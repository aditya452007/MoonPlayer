import { useState, useRef, useEffect, memo } from 'react';
import { Skeleton } from '../Skeleton/Skeleton';
import './ImgWithFallback.css';

const failedImageUrls = new Set();

export const ImgWithFallback = memo(function ImgWithFallback({
  src,
  alt = '',
  fallbackSrc = '/default-album-art.png',
  fallbackComponent = null,
  className = '',
  style = {},
  onLoad,
  onError,
  ...props
}) {
  const [status, setStatus] = useState(() => {
    if (!src) return 'failed';
    return failedImageUrls.has(src) ? 'failed' : 'loading';
  });
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) {
      setStatus('failed');
      return;
    }
    if (failedImageUrls.has(src)) {
      setStatus('failed');
      return;
    }

    setStatus('loading');

    // Check cache: if image is already loaded/cached
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth === 0) {
        failedImageUrls.add(src);
        setStatus('failed');
      } else {
        setStatus('loaded');
      }
    }
  }, [src]);

  const handleLoad = () => {
    setStatus('loaded');
    onLoad?.();
  };

  const handleError = () => {
    if (src) failedImageUrls.add(src);
    setStatus('failed');
    onError?.();
  };

  if (status === 'failed') {
    if (fallbackComponent) return fallbackComponent;
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={`img-fallback img-fallback--failed ${className}`}
        style={style}
        {...props}
      />
    );
  }

  return (
    <div className={`img-fallback-container ${className}`} style={{ ...style, position: 'relative', overflow: 'hidden' }}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`img-fallback img-fallback--loaded`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: status === 'loaded' ? 'block' : 'none',
          ...style
        }}
        {...props}
      />
      {status === 'loading' && (
        <Skeleton 
          variant="rect" 
          className="img-fallback__skeleton" 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%' 
          }} 
        />
      )}
    </div>
  );
});
