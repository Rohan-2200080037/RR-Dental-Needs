/*
 * Custom service worker extension for Web Push Notifications
 */

self.addEventListener('push', function(event) {
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Notification', body: event.data.text() };
        }
    }

    const title = data.title || 'RR Dental Needs';
    const options = {
        body: data.body || 'You have a new notification!',
        icon: data.icon || '/pwa-192x192.png',
        badge: data.badge || '/pwa-192x192.png',
        data: {
            url: data.url || '/'
        },
        // Native mobile vibrations if supported
        vibrate: [100, 50, 100],
        actions: [
            { action: 'open', title: 'Open App' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    // Default URL is from the notification data
    const targetUrl = event.notification.data.url 
        ? new URL(event.notification.data.url, self.location.origin).href 
        : self.location.origin;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // Check if there is already a window open with this exact app origin
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                // Focus the existing window if it matches origin
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});
