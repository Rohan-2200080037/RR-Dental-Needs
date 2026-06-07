const nimbuspost = require('../services/nimbuspostService');
const pool = require('../db');
const logger = require('../services/loggingService');
const notificationController = require('./notificationController');

exports.getRates = async (req, res) => {
  const { pincode, weight, cod } = req.query;
  console.log(`[NIMBUSPOST DEBUG] getRates called: pincode=${pincode}, weight=${weight}, cod=${cod}`);
  if (!pincode) return res.status(400).json({ message: "Delivery pincode is required." });
  try {
    const result = await nimbuspost.getServiceableCouriers(pincode, parseFloat(weight || 0.3), cod === 'true');
    res.status(200).json({ success: true, available: result.available_courier_companies || [], recommended: result.recommended_courier });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createShipment = async (req, res) => {
  const { orderId } = req.params;
  try {
    const orderRes = await pool.query(`
      SELECT o.*, a.name as delivery_name, a.phone, a.address, a.city, a.state, a.pincode, u.email as user_email
      FROM Orders o
      JOIN Addresses a ON o.address_id = a.id
      JOIN Users u ON o.user_id = u.id
      WHERE o.id = $1
    `, [orderId]);
    if (orderRes.rows.length === 0) return res.status(404).json({ message: "Order not found." });
    const order = orderRes.rows[0];

    const itemsRes = await pool.query(`SELECT oi.quantity, oi.price, p.name, p.id FROM Order_Items oi JOIN Products p ON oi.product_id = p.id WHERE oi.order_id = $1`, [orderId]);
    const items = itemsRes.rows;

    const orderData = {
      order_id: orderId.toString(),
      billing_customer_name: order.delivery_name,
      billing_phone: order.phone,
      billing_email: order.user_email || '',
      billing_address: order.address,
      billing_city: order.city,
      billing_state: order.state,
      billing_pincode: order.pincode,
      billing_country: 'India',
      payment_method: order.payment_method === 'COD' ? 'COD' : 'Prepaid',
      total_amount: parseFloat(order.total_price),
      weight: 0.3,
      order_items: items.map(i => ({
        name: i.name,
        sku: `PROD-${i.id}`,
        units: i.quantity,
        selling_price: parseFloat(i.price)
      }))
    };

    const result = await nimbuspost.createShipment(orderData);
    const respData = result.data || result;
    const npShipmentId = (respData.id || respData.shipment_id || '').toString();
    const npAWB = (respData.awb || respData.awb_code || '').toString();
    const npOrderId = (respData.order_id || '').toString();
    if (!npAWB) {
      throw new Error(`NimbusPost did not return AWB/ID. Response: ${JSON.stringify(result).slice(0, 300)}`);
    }
    logger.info(`NimbusPost shipment created for Order #${orderId}: NP ID ${npShipmentId}, AWB ${npAWB}`);

    await pool.query(
      `UPDATE Orders SET shipping_status = 'Packed', shipping_provider = 'NimbusPost', shipment_id = $1, tracking_number = $2 WHERE id = $3`,
      [npShipmentId, npAWB, orderId]
    );

    await notificationController.createNotification(
      order.user_id,
      `Your order #${orderId} has been forwarded to our logistics partner.`,
      `/profile?tab=orders`
    );

    res.status(200).json({ message: "Shipment created in NimbusPost.", shipmentId: npShipmentId, orderId: npOrderId, awb: npAWB });
  } catch (err) {
    logger.error(`NimbusPost create shipment failed for order ${orderId}: ${err.stack || err.message}`);
    res.status(500).json({ message: `Failed to create shipment: ${err.message}` });
  }
};

exports.listWarehouses = async (req, res) => {
  try {
    const result = await nimbuspost.getWarehouses();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.assignAWB = async (req, res) => {
  res.status(200).json({ message: "AWB is auto-assigned by NimbusPost on order creation." });
};

exports.requestPickup = async (req, res) => {
  const { shipmentId } = req.params;
  try {
    const result = await nimbuspost.requestPickup(shipmentId);
    res.status(200).json({ message: "Pickup requested.", pickup: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.generateLabel = async (req, res) => {
  const { shipmentId } = req.params;
  const { awb } = req.body || {};
  try {
    const result = await nimbuspost.generateLabel(shipmentId, awb || '');
    res.status(200).json({ message: "Label generated.", labelUrl: result.label_url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.trackShipment = async (req, res) => {
  const { awb } = req.params;
  try {
    const result = await nimbuspost.trackByAWB(awb);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.triggerAutomaticShipment = async (orderId) => {
  try {
    const req = { params: { orderId } };
    const res = {
      status: () => ({ json: () => {} })
    };
    await exports.createShipment(req, res);
  } catch (err) {
    logger.error(`Auto-shipment failed for order ${orderId}: ${err.message}`);
  }
};
