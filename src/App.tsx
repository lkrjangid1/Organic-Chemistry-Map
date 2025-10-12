import Header from './components/Header';
import SidePanel from './components/SidePanel';
import MapPage from './pages/MapPage';
import { useTheme } from './theme';

/**
 * Main App component for the Organic Chemistry Map visualization
 * Features:
 * - Full-screen layout with fixed header
 * - Interactive map visualization
 * - Responsive side panel for information display
 * - Clean, modern design with Tailwind CSS
 */

function App() {
  const { tokens } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${tokens.appBackground}`}>
      {/* Fixed header */}
      <Header />

      {/* Main content area with padding for header */}
      <main className="pt-14 text-slate-900 dark:text-neutral-100 transition-colors duration-300">
        {/* Chemistry map visualization */}
        <MapPage />

        {/* Side panel for compound/reaction information */}
        <SidePanel />
      </main>
    </div>
  );
}

export default App;
