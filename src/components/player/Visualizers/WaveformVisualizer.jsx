
export function WaveformVisualizer({ dataArray, baseColor }) {
  // We use transform: scaleY(...) instead of changing height.
  // Transitioning height causes layout reflows (layout thrash) 60 times a second.
  // transform runs entirely on the GPU compositor thread.

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
        const scaleY = Math.max(0.02, val / 255);
        
        return (
          <div 
            key={i}
            style={{
              flex: 1,
              backgroundColor: baseColor,
              height: '100%',
              transform: `scaleY(${scaleY})`,
              transformOrigin: 'bottom',
              willChange: 'transform',
              transition: 'transform 0.05s ease',
              borderRadius: '2px 2px 0 0',
              opacity: 0.8
            }}
          />
        );
      })}
    </div>
  );
}

