const PHONEPE_CONFIG = {
    merchantId: process.env.PHONEPE_MERCHANT_ID || 'PGMD5', // Default UAT MID
    saltKey: process.env.PHONEPE_SALT_KEY || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399', // Default UAT Salt Key
    saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
    env: process.env.PHONEPE_ENV || 'UAT', // UAT or PRODUCTION
    apiEndpoint: process.env.PHONEPE_ENV === 'PRODUCTION' 
        ? 'https://api.phonepe.com/apis/hermes/pg/v1/pay' 
        : 'https://api-preprod.phonepe.com/apis/hermes/pg/v1/pay',
    statusEndpoint: process.env.PHONEPE_ENV === 'PRODUCTION'
        ? 'https://api.phonepe.com/apis/hermes/pg/v1/status'
        : 'https://api-preprod.phonepe.com/apis/hermes/pg/v1/status',
    callbackUrl: `${process.env.BACKEND_URL}/api/payment/phonepe-callback`,
    redirectUrl: `${process.env.FRONTEND_URL}/payment-status`
};

module.exports = PHONEPE_CONFIG;
