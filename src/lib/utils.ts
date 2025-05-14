// import { type ClassValue } from "clsx";
// import { twMerge } from "tailwind-merge";

/**
 * Preloads images specified by the CSS selector.
 * @function
 * @param {string} [selector='img'] - CSS selector for target images.
 * @returns {Promise} - Resolves when all specified images are loaded.
 */
export const preloadImages = (selector = "img") => {
  return new Promise((resolve) => {
    // We're using a simple approach since imagesLoaded library isn't available
    const images = document.querySelectorAll(selector);
    let loadedCount = 0;

    if (images.length === 0) {
      resolve(true);
      return;
    }

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === images.length) {
        resolve(true);
      }
    };

    images.forEach((img) => {
      // For background images
      if (
        img.classList.contains("grid__item-image") ||
        img.classList.contains("panel__img")
      ) {
        const style = getComputedStyle(img);
        const bgImg = style.backgroundImage;

        if (bgImg && bgImg !== "none") {
          const imgUrl = bgImg.replace(/url$$['"]?(.*?)['"]?$$/i, "$1");
          const testImg = new Image();
          testImg.onload = checkAllLoaded;
          testImg.onerror = checkAllLoaded;
          testImg.src = imgUrl;
        } else {
          checkAllLoaded();
        }
      }
      // For regular images
      else if (img instanceof HTMLImageElement) {
        if (img.complete) {
          checkAllLoaded();
        } else {
          img.onload = checkAllLoaded;
          img.onerror = checkAllLoaded;
        }
      } else {
        checkAllLoaded();
      }
    });
  });
};

// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }
