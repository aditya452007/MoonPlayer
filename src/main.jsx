import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';
import './styles/index.css';
import './styles/animations.css';
import './styles/utilities.css';
import { registerSW } from 'virtual:pwa-register';

try {
  registerSW({ 
    immediate: true,
    onRegisterError(error) {
      console.warn('Service worker registration failed:', error);
    }
  });
} catch (e) {
  console.warn('Failed to invoke registerSW:', e);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
