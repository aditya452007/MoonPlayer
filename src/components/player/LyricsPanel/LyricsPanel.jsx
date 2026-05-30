import { useEffect, useRef, useState } from 'react';
import './LyricsPanel.css';

export function LyricsPanel({ lyricsData, currentTime, onSeek }) {
  const containerRef = useRef(null);
  const lineRefs = useRef([]);
  const [userIsScrolling, setUserIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);

  const isSynced = lyricsData?.isSynced || false;
  const lines = lyricsData?.lines || [];

  // Find the active line index
  let activeIndex = -1;
  if (isSynced && lines.length > 0) {
    for (let i = 0; i < lines.length; i++) {
      if (currentTime >= lines[i].time) {
        activeIndex = i;
      } else {
        break; // lines are sorted
      }
    }
  }

  // Handle auto-scrolling
  useEffect(() => {
    if (!isSynced || userIsScrolling || activeIndex === -1) return;

    const activeLineEl = lineRefs.current[activeIndex];
    if (activeLineEl && containerRef.current) {
      activeLineEl.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, isSynced, userIsScrolling]);

  // Handle manual scroll pausing
  const handleScroll = () => {
    setUserIsScrolling(true);
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Resume auto-scroll after 3 seconds of no scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      setUserIsScrolling(false);
    }, 3000);
  };

  const handleLineClick = (time) => {
    if (time !== -1 && onSeek) {
      onSeek(time);
      setUserIsScrolling(false);
    }
  };

  // If no lyrics, show empty state
  if (!lyricsData || lines.length === 0) {
    return (
      <div className="lyrics-panel">
        <div className="lyrics-panel__empty">
          <p>Lyrics not available for this track.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="lyrics-panel" 
      ref={containerRef}
      onWheel={handleScroll}
      onTouchMove={handleScroll}
    >
      {lines.map((line, idx) => {
        const isActive = isSynced && idx === activeIndex;
        const className = isSynced 
          ? `lyrics-panel__line ${isActive ? 'lyrics-panel__line--active' : ''}`
          : 'lyrics-panel__line lyrics-panel__line--plain';
          
        return (
          <button
            type="button"
            key={`lyric-${idx}`}
            ref={(el) => (lineRefs.current[idx] = el)}
            className={className}
            onClick={() => handleLineClick(line.time)}
          >
            {line.text}
          </button>
        );
      })}
    </div>
  );
}

