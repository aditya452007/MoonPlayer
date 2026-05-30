import { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { usePreferenceStore } from '../../../store/preferenceStore';
import { usePlayerStore } from '../../../store/playerStore';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { AstronautPet } from '../Characters/AstronautPet';
import { SpaceCatPet } from '../Characters/SpaceCatPet';
import './PetContainer.css';

const handleDragEnd = () => {
  // Save new position
};

export function PetContainer() {
  const { petEnabled, petCharacter, petPosition, isHydrated } = usePreferenceStore();
  const { isPlaying } = usePlayerStore();
  const { isMobile } = useBreakpoint();
  
  const [petState, setPetState] = useState('idle');
  const [speech, setSpeech] = useState('');
  
  const sleepTimeoutRef = useRef(null);
  const speechTimeoutRef = useRef(null);

  const say = (text) => {
    setSpeech(text);
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    speechTimeoutRef.current = setTimeout(() => {
      setSpeech('');
    }, 4000);
  };

  // Sync state with playback
  useEffect(() => {
    if (isPlaying) {
      if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
      setPetState('dancing');
    } else {
      setPetState('idle');
      // Go to sleep after 10 seconds of pause
      sleepTimeoutRef.current = setTimeout(() => {
        setPetState('sleeping');
      }, 10000);
    }

    return () => {
      if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
    };
  }, [isPlaying]);

  // Handle random speech on mount
  useEffect(() => {
    if (!petEnabled) return;

    const greetings = ['Hello!', 'Ready for music?', 'Beep boop.', 'Meow?'];
    
    // Avoid synchronous setState in effect
    setTimeout(() => {
      say(greetings[Math.floor(Math.random() * greetings.length)]);
    }, 500);

    // Random speech loop
    const interval = setInterval(() => {
      if (petState === 'dancing' && Math.random() > 0.7) {
        say('What a tune! 🎵');
      } else if (petState === 'idle' && Math.random() > 0.8) {
        say('Play something?');
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [petEnabled, petState]);

  if (!isHydrated || !petEnabled) return null;

  const size = isMobile ? 60 : 90;
  
  return (
    <m.div
      className="pet-container"
      drag
      dragMomentum={false}
      initial={false}
      style={{
        left: petPosition.x,
        bottom: petPosition.y + 80, // stay above playbar
      }}
      dragConstraints={{ left: 0, right: window.innerWidth - size, top: 0, bottom: window.innerHeight - 100 }}
      onDragEnd={handleDragEnd}
      onTap={() => {
        if (petState === 'sleeping') {
          setPetState('idle');
          say('Huh? I am awake!');
        } else {
          say(petCharacter === 'spacecat' ? 'Purrr...' : 'Affirmative.');
        }
      }}
    >
      <AnimatePresence>
        {speech && (
          <m.div
            className="pet-speech-bubble"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
          >
            {speech}
          </m.div>
        )}
      </AnimatePresence>

      {petCharacter === 'astronaut' ? (
        <AstronautPet state={petState} size={size} />
      ) : (
        <SpaceCatPet state={petState} size={size} />
      )}
    </m.div>
  );
}
