/**
 * Extracts the average (dominant) color from an image URL.
 * Falls back to the default surface color if CORS blocks the canvas read or request is cancelled (Medium).
 * Supports request cancellation via AbortSignal to prevent state updates on unmounted callers.
 * 
 * @param {string} imageUrl - The URL of the image
 * @param {AbortSignal} [signal] - Optional abort signal to cancel resource loading
 * @returns {Promise<string>} - The rgb string, e.g., 'rgb(255, 255, 255)'
 */
export function extractDominantColor(imageUrl, signal = null) {
  return new Promise((resolve) => {
    if (!imageUrl || signal?.aborted) {
      resolve('rgb(26, 30, 37)'); // Fallback to var(--bg-elevated)
      return;
    }

    const img = new Image();
    // Only set crossOrigin for remote/absolute URLs to prevent CORS block on local resources
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('//')) {
      img.crossOrigin = 'Anonymous';
    }

    let abortHandler;
    if (signal) {
      abortHandler = () => {
        img.src = ''; // Cancel loading of image
        resolve('rgb(26, 30, 37)');
      };
      signal.addEventListener('abort', abortHandler);
    }
    
    img.onload = () => {
      if (signal?.aborted) {
        if (signal && abortHandler) signal.removeEventListener('abort', abortHandler);
        resolve('rgb(26, 30, 37)');
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // Scale down significantly for performance and to average out noise
      const size = 50;
      canvas.width = size;
      canvas.height = size;
      
      try {
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size).data;
        let r = 0, g = 0, b = 0;
        let count = 0;
        
        // Step by 4 to get rgba of each pixel
        for (let i = 0; i < imageData.length; i += 4) {
          // Skip highly transparent pixels
          if (imageData[i + 3] < 128) continue;
          
          r += imageData[i];
          g += imageData[i + 1];
          b += imageData[i + 2];
          count++;
        }
        
        if (count > 0) {
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);
          resolve(`rgb(${r}, ${g}, ${b})`);
        } else {
          resolve('rgb(26, 30, 37)');
        }
      } catch (e) {
        // Likely a CORS tainted canvas error
        console.warn('Canvas color extraction blocked by CORS. Using fallback.', e);
        resolve('rgb(26, 30, 37)');
      } finally {
        if (signal && abortHandler) {
          signal.removeEventListener('abort', abortHandler);
        }
      }
    };
    
    img.onerror = () => {
      if (signal && abortHandler) {
        signal.removeEventListener('abort', abortHandler);
      }
      console.warn('Failed to load image for color extraction.');
      resolve('rgb(26, 30, 37)');
    };
    
    img.src = imageUrl;
  });
}

/**
 * Extracts a color palette from an image URL.
 * Returns an array of dominant color strings, sorted by frequency.
 * BloomeeTunes' palette_generator equivalent.
 */
export function extractColorPalette(imageUrl, signal = null, colorCount = 3) {
  return new Promise((resolve) => {
    if (!imageUrl || signal?.aborted) {
      resolve(['rgb(26, 30, 37)']);
      return;
    }

    const img = new Image();
    // Only set crossOrigin for remote/absolute URLs to prevent CORS block on local resources
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('//')) {
      img.crossOrigin = 'Anonymous';
    }

    let abortHandler;
    if (signal) {
      abortHandler = () => {
        img.src = '';
        resolve(['rgb(26, 30, 37)']);
      };
      signal.addEventListener('abort', abortHandler);
    }

    img.onload = () => {
      if (signal?.aborted) {
        if (abortHandler && signal) signal.removeEventListener('abort', abortHandler);
        resolve(['rgb(26, 30, 37)']);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 50;
      canvas.width = size;
      canvas.height = size;

      try {
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size).data;

        // Simple color quantization: bucket colors into coarse bins
        const colorMap = new Map();
        const binSize = 32; // 8 bins per channel (256/32)

        for (let i = 0; i < imageData.length; i += 4) {
          if (imageData[i + 3] < 128) continue;
          const r = Math.floor(imageData[i] / binSize) * binSize + binSize / 2;
          const g = Math.floor(imageData[i + 1] / binSize) * binSize + binSize / 2;
          const b = Math.floor(imageData[i + 2] / binSize) * binSize + binSize / 2;
          const key = `${r},${g},${b}`;
          colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }

        // Sort by frequency, return top colors
        const sorted = [...colorMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, colorCount)
          .map(([key]) => {
            const [r, g, b] = key.split(',').map(Number);
            return `rgb(${r}, ${g}, ${b})`;
          });

        resolve(sorted.length > 0 ? sorted : ['rgb(26, 30, 37)']);
      } catch {
        resolve(['rgb(26, 30, 37)']);
      } finally {
        if (abortHandler && signal) signal.removeEventListener('abort', abortHandler);
      }
    };

    img.onerror = () => {
      if (abortHandler && signal) signal.removeEventListener('abort', abortHandler);
      resolve(['rgb(26, 30, 37)']);
    };

    img.src = imageUrl;
  });
}
