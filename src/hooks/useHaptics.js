export function useHaptics() {
  const light = async () => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      if (window.Capacitor?.Plugins?.Haptics) {
        await window.Capacitor.Plugins.Haptics.impact({ style: 'light' });
      }
    } catch {
      return;
    }
  };

  const medium = async () => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
      if (window.Capacitor?.Plugins?.Haptics) {
        await window.Capacitor.Plugins.Haptics.impact({ style: 'medium' });
      }
    } catch {
      return;
    }
  };

  return { light, medium };
}
