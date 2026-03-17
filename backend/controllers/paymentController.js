const Razorpay = require('razorpay');
const pool = require('../db');

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
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
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
