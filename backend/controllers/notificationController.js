const pool = require('../db');
const pushService = require('../services/pushService');

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

exports.createNotification = async (userId, message, url = '/') => {
    try {
        await pool.query(
            'INSERT INTO Notifications (user_id, message) VALUES ($1, $2)',
            [userId, message]
        );
        // Send background push notification
        pushService.sendPushNotification(userId, 'RR Dental Needs', message, url);
    } catch (err) {
        console.error("Error creating notification:", err);
    }
};

exports.clearAll = async (req, res) => {
    const userId = req.user.id;
    try {
        await pool.query(
            'DELETE FROM Notifications WHERE user_id = $1',
            [userId]
        );
        res.status(200).json({ message: "All notifications cleared." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getVapidKey = (req, res) => {
    try {
        const publicKey = pushService.getPublicKey();
        res.status(200).json({ publicKey });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.subscribe = async (req, res) => {
    const userId = req.user.id;
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
        return res.status(400).json({ message: "Invalid subscription payload." });
    }

    try {
        // Upsert subscription: insert or update keys for the endpoint
        await pool.query(`
            INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (endpoint) 
            DO UPDATE SET user_id = $1, p256dh = $3, auth = $4
        `, [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]);

        res.status(201).json({ message: "Subscription saved successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.unsubscribe = async (req, res) => {
    const { endpoint } = req.body;

    if (!endpoint) {
        return res.status(400).json({ message: "Endpoint is required." });
    }

    try {
        await pool.query(
            'DELETE FROM push_subscriptions WHERE endpoint = $1',
            [endpoint]
        );
        res.status(200).json({ message: "Subscription removed successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
