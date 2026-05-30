import { m } from 'framer-motion';

const variants = {
  idle: {
    y: [0, -10, 0],
    rotate: [0, 5, -5, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
  },
  dancing: {
    y: [0, -20, 0],
    rotate: [0, 15, -15, 0],
    scale: [1, 1.1, 1],
    transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
  },
  sleeping: {
    y: [0, -5, 0],
    rotate: [15, 15],
    scale: [1, 1.05, 1],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
  }
};

const visorVariants = {
  idle: { fill: '#4FC3F7' },
  // Replace deprecated yoyo: Infinity with repeat/reverse for framer-motion v12 (Issue #4, #31)
  dancing: { fill: '#FF4081', transition: { duration: 0.5, repeat: Infinity, repeatType: 'reverse' } },
  sleeping: { fill: '#1E88E5' }
};

export function AstronautPet({ state, size = 80 }) {
  // states: 'idle', 'dancing', 'sleeping'

  return (
    <m.div
      animate={state}
      variants={variants}
      style={{ width: size, height: size, cursor: 'grab' }}
      whileTap={{ cursor: 'grabbing', scale: 0.9 }}
      role="img"
      aria-label={`Astronaut pet character in ${state} state`}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        {/* Jetpack */}
        <rect x="25" y="30" width="50" height="40" rx="10" fill="#B0BEC5" />
        {/* Jetpack Fire (only when dancing or idle) */}
        {state !== 'sleeping' && (
          <m.path 
            d="M35 70 Q50 95 65 70 Z" 
            fill="#FFB300"
            animate={{ scaleY: state === 'dancing' ? [1, 1.5, 1] : [1, 1.1, 1] }}
            transition={{ duration: state === 'dancing' ? 0.4 : 2, repeat: Infinity }}
            style={{ transformOrigin: '50% 70px' }}
          />
        )}
        
        {/* Body */}
        <rect x="35" y="40" width="30" height="40" rx="15" fill="#ECEFF1" />
        {/* Arms */}
        <rect x="20" y="45" width="20" height="10" rx="5" fill="#ECEFF1" transform="rotate(-30 30 50)" />
        <rect x="60" y="45" width="20" height="10" rx="5" fill="#ECEFF1" transform="rotate(30 70 50)" />
        {/* Helmet Base */}
        <circle cx="50" cy="35" r="22" fill="#ECEFF1" />
        <circle cx="50" cy="35" r="24" fill="none" stroke="#CFD8DC" strokeWidth="2" />
        
        {/* Visor */}
        <m.ellipse 
          cx="50" cy="35" rx="14" ry="10" 
          variants={visorVariants}
          animate={state}
        />
        <path d="M42 30 Q50 25 58 30" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.5" strokeLinecap="round" />

        {/* Sleeping Z's */}
        {state === 'sleeping' && (
          <m.g
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], x: 20, y: -20 }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <text x="65" y="20" fill="#fff" fontSize="12" fontWeight="bold">Z</text>
          </m.g>
        )}
      </svg>
    </m.div>
  );
}
