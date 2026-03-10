const pool = require('../db');

exports.addReview = async (req, res) => {
    const userId = req.user.id;
    const { productId, rating, comment } = req.body;

    if (!productId || !rating) {
        return res.status(400).json({ message: "Product ID and rating are required." });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    try {
        const result = await pool.query('SELECT id FROM Reviews WHERE user_id = $1 AND product_id = $2', [userId, productId]);
        if (result.rows.length > 0) return res.status(400).json({ message: "You already reviewed this product." });

        await pool.query('INSERT INTO Reviews (user_id, product_id, rating, comment) VALUES ($1, $2, $3, $4)', [userId, productId, rating, comment]);
        res.status(201).json({ message: "Review added successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProductReviews = async (req, res) => {
    const { productId } = req.params;
    try {
        const reviewsResult = await pool.query(`
            SELECT r.id, r.rating, r.comment, r.review_date, u.name as user_name 
            FROM Reviews r
            JOIN Users u ON r.user_id = u.id
            WHERE r.product_id = $1
            ORDER BY r.review_date DESC
        `, [productId]);

        const avgResult = await pool.query('SELECT AVG(rating) as average_rating FROM Reviews WHERE product_id = $1', [productId]);
        
        res.status(200).json({ reviews: reviewsResult.rows, averageRating: avgResult.rows[0].average_rating || 0 });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateReview = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    try {
        const result = await pool.query('SELECT user_id FROM Reviews WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Review not found." });
        if (result.rows[0].user_id !== userId) return res.status(403).json({ message: "Unauthorized." });

        await pool.query('UPDATE Reviews SET rating = COALESCE($1, rating), comment = COALESCE($2, comment) WHERE id = $3', [rating, comment, id]);
        res.status(200).json({ message: "Review updated successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteReview = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const result = await pool.query('SELECT user_id FROM Reviews WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Review not found." });
        
        if (result.rows[0].user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized." });
        }

        await pool.query('DELETE FROM Reviews WHERE id = $1', [id]);
        res.status(200).json({ message: "Review deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
