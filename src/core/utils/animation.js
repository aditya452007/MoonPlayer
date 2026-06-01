export const EASE_OUT_QUART = [0.25, 1, 0.5, 1];
export const STAGGER_FAST = 0.03;
export const STAGGER_MEDIUM = 0.05;
export const STAGGER_SLOW = 0.08;

export const DURATION = {
  FAST: 0.12,
  HOVER: 0.2,
  LIST: 0.25,
  STAGGER: 0.03,
  OVERLAY: 0.3,
  MINI_PLAYER: 0.35,
  COLOR: 0.5,
};

export const EASE = {
  OUT_QUART: [0.25, 1, 0.5, 1],
  OUT_CUBIC: [0, 0, 0.2, 1],
  IN_CUBIC: [0.4, 0, 1, 1],
  OUT_BACK: [0.34, 1.56, 0.64, 1],
  OUT: [0, 0, 0.2, 1],
  DEFAULT: 'ease',
};

export const TRANSITION = {
  pageTransition: {
    type: 'tween',
    duration: DURATION.LIST,
    ease: EASE.OUT_CUBIC,
  },
  cardPress: {
    duration: DURATION.FAST,
    ease: EASE.OUT_QUART,
  },
  listStagger: (index) => ({
    duration: DURATION.LIST,
    delay: Math.min(index * DURATION.STAGGER, 0.2),
    ease: EASE.OUT_QUART,
  }),
  overlaySlide: {
    type: 'spring',
    damping: 25,
    stiffness: 200,
    mass: 0.8,
  },
  overlayFade: {
    duration: DURATION.OVERLAY,
    ease: EASE.OUT_CUBIC,
  },
  colorTransition: {
    duration: DURATION.COLOR,
    ease: EASE.OUT_CUBIC,
  },
  iconSwap: {
    duration: 0.2,
    ease: EASE.OUT_BACK,
  },
  toastEnter: {
    type: 'spring',
    damping: 25,
    stiffness: 350,
    mass: 0.6,
  },
};
