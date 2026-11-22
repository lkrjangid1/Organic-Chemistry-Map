import { StrictMode } from 'react';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './theme';
import { PWAInstallProvider } from './pwa/PWAInstallProvider';
import './pwa/registerServiceWorker';

/** Interactive map, mounted client-only on /map/ by Astro. */
export default function MapApp() {
  return (
    <StrictMode>
      <ThemeProvider>
        <PWAInstallProvider>
          <App />
        </PWAInstallProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
