const preloadedImages = new Set();

// Preload single image
export const preloadImage = (url) => {
    if (!url || preloadedImages.has(url)) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            preloadedImages.add(url);
            resolve();
        };
        img.onerror = reject;
        img.src = url;
        img._gc_guard = img;
    });
};

// Preload list
export const preloadImages = (urls) => {
    if (!urls || !Array.isArray(urls)) return;
    urls.forEach(url => preloadImage(url).catch(err => console.warn(`Failed to preload: ${url}`, err)));
};

export default {
    preloadImage,
    preloadImages
};
