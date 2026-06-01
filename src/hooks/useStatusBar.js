import { useCallback } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

const isPlatform = (platform) => {
  if (platform === 'capacitor') {
    return Capacitor.isNativePlatform;
  }
  return Capacitor.getPlatform() === platform;
};

export function useStatusBar() {
  const setImmersive = useCallback(async (immersive) => {
    if (!isPlatform('capacitor')) return;
    try {
      if (immersive) {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setOverlaysWebView({ overlay: true });
        if (isPlatform('android')) {
          await StatusBar.hide();
        }
      } else {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setOverlaysWebView({ overlay: false });
        if (isPlatform('android')) {
          await StatusBar.show();
        }
      }
    } catch (e) {
      console.warn('StatusBar plugin error:', e);
    }
  }, []);

  return { setImmersive };
}
