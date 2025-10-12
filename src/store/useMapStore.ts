import { create } from 'zustand';
import { Edge, Node, type ReactFlowInstance } from 'reactflow';

import type { ChemicalNodeData } from '../components/NodeChemical';
import type { CustomEdgeData } from '../components/CustomEdge';

/**
 * Zustand store for managing the chemistry map application state
 * Handles selected nodes, filters, search, and path highlighting
 */

export interface MapState {
  // Node and edge data
  nodes: Node<ChemicalNodeData>[];
  edges: Edge<CustomEdgeData>[];

  // Selection and interaction
  selectedNode: Node<ChemicalNodeData> | null;
  selectedEdge: Edge<CustomEdgeData> | null;

  // Filtering and search
  reactionFilter: string | null;
  searchQuery: string;
  highlightedPath: string[];

  // UI state
  isPanelOpen: boolean;

  // React Flow instance
  reactFlowInstance: ReactFlowInstance | null;

  // Actions
  setNodes: (nodes: Node<ChemicalNodeData>[]) => void;
  setEdges: (edges: Edge<CustomEdgeData>[]) => void;
  setSelectedNode: (node: Node<ChemicalNodeData> | null) => void;
  setSelectedEdge: (edge: Edge<CustomEdgeData> | null) => void;
  setReactionFilter: (filter: string | null) => void;
  setSearchQuery: (query: string) => void;
  setHighlightedPath: (path: string[]) => void;
  setIsPanelOpen: (isOpen: boolean) => void;
  setReactFlowInstance: (instance: ReactFlowInstance | null) => void;
  focusElement: (id: string, type: 'node' | 'edge') => void;

  // Computed values
  getFilteredEdges: () => Edge<CustomEdgeData>[];
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
  reactFlowInstance: null,

  // Setters
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  setSelectedNode: (node) => {
    const instance = get().reactFlowInstance;

    if (instance) {
      instance.setNodes((nodes) =>
        nodes.map((current) => ({
          ...current,
          selected: !!node && current.id === node.id,
        })),
      );

      instance.setEdges((edges) =>
        edges.map((edge) => ({
          ...edge,
          selected: false,
        })),
      );
    }

    let nextNode = node;
    if (instance && node) {
      nextNode = instance
        .getNodes()
        .find((current) => current.id === node.id) as Node<ChemicalNodeData> | undefined ?? node;
    }

    set({
      selectedNode: nextNode ?? null,
      selectedEdge: null,
    });
  },

  setSelectedEdge: (edge) => {
    const instance = get().reactFlowInstance;

    if (instance) {
      instance.setEdges((edges) =>
        edges.map((current) => ({
          ...current,
          selected: !!edge && current.id === edge.id,
        })),
      );

      instance.setNodes((nodes) =>
        nodes.map((node) => ({
          ...node,
          selected: false,
        })),
      );
    }

    let nextEdge = edge;
    if (instance && edge) {
      nextEdge = instance
        .getEdges()
        .find((current) => current.id === edge.id) as Edge<CustomEdgeData> | undefined ?? edge;
    }

    set({
      selectedEdge: nextEdge ?? null,
      selectedNode: null,
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
  setReactFlowInstance: (instance) => set({ reactFlowInstance: instance }),

  focusElement: (id, type) => {
    const instance = get().reactFlowInstance;
    if (!instance) return;

    if (type === 'node') {
      const node = instance.getNode(id) as Node<ChemicalNodeData> | undefined;
      if (!node) return;

      // Smoothly zoom to the node position
      instance.fitView({
        nodes: [node],
        padding: 0.35,
        minZoom: 1.4,
        maxZoom: 2.2,
        duration: 1000,
      });

      get().setSelectedNode(node);
      return;
    }

    const edge = instance
      .getEdges()
      .find((current) => current.id === id) as Edge<CustomEdgeData> | undefined;

    if (!edge) return;

    const sourceNode = instance.getNode(edge.source) as Node<ChemicalNodeData> | undefined;
    const targetNode = instance.getNode(edge.target) as Node<ChemicalNodeData> | undefined;

    if (!sourceNode || !targetNode) return;

    instance.fitView({
      nodes: [sourceNode, targetNode],
      padding: 0.45,
      minZoom: 1.2,
      maxZoom: 1.9,
      duration: 1100,
    });

    get().setSelectedEdge(edge);
  },

  // Computed getters
  getFilteredEdges: () => {
    const { edges, reactionFilter } = get();
    if (!reactionFilter) return edges;

    return edges.filter(edge =>
      (edge.data?.label && edge.data.label.toLowerCase().includes(reactionFilter.toLowerCase())) ||
      (edge.data?.reactionInfo?.mechanism && edge.data.reactionInfo.mechanism.toLowerCase().includes(reactionFilter.toLowerCase()))
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
    const instance = get().reactFlowInstance;

    if (instance) {
      instance.setNodes((nodes) =>
        nodes.map((node) => ({
          ...node,
          selected: false,
        })),
      );

      instance.setEdges((edges) =>
        edges.map((edge) => ({
          ...edge,
          selected: false,
        })),
      );
    }

    set({
      selectedNode: null,
      selectedEdge: null,
      highlightedPath: [],
    });
  }
}));
