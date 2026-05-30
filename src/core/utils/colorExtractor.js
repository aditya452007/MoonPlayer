/**
 * Extracts the average (dominant) color from an image URL.
 * Falls back to the default surface color if CORS blocks the canvas read.
 * 
 * @param {string} imageUrl - The URL of the image
 * @returns {Promise<string>} - The rgb string, e.g., 'rgb(255, 255, 255)'
 */
export function extractDominantColor(imageUrl) {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve('rgb(26, 30, 37)'); // Fallback to var(--bg-elevated) essentially
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Attempt CORS
    
    img.onload = () => {
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
      }
    };
    
    img.onerror = () => {
      console.warn('Failed to load image for color extraction.');
      resolve('rgb(26, 30, 37)');
    };
    
    img.src = imageUrl;
  });
}
