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

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
    }
});

exports.createNotification = async (userId, message, url = '/') => {
    try {
        await pool.query(
            'INSERT INTO Notifications (user_id, message) VALUES ($1, $2)',
            [userId, message]
        );
        // Send background push notification
        pushService.sendPushNotification(userId, 'RR Dental Needs', message, url);

        // Fetch user email for email notification
        const userRes = await pool.query('SELECT email, name FROM Users WHERE id = $1', [userId]);
        if (userRes.rows.length > 0) {
            const userEmail = userRes.rows[0].email;
            const userName = userRes.rows[0].name;

            const mailOptions = {
                from: process.env.SMTP_EMAIL || 'no-reply@rrdentalneeds.online',
                to: userEmail,
                subject: 'Notification Update - RR Dental Needs',
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2>Hello ${userName},</h2>
                        <p>${message}</p>
                        <p>You can check the details on our website:</p>
                        <a href="https://rrdentalneeds.online${url}" style="background-color: #0d9488; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">View Update</a>
                        <br/><br/>
                        <p>Regards,<br/>RR Dental Needs Team</p>
                    </div>
                `
            };

            // Send in background, don't block
            transporter.sendMail(mailOptions).catch(mailErr => {
                console.error("Nodemailer failed in background:", mailErr.message);
            });
        }
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
