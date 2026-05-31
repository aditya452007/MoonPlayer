export function calculateGridColumns(containerWidth, minItemWidth, gap) {
  const effectiveWidth = containerWidth + gap;
  const columns = Math.max(1, Math.floor(effectiveWidth / (minItemWidth + gap)));
  const usedWidth = columns * minItemWidth + (columns - 1) * gap;
  const remaining = containerWidth - usedWidth;
  return { columns, itemWidth: minItemWidth + remaining / columns, remaining };
}

export function getViewportFraction(containerWidth) {
  if (containerWidth < 768) return 0.65;
  if (containerWidth < 1024) return 0.40;
  return 0.30;
}
