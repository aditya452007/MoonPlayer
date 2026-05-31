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
  const loaded = useRef(false);

  useEffect(() => {
    if (!src) {
      setStatus('failed');
      return;
    }
    if (failedImageUrls.has(src)) {
      setStatus('failed');
    } else {
      setStatus('loading');
      loaded.current = false;
    }
  }, [src]);

  const handleLoad = () => {
    if (!loaded.current) {
      loaded.current = true;
      setStatus('loaded');
      onLoad?.();
    }
  };

  const handleError = () => {
    if (src) failedImageUrls.add(src);
    setStatus('failed');
    onError?.();
  };

  if (status === 'loading') {
    return (
      <div className={`img-fallback img-fallback--loading ${className}`} style={{ ...style, position: 'relative' }}>
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{ display: 'none' }}
          {...props}
        />
        <Skeleton variant="rect" className="img-fallback__skeleton" style={{ width: '100%', height: '100%', absolute: 'absolute', top: 0, left: 0 }} />
      </div>
    );
  }

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
    <img
      src={src}
      alt={alt}
      className={`img-fallback img-fallback--loaded ${className}`}
      style={style}
      {...props}
    />
  );
});
