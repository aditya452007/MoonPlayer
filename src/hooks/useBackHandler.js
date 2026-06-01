import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { usePlayerStore } from '../store/playerStore';

const isPlatform = (platform) => {
  if (platform === 'capacitor') {
    return Capacitor.isNativePlatform;
  }
  return Capacitor.getPlatform() === platform;
};

export function useBackHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isFullscreen, setFullscreen, isQueueVisible, setQueueVisibility } = usePlayerStore();

  useEffect(() => {
    const handlePopState = (e) => {
      if (isFullscreen) {
        e.preventDefault();
        setFullscreen(false);
        window.history.pushState(null, '', window.location.href);
        return;
      }
      if (isQueueVisible) {
        e.preventDefault();
        setQueueVisibility(false);
        window.history.pushState(null, '', window.location.href);
        return;
      }
      if (location.pathname !== '/') {
        e.preventDefault();
        navigate('/');
        window.history.pushState(null, '', window.location.href);
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isFullscreen, isQueueVisible, location.pathname, navigate, setFullscreen, setQueueVisibility]);

  useEffect(() => {
    if (!isPlatform('capacitor')) return;

    const backButtonPromise = App.addListener('backButton', () => {
      if (isFullscreen) {
        setFullscreen(false);
        return;
      }
      if (isQueueVisible) {
        setQueueVisibility(false);
        return;
      }
      if (location.pathname !== '/') {
        navigate('/');
        return;
      }
      App.exitApp();
    });

    return () => {
      backButtonPromise.then((h) => h.remove());
    };
  }, [isFullscreen, isQueueVisible, location.pathname, navigate, setFullscreen, setQueueVisibility]);
}
