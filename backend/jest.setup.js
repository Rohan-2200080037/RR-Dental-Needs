const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

process.env.JWT_SECRET = 'test_jwt_secret_for_opencode_tests';
process.env.SHIPROCKET_PICKUP_PINCODE = '520001';
process.env.SHIPROCKET_PICKUP_LOCATION = 'Primary';
process.env.NODE_ENV = 'test';
