const webpush = require('web-push');
const fs = require('fs');
const path = require('path');
const pool = require('../db');

// Auto-generate VAPID keys if not present in environment or .env file
function initVapidKeys() {
    let publicKey = process.env.VAPID_PUBLIC_KEY;
    let privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
        const envPath = path.join(__dirname, '../.env');
        let keys;
        
        try {
            keys = webpush.generateVAPIDKeys();
        } catch (err) {
            console.error("Error generating VAPID keys. web-push might not be installed yet:", err.message);
            return;
        }

        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            let updated = false;

            if (!envContent.includes('VAPID_PUBLIC_KEY')) {
                envContent += `\nVAPID_PUBLIC_KEY="${keys.publicKey}"`;
                publicKey = keys.publicKey;
                updated = true;
            }
            if (!envContent.includes('VAPID_PRIVATE_KEY')) {
                envContent += `\nVAPID_PRIVATE_KEY="${keys.privateKey}"`;
                privateKey = keys.privateKey;
                updated = true;
            }

            if (updated) {
                fs.writeFileSync(envPath, envContent, 'utf8');
                console.log("VAPID keys successfully generated and written to backend/.env");
            }
        } else {
            publicKey = keys.publicKey;
            privateKey = keys.privateKey;
            console.log("No .env file found. Using temporary in-memory VAPID keys.");
        }

        process.env.VAPID_PUBLIC_KEY = publicKey;
        process.env.VAPID_PRIVATE_KEY = privateKey;
    }

    if (publicKey && privateKey) {
        webpush.setVapidDetails(
            'mailto:rrdentalneeds@gmail.com',
            publicKey,
            privateKey
        );
        console.log("Web Push VAPID details set successfully.");
    }
}

// Initialize VAPID keys setup
initVapidKeys();

/**
 * Sends a push notification to all subscriptions of a specific user.
 * @param {number} userId - The ID of the user.
 * @param {string} title - The notification title.
 * @param {string} body - The notification body content.
 * @param {string} [url] - Optional navigation URL for when the notification is clicked.
 */
async function sendPushNotification(userId, title, body, url = '/') {
    try {
        const result = await pool.query(
            'SELECT * FROM push_subscriptions WHERE user_id = $1',
            [userId]
        );

        const subscriptions = result.rows;
        if (subscriptions.length === 0) {
            return;
        }

        console.log(`Sending push notification to user ${userId} (${subscriptions.length} subscription(s))...`);

        const payload = JSON.stringify({
            title,
            body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            url
        });

        const sendPromises = subscriptions.map(async (sub) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };

            try {
                await webpush.sendNotification(pushSubscription, payload);
            } catch (err) {
                // If subscription has expired or is no longer active, delete it from the DB
                if (err.statusCode === 410 || err.statusCode === 404) {
                    console.log(`Subscription for endpoint ${sub.endpoint} has expired. Deleting...`);
                    await pool.query(
                        'DELETE FROM push_subscriptions WHERE id = $1',
                        [sub.id]
                    );
                } else {
                    console.error(`Failed to send push notification to endpoint ${sub.endpoint}:`, err);
                }
            }
        });

        await Promise.all(sendPromises);
    } catch (err) {
        console.error(`Error in sendPushNotification for user ${userId}:`, err);
    }
}

module.exports = {
    sendPushNotification,
    getPublicKey: () => process.env.VAPID_PUBLIC_KEY
};
