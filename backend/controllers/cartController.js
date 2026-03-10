const pool = require('../db');

exports.addToCart = async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!productId || !quantity) {
        return res.status(400).json({ message: "Product ID and quantity required." });
    }

    try {
        // Check if product exists and stock
        const [products] = await pool.query('SELECT stock_quantity FROM Products WHERE id = ?', [productId]);
        if (products.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }
        
        if (products[0].stock_quantity < quantity) {
            return res.status(400).json({ message: "Not enough stock available." });
        }

        // Check if item already in cart
        const [cartItems] = await pool.query('SELECT id, quantity FROM Cart WHERE user_id = ? AND product_id = ?', [userId, productId]);
        
        if (cartItems.length > 0) {
            // Update quantity
            const newQuantity = cartItems[0].quantity + parseInt(quantity);
            if (newQuantity > products[0].stock_quantity) {
                return res.status(400).json({ message: "Total requested quantity exceeds stock." });
            }
            await pool.query('UPDATE Cart SET quantity = ? WHERE id = ?', [newQuantity, cartItems[0].id]);
            return res.status(200).json({ message: "Cart updated." });
        } else {
            // Insert new cart item
            await pool.query('INSERT INTO Cart (user_id, product_id, quantity) VALUES (?, ?, ?)', [userId, productId, quantity]);
            return res.status(201).json({ message: "Item added to cart." });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getCart = async (req, res) => {
    const userId = req.user.id;
    try {
        const [cartItems] = await pool.query(`
            SELECT c.id as cart_id, c.quantity, p.id as product_id, p.name, p.price, p.image, p.stock_quantity 
            FROM Cart c 
            JOIN Products p ON c.product_id = p.id 
            WHERE c.user_id = ?
        `, [userId]);
        res.status(200).json(cartItems);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateCartQuantity = async (req, res) => {
    const { id } = req.params; // cart item id
    const { quantity } = req.body;
    const userId = req.user.id;

    if (!quantity || quantity < 1) {
        return res.status(400).json({ message: "Invalid quantity." });
    }

    try {
        const [cartItems] = await pool.query('SELECT c.user_id, p.stock_quantity FROM Cart c JOIN Products p ON c.product_id = p.id WHERE c.id = ?', [id]);
        
        if (cartItems.length === 0) {
            return res.status(404).json({ message: "Cart item not found." });
        }

        if (cartItems[0].user_id !== userId) {
            return res.status(403).json({ message: "Unauthorized." });
        }

        if (cartItems[0].stock_quantity < quantity) {
             return res.status(400).json({ message: "Not enough stock available." });
        }

        await pool.query('UPDATE Cart SET quantity = ? WHERE id = ?', [quantity, id]);
        res.status(200).json({ message: "Cart quantity updated." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.removeFromCart = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const [cartItems] = await pool.query('SELECT user_id FROM Cart WHERE id = ?', [id]);
        
        if (cartItems.length === 0) {
            return res.status(404).json({ message: "Cart item not found." });
        }

        if (cartItems[0].user_id !== userId) {
            return res.status(403).json({ message: "Unauthorized." });
        }

        await pool.query('DELETE FROM Cart WHERE id = ?', [id]);
        res.status(200).json({ message: "Item removed from cart." });
    } catch (err) {
         res.status(500).json({ message: err.message });
    }
};

exports.clearCart = async (req, res) => {
    const userId = req.user.id;
    try {
        await pool.query('DELETE FROM Cart WHERE user_id = ?', [userId]);
        res.status(200).json({ message: "Cart cleared." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
