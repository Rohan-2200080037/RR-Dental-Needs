const shiprocket = require('../services/shiprocketService');
const pool = require('../db');
const logger = require('../services/loggingService');
const notificationController = require('./notificationController');

exports.getRates = async (req, res) => {
  const { pincode, weight, cod } = req.query;
  if (!pincode) return res.status(400).json({ message: "Delivery pincode is required." });
  try {
    const result = await shiprocket.getServiceableCouriers(pincode, parseFloat(weight || 0.5), cod === 'true');
    const available = result.data?.available_courier_companies || [];
    const recommended = result.data?.recommended_courier || null;
    res.status(200).json({ success: true, available, recommended });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createShipment = async (req, res) => {
  const { orderId } = req.params;
  try {
    const orderRes = await pool.query(`
      SELECT o.*, a.name as delivery_name, a.phone, a.address, a.city, a.state, a.pincode
      FROM Orders o JOIN Addresses a ON o.address_id = a.id WHERE o.id = $1
    `, [orderId]);
    if (orderRes.rows.length === 0) return res.status(404).json({ message: "Order not found." });
    const order = orderRes.rows[0];

    const itemsRes = await pool.query(`SELECT oi.quantity, oi.price, p.name, p.id FROM Order_Items oi JOIN Products p ON oi.product_id = p.id WHERE oi.order_id = $1`, [orderId]);
    const items = itemsRes.rows;
    const totalWeight = items.reduce((sum, i) => sum + (i.quantity * 0.2), 0.5);

    const srOrderData = {
      order_id: orderId.toString(),
      order_date: new Date(order.order_date).toISOString().split('T')[0],
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
      billing_customer_name: order.delivery_name,
      billing_last_name: '',
      billing_address: order.address,
      billing_city: order.city,
      billing_pincode: order.pincode,
      billing_state: order.state,
      billing_country: 'India',
      billing_email: '',
      billing_phone: order.phone,
      shipping_is_billing: true,
      order_items: items.map(i => ({
        name: i.name,
        sku: `PROD-${i.id}`,
        units: i.quantity,
        selling_price: parseFloat(i.price)
      })),
      payment_method: order.payment_method === 'COD' ? 'COD' : 'Prepaid',
      sub_total: parseFloat(order.total_price),
      length: 10,
      breadth: 10,
      height: 10,
      weight: Math.max(Math.ceil(totalWeight), 1)
    };

    const srResult = await shiprocket.createOrder(srOrderData);
    const srOrderId = srResult.order_id || srResult.id || srResult.shipment_id || '';
    const srShipmentId = srResult.shipment_id || srResult.shipmentId || srResult.id || '';
    logger.info(`Shiprocket order created for Order #${orderId}: SR Order ${srOrderId}, SR Shipment ${srShipmentId}`);

    await pool.query(`UPDATE Orders SET shipping_status = 'Packed', shipping_provider = 'Shiprocket', shipment_id = $1 WHERE id = $2`, [srShipmentId.toString(), orderId]);

    await notificationController.createNotification(
      order.user_id,
      `Your order #${orderId} has been forwarded to our logistics partner.`,
      `/profile?tab=orders`
    );

    res.status(200).json({ message: "Shipment created in Shiprocket.", shipmentId: srResult.shipment_id, orderId: srResult.order_id });
  } catch (err) {
    logger.error(`Shiprocket create shipment failed for order ${orderId}: ${err.message}`);
    res.status(500).json({ message: "Failed to create shipment." });
  }
};

exports.assignAWB = async (req, res) => {
  const { shipmentId } = req.params;
  const { courierId } = req.body;
  try {
    const result = await shiprocket.assignAWB(shipmentId, courierId);
    res.status(200).json({ message: "AWB assigned.", awb: result.awb_code, courierName: result.courier_name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.requestPickup = async (req, res) => {
  const { shipmentId } = req.params;
  try {
    const result = await shiprocket.generatePickup(shipmentId);
    res.status(200).json({ message: "Pickup requested.", pickup: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.generateLabel = async (req, res) => {
  const { shipmentId } = req.params;
  try {
    const result = await shiprocket.generateLabel(shipmentId);
    res.status(200).json({ message: "Label generated.", labelUrl: result.label_url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.trackShipment = async (req, res) => {
  const { awb } = req.params;
  try {
    const result = await shiprocket.trackShipment(awb);
    const td = result.tracking_data;
    res.status(200).json({
      status: td.status || 'In Transit',
      estimatedDelivery: td.eta || null,
      scans: (td.scanned_details || []).map(s => ({
        status: s.activity || s.status,
        location: s.location || 'Unknown',
        time: s.date
      })),
      courierName: td.courier_name || ''
    });
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
