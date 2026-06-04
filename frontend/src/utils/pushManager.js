import axios from 'axios';

// Helper to convert URL-safe base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Check if the browser supports push notifications
 */
export function isPushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Check if push notifications permission is currently granted
 */
export function getNotificationPermission() {
    return Notification.permission;
}

/**
 * Check if there is an active push subscription on this device
 */
export async function getActiveSubscription() {
    if (!isPushSupported()) return null;
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
}

/**
 * Subscribe the user to push notifications
 * @param {string} token - The auth JWT token
 * @returns {Promise<PushSubscription>}
 */
export async function subscribeToPush(token) {
    if (!isPushSupported()) {
        throw new Error('Push notifications are not supported in this browser.');
    }

    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error('Notification permission was denied.');
    }

    const registration = await navigator.serviceWorker.ready;

    // 2. Fetch VAPID Public Key from backend
    const vapidKeyRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/notifications/vapid-key`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const vapidPublicKey = vapidKeyRes.data.publicKey;

    // 3. Subscribe via PushManager
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
    });

    // 4. Send subscription details to backend
    await axios.post(
        `${import.meta.env.VITE_API_URL}/api/notifications/subscribe`,
        { subscription },
        { headers: { Authorization: `Bearer ${token}` } }
    );

    return subscription;
}

/**
 * Unsubscribe the user from push notifications
 * @param {string} token - The auth JWT token
 */
export async function unsubscribeFromPush(token) {
    if (!isPushSupported()) return;

    const subscription = await getActiveSubscription();
    if (!subscription) return;

    // 1. Unsubscribe from the push service provider
    await subscription.unsubscribe();

    // 2. Notify the backend to remove subscription
    await axios.post(
        `${import.meta.env.VITE_API_URL}/api/notifications/unsubscribe`,
        { endpoint: subscription.endpoint },
        { headers: { Authorization: `Bearer ${token}` } }
    );
}
