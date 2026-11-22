import { StrictMode } from 'react';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './theme';
import { PWAInstallProvider } from './pwa/PWAInstallProvider';
import './pwa/registerServiceWorker';
import { PageLinksProvider, type MapLinks } from './data/PageLinks';

/** Interactive map, mounted client-only on /map/ by Astro. `links` points map items at their pages. */
export default function MapApp({ links }: { links?: MapLinks }) {
  return (
    <StrictMode>
      <ThemeProvider>
        <PWAInstallProvider>
          <PageLinksProvider links={links}>
            <App />
          </PageLinksProvider>
        </PWAInstallProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
