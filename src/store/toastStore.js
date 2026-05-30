import { create } from 'zustand';

const activeTimers = new Map();

export const useToastStore = create((set) => ({
  toasts: [],

  /**
   * Adds a new toast message to the store.
   * @param {string} message The text content of the toast.
   * @param {'success'|'error'|'info'|'warning'} type The severity/type of toast.
   * @param {number} duration Duration in milliseconds before auto-removing. Set to 0 to keep open.
   * @returns {string|null} The unique ID of the created toast, or null if invalid.
   */
  addToast: (message, type = 'info', duration = 3000) => {
    if (!message || typeof message !== 'string') {
      console.warn('Toast message must be a non-empty string');
      return null;
    }

    const id = crypto.randomUUID();
    
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));

    if (duration > 0) {
      const timer = setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter(t => t.id !== id)
        }));
        activeTimers.delete(id);
      }, duration);
      activeTimers.set(id, timer);
    }

    return id;
  },

  updateToast: (id, updates) => {
    set((state) => ({
      toasts: state.toasts.map(t => 
        t.id === id ? { ...t, ...updates } : t
      )
    }));
  },

  removeToast: (id) => {
    if (activeTimers.has(id)) {
      clearTimeout(activeTimers.get(id));
      activeTimers.delete(id);
    }
    set((state) => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  }
}));
