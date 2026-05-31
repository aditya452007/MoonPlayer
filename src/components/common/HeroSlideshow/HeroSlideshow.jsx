import React, { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Play, Heart, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { usePlayerStore } from '../../../store/playerStore';
import { useLibraryStore } from '../../../store/libraryStore';
import { useToastStore } from '../../../store/toastStore';
import { ImgWithFallback } from '../ImgWithFallback/ImgWithFallback';
import './HeroSlideshow.css';

export function HeroSlideshow({ tracks }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const autoplayTimer = useRef(null);

  const { play, currentTrack, isPlaying } = usePlayerStore();
  const { toggleLikeTrack, likedSongs } = useLibraryStore();
  const addToast = useToastStore((state) => state.addToast);

  // We only feature up to 5 tracks from the list
  const featuredTracks = React.useMemo(() => {
    if (!tracks) return [];
    return tracks.slice(0, 5);
  }, [tracks]);

  const totalSlides = featuredTracks.length;

  // Autoplay functionality
  useEffect(() => {
    if (totalSlides <= 1 || isHovered) {
      if (autoplayTimer.current) clearInterval(autoplayTimer.current);
      return;
    }

    autoplayTimer.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
    }, 5000); // Cycle every 5s

    return () => {
      if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    };
  }, [totalSlides, isHovered]);

  if (totalSlides === 0) return null;

  const currentSlideTrack = featuredTracks[currentIndex];
  const isCurrentTrackPlaying = currentTrack?.id === currentSlideTrack.id && isPlaying;
  const isFavorite = likedSongs ? likedSongs.some((t) => t.id === currentSlideTrack.id) : false;

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const handlePlayClick = (e) => {
    e.stopPropagation();
    if (isCurrentTrackPlaying) {
      // already playing: do nothing or let general player handle
    } else {
      play(currentSlideTrack);
      addToast(`Playing ${currentSlideTrack.title}`, 'success');
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleLikeTrack(currentSlideTrack);
  };

  const slideVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div 
      className="hero-slideshow glass-panel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        <m.div 
          key={currentSlideTrack.id}
          className="hero-slideshow__slide"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={slideVariants}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          {/* Ambient blurred backdrop cover art */}
          <div className="hero-slideshow__backdrop-wrapper">
            <ImgWithFallback 
              src={currentSlideTrack.imageUrl} 
              className="hero-slideshow__backdrop-img"
              alt=""
              aria-hidden="true"
              fallbackSrc="/default-album-art.png"
            />
            <div className="hero-slideshow__backdrop-overlay" />
          </div>

          <div className="hero-slideshow__content">
            <div className="hero-slideshow__meta">
              <span className="hero-slideshow__badge">FEATURED SOUNDS</span>
              <h2 className="hero-slideshow__title">{currentSlideTrack.title}</h2>
              <p className="hero-slideshow__artists">
                {currentSlideTrack.artistNames?.join(', ')}
              </p>
              
              <div className="hero-slideshow__actions">
                <button 
                  className="hero-slideshow__btn hero-slideshow__btn--play"
                  onClick={handlePlayClick}
                >
                  <Play size={18} weight="fill" />
                  <span>{isCurrentTrackPlaying ? 'PLAYING NOW' : 'PLAY NOW'}</span>
                </button>
                <button 
                  className={`hero-slideshow__btn hero-slideshow__btn--fav ${isFavorite ? 'hero-slideshow__btn--fav-active' : ''}`}
                  onClick={handleFavoriteClick}
                  aria-label="Add to favorites"
                >
                  <Heart size={18} weight={isFavorite ? 'fill' : 'bold'} />
                </button>
              </div>
            </div>

            <div className="hero-slideshow__album-art-panel">
              <div className="hero-slideshow__art-frame">
                <ImgWithFallback 
                  src={currentSlideTrack.imageUrl} 
                  alt={currentSlideTrack.title}
                  className="hero-slideshow__art-img"
                  fallbackSrc="/default-album-art.png"
                />
                <div className="hero-slideshow__art-glow" style={{ backgroundImage: `url(${currentSlideTrack.imageUrl || '/default-album-art.png'})` }} />
              </div>
            </div>
          </div>
        </m.div>
      </AnimatePresence>

      {/* Manual Chevron controls */}
      {totalSlides > 1 && (
        <>
          <button 
            className="hero-slideshow__arrow hero-slideshow__arrow--left" 
            onClick={handlePrev}
            aria-label="Previous slide"
          >
            <CaretLeft size={24} weight="bold" />
          </button>
          <button 
            className="hero-slideshow__arrow hero-slideshow__arrow--right" 
            onClick={handleNext}
            aria-label="Next slide"
          >
            <CaretRight size={24} weight="bold" />
          </button>

          {/* Lunar Slide dots indicators */}
          <div className="hero-slideshow__dots">
            {featuredTracks.map((_, index) => (
              <button
                key={index}
                className={`hero-slideshow__dot ${index === currentIndex ? 'hero-slideshow__dot--active' : ''}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default HeroSlideshow;
