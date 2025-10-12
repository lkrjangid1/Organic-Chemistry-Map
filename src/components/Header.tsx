import { Github, Info, Moon, Sun } from 'lucide-react';
import ogmLogo from '../assets/ogm_logo.png';
import { useTheme } from '../theme';

/**
 * Header component for the organic chemistry visualization app
 * Features:
 * - App branding and title
 * - Navigation links
 * - Responsive design
 */

const Header = () => {
  const { tokens, isDark, toggleTheme } = useTheme();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-20 backdrop-blur-sm border-b shadow-sm transition-colors duration-300 ${tokens.header.background} ${tokens.header.border}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <img
              src={ogmLogo}
              alt="Organic Chemistry Map logo"
              className="w-10 h-10 rounded-[8px] border border-white/10 shadow-sm object-cover"
            />
            <div>
              <h1 className={`text-lg font-bold transition-colors duration-300 ${tokens.header.text}`}>
                Organic Chemistry Map
              </h1>
              <p className={`text-xs hidden sm:block transition-colors duration-300 ${tokens.header.subtext}`}>
                Interactive visualization for JEE Advanced
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <button
              onClick={() => window.open('https://github.com/lkrjangid1/Organic-Chemistry-Map', '_blank')}
              className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-colors duration-200 ${tokens.header.buttonText} ${tokens.header.buttonHoverBg}`}
              title="View on GitHub"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </button>

            <button
              onClick={toggleTheme}
              className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-colors duration-200 ${tokens.header.buttonText} ${tokens.header.buttonHoverBg}`}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'} mode</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
