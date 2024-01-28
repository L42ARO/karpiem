import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare let self: ServiceWorkerGlobalScope;

// self.__WB_MANIFEST is the default injection point
precacheAndRoute(self.__WB_MANIFEST);

// Clean old assets
cleanupOutdatedCaches();

let allowlist: undefined | RegExp[];
if (import.meta.env.DEV) allowlist = [/^\/$/];

// To allow working offline
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), { allowlist }));

self.skipWaiting();
clientsClaim();

async function SubscribePushNotification() {
    try {
        const subscription = await self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array('BHuIVp9rJ2EJoA9LKFXI2kJB9Y0f0womlgLHiHgfygU9h4jGGI9sFfoCILYc8_TZNi98RuE3LHAXb9QwQOVr9XA')
        });

        const response = await saveSubscription(subscription);
        console.log(`Save subscription response: ${response}`);
        return Promise.resolve("Push Subscription: Success");
    } catch (err) {
        console.warn(`Save subscription error: ${err}`);
        return Promise.reject("Push Subscription: Failed");
    }
}

// Timer variables
let timerId: NodeJS.Timeout | undefined;

// Listen for messages from the main application
// Inside the startTimer function
self.addEventListener('message', (event) => {
    if (event.data.action === 'startTimer') {
        event.waitUntil(startTimer(event.data.value));
    }
    if (event.data.action === "notifyTimer") {
        self.registration.showNotification('Timer Alert', {
            body: `${event.data.value} seconds timer has expired!`,
        });
    }
    if(event.data.action === "subscribePush"){
        console.log("Subscribing Push Manually");
        SubscribePushNotification()
            .then(res => {
                console.log(res);
                self.registration.showNotification(`✅ ${res}`);
            })
            .catch(err=>{
                console.log(err);
                self.registration.showNotification(`❌ ${err}`);
            });
    }
});

async function startTimer(t: number) {
    // Clear any existing timer
    if (timerId) {
        clearInterval(timerId);
    }

    // Set a new timer for 20 minutes
    timerId = setTimeout(() => {
        self.registration.showNotification('Timer Alert', {
            body: `${t} seconds timer has expired!`,
        });
    }, t);
}

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

const saveSubscription = async (subscription: PushSubscription): Promise<any> => {
    //Check if we are running on localhost
    const isLocalhost = Boolean(
        self.location.hostname === 'localhost' ||
        // [::1] is the IPv6 localhost address.
        self.location.hostname === '[::1]');

    const serverURL = isLocalhost ? 'http://localhost:8080' : 'https://karpiem.up.railway.app';
    const response = await fetch(serverURL + '/save-subscription', {
        method: 'post',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({
            subscription: subscription
        })
    });

    if (!response.ok) {
        const txt = await response.text();
        throw new Error(txt);
    }

    return "Success";
}

self.addEventListener('activate', async (e: ExtendableEvent) => {
    console.log('Service worker activating...');
    SubscribePushNotification()
        .then(res => {
            console.log(res);
            self.registration.showNotification(`✅ ${res}`);
        })
        .catch(err=>{
            console.log(err);
            self.registration.showNotification(`❌ ${err}`);
        });
});

self.addEventListener('push', (e: PushEvent) => {
    self.registration.showNotification('Karpiem', { body: e.data!.text() });
});

