import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './theme';
import { PWAInstallProvider } from './pwa/PWAInstallProvider';
import './pwa/registerServiceWorker';

/**
 * Application entry point
 * Renders the main App component with React 19 strict mode
 */

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PWAInstallProvider>
        <App />
      </PWAInstallProvider>
    </ThemeProvider>
  </StrictMode>,
);
