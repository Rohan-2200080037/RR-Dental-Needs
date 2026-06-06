const axios = require('axios');
const logger = require('./loggingService');

const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';
const SR_EMAIL = process.env.SHIPROCKET_EMAIL;
const SR_PASSWORD = process.env.SHIPROCKET_PASSWORD;
const PICKUP_PINCODE = process.env.SHIPROCKET_PICKUP_PINCODE || '520001';
const PICKUP_LOCATION = process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary';

let authToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (authToken && Date.now() < tokenExpiry) return authToken;
  if (!SR_EMAIL || !SR_PASSWORD) {
    logger.warn('Shiprocket credentials not configured, using simulated mode');
    return 'simulated_token';
  }
  try {
    const { data } = await axios.post(`${BASE_URL}/auth/login`, {
      email: SR_EMAIL,
      password: SR_PASSWORD
    });
    authToken = data.token;
    tokenExpiry = Date.now() + (240 * 60 * 60 * 1000); // 240 hours
    logger.info('Shiprocket: new auth token obtained');
    return authToken;
  } catch (err) {
    logger.error('Shiprocket auth failed: ' + (err.response?.data?.message || err.message));
    throw new Error('Shiprocket authentication failed');
  }
}

function isSimulated() {
  return !SR_EMAIL || !SR_PASSWORD;
}

async function shiprocketRequest(method, endpoint, data = null, params = null) {
  if (isSimulated()) {
    logger.info(`Shiprocket simulated: ${method} ${endpoint}`);
    return simulateResponse(endpoint, data);
  }
  const token = await getToken();
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  };
  if (data) config.data = data;
  if (params) config.params = params;
  try {
    const { data: result } = await axios(config);
    return result;
  } catch (err) {
    logger.error(`Shiprocket API error [${endpoint}]: ${err.response?.data?.message || err.message}`);
    throw new Error(`Shiprocket request failed: ${err.response?.data?.message || err.message}`);
  }
}

function simulateResponse(endpoint, data) {
  if (endpoint.includes('/courier/serviceability')) {
    return {
      data: {
        available_courier_companies: [
          { id: 1, courier_name: 'Delhivery', rate: 80, estimated_delivery_days: 5 },
          { id: 2, courier_name: 'Ecom Express', rate: 75, estimated_delivery_days: 6 },
          { id: 3, courier_name: 'XpressBees', rate: 70, estimated_delivery_days: 4 }
        ],
        recommended_courier: { id: 1, courier_name: 'Delhivery', rate: 80, estimated_delivery_days: 5 }
      }
    };
  }
  if (endpoint.includes('/orders/create/adhoc')) {
    return { order_id: Math.floor(Math.random() * 100000), shipment_id: Math.floor(Math.random() * 100000) };
  }
  if (endpoint.includes('/courier/assign/awb')) {
    return { awb_code: `SR${Date.now()}`, courier_name: 'Delhivery' };
  }
  if (endpoint.includes('/courier/generate/pickup')) {
    return { pickup_status: 'scheduled', pickup_token_number: `PK${Date.now()}` };
  }
  if (endpoint.includes('/courier/generate/label')) {
    return { label_url: 'https://example.com/label.pdf', label_created: 1 };
  }
  if (endpoint.includes('/orders/print/invoice')) {
    return { invoice_url: 'https://example.com/invoice.pdf' };
  }
  if (endpoint.includes('/courier/track')) {
    return {
      tracking_data: {
        status: 'In Transit',
        shipment_status: 5,
        track_status: 5,
        eta: '2026-06-10',
        scanned_details: [
          { date: new Date().toISOString(), activity: 'Picked Up', location: 'Origin City', status: 'Pickup' }
        ]
      }
    };
  }
  return { success: true };
}

exports.getServiceableCouriers = async (deliveryPincode, weight, cod = false) => {
  try {
    const result = await shiprocketRequest('get', '/courier/serviceability/', null, {
      pickup_postcode: PICKUP_PINCODE,
      delivery_postcode: deliveryPincode,
      weight: Math.max(weight || 0.5, 0.1),
      cod: cod ? 1 : 0
    });
    return result;
  } catch (err) {
    logger.warn('Shiprocket serviceability check failed, using fallback rate');
    return {
      data: {
        available_courier_companies: [{ courier_name: 'Standard Courier', rate: 80, estimated_delivery_days: 5 }],
        recommended_courier: { courier_name: 'Standard Courier', rate: 80, estimated_delivery_days: 5 }
      }
    };
  }
};

exports.createOrder = async (orderData) => {
  return shiprocketRequest('post', '/orders/create/adhoc', orderData);
};

exports.assignAWB = async (shipmentId, courierId) => {
  return shiprocketRequest('post', '/courier/assign/awb', {
    shipment_id: shipmentId,
    courier_id: courierId
  });
};

exports.generatePickup = async (shipmentId) => {
  return shiprocketRequest('post', '/courier/generate/pickup', { shipment_id: shipmentId });
};

exports.generateLabel = async (shipmentId) => {
  return shiprocketRequest('post', '/courier/generate/label', { shipment_id: shipmentId });
};

exports.trackShipment = async (awbCode) => {
  return shiprocketRequest('get', `/courier/track/awb/${awbCode}`);
};

exports.generateInvoice = async (orderId) => {
  return shiprocketRequest('post', '/orders/print/invoice', { order_id: orderId });
};
