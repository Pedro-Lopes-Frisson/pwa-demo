const CACHE_VERSION = 'v3';


const addResourcesToCache = async (resources) => {
    const cache = await caches.open(CACHE_VERSION);
    await cache.addAll(resources);
};

const putInCache = async (request, response) => {
    const cache = await caches.open(CACHE_VERSION);
    await cache.put(request, response);
};

const cacheFirst = async ({ request, preloadResponsePromise, fallbackUrl }) => {
    // First try to get the resource from the cache
    const responseFromCache = await caches.match(request);
    if (responseFromCache) {
        return responseFromCache;
    }

    // Next try to use (and cache) the preloaded response, if it's there
    const preloadResponse = await preloadResponsePromise;
    if (preloadResponse) {
        console.info("using preload response", preloadResponse);
        putInCache(request, preloadResponse.clone());
        return preloadResponse;
    }

    // Next try to get the resource from the network
    try {
        const responseFromNetwork = await fetch(request);
        // response may be used only once
        // we need to save clone to put one copy in cache
        // and serve second one
        putInCache(request, responseFromNetwork.clone());
        return responseFromNetwork;
    } catch (error) {
        const fallbackResponse = await caches.match(fallbackUrl);
        if (fallbackResponse) {
            return fallbackResponse;
        }
        // when even the fallback response is not available,
        // there is nothing we can do, but we must always
        // return a Response object
        return new Response("Network error happened", {
            status: 408,
            headers: { "Content-Type": "text/plain" },
        });
    }
};

// Enable navigation preload
const enableNavigationPreload = async () => {
    if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
    }
};

self.addEventListener("activate", (event) => {
    event.waitUntil(enableNavigationPreload());
});

self.addEventListener("install", (event) => {
    event.waitUntil(
        addResourcesToCache([
            "/pwa-demo/index.html",
            "/pwa-demo/index.js",
            "/pwa-demo/categories.js",
            "/pwa-demo/categories.html",
            "/pwa-demo/categoryList.js",
            "/pwa-demo/categoryList.html",
            "/pwa-demo/categories.html?category=food",
            "/pwa-demo/categories.html?category=movie",
        ]),
        fetch('https://api.chucknorris.io/jokes/random?category=movie')
            .then(response => putInCache('https://api.chucknorris.io/jokes/random?category=movie', response.clone()))
            .catch(error => {
                // Handle errors
            }),
        fetch('https://api.chucknorris.io/jokes/random?category=food')
            .then(response => putInCache('https://api.chucknorris.io/jokes/random?category=food', response.clone()))
            .catch(error => {
                // Handle errors
            }),
        fetch('https://api.chucknorris.io/jokes/categories')
            .then(response => putInCache('https://api.chucknorris.io/jokes/categories', response.clone()))
            .catch(error => {
                // Handle errors
            }),
    );
});
const update = request =>
    caches
        .open(CURRENT_CACHE)
        .then(cache =>
            fetch(request).then(response => cache.put(request, response))
        );

const fromNetwork = (request, timeout) =>
    new Promise((fulfill, reject) => {
        const timeoutId = setTimeout(reject, timeout);
        fetch(request).then(response => {
            clearTimeout(timeoutId);
            fulfill(response);
            update(request);
        }, reject);
    });

self.addEventListener("fetch", (event) => {
    if (event.request.url.includes("js") || event.request.url.includes("css")) {
        event.respondWith(
            cacheFirst({
                request: event.request,
                preloadResponsePromise: event.preloadResponse,
                fallbackUrl: "/pwa-demo/images/windows/SplashScreen.scale-400.png",
            }),
        );
    } else {
        evt.respondWith(
            fromNetwork(evt.request, 10000).catch(() => fromCache(evt.request))
        );
        evt.waitUntil(update(evt.request));
    }


});


const deleteCache = async (key) => {
    await caches.delete(key);
};

const deleteOldCaches = async () => {
    const cacheKeepList = [CACHE_VERSION];
    const keyList = await caches.keys();
    const cachesToDelete = keyList.filter((key) => !cacheKeepList.includes(key));
    await Promise.all(cachesToDelete.map(deleteCache));
};

self.addEventListener("activate", (event) => {
    event.waitUntil(deleteOldCaches());
});
