import { create } from 'zustand';

export const useToastStore = create((set) => ({
  toasts: [],

  addToast: (message, type = 'info', duration = 3000) => {
    const id = crypto.randomUUID();
    
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter(t => t.id !== id)
        }));
      }, duration);
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
    set((state) => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  }
}));
