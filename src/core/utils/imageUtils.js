export function getOptimalImageUrl(baseUrl, targetWidth = 400) {
  if (!baseUrl) return null;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const optimalWidth = Math.round(targetWidth * dpr);
  if (baseUrl.includes('=')) return baseUrl;
  if (baseUrl.includes('?')) return `${baseUrl}&w=${optimalWidth}`;
  return `${baseUrl}?w=${optimalWidth}`;
}
