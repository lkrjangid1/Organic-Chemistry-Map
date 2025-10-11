import Header from './components/Header';
import MapPage from './pages/MapPage';

/**
 * Main App component for the Organic Chemistry Map visualization
 * Features:
 * - Full-screen layout with fixed header
 * - Interactive map visualization
 * - Responsive side panel for information display
 * - Clean, modern design with Tailwind CSS
 */

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed header */}
      <Header />

      {/* Main content area with padding for header */}
      <main className="pt-14">
        {/* Chemistry map visualization */}
        <MapPage />

        {/* Side panel for compound/reaction information */}
        {/* <SidePanel /> */}
      </main>
    </div>
  );
}

export default App;