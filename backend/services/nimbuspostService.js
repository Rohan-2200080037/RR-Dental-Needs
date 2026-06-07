const axios = require('axios');
const logger = require('./loggingService');

const BASE_URL = 'https://ship.nimbuspost.com/api';
const API_KEY = process.env.NIMBUSPOST_API_KEY || '';
const WAREHOUSE_ID = process.env.NIMBUSPOST_WAREHOUSE_ID || '';

function isConfigured() {
  return !!API_KEY;
}

async function nimbusRequest(method, endpoint, data = null, params = null) {
  if (!isConfigured()) {
    logger.info(`NimbusPost simulated: ${method} ${endpoint}`);
    return simulateResponse(endpoint, data);
  }
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: { 'NP-API-KEY': API_KEY, 'Content-Type': 'application/json' }
  };
  if (data) config.data = data;
  if (params) config.params = params;
  try {
    const { data: result } = await axios(config);
    return result;
  } catch (err) {
    logger.error(`NimbusPost API error [${endpoint}]: ${err.response?.data?.message || err.message}`);
    throw new Error(`NimbusPost request failed: ${err.response?.data?.message || err.message}`);
  }
}

function simulateResponse(endpoint, data) {
  if (endpoint.includes('/couriers')) {
    return {
      status: true,
      data: [
        { id: 1, name: 'Delhivery', rate: 80, estimated_delivery_days: 5 },
        { id: 2, name: 'Ecom Express', rate: 75, estimated_delivery_days: 6 },
        { id: 3, name: 'XpressBees', total_charge: 68, etd: 4 }
      ]
    };
  }
  if (endpoint.includes('/shipments/create')) {
    return {
      status: true,
      data: { id: Math.floor(Math.random() * 100000), awb: `AWB${Date.now()}`, order_id: `NP${Date.now()}` }
    };
  }
  if (endpoint.includes('/shipments/track')) {
    return {
      status: true,
      data: {
        current_status: 'In Transit',
        courier_name: 'Delhivery',
        estimated_delivery: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        tracking_history: [
          { status: 'Pickup', location: 'Origin City', activity: 'Picked Up', time: new Date().toISOString() },
          { status: 'In Transit', location: 'Sorting Center', activity: 'In Transit', time: new Date(Date.now() - 86400000).toISOString() }
        ]
      }
    };
  }
  if (endpoint.includes('/shipments/label')) {
    return { status: true, data: { label_url: 'https://example.com/label.pdf' } };
  }
  if (endpoint.includes('/shipments/pickups')) {
    return { status: true, data: { message: 'Pickup scheduled', pickup_id: `PK${Date.now()}` } };
  }
  return { status: true };
}

exports.getServiceableCouriers = async (deliveryPincode, weight, cod = false) => {
  try {
    const pickupPincode = process.env.NIMBUSPOST_PICKUP_PINCODE || '520001';
    const params = { pickup_pincode: pickupPincode, delivery_pincode: deliveryPincode, weight, cod: cod ? '1' : '0' };
    const result = await nimbusRequest('get', '/couriers', null, params);
    const couriers = result.data || [];
    const rates = couriers.map(c => ({
      id: c.id,
      courier_name: c.name,
      rate: c.total_charge || c.rate || 80,
      estimated_delivery_days: c.etd || c.estimated_delivery_days || 5
    }));
    return {
      available_courier_companies: rates,
      recommended_courier: rates.length > 0 ? rates.reduce((a, b) => (a.rate < b.rate ? a : b)) : null
    };
  } catch (err) {
    logger.warn(`NimbusPost courier rates failed for pincode ${deliveryPincode}: ${err.message}, using fallback`);
    return {
      available_courier_companies: [{ courier_name: 'Standard Courier', rate: 80, estimated_delivery_days: 5 }],
      recommended_courier: { courier_name: 'Standard Courier', rate: 80, estimated_delivery_days: 5 }
    };
  }
};

exports.createShipment = async (orderData) => {
  const nameParts = (orderData.billing_customer_name || 'Customer').split(' ');
  const fname = nameParts[0] || 'Customer';
  const lname = nameParts.slice(1).join(' ') || '';

  const phoneRaw = (orderData.billing_phone || '').toString().replace(/\D/g, '');
  const phoneClean = phoneRaw.slice(-10);

  const payload = {
    consignee: {
      name: orderData.billing_customer_name || 'Customer',
      address: orderData.billing_address || '',
      address_2: '',
      city: orderData.billing_city || '',
      state: orderData.billing_state || '',
      pincode: (orderData.billing_pincode || '').toString(),
      phone: phoneClean,
      email: orderData.billing_email || ''
    },
    order: {
      order_number: orderData.order_id?.toString() || '',
      shipping_charges: 0,
      discount: 0,
      cod_charges: orderData.payment_method === 'COD' ? Math.round(parseFloat(orderData.total_amount || 0) * 0.02) : 0,
      payment_type: orderData.payment_method === 'COD' ? 'cod' : 'prepaid',
      total: Math.round(parseFloat(orderData.total_amount || 0)),
      package_weight: Math.round((orderData.weight || 0.3) * 1000), // convert kg to grams
      package_length: 10,
      package_height: 10,
      package_breadth: 10
    },
    order_items: (orderData.order_items || []).map(i => ({
      name: i.name || 'Product',
      qty: (i.units || 1).toString(),
      price: (parseFloat(i.selling_price) || 0).toString(),
      sku: i.sku || ''
    })),
    support_email: process.env.NIMBUSPOST_SUPPORT_EMAIL || '',
    support_phone: (process.env.NIMBUSPOST_SUPPORT_PHONE || '').replace(/\D/g, '')
  };

  if (WAREHOUSE_ID) {
    payload.pickup_warehouse_id = WAREHOUSE_ID;
    payload.rto_warehouse_id = WAREHOUSE_ID;
  }

  logger.info(`[NIMBUSPOST DEBUG] createShipment payload: ${JSON.stringify({
    ...payload,
    pickup_warehouse_id: payload.pickup_warehouse_id,
    rto_warehouse_id: payload.rto_warehouse_id,
    consignee: { ...payload.consignee, phone: payload.consignee.phone },
    order_items: `${payload.order_items.length} item(s)`
  })}`);

  return nimbusRequest('post', '/shipments/create', payload);
};

exports.trackByAWB = async (awb) => {
  const result = await nimbusRequest('get', `/shipments/track_awb/${awb}`);
  const td = result.data || {};
  return {
    status: td.current_status || 'In Transit',
    estimatedDelivery: td.estimated_delivery || null,
    scans: (td.tracking_history || []).map(s => ({
      status: s.activity || s.status,
      location: s.location || 'Unknown',
      time: s.time
    })),
    courierName: td.courier_name || ''
  };
};

exports.trackByNPId = async (npId) => {
  const result = await nimbusRequest('get', `/shipments/track/${npId}`);
  const td = result.data || {};
  return {
    status: td.current_status || 'In Transit',
    estimatedDelivery: td.estimated_delivery || null,
    scans: (td.tracking_history || []).map(s => ({
      status: s.activity || s.status,
      location: s.location || 'Unknown',
      time: s.time
    })),
    courierName: td.courier_name || ''
  };
};

exports.generateLabel = async (shipmentId, awb) => {
  const result = await nimbusRequest('post', '/shipments/label', { id: shipmentId, awb });
  return { label_url: result.data?.label_url || '' };
};

exports.requestPickup = async (shipmentId) => {
  return nimbusRequest('post', '/shipments/pickups', { id: shipmentId });
};

exports.cancelShipment = async (orderId) => {
  return nimbusRequest('post', '/orders/cancel', { id: orderId });
};

exports.getWarehouses = async () => {
  return nimbusRequest('get', '/warehouse');
};
