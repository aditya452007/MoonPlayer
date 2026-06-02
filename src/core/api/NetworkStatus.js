const listeners = new Set();

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

function handleOnline() {
  isOnline = true;
  listeners.forEach(cb => cb(true));
}

function handleOffline() {
  isOnline = false;
  listeners.forEach(cb => cb(false));
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}

export const NetworkStatus = {
  get isOnline() { return isOnline; },

  onChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};
