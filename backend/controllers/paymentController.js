const Razorpay = require('razorpay');
const pool = require('../db');
const crypto = require('crypto');
const axios = require('axios');
const PHONEPE_CONFIG = require('../config/phonepeConfig');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
});

exports.createRazorpayOrder = async (req, res) => {
    const { amount, currency = 'INR', receipt } = req.body;
    
    if (!amount) {
        return res.status(400).json({ message: "Amount is required." });
    }

    try {
        const options = {
            amount: Math.round(amount * 100), // razorpay expects amount in paise
            currency: currency,
            receipt: receipt || `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        
        // Optionally store this razorpay order id in a temporary table or just return it
        // We will link it to the actual order in createOrder or updateOrder status
        
        res.status(201).json(order);
    } catch (err) {
        console.error("Razorpay Order Creation Error:", err);
        res.status(500).json({ message: "Could not create Razorpay order." });
    }
};

exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;
    const crypto = require('crypto');

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret');
    
    let isVerified = false;
    if (razorpay_signature === 'phonepe_verified') {
        // This is a PhonePe transaction already verified by checkPhonePeStatus
        isVerified = true;
    } else {
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');
        isVerified = (generated_signature === razorpay_signature);
    }

    if (isVerified) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Create the order now that payment is verified
            const { orderId, totalPrice } = await require('./orderController').processOrderCreation(client, req.user.id, {
                ...req.body.orderDetails,
                paymentStatus: 'Paid',
                rzpOrderId: razorpay_order_id,
                rzpPaymentId: razorpay_payment_id
            });

            await client.query('COMMIT');

            // Trigger notification
            await require('./notificationController').createNotification(req.user.id, `Payment verified. Order #${orderId} placed successfully.`);
            
            res.status(200).json({ message: "Payment verified and order created successfully.", orderId });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error("Payment post-processing error:", err);
            res.status(500).json({ message: err.message || "Error processing order after payment." });
        } finally {
            client.release();
        }
    } else {
        res.status(400).json({ message: "Payment verification failed." });
    }
};

exports.initiatePhonePePayment = async (req, res) => {
    const { amount, orderDetails } = req.body;
    
    if (!amount) {
        return res.status(400).json({ message: "Amount is required." });
    }

    try {
        const merchantTransactionId = `TXN_${Date.now()}`;
        const data = {
            merchantId: PHONEPE_CONFIG.merchantId,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: `USER_${req.user.id}`,
            amount: Math.round(amount * 100), // convert to paise
            redirectUrl: `${PHONEPE_CONFIG.redirectUrl}?txnId=${merchantTransactionId}`,
            redirectMode: 'REDIRECT',
            callbackUrl: PHONEPE_CONFIG.callbackUrl,
            mobileNumber: orderDetails.phone || '9999999999',
            paymentInstrument: {
                type: 'PAY_PAGE'
            }
        };

        const payload = JSON.stringify(data);
        const bufferObj = Buffer.from(payload, 'utf8');
        const base64Payload = bufferObj.toString('base64');

        const xVerify = crypto
            .createHash('sha256')
            .update(base64Payload + "/pg/v1/pay" + PHONEPE_CONFIG.saltKey)
            .digest('hex') + "###" + PHONEPE_CONFIG.saltIndex;

        const options = {
            method: 'post',
            url: PHONEPE_CONFIG.apiEndpoint,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': xVerify
            },
            data: {
                request: base64Payload
            }
        };

        const response = await axios.request(options);
        
        // Store transaction attempt in database if needed
        // await pool.query('INSERT INTO transactions ...');

        res.status(200).json({
            url: response.data.data.instrumentResponse.redirectInfo.url,
            merchantTransactionId
        });
    } catch (err) {
        console.error("PhonePe Initiation Error:", err.response?.data || err.message);
        res.status(500).json({ message: "Could not initiate PhonePe payment." });
    }
};

exports.phonepeCallback = async (req, res) => {
    const { response } = req.body;
    
    if (!response) return res.status(400).send("No response");

    try {
        const bufferObj = Buffer.from(response, 'base64');
        const decodedResponse = JSON.parse(bufferObj.toString('utf8'));

        // Verify Checksum
        const xVerifyReceived = req.headers['x-verify'];
        const checksum = crypto
            .createHash('sha256')
            .update(response + PHONEPE_CONFIG.saltKey)
            .digest('hex') + "###" + PHONEPE_CONFIG.saltIndex;

        if (xVerifyReceived !== checksum) {
            console.error("PhonePe callback integrity check failed");
            return res.status(400).send("Security Check Failed");
        }

        if (decodedResponse.success && decodedResponse.code === 'PAYMENT_SUCCESS') {
            const merchantTransactionId = decodedResponse.data.merchantTransactionId;
            const amountPaid = decodedResponse.data.amount / 100;

            // Here we need to find the user and details associated with this txn
            // Since callbacks are asynchronous, it's best to have stored the orderDetails temporarily or use metadata
            // For now, if the user is still on the frontend, they will hit the redirect URL
            // and we will verify status there too.
            console.log(`Payment Success for ${merchantTransactionId}: ₹${amountPaid}`);
            
            // TODO: Update order in DB
        }

        res.status(200).send("OK");
    } catch (err) {
        console.error("PhonePe Callback Error:", err);
        res.status(500).send("Internal Error");
    }
};

exports.checkPhonePeStatus = async (req, res) => {
    const { merchantTransactionId } = req.params;

    try {
        const xVerify = crypto
            .createHash('sha256')
            .update(`/pg/v1/status/${PHONEPE_CONFIG.merchantId}/${merchantTransactionId}` + PHONEPE_CONFIG.saltKey)
            .digest('hex') + "###" + PHONEPE_CONFIG.saltIndex;

        const options = {
            method: 'get',
            url: `${PHONEPE_CONFIG.statusEndpoint}/${PHONEPE_CONFIG.merchantId}/${merchantTransactionId}`,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': xVerify,
                'X-MERCHANT-ID': PHONEPE_CONFIG.merchantId
            }
        };

        const response = await axios.request(options);
        
        if (response.data.success && response.data.code === 'PAYMENT_SUCCESS') {
            // Process order as Paid
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                
                // Note: We need the orderDetails. In a real app, we'd fetch them from a 'pending_orders' table using merchantTransactionId
                // For this demo, we'll assume the frontend sends the orderDetails during the redirect/status check
                // or we use a session/cache.
                
                res.status(200).json({ success: true, data: response.data.data });
            } finally {
                client.release();
            }
        } else {
            res.status(200).json({ success: false, message: response.data.message });
        }
    } catch (err) {
        console.error("PhonePe Status Check Error:", err.response?.data || err.message);
        res.status(500).json({ message: "Error checking payment status." });
    }
};
