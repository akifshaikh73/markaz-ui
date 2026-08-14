// Standard CRA service worker registration — enables PWA offline support

const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
    if ('serviceWorker' in navigator) {
        const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
        if (publicUrl.origin !== window.location.origin) return;

        window.addEventListener('load', () => {
            const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

            if (isLocalhost) {
                checkValidServiceWorker(swUrl, config);
                navigator.serviceWorker.ready.then(() => {
                    console.log('PWA: serving from service worker cache (localhost).');
                });
            } else {
                registerValidSW(swUrl, config);
            }
        });
    }
}

function registerValidSW(swUrl, config) {
    navigator.serviceWorker
        .register(swUrl)
        .then(registration => {
            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (!installingWorker) return;
                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            console.log('PWA: new content available, refresh to update.');
                            if (config && config.onUpdate) config.onUpdate(registration);
                        } else {
                            console.log('PWA: content cached for offline use.');
                            if (config && config.onSuccess) config.onSuccess(registration);
                        }
                    }
                };
            };
        })
        .catch(error => console.error('SW registration error:', error));
}

function checkValidServiceWorker(swUrl, config) {
    fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (response.status === 404 || (contentType && !contentType.includes('javascript'))) {
                navigator.serviceWorker.ready.then(registration => registration.unregister()).then(() => window.location.reload());
            } else {
                registerValidSW(swUrl, config);
            }
        })
        .catch(() => console.log('PWA: no internet, running in offline mode.'));
}

export function unregister() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then(registration => registration.unregister())
            .catch(error => console.error(error.message));
    }
}
