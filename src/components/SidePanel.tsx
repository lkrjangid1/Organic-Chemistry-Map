import { X, Search } from 'lucide-react';
import { useState } from 'react';

/**
 * Side panel component for displaying detailed information about selected nodes/edges
 * Features:
 * - Compound details (SMILES, formula, properties)
 * - Reaction information (reagents, conditions, mechanism)
 * - Search and filtering controls
 * - Responsive design with glass morphism effect
 */

const SidePanel = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reactionFilter, setReactionFilter] = useState('All');

  if (!isPanelOpen) {
    return (
      <div className="fixed top-20 right-4 z-10">
        <button
          onClick={() => setIsPanelOpen(true)}
          className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3 hover:bg-white/90 transition-all"
          title="Open controls panel"
        >
          <Search className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    );
  }

  const reactionTypes = [
    'All',
    'Nitration',
    'Reduction',
    'Oxidation',
    'Halogenation',
    'Friedel-Crafts',
    'Sulfonation',
    'Acetylation',
  ];

  return (
    <div className="fixed top-20 right-4 w-80 max-h-[80vh] bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-xl z-10 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Chemistry Map Controls
        </h2>
        <button
          onClick={() => setIsPanelOpen(false)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Close panel"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Search Section */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Compounds
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, formula, or IUPAC..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Reactions
            </label>
            <select
              value={reactionFilter}
              onChange={(e) => setReactionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {reactionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Help Text */}
        <div className="border-t border-gray-200 pt-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="font-medium text-blue-800 mb-2">How to Use</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Pan: Click and drag</li>
              <li>• Zoom: Mouse wheel</li>
              <li>• Select: Click on compounds</li>
              <li>• Reset: Use controls</li>
              <li>• Search to find compounds</li>
              <li>• Filter reactions by type</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidePanel;