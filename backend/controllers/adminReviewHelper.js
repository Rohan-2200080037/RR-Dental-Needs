exports.getAllReviews = async (req, res) => {
    try {
        const query = `
            SELECT r.id, r.rating, r.comment, r.review_date, r.product_id, p.name as product_name, u.name as user_name 
            FROM Reviews r
            JOIN Users u ON r.user_id = u.id
            JOIN Products p ON r.product_id = p.id
            ORDER BY r.review_date DESC
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
