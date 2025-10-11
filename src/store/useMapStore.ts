import { create } from 'zustand';
import { Node, Edge } from 'reactflow';

/**
 * Zustand store for managing the chemistry map application state
 * Handles selected nodes, filters, search, and path highlighting
 */

interface ChemicalNodeData {
  label: string;
  smiles: string;
  info: {
    formula: string;
    iupac: string;
    notes?: string;
    properties?: string;
  };
}

interface ReactionEdgeData {
  label: string;
  type: string;
  reactionInfo: {
    reagents: string;
    conditions: string;
    mechanism: string;
    equation: string;
  };
}

export interface MapState {
  // Node and edge data
  nodes: Node<ChemicalNodeData>[];
  edges: Edge<ReactionEdgeData>[];

  // Selection and interaction
  selectedNode: Node<ChemicalNodeData> | null;
  selectedEdge: Edge<ReactionEdgeData> | null;

  // Filtering and search
  reactionFilter: string | null;
  searchQuery: string;
  highlightedPath: string[];

  // UI state
  isPanelOpen: boolean;

  // Actions
  setNodes: (nodes: Node<ChemicalNodeData>[]) => void;
  setEdges: (edges: Edge<ReactionEdgeData>[]) => void;
  setSelectedNode: (node: Node<ChemicalNodeData> | null) => void;
  setSelectedEdge: (edge: Edge<ReactionEdgeData> | null) => void;
  setReactionFilter: (filter: string | null) => void;
  setSearchQuery: (query: string) => void;
  setHighlightedPath: (path: string[]) => void;
  setIsPanelOpen: (isOpen: boolean) => void;

  // Computed values
  getFilteredEdges: () => Edge<ReactionEdgeData>[];
  getNodesMatchingSearch: () => Node<ChemicalNodeData>[];
  clearSelection: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  // Initial state
  nodes: [],
  edges: [],
  selectedNode: null,
  selectedEdge: null,
  reactionFilter: null,
  searchQuery: '',
  highlightedPath: [],
  isPanelOpen: false,

  // Setters
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  setSelectedNode: (node) => {
    set({
      selectedNode: node,
      selectedEdge: null,
      isPanelOpen: !!node
    });
  },

  setSelectedEdge: (edge) => {
    set({
      selectedEdge: edge,
      selectedNode: null,
      isPanelOpen: !!edge
    });
  },

  setReactionFilter: (filter) => set({ reactionFilter: filter }),

  setSearchQuery: (query) => {
    set({ searchQuery: query });

    // Auto-highlight matching nodes
    const state = get();
    const matchingNodes = state.getNodesMatchingSearch();
    if (matchingNodes.length > 0) {
      set({ highlightedPath: matchingNodes.map(node => node.id) });
    } else {
      set({ highlightedPath: [] });
    }
  },

  setHighlightedPath: (path) => set({ highlightedPath: path }),
  setIsPanelOpen: (isOpen) => set({ isPanelOpen: isOpen }),

  // Computed getters
  getFilteredEdges: () => {
    const { edges, reactionFilter } = get();
    if (!reactionFilter) return edges;

    return edges.filter(edge =>
      edge.data?.label.toLowerCase().includes(reactionFilter.toLowerCase()) ||
      edge.data?.reactionInfo?.mechanism.toLowerCase().includes(reactionFilter.toLowerCase())
    );
  },

  getNodesMatchingSearch: () => {
    const { nodes, searchQuery } = get();
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return nodes.filter(node =>
      node.data?.label.toLowerCase().includes(query) ||
      node.data?.info.formula.toLowerCase().includes(query) ||
      node.data?.info.iupac.toLowerCase().includes(query)
    );
  },

  clearSelection: () => {
    set({
      selectedNode: null,
      selectedEdge: null,
      isPanelOpen: false,
      highlightedPath: [],
      searchQuery: ''
    });
  }
}));