import { X, Search, Beaker, GitBranch } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

import data from '../data/jee_organic.json';
import { useMapStore } from '../store/useMapStore';
import { useTheme } from '../theme';

/**
 * Side panel component for displaying detailed information about selected nodes/edges
 * Features:
 * - Compound details (SMILES, formula, properties)
 * - Reaction information (reagents, conditions, mechanism)
 * - Search and filtering controls
 * - Responsive design with glass morphism effect
 */

type Suggestion =
  | {
      id: string;
      type: 'node';
      title: string;
      subtitle?: string;
      description?: string;
    }
  | {
      id: string;
      type: 'edge';
      title: string;
      subtitle?: string;
      description?: string;
      extra?: string;
    };

const SidePanel = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchQuery = useMapStore((state) => state.searchQuery);
  const setSearchQuery = useMapStore((state) => state.setSearchQuery);
  const focusElement = useMapStore((state) => state.focusElement);
  const setStorePanelOpen = useMapStore((state) => state.setIsPanelOpen);
  const { tokens, isDark } = useTheme();

  const panelTokens = tokens.panel;

  useEffect(() => {
    setStorePanelOpen(isPanelOpen);
  }, [isPanelOpen, setStorePanelOpen]);

  const nodeLookup = useMemo(() => {
    const entries = new Map<string, (typeof data.nodes)[number]>();
    data.nodes.forEach((node) => {
      entries.set(node.id, node);
    });
    return entries;
  }, []);

  const { nodeSuggestions, edgeSuggestions } = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) {
      return { nodeSuggestions: [] as Suggestion[], edgeSuggestions: [] as Suggestion[] };
    }

    const containsQuery = (value?: string) =>
      value ? value.toLowerCase().includes(trimmed) : false;

    const nodes = data.nodes
      .filter(
        (node) =>
          containsQuery(node.label) ||
          containsQuery(node.info.formula) ||
          containsQuery(node.info.iupac) ||
          containsQuery(node.info.notes) ||
          containsQuery(node.info.properties),
      )
      .slice(0, 8)
      .map<Suggestion>((node) => ({
        id: node.id,
        type: 'node',
        title: node.label,
        subtitle: node.info.formula,
        description: node.info.iupac,
      }));

    const edges = data.edges
      .filter((edge) => {
        const { reactionInfo } = edge;
        return (
          containsQuery(edge.label) ||
          containsQuery(reactionInfo.reagents) ||
          containsQuery(reactionInfo.conditions) ||
          containsQuery(reactionInfo.mechanism) ||
          containsQuery(reactionInfo.equation)
        );
      })
      .slice(0, 8)
      .map<Suggestion>((edge) => {
        const sourceLabel = nodeLookup.get(edge.source)?.label ?? edge.source;
        const targetLabel = nodeLookup.get(edge.target)?.label ?? edge.target;

        return {
          id: edge.id,
          type: 'edge',
          title: edge.label,
          subtitle: `${sourceLabel} → ${targetLabel}`,
          description: edge.reactionInfo.reagents,
          extra: edge.reactionInfo.conditions,
        };
      });

    return { nodeSuggestions: nodes, edgeSuggestions: edges };
  }, [nodeLookup, searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(true);
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    focusElement(suggestion.id, suggestion.type);
    setSearchQuery(suggestion.title);
    setShowSuggestions(false);
  };

  const suggestionSurfaceVars = useMemo(
    () =>
      ({
        '--panel-surface': panelTokens.surface,
        '--panel-surface-hover': panelTokens.surfaceHover,
      } as React.CSSProperties),
    [panelTokens.surface, panelTokens.surfaceHover],
  );

  if (!isPanelOpen) {
    return (
      <div className="fixed top-20 right-4 z-10">
        <button
          onClick={() => setIsPanelOpen(true)}
          className="backdrop-blur-md border rounded-lg shadow-lg p-3 transition-all hover:bg-[var(--panel-surface-hover)]"
          style={{
            background: panelTokens.background,
            borderColor: panelTokens.border,
            boxShadow: panelTokens.shadow,
            color: panelTokens.icon,
            ...suggestionSurfaceVars,
          }}
          title="Open controls panel"
        >
          <Search className="w-5 h-5" style={{ color: panelTokens.icon }} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed top-20 right-4 w-80 max-h-[80vh] backdrop-blur-lg border rounded-xl shadow-xl z-10 overflow-hidden flex flex-col"
      style={{
        background: panelTokens.background,
        borderColor: panelTokens.border,
        boxShadow: panelTokens.shadow,
        color: panelTokens.text,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: panelTokens.divider }}
      >
        <h2
          className="text-lg font-semibold flex items-center gap-2"
          style={{ color: panelTokens.heading }}
        >
          <Search className="w-5 h-5" style={{ color: panelTokens.icon }} />
          <span>Chemistry Map Controls</span>
        </h2>
        <button
          onClick={() => setIsPanelOpen(false)}
          className="p-1 rounded transition-colors hover:bg-[var(--panel-surface-hover)]"
          title="Close panel"
          style={{
            color: panelTokens.icon,
            ...suggestionSurfaceVars,
          }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Search Section */}
        <div className="space-y-3">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: panelTokens.textMuted }}
            >
              Search Compounds & Reactions
            </label>
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search for compounds or reactions..."
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder:text-slate-400 dark:placeholder:text-neutral-500"
              style={{
                background: panelTokens.inputBackground,
                borderColor: panelTokens.inputBorder,
                color: panelTokens.text,
              }}
            />
            {searchQuery.trim() && showSuggestions && (
              <div
                className="mt-2 border rounded-lg shadow-lg divide-y max-h-60 overflow-y-auto"
                style={{
                  ...suggestionSurfaceVars,
                  borderColor: panelTokens.border,
                  background: panelTokens.surface,
                  boxShadow: panelTokens.shadow,
                }}
              >
                {nodeSuggestions.length === 0 && edgeSuggestions.length === 0 && (
                  <div
                    className="px-3 py-2 text-sm"
                    style={{ color: panelTokens.textMuted }}
                  >
                    No matches found.
                  </div>
                )}

                {nodeSuggestions.length > 0 && (
                  <div>
                    <div
                      className="px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: panelTokens.textMuted }}
                    >
                      Compounds
                    </div>
                    <ul className="py-1" style={{ color: panelTokens.text }}>
                      {nodeSuggestions.map((item) => (
                        <li key={`${item.type}-${item.id}`}>
                          <button
                            type="button"
                            onClick={() => handleSuggestionSelect(item)}
                            className="w-full text-left px-3 py-2 transition-colors hover:bg-[var(--panel-surface-hover)] rounded-none"
                            style={{
                              background: 'var(--panel-surface)',
                              color: panelTokens.text,
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5">
                                <Beaker
                                  className="h-4 w-4"
                                  style={{ color: isDark ? '#60a5fa' : '#2563eb' }}
                                />
                              </span>
                              <div className="space-y-0.5">
                                <div className="text-sm font-medium">{item.title}</div>
                                {item.subtitle && (
                                  <div
                                    className="text-xs"
                                    style={{ color: panelTokens.textMuted }}
                                  >
                                    {item.subtitle}
                                  </div>
                                )}
                                {item.description && (
                                  <div
                                    className="text-xs truncate"
                                    style={{ color: panelTokens.textMuted }}
                                  >
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {edgeSuggestions.length > 0 && (
                  <div>
                    <div
                      className="px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: panelTokens.textMuted }}
                    >
                      Reactions
                    </div>
                    <ul className="py-1" style={{ color: panelTokens.text }}>
                      {edgeSuggestions.map((item) => (
                        <li key={`${item.type}-${item.id}`}>
                          <button
                            type="button"
                            onClick={() => handleSuggestionSelect(item)}
                            className="w-full text-left px-3 py-2 transition-colors hover:bg-[var(--panel-surface-hover)] rounded-none"
                            style={{
                              background: 'var(--panel-surface)',
                              color: panelTokens.text,
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5">
                                <GitBranch
                                  className="h-4 w-4"
                                  style={{ color: isDark ? '#f97316' : '#059669' }}
                                />
                              </span>
                              <div className="space-y-0.5">
                                <div className="text-sm font-medium">{item.title}</div>
                                {item.subtitle && (
                                  <div
                                    className="text-xs"
                                    style={{ color: panelTokens.textMuted }}
                                  >
                                    {item.subtitle}
                                  </div>
                                )}
                                {(item.description || (item.type === 'edge' && item.extra)) && (
                                  <div
                                    className="text-xs space-y-0.5"
                                    style={{ color: panelTokens.textMuted }}
                                  >
                                    {item.description && <div>{item.description}</div>}
                                    {item.type === 'edge' && item.extra && (
                                      <div className="italic">{item.extra}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div
          className="border-t pt-4"
          style={{ borderColor: panelTokens.divider }}
        >
          <div
            className="rounded-lg p-3"
            style={{
              background: panelTokens.surface,
              color: panelTokens.text,
            }}
          >
            <h4
              className="font-medium mb-2"
              style={{ color: panelTokens.heading }}
            >
              How to Use
            </h4>
            <ul
              className="text-sm space-y-1"
              style={{ color: panelTokens.textMuted }}
            >
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