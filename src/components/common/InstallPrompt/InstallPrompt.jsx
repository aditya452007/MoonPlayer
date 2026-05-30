import { useState, useEffect } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { DownloadSimple, X } from '@phosphor-icons/react';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import './InstallPrompt.css';

/**
 * InstallPrompt Component
 * Displays a non-intrusive floating drawer promoting PWA installations.
 * Employs secure lazy initializers and respects browser storage sandboxes.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  // Safe lazy initializer for sessionStorage to prevent security origin crashes
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return !!sessionStorage.getItem('installPromptDismissed');
    } catch (e) {
      console.warn('sessionStorage is blocked or unavailable:', e);
      return false;
    }
  });

  useEffect(() => {
    if (isDismissed) return;

    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isDismissed]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      await deferredPrompt.userChoice;
    } catch (err) {
      console.warn('PWA install prompt action failed or was canceled:', err);
    } finally {
      // We no longer need the prompt. Clear it up
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('installPromptDismissed', 'true');
    } catch (e) {
      console.warn('Failed to persist installPromptDismissed to sessionStorage:', e);
    }
  };

  // Only show if we have a prompt and it hasn't been dismissed
  const isVisible = deferredPrompt !== null && !isDismissed;

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div 
          className="install-prompt glass-panel"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="install-prompt__content">
            <div className="install-prompt__icon">
              <img src="/favicon.svg" alt="MoonPlayer Logo" width="32" height="32" />
            </div>
            <div className="install-prompt__text">
              <h4 className="install-prompt__title">Install MoonPlayer</h4>
              <p className="install-prompt__desc">Add to home screen for a better experience</p>
            </div>
          </div>
          
          <div className="install-prompt__actions">
            <Button variant="primary" onClick={handleInstallClick} className="install-prompt__install-btn">
              <DownloadSimple size={18} />
              <span>Install</span>
            </Button>
            <IconButton icon={X} ariaLabel="Dismiss" onClick={handleDismiss} />
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
export default InstallPrompt;
