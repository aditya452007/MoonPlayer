import { m } from 'framer-motion';

const variants = {
  idle: {
    y: [0, -8, 0],
    rotate: [0, -3, 3, 0],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
  },
  dancing: {
    y: [0, -15, 0],
    rotate: [0, -10, 10, 0],
    scale: [1, 1.15, 1],
    transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }
  },
  sleeping: {
    y: [0, -3, 0],
    rotate: [0],
    scale: [1, 1.02, 1],
    transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' }
  }
};

export function SpaceCatPet({ state, size = 80 }) {
  // states: 'idle', 'dancing', 'sleeping'

  return (
    <m.div
      animate={state}
      variants={variants}
      style={{ width: size, height: size, cursor: 'grab' }}
      whileTap={{ cursor: 'grabbing', scale: 0.9 }}
      role="img"
      aria-label={`Space cat pet character in ${state} state`}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        {/* Tail */}
        <m.path 
          d="M30 70 Q10 80 15 50" 
          fill="none" 
          stroke="#FF9800" 
          strokeWidth="6" 
          strokeLinecap="round"
          animate={{ rotate: state === 'dancing' ? [0, -20, 0] : [0, -5, 0] }}
          transition={{ duration: state === 'dancing' ? 0.3 : 2, repeat: Infinity }}
          style={{ transformOrigin: '30px 70px' }}
        />

        {/* Space Suit Body */}
        <rect x="35" y="45" width="30" height="30" rx="10" fill="#ECEFF1" />
        
        {/* Cat Ears (Inside helmet) */}
        <polygon points="35,25 42,15 48,25" fill="#FF9800" />
        <polygon points="65,25 58,15 52,25" fill="#FF9800" />
        
        {/* Cat Head */}
        <circle cx="50" cy="35" r="18" fill="#FF9800" />
        <circle cx="50" cy="35" r="14" fill="#FFA726" />
        
        {/* Cat Face */}
        {state === 'sleeping' ? (
          <g stroke="#5D4037" strokeWidth="2" strokeLinecap="round" fill="none">
            <path d="M42 33 Q45 35 48 33" />
            <path d="M52 33 Q55 35 58 33" />
            <path d="M48 38 Q50 40 52 38" />
          </g>
        ) : (
          <g fill="#5D4037">
            <ellipse cx="43" cy="33" rx="2" ry="3" />
            <ellipse cx="57" cy="33" rx="2" ry="3" />
            <path d="M48 38 Q50 40 52 38" stroke="#5D4037" strokeWidth="1.5" fill="none" />
          </g>
        )}

        {/* Helmet Glass */}
        <circle cx="50" cy="32" r="24" fill="#81D4FA" opacity="0.4" />
        <circle cx="50" cy="32" r="24" fill="none" stroke="#E1F5FE" strokeWidth="2" />
        <path d="M35 20 Q45 15 55 18" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.6" strokeLinecap="round" />

        {/* Sleeping Z's */}
        {state === 'sleeping' && (
          <m.g
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], x: 15, y: -15 }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <text x="65" y="20" fill="#fff" fontSize="12" fontWeight="bold">Z</text>
          </m.g>
        )}
      </svg>
    </m.div>
  );
}
