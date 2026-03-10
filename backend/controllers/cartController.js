const pool = require('../db');

exports.addToCart = async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!productId || !quantity) {
        return res.status(400).json({ message: "Product ID and quantity required." });
    }

    try {
        // Check if product exists and stock
        const productResult = await pool.query('SELECT stock_quantity FROM Products WHERE id = $1', [productId]);
        if (productResult.rows.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }
        
        if (productResult.rows[0].stock_quantity < quantity) {
            return res.status(400).json({ message: "Not enough stock available." });
        }

        // Check if item already in cart
        const cartResult = await pool.query('SELECT id, quantity FROM Cart WHERE user_id = $1 AND product_id = $2', [userId, productId]);
        
        if (cartResult.rows.length > 0) {
            // Update quantity
            const newQuantity = cartResult.rows[0].quantity + parseInt(quantity);
            if (newQuantity > productResult.rows[0].stock_quantity) {
                return res.status(400).json({ message: "Total requested quantity exceeds stock." });
            }
            await pool.query('UPDATE Cart SET quantity = $1 WHERE id = $2', [newQuantity, cartResult.rows[0].id]);
            return res.status(200).json({ message: "Cart updated." });
        } else {
            // Insert new cart item
            await pool.query('INSERT INTO Cart (user_id, product_id, quantity) VALUES ($1, $2, $3)', [userId, productId, quantity]);
            return res.status(201).json({ message: "Item added to cart." });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getCart = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await pool.query(`
            SELECT c.id as cart_id, c.quantity, p.id as product_id, p.name, p.price, p.image, p.stock_quantity 
            FROM Cart c 
            JOIN Products p ON c.product_id = p.id 
            WHERE c.user_id = $1
        `, [userId]);
        res.status(200).json(result.rows);
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
        const result = await pool.query('SELECT c.user_id, p.stock_quantity FROM Cart c JOIN Products p ON c.product_id = p.id WHERE c.id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Cart item not found." });
        }

        if (result.rows[0].user_id !== userId) {
            return res.status(403).json({ message: "Unauthorized." });
        }

        if (result.rows[0].stock_quantity < quantity) {
             return res.status(400).json({ message: "Not enough stock available." });
        }

        await pool.query('UPDATE Cart SET quantity = $1 WHERE id = $2', [quantity, id]);
        res.status(200).json({ message: "Cart quantity updated." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.removeFromCart = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const result = await pool.query('SELECT user_id FROM Cart WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Cart item not found." });
        }

        if (result.rows[0].user_id !== userId) {
            return res.status(403).json({ message: "Unauthorized." });
        }

        await pool.query('DELETE FROM Cart WHERE id = $1', [id]);
        res.status(200).json({ message: "Item removed from cart." });
    } catch (err) {
         res.status(500).json({ message: err.message });
    }
};

exports.clearCart = async (req, res) => {
    const userId = req.user.id;
    try {
        await pool.query('DELETE FROM Cart WHERE user_id = $1', [userId]);
        res.status(200).json({ message: "Cart cleared." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
