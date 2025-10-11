import { Atom, Github, Info } from 'lucide-react';

/**
 * Header component for the organic chemistry visualization app
 * Features:
 * - App branding and title
 * - Navigation links
 * - Responsive design
 */

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Atom className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Organic Chemistry Map
              </h1>
              <p className="text-xs text-gray-600 hidden sm:block">
                Interactive visualization for JEE Advanced
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <button
              onClick={() => window.open('https://github.com', '_blank')}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="View on GitHub"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </button>

            <button
              onClick={() => {
                alert('Organic Chemistry Map v1.0\n\nAn interactive visualization tool for exploring organic chemistry reactions and compounds. Built with React Flow and SMILES Drawer.');
              }}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="About this app"
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">About</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;