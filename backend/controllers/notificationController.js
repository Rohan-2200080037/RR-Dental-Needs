const pool = require('../db');

exports.getNotifications = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await pool.query(
            'SELECT * FROM Notifications WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.markAsRead = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const result = await pool.query(
            'UPDATE Notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
        res.status(200).json({ message: "Notification marked as read." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createNotification = async (userId, message) => {
    try {
        await pool.query(
            'INSERT INTO Notifications (user_id, message) VALUES ($1, $2)',
            [userId, message]
        );
    } catch (err) {
        console.error("Error creating notification:", err);
    }
};
