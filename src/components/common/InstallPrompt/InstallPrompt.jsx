import { useState, useEffect } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { DownloadSimple, X } from '@phosphor-icons/react';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import './InstallPrompt.css';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isDismissed, setIsDismissed] = useState(() => !!sessionStorage.getItem('installPromptDismissed'));

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
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    await deferredPrompt.userChoice;
    
    // We no longer need the prompt. Clear it up
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('installPromptDismissed', 'true');
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
              <h4>Install MoonPlayer</h4>
              <p>Add to home screen for a better experience</p>
            </div>
          </div>
          
          <div className="install-prompt__actions">
            <Button variant="primary" onClick={handleInstallClick}>
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
