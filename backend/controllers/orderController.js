const pool = require('../db');

exports.createOrder = async (req, res) => {
    const userId = req.user.id;
    const { 
        name, phone, address, city, state, pincode, 
        paymentMethod = 'COD' 
    } = req.body;

    if (!name || !phone || !address || !city || !state || !pincode) {
        return res.status(400).json({ message: "All address fields are required." });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Get Cart Items
        const [cartItems] = await connection.query(`
            SELECT c.product_id, c.quantity, p.price, p.stock_quantity, p.seller_id
            FROM Cart c 
            JOIN Products p ON c.product_id = p.id 
            WHERE c.user_id = ?
        `, [userId]);

        if (cartItems.length === 0) {
            await connection.rollback();
            return res.status(400).json({ message: "Cart is empty." });
        }

        // 2. Validate Stock and Calculate Total Price
        let totalPrice = 0;
        for (let item of cartItems) {
            if (item.quantity > item.stock_quantity) {
                 await connection.rollback();
                 return res.status(400).json({ message: `Insufficient stock for product ID ${item.product_id}.` });
            }
            totalPrice += item.price * item.quantity;
        }

        // 3. Save Address
        const [addressResult] = await connection.query(
            'INSERT INTO Addresses (user_id, name, phone, address, city, state, pincode) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, name, phone, address, city, state, pincode]
        );
        const addressId = addressResult.insertId;

        // 4. Create Order
        const [orderResult] = await connection.query(
            'INSERT INTO Orders (user_id, address_id, total_price, payment_method, order_status) VALUES (?, ?, ?, ?, ?)',
            [userId, addressId, totalPrice, paymentMethod, 'Pending']
        );
        const orderId = orderResult.insertId;

        // 5. Create Order Items & Update Stock
        for (let item of cartItems) {
             await connection.query(
                 'INSERT INTO Order_Items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                 [orderId, item.product_id, item.quantity, item.price]
             );

             // Deduct stock
             await connection.query(
                 'UPDATE Products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                 [item.quantity, item.product_id]
             );
        }

        // 6. Clear Cart
        await connection.query('DELETE FROM Cart WHERE user_id = ?', [userId]);

        await connection.commit();
        res.status(201).json({ message: "Order placed successfully.", orderId });

    } catch (err) {
        await connection.rollback();
        res.status(500).json({ message: err.message });
    } finally {
        connection.release();
    }
};

exports.getUserOrders = async (req, res) => {
    const userId = req.user.id;
    try {
        const [orders] = await pool.query(`
            SELECT o.id, o.order_date, o.total_price, o.order_status, o.payment_method,
                   a.name as delivery_name, a.address, a.city, a.state, a.pincode
            FROM Orders o
            JOIN Addresses a ON o.address_id = a.id
            WHERE o.user_id = ?
            ORDER BY o.order_date DESC
        `, [userId]);

        // Get items for each order
        for(let order of orders) {
             const [items] = await pool.query(`
                 SELECT oi.quantity, oi.price, p.name, p.image 
                 FROM Order_Items oi
                 JOIN Products p ON oi.product_id = p.id
                 WHERE oi.order_id = ?
             `, [order.id]);
             order.items = items;
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
        const [orders] = await pool.query(`
            SELECT DISTINCT o.id as order_id, o.order_date, o.order_status, o.payment_method,
                   u.email as customer_email, a.name as customer_name, a.phone, a.address, a.city, a.state, a.pincode
            FROM Orders o
            JOIN Addresses a ON o.address_id = a.id
            JOIN Order_Items oi ON o.id = oi.order_id
            JOIN Products p ON oi.product_id = p.id
            JOIN Users u ON o.user_id = u.id
            WHERE p.seller_id = ?
            ORDER BY o.order_date DESC
        `, [req.user.sellerId]);

        for (let order of orders) {
             const [items] = await pool.query(`
                 SELECT oi.quantity, oi.price, p.name 
                 FROM Order_Items oi
                 JOIN Products p ON oi.product_id = p.id
                 WHERE oi.order_id = ? AND p.seller_id = ?
             `, [order.order_id, req.user.sellerId]);
             order.items = items;
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
        const [orders] = await pool.query('SELECT order_status, user_id FROM Orders WHERE id = ?', [id]);
        if (orders.length === 0) return res.status(404).json({ message: "Order not found." });
        if (orders[0].user_id !== userId) return res.status(403).json({ message: "Unauthorized." });
        if (orders[0].order_status !== 'Pending') {
            return res.status(400).json({ message: "Only pending orders can be cancelled." });
        }

        // Restore stock
        const [items] = await pool.query('SELECT product_id, quantity FROM Order_Items WHERE order_id = ?', [id]);
        for (let item of items) {
            await pool.query('UPDATE Products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
        }

        await pool.query('UPDATE Orders SET order_status = ? WHERE id = ?', ['Cancelled', id]);
        res.status(200).json({ message: "Order cancelled successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteOrderHistory = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const [orders] = await pool.query('SELECT user_id FROM Orders WHERE id = ?', [id]);
        if (orders.length === 0) return res.status(404).json({ message: "Order not found." });
        if (orders[0].user_id !== userId) return res.status(403).json({ message: "Unauthorized." });

        await pool.query('DELETE FROM Orders WHERE id = ?', [id]);
        res.status(200).json({ message: "Order deleted from history." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Pending', 'Packed', 'Shipped', 'Delivered'

    const validStatuses = ['Pending', 'Packed', 'Shipped', 'Delivered'];
    if (!validStatuses.includes(status)) {
         return res.status(400).json({ message: "Invalid status." });
    }

    try {
        // Usually, an admin updates status, or a seller updates status of orders containing their items.
        // For simplicity based on requirements, Admin can update any order status, 
        // Sellers can update order status for their products.
        // If order_status is tied to the Order table, updating it affects all items.

        await pool.query('UPDATE Orders SET order_status = ? WHERE id = ?', [status, id]);
        res.status(200).json({ message: "Order status updated." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin
exports.getAllOrders = async (req, res) => {
    try {
        const [orders] = await pool.query(`
            SELECT o.id, o.order_date, o.total_price, o.order_status, o.payment_method, u.email as user_email
            FROM Orders o
            JOIN Users u ON o.user_id = u.id
            ORDER BY o.order_date DESC
        `);
        res.status(200).json(orders);
    } catch (err) {
         res.status(500).json({ message: err.message });
    }
};

exports.deleteOrderAsAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM Orders WHERE id = ?', [id]);
        res.status(200).json({ message: "Order deleted by admin." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
