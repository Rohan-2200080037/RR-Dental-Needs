const Razorpay = require('razorpay');
const pool = require('../db');
const crypto = require('crypto');
const logger = require('../services/loggingService');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
});

exports.createRazorpayOrder = async (req, res) => {
    const { amount, currency = 'INR', receipt } = req.body;
    
    if (!amount) {
        return res.status(400).json({ message: "Amount is required." });
    }
    const amountPaise = Math.round(amount * 100);
    if (amountPaise < 100) {
        return res.status(400).json({ message: "Minimum amount is 1.00 INR (100 paise)." });
    }

    try {
        const options = {
            amount: amountPaise,
            currency: currency,
            receipt: receipt || `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.status(201).json(order);
    } catch (err) {
        console.error("Razorpay Order Creation Error:", err);
        res.status(500).json({ message: "Could not create Razorpay order." });
    }
};

exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: "Missing required payment fields: order_id, payment_id, signature." });
    }

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret');
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');
    const isVerified = (generated_signature === razorpay_signature);

    if (isVerified) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Create the order now that payment is verified
            const orderController = require('./orderController');
            const { orderId, totalPrice, cartItems, lowStockItems } = await orderController.processOrderCreation(client, req.user.id, {
                ...req.body.orderDetails,
                paymentStatus: 'Paid',
                rzpOrderId: razorpay_order_id,
                rzpPaymentId: razorpay_payment_id
            });

            // Auto-confirm prepaid orders and update shipping status
            await client.query(
                "UPDATE Orders SET order_status = 'Confirmed', shipping_status = 'Pending' WHERE id = $1",
                [orderId]
            );

            await client.query('COMMIT');

            // 1. Trigger notification for user
            const notificationController = require('./notificationController');
            await notificationController.createNotification(
                req.user.id, 
                `Payment verified. Order #${orderId} placed successfully. Amount: ₹${totalPrice}`,
                `/profile?tab=orders`
            );
            
            // 2. Notify admin and sellers of new order
            orderController.notifySellersAndAdminsOfNewOrder(orderId, totalPrice, cartItems, req.user.id);

            // 3. Notify sellers of low stock
            for (let item of lowStockItems) {
                const sellerRes = await pool.query('SELECT user_id FROM Sellers WHERE id = $1', [item.seller_id]);
                if (sellerRes.rows.length > 0) {
                    const sellerUserId = sellerRes.rows[0].user_id;
                    await notificationController.createNotification(
                        sellerUserId,
                        `Low stock alert: Product "${item.name}" has only ${item.stock_quantity} remaining.`,
                        `/seller`
                    );
                }
            }

            // 4. Auto-trigger NimbusPost shipment for prepaid orders
            const shippingController = require('./shippingController');
            shippingController.triggerAutomaticShipment(orderId).catch(err => {
                logger.error(`Auto-shipment after payment failed for order ${orderId}: ${err.message}`);
            });
            
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
