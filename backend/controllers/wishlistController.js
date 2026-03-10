const pool = require('../db');

exports.addToWishlist = async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) return res.status(400).json({ message: "Product ID required." });

    try {
        const result = await pool.query('SELECT id FROM Wishlist WHERE user_id = $1 AND product_id = $2', [userId, productId]);
        if (result.rows.length > 0) return res.status(400).json({ message: "Product already in wishlist." });

        await pool.query('INSERT INTO Wishlist (user_id, product_id) VALUES ($1, $2)', [userId, productId]);
        res.status(201).json({ message: "Added to wishlist." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getWishlist = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await pool.query(`
            SELECT w.id as wishlist_id, p.id as product_id, p.name, p.price, p.image, p.stock_quantity
            FROM Wishlist w
            JOIN Products p ON w.product_id = p.id
            WHERE w.user_id = $1
        `, [userId]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.moveToCart = async (req, res) => {
    const { id } = req.params; // wishlist item id
    const userId = req.user.id;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const wishlistResult = await client.query('SELECT product_id FROM Wishlist WHERE id = $1 AND user_id = $2', [id, userId]);
        if (wishlistResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Wishlist item not found." });
        }

        const productId = wishlistResult.rows[0].product_id;

        // Add to Cart
        const cartResult = await client.query('SELECT id, quantity FROM Cart WHERE user_id = $1 AND product_id = $2', [userId, productId]);
        
        if (cartResult.rows.length > 0) {
            await client.query('UPDATE Cart SET quantity = quantity + 1 WHERE id = $1', [cartResult.rows[0].id]);
        } else {
            await client.query('INSERT INTO Cart (user_id, product_id, quantity) VALUES ($1, $2, 1)', [userId, productId]);
        }

        // Remove from wishlist
        await client.query('DELETE FROM Wishlist WHERE id = $1', [id]);

        await client.query('COMMIT');
        res.status(200).json({ message: "Item moved to cart." });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
};

exports.removeFromWishlist = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const result = await pool.query('DELETE FROM Wishlist WHERE id = $1 AND user_id = $2', [id, userId]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Wishlist item not found or unauthorized." });
        res.status(200).json({ message: "Item removed from wishlist." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.removeFromWishlistByProduct = async (req, res) => {
    const { productId } = req.params;
    const userId = req.user.id;

    try {
        const result = await pool.query('DELETE FROM Wishlist WHERE product_id = $1 AND user_id = $2', [productId, userId]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Wishlist item not found or unauthorized." });
        res.status(200).json({ message: "Item removed from wishlist." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
