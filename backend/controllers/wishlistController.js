const pool = require('../db');

exports.addToWishlist = async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) return res.status(400).json({ message: "Product ID required." });

    try {
        const [existing] = await pool.query('SELECT id FROM Wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
        if (existing.length > 0) return res.status(400).json({ message: "Product already in wishlist." });

        await pool.query('INSERT INTO Wishlist (user_id, product_id) VALUES (?, ?)', [userId, productId]);
        res.status(201).json({ message: "Added to wishlist." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getWishlist = async (req, res) => {
    const userId = req.user.id;
    try {
        const [wishlist] = await pool.query(`
            SELECT w.id as wishlist_id, p.id as product_id, p.name, p.price, p.image, p.stock_quantity
            FROM Wishlist w
            JOIN Products p ON w.product_id = p.id
            WHERE w.user_id = ?
        `, [userId]);
        res.status(200).json(wishlist);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.moveToCart = async (req, res) => {
    const { id } = req.params; // wishlist item id
    const userId = req.user.id;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [wishlistItems] = await connection.query('SELECT product_id FROM Wishlist WHERE id = ? AND user_id = ?', [id, userId]);
        if (wishlistItems.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Wishlist item not found." });
        }

        const productId = wishlistItems[0].product_id;

        // Add to Cart
        const [cartItems] = await connection.query('SELECT id, quantity FROM Cart WHERE user_id = ? AND product_id = ?', [userId, productId]);
        
        if (cartItems.length > 0) {
            await connection.query('UPDATE Cart SET quantity = quantity + 1 WHERE id = ?', [cartItems[0].id]);
        } else {
            await connection.query('INSERT INTO Cart (user_id, product_id, quantity) VALUES (?, ?, 1)', [userId, productId]);
        }

        // Remove from wishlist
        await connection.query('DELETE FROM Wishlist WHERE id = ?', [id]);

        await connection.commit();
        res.status(200).json({ message: "Item moved to cart." });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ message: err.message });
    } finally {
        connection.release();
    }
};

exports.removeFromWishlist = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const [result] = await pool.query('DELETE FROM Wishlist WHERE id = ? AND user_id = ?', [id, userId]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Wishlist item not found or unauthorized." });
        res.status(200).json({ message: "Item removed from wishlist." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
