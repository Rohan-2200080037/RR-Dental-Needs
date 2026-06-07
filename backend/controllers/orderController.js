const pool = require('../db');
const notificationController = require('./notificationController');
const shippingController = require('./shippingController');
const logger = require('../services/loggingService');

exports.createOrder = async (req, res) => {
    const userId = req.user.id;
    const { 
        name, phone, address, city, state, pincode, 
        latitude = null, longitude = null,
        paymentMethod = 'COD', shouldSaveAddress = false,
        shippingCharge = 0, shippingProvider = 'Free Shipping', estimatedDeliveryDate = null
    } = req.body;

    if (!name || !phone || !address || !city || !state || !pincode) {
        return res.status(400).json({ message: "All address fields are required." });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // COD Fraud Prevention Checks
        if (paymentMethod === 'COD') {
            const settingsRes = await client.query('SELECT * FROM logistics_settings LIMIT 1');
            if (settingsRes.rows.length > 0) {
                const settings = settingsRes.rows[0];
                if (!settings.cod_enabled) {
                    throw new Error("Cash on Delivery is currently disabled.");
                }

                // Blocked pincodes check
                if (settings.blocked_pincodes) {
                    const blockedList = settings.blocked_pincodes.split(',').map(p => p.trim());
                    if (blockedList.includes(pincode.trim())) {
                        throw new Error("Cash on Delivery is not available for this pincode.");
                    }
                }

                // Blocked user check
                const userRes = await client.query('SELECT is_cod_blocked FROM users WHERE id = $1', [userId]);
                if (userRes.rows.length > 0 && userRes.rows[0].is_cod_blocked) {
                    throw new Error("Cash on Delivery is not available for this account.");
                }
            }
        }

        const { orderId, totalPrice, cartItems, lowStockItems } = await exports.processOrderCreation(client, userId, {
            name, phone, address, city, state, pincode, latitude, longitude, paymentMethod,
            shouldSaveAddress, paymentStatus: 'Pending',
            shippingCharge, shippingProvider, estimatedDeliveryDate
        });
        await client.query('COMMIT');

        // 1. Notify user
        await notificationController.createNotification(
            userId, 
            `Order #${orderId} has been placed successfully. Amount: ₹${totalPrice}`,
            `/profile?tab=orders`
        );
        logger.info(`Order ${orderId} placed by user ${userId}`);

        // 2. Notify admin and sellers of new order
        exports.notifySellersAndAdminsOfNewOrder(orderId, totalPrice, cartItems, userId);

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

        res.status(201).json({ message: "Order placed successfully.", orderId });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
};

// Core logic extracted for reuse (e.g., by paymentController)
exports.processOrderCreation = async (client, userId, orderDetails) => {
    const { 
        name, phone, address, city, state, pincode, 
        latitude = null, longitude = null,
        paymentMethod, paymentStatus = 'Pending', 
        rzpOrderId = null, rzpPaymentId = null,
        shouldSaveAddress = false,
        shippingCharge = 0, shippingProvider = 'Free Shipping', estimatedDeliveryDate = null
    } = orderDetails;

    // 1. Get Cart Items
    const cartResult = await client.query(`
        SELECT c.product_id, c.quantity, p.price, p.stock_quantity, p.seller_id
        FROM Cart c 
        JOIN Products p ON c.product_id = p.id 
        WHERE c.user_id = $1
    `, [userId]);
    const cartItems = cartResult.rows;

    if (cartItems.length === 0) {
        throw new Error("Cart is empty.");
    }

    // 2. Validate Stock and Calculate Total Price
    let totalPrice = 0;
    for (let item of cartItems) {
        if (item.quantity > item.stock_quantity) {
             throw new Error(`Insufficient stock for product ID ${item.product_id}.`);
        }
        totalPrice += item.price * item.quantity;
    }

    // Max COD Amount Check
    if (paymentMethod === 'COD') {
        const settingsRes = await client.query('SELECT max_cod_amount FROM logistics_settings LIMIT 1');
        if (settingsRes.rows.length > 0) {
            const maxCod = parseFloat(settingsRes.rows[0].max_cod_amount);
            if (totalPrice > maxCod) {
                throw new Error(`Order total of ₹${totalPrice} exceeds the maximum allowed COD limit of ₹${maxCod}.`);
            }
        }
    }

    // 3. Find or Create Address
    // Check if an identical address already exists for this user
    const existingAddrResult = await client.query(
        'SELECT id FROM Addresses WHERE user_id = $1 AND name = $2 AND phone = $3 AND address = $4 AND city = $5 AND state = $6 AND pincode = $7',
        [userId, name, phone, address, city, state, pincode]
    );

    let addressId;
    if (existingAddrResult.rows.length > 0) {
        addressId = existingAddrResult.rows[0].id;
        // If it exists and user wants to save it, ensure is_saved is TRUE
        if (shouldSaveAddress) {
            await client.query('UPDATE Addresses SET is_saved = TRUE, is_active = TRUE WHERE id = $1', [addressId]);
        }
    } else {
        // Create new address - is_saved depends on shouldSaveAddress checkbox
        const addressResult = await client.query(
            'INSERT INTO Addresses (user_id, name, phone, address, city, state, pincode, is_saved, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
            [userId, name, phone, address, city, state, pincode, shouldSaveAddress, latitude, longitude]
        );
        addressId = addressResult.rows[0].id;
    }

    const finalTotal = parseFloat(totalPrice) + parseFloat(shippingCharge);

    const orderResult = await client.query(
        `INSERT INTO Orders (
            user_id, address_id, total_price, payment_method, order_status, payment_status, 
            razorpay_order_id, razorpay_payment_id,
            shipping_charge, shipping_status,
            delivery_latitude, delivery_longitude
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
        [
            userId, 
            addressId, 
            finalTotal,
            paymentMethod, 
            'Pending', 
            paymentStatus, 
            rzpOrderId, 
            rzpPaymentId,
            shippingCharge,
            'Pending',
            latitude,
            longitude
        ]
    );
    const orderId = orderResult.rows[0].id;

    // 5. Create Order Items & Update Stock
    for (let item of cartItems) {
         await client.query(
             'INSERT INTO Order_Items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
             [orderId, item.product_id, item.quantity, item.price]
         );

         // Deduct stock
         await client.query(
             'UPDATE Products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
             [item.quantity, item.product_id]
         );
    }

    // 6. Clear Cart
    await client.query('DELETE FROM Cart WHERE user_id = $1', [userId]);

    // Check low stock products
    const lowStockItems = [];
    for (let item of cartItems) {
        const prodRes = await client.query(
            'SELECT name, stock_quantity, low_stock_threshold, seller_id FROM Products WHERE id = $1',
            [item.product_id]
        );
        if (prodRes.rows.length > 0) {
            const prod = prodRes.rows[0];
            if (prod.stock_quantity <= prod.low_stock_threshold) {
                lowStockItems.push(prod);
            }
        }
    }

    return { orderId, totalPrice: finalTotal, cartItems, lowStockItems };
};

exports.getUserOrders = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await pool.query(`
            SELECT o.id, o.order_date, o.total_price, o.order_status, o.payment_method,
                   o.shipping_charge, o.shipping_status, o.courier_name, o.tracking_number,
                   a.name as delivery_name, a.address, a.city, a.state, a.pincode
            FROM Orders o
            JOIN Addresses a ON o.address_id = a.id
            WHERE o.user_id = $1
            ORDER BY o.order_date DESC
        `, [userId]);
        const orders = result.rows;

        // Get items for each order
        for(let order of orders) {
             const itemsResult = await pool.query(`
                 SELECT oi.quantity, oi.price, p.name, p.image 
                 FROM Order_Items oi
                 JOIN Products p ON oi.product_id = p.id
                 WHERE oi.order_id = $1
             `, [order.id]);
             order.items = itemsResult.rows;
        }

        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// For Sellers to view orders containing their products
exports.getSellerOrders = async (req, res) => {
    if (!req.user.sellerId) {
        return res.status(403).json({ message: "Seller profile required." });
    }

    try {
        // Find order items that belong to the seller's products
        const result = await pool.query(`
            SELECT DISTINCT o.id as order_id, o.order_date, o.order_status, o.payment_method, o.payment_status,
                   o.shipping_charge, o.shipping_status, o.courier_name, o.tracking_number, o.total_price,
                   u.email as customer_email, a.name as customer_name, a.phone, a.address, a.city, a.state, a.pincode
            FROM Orders o
            JOIN Addresses a ON o.address_id = a.id
            JOIN Order_Items oi ON o.id = oi.order_id
            JOIN Products p ON oi.product_id = p.id
            JOIN Users u ON o.user_id = u.id
            WHERE p.seller_id = $1
            ORDER BY o.order_date DESC
        `, [req.user.sellerId]);
        const orders = result.rows;

        for (let order of orders) {
             const itemsResult = await pool.query(`
                 SELECT oi.quantity, oi.price, p.name 
                 FROM Order_Items oi
                 JOIN Products p ON oi.product_id = p.id
                 WHERE oi.order_id = $1 AND p.seller_id = $2
             `, [order.order_id, req.user.sellerId]);
             order.items = itemsResult.rows;
        }

        res.status(200).json(orders);
    } catch (err) {
         res.status(500).json({ message: err.message });
    }
};

exports.cancelOrder = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const result = await pool.query('SELECT order_status, user_id FROM Orders WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Order not found." });
        if (result.rows[0].user_id !== userId) return res.status(403).json({ message: "Unauthorized." });
        
        const status = result.rows[0].order_status;
        if (status === 'Packed' || status === 'Shipped' || status === 'Delivered') {
            return res.status(400).json({ message: "Order cannot be cancelled after it has been packed." });
        }
        if (status !== 'Pending') {
            return res.status(400).json({ message: "Only pending orders can be cancelled." });
        }

        // Restore stock
        const itemsResult = await pool.query('SELECT product_id, quantity FROM Order_Items WHERE order_id = $1', [id]);
        for (let item of itemsResult.rows) {
            await pool.query('UPDATE Products SET stock_quantity = stock_quantity + $1 WHERE id = $2', [item.quantity, item.product_id]);
        }

        await pool.query('UPDATE Orders SET order_status = $1 WHERE id = $2', ['Cancelled', id]);
        
        // Trigger notification
        await notificationController.createNotification(userId, `Your order #${id} has been cancelled.`);
        logger.info(`Order ${id} cancelled by user ${userId}`);

        res.status(200).json({ message: "Order cancelled successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteOrderHistory = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const result = await pool.query('SELECT user_id FROM Orders WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Order not found." });
        if (result.rows[0].user_id !== userId) return res.status(403).json({ message: "Unauthorized." });

        await pool.query('DELETE FROM Orders WHERE id = $1', [id]);
        res.status(200).json({ message: "Order deleted from history." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'

    const validStatuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
         return res.status(400).json({ message: "Invalid status." });
    }

    try {
        await pool.query('UPDATE Orders SET order_status = $1 WHERE id = $2', [status, id]);

        // Get user_id of the order to notify them
        const orderResult = await pool.query('SELECT user_id FROM Orders WHERE id = $1', [id]);
        if (orderResult.rows.length > 0) {
            const userId = orderResult.rows[0].user_id;
            await notificationController.createNotification(
                userId, 
                `Your order #${id} status has been updated to "${status}".`,
                `/profile?tab=orders`
            );
        }

        if (status === 'Confirmed') {
            shippingController.triggerAutomaticShipment(id).catch(err => {
                logger.error(`Error triggering auto-shipment for order ${id}: ${err.message}`);
            });
        }

        res.status(200).json({ message: "Order status updated." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updatePaymentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Expecting 'Completed'
    const sellerId = req.user.sellerId;
    const role = req.user.role;

    if (status !== 'Completed') {
        return res.status(400).json({ message: "Invalid payment status. Only 'Completed' is allowed." });
    }

    try {
        // 1. Check if order exists and current status
        const orderResult = await pool.query('SELECT payment_status FROM Orders WHERE id = $1', [id]);
        if (orderResult.rows.length === 0) return res.status(404).json({ message: "Order not found." });
        
        const currentStatus = orderResult.rows[0].payment_status;
        if (currentStatus === 'Completed') {
            return res.status(400).json({ message: "Payment is already completed and cannot be changed back." });
        }

        // 2. Authorization: Admin can update any. Seller can only update if they have items in this order.
        if (role !== 'admin') {
            const itemCheck = await pool.query(`
                SELECT 1 FROM Order_Items oi 
                JOIN Products p ON oi.product_id = p.id 
                WHERE oi.order_id = $1 AND p.seller_id = $2
            `, [id, sellerId]);
            
            if (itemCheck.rows.length === 0) {
                return res.status(403).json({ message: "Unauthorized. You don't have products in this order." });
            }
        }

        // 3. Update Status
        await pool.query('UPDATE Orders SET payment_status = $1 WHERE id = $2', [status, id]);
        
        logger.info(`Payment status for order ${id} updated to ${status} by ${role} ${req.user.id}`);
        res.status(200).json({ message: "Payment status updated to Completed." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateShipping = async (req, res) => {
    const { id } = req.params;
    const { courier_name, tracking_number, shipping_status } = req.body;

    const validStatuses = ['Pending', 'Packed', 'Shipped', 'Delivered'];
    if (shipping_status && !validStatuses.includes(shipping_status)) {
        return res.status(400).json({ message: "Invalid shipping status." });
    }

    try {
        const orderRes = await pool.query('SELECT id FROM Orders WHERE id = $1', [id]);
        if (orderRes.rows.length === 0) return res.status(404).json({ message: "Order not found." });

        const updates = [];
        const params = [];
        let idx = 1;
        if (courier_name !== undefined) {
            updates.push(`courier_name = $${idx++}`);
            params.push(courier_name);
        }
        if (tracking_number !== undefined) {
            updates.push(`tracking_number = $${idx++}`);
            params.push(tracking_number);
        }
        if (shipping_status !== undefined) {
            updates.push(`shipping_status = $${idx++}`);
            params.push(shipping_status);
            if (shipping_status === 'Delivered') {
                updates.push(`order_status = 'Delivered'`);
            } else if (shipping_status === 'Shipped') {
                updates.push(`order_status = 'Shipped'`);
            }
        }
        if (updates.length === 0) {
            return res.status(400).json({ message: "No fields to update." });
        }
        params.push(id);
        await pool.query(`UPDATE Orders SET ${updates.join(', ')} WHERE id = $${idx}`, params);

        // Notify user
        const orderInfo = await pool.query('SELECT user_id FROM Orders WHERE id = $1', [id]);
        if (orderInfo.rows.length > 0) {
            const msg = shipping_status
                ? `Your order #${id} shipping status updated to "${shipping_status}".`
                : `Your order #${id} shipping information has been updated.`;
            await notificationController.createNotification(orderInfo.rows[0].user_id, msg, `/profile?tab=orders`);
        }

        res.status(200).json({ message: "Shipping info updated successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin
exports.getAllOrders = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT o.id, o.order_date, o.total_price, o.order_status, o.payment_method, o.shipping_charge, o.shipping_provider,
                   u.email as user_email
            FROM Orders o
            JOIN Users u ON o.user_id = u.id
            ORDER BY o.order_date DESC
        `);
        res.status(200).json(result.rows);
    } catch (err) {
         res.status(500).json({ message: err.message });
    }
};

exports.deleteOrderAsAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM Orders WHERE id = $1', [id]);
        res.status(200).json({ message: "Order deleted by admin." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getOrderById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    try {
        const result = await pool.query(`
            SELECT o.*, a.name as delivery_name, a.phone, a.address, a.city, a.state, a.pincode
            FROM Orders o
            JOIN Addresses a ON o.address_id = a.id
            WHERE o.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Order not found." });
        }

        const order = result.rows[0];

        // Authorization check: User can only see their own, Admin/Seller check logic
        if (role !== 'admin' && order.user_id !== userId) {
             // If seller, check if they have items in this order
             if (role === 'seller') {
                 const itemCheck = await pool.query(`
                     SELECT 1 FROM Order_Items oi 
                     JOIN Products p ON oi.product_id = p.id 
                     WHERE oi.order_id = $1 AND p.seller_id = $2
                 `, [id, req.user.sellerId]);
                 if (itemCheck.rows.length === 0) {
                     return res.status(403).json({ message: "Unauthorized." });
                 }
             } else {
                 return res.status(403).json({ message: "Unauthorized." });
             }
        }

        const itemsResult = await pool.query(`
            SELECT oi.*, p.name, p.image
            FROM Order_Items oi
            JOIN Products p ON oi.product_id = p.id
            WHERE oi.order_id = $1
        `, [id]);

        order.items = itemsResult.rows;
        res.status(200).json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getUserOrdersById = async (req, res) => {
    const { id: userId } = req.params;
    const currentUserId = req.user.id;
    const role = req.user.role;

    // Only allow admin or the user themselves
    if (role !== 'admin' && parseInt(userId) !== currentUserId) {
        return res.status(403).json({ message: "Unauthorized." });
    }

    try {
        const result = await pool.query(`
            SELECT o.*, a.name as delivery_name, a.address, a.city, a.state, a.pincode
            FROM Orders o
            JOIN Addresses a ON o.address_id = a.id
            WHERE o.user_id = $1
            ORDER BY o.order_date DESC
        `, [userId]);
        
        const orders = result.rows;
        for (let order of orders) {
            const items = await pool.query(`
                SELECT oi.*, p.name, p.image 
                FROM Order_Items oi
                JOIN Products p ON oi.product_id = p.id
                WHERE oi.order_id = $1
            `, [order.id]);
            order.items = items.rows;
        }

        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.notifySellersAndAdminsOfNewOrder = async (orderId, totalPrice, cartItems, userId) => {
    try {
        const userRes = await pool.query('SELECT name FROM Users WHERE id = $1', [userId]);
        const purchaserName = userRes.rows[0]?.name || 'A customer';

        // 1. Notify Admin
        const adminsResult = await pool.query("SELECT id FROM Users WHERE role = 'admin'");
        for (let admin of adminsResult.rows) {
            await notificationController.createNotification(
                admin.id,
                `New order #${orderId} of ₹${totalPrice} has been placed by ${purchaserName}.`,
                `/admin`
            );
        }

        // 2. Notify Sellers
        const uniqueSellerIds = [...new Set(cartItems.map(item => item.seller_id))];
        for (let sellerId of uniqueSellerIds) {
            const sellerRes = await pool.query('SELECT user_id FROM Sellers WHERE id = $1', [sellerId]);
            if (sellerRes.rows.length > 0) {
                const sellerUserId = sellerRes.rows[0].user_id;
                await notificationController.createNotification(
                    sellerUserId,
                    `New order #${orderId} has been placed containing your products.`,
                    `/seller`
                );
            }
        }
    } catch (err) {
        console.error("Error sending order placement notifications to admins/sellers:", err);
    }
};
