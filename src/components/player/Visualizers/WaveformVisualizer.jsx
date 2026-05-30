
export function WaveformVisualizer({ dataArray, baseColor }) {
  // Use state to avoid triggering too many React renders if possible,
  // but since we get requestAnimationFrame props, it might render every frame.
  // For performance, we could use a canvas, but simple div bars are okay for 64 bins.

  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        justifyContent: 'center',
        gap: '2px',
        width: '100%', 
        height: '100%',
        padding: '0 16px',
        boxSizing: 'border-box'
      }}
    >
      {Array.from({ length: 64 }).map((_, i) => {
        const val = dataArray ? dataArray[i] : 0;
        const heightPct = Math.max(2, (val / 255) * 100);
        
        return (
          <div 
            key={i}
            style={{
              flex: 1,
              backgroundColor: baseColor,
              height: `${heightPct}%`,
              transition: 'height 0.05s ease',
              borderRadius: '2px 2px 0 0',
              opacity: 0.8
            }}
          />
        );
      })}
    </div>
  );
}

