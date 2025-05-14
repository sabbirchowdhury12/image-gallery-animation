/**
 * Preloads images specified by the CSS selector.
 * @param {string} [selector='img'] - CSS selector for target images.
 * @returns {Promise} - Resolves when all specified images are loaded.
 */
export const preloadImages = (selector = "img"): Promise<void> => {
  return new Promise((resolve) => {
    // For React, we'll use a simpler approach than imagesLoaded library
    const images = document.querySelectorAll(selector);
    let loadedCount = 0;

    // If no images, resolve immediately
    if (images.length === 0) {
      resolve();
      return;
    }

    // Function to handle when an image is loaded
    const imageLoaded = () => {
      loadedCount++;
      if (loadedCount === images.length) {
        resolve();
      }
    };

    // Check each image
    images.forEach((img) => {
      if ((img as HTMLImageElement).complete) {
        imageLoaded();
      } else {
        img.addEventListener("load", imageLoaded);
        img.addEventListener("error", imageLoaded); // Also handle errors
      }
    });

    // Also handle background images
    document.querySelectorAll('[style*="background-image"]').forEach((el) => {
      const url = window
        .getComputedStyle(el)
        .backgroundImage.match(/url$$['"]?([^'"]+)['"]?$$/)?.[1];
      if (url) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = imageLoaded;
        img.onerror = imageLoaded;
        img.src = url;
      }
    });
  });
};
