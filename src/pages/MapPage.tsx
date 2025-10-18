import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  type EdgeMouseHandler,
  MarkerType,
  Node,
  type NodeChange,
  type NodeMouseHandler,
  type ReactFlowInstance,
  type Viewport,
} from 'reactflow';
import 'reactflow/dist/style.css';

import NodeChemical, { HandleDirection } from '../components/NodeChemical';
import type { ChemicalNodeData } from '../components/NodeChemical';
import {
  useOrganicData,
  type OrganicEdge,
  type OrganicNode,
} from '../data/OrganicDataContext';
import CustomEdge, { type CustomEdgeData, type ReactionInfo } from '../components/CustomEdge';
import { useTheme } from '../theme';
import InfoPanel, { type SelectedInfo } from '../components/InfoPanel';
import { useMapStore } from '../store/useMapStore';
import {
  buildOrganicDatasetSnapshot,
  extractPositionsFromDataset,
  readStoredDataset,
  type LayoutPoint,
  writeStoredDataset,
} from '../utils/layoutStorage';

/**
 * Main React Flow visualization page for the chemistry map
 * Features:
 * - Interactive node and edge rendering
 * - Custom chemical node type with SMILES structures
 * - Pan, zoom, and selection functionality
 * - Integration with global state management
 */

// Define custom node types for React Flow
const nodeTypes = {
  chemical: NodeChemical,
};

const edgeTypes = {
  custom: CustomEdge,
};

const VIEWPORT_STORAGE_KEY = 'ocm:viewport';

const CARD_WIDTH = 220;
const CARD_HEIGHT = 240;
const CARD_GAP = 60;

type PositionLike = {
  position: LayoutPoint;
};

const MIN_GAP_X = CARD_WIDTH + CARD_GAP;
const MIN_GAP_Y = CARD_HEIGHT + CARD_GAP;

const determineLayoutScale = (nodes: PositionLike[]): number => {
  if (nodes.length < 2) {
    return 1;
  }

  let requiredScale = 1;

  for (let i = 0; i < nodes.length; i += 1) {
    const current = nodes[i].position;

    for (let j = i + 1; j < nodes.length; j += 1) {
      const candidate = nodes[j].position;
      const dx = Math.abs(current.x - candidate.x);
      const dy = Math.abs(current.y - candidate.y);

      if (dx < MIN_GAP_X && dy < MIN_GAP_Y) {
        const scaleCandidates: number[] = [];

        if (dx > 0) {
          scaleCandidates.push(MIN_GAP_X / dx);
        }

        if (dy > 0) {
          scaleCandidates.push(MIN_GAP_Y / dy);
        }

        const pairScale = scaleCandidates.length > 0 ? Math.max(...scaleCandidates) : 1.25;
        requiredScale = Math.max(requiredScale, pairScale);
      }
    }
  }

  const bufferedScale = requiredScale === 1 ? 1 : requiredScale * 1.05;
  return Math.min(Math.max(bufferedScale, 1), 4);
};

const applyScaledLayout = (
  point: LayoutPoint,
  center: LayoutPoint,
  scale: number,
): LayoutPoint => {
  if (scale === 1) {
    return point;
  }

  return {
    x: (point.x - center.x) * scale + center.x,
    y: (point.y - center.y) * scale + center.y,
  };
};

const MapPage = () => {
  const { tokens, isDark } = useTheme();
  const {
    data: organicData,
    loading: isOrganicDataLoading,
    error: organicDataError,
    reload: reloadOrganicData,
  } = useOrganicData();

  const setNodes = useMapStore((state) => state.setNodes);
  const setEdges = useMapStore((state) => state.setEdges);
  const setSelectedNode = useMapStore((state) => state.setSelectedNode);
  const setSelectedEdge = useMapStore((state) => state.setSelectedEdge);
  const clearSelection = useMapStore((state) => state.clearSelection);
  const setReactFlowInstance = useMapStore((state) => state.setReactFlowInstance);
  const selectedNode = useMapStore((state) => state.selectedNode);
  const selectedEdge = useMapStore((state) => state.selectedEdge);
  const applyNodeChangesToStore = useMapStore((state) => state.applyNodeChanges);
  const mapNodes = useMapStore((state) => state.nodes);
  const mapEdges = useMapStore((state) => state.edges);
  const baselineNodesMap = useMemo(
    () =>
      organicData
        ? new Map<string, OrganicNode>(organicData.nodes.map((node) => [node.id, node]))
        : new Map<string, OrganicNode>(),
    [organicData],
  );
  const baselineEdgesMap = useMemo(
    () =>
      organicData
        ? new Map<string, OrganicEdge>(organicData.edges.map((edge) => [edge.id, edge]))
        : new Map<string, OrganicEdge>(),
    [organicData],
  );

  useEffect(() => {
    return () => {
      setReactFlowInstance(null);
    };
  }, [setReactFlowInstance]);

  const selectedInfo: SelectedInfo | null = useMemo(() => {
    if (selectedNode?.data) {
      return { type: 'node', payload: selectedNode.data };
    }

    if (selectedEdge) {
      const rawLabel = selectedEdge.data?.label ?? selectedEdge.label ?? 'Reaction';
      const label = typeof rawLabel === 'string' ? rawLabel : String(rawLabel);
      const reactionInfo: ReactionInfo = {
        reagents: selectedEdge.data?.reactionInfo?.reagents,
        conditions: selectedEdge.data?.reactionInfo?.conditions,
        mechanism: selectedEdge.data?.reactionInfo?.mechanism,
        equation: selectedEdge.data?.reactionInfo?.equation,
      };

      return { type: 'edge', payload: { label, reactionInfo } };
    }

    return null;
  }, [selectedEdge, selectedNode]);

  // Transform JSON data to React Flow format
  const { nodes: initialNodes, edges: initialEdges } = useMemo<{
    nodes: Node[];
    edges: Edge<CustomEdgeData>[];
  }>(() => {
    if (!organicData) {
      return {
        nodes: [],
        edges: [],
      };
    }

    const layoutScale = determineLayoutScale(organicData.nodes);
    const storedDataset = typeof window !== 'undefined' ? readStoredDataset() : null;
    const storedPositions = extractPositionsFromDataset(storedDataset);

    const centerPoint = organicData.nodes.reduce<LayoutPoint>(
      (acc, node) => {
        acc.x += node.position.x;
        acc.y += node.position.y;
        return acc;
      },
      { x: 0, y: 0 },
    );

    if (organicData.nodes.length > 0) {
      centerPoint.x /= organicData.nodes.length;
      centerPoint.y /= organicData.nodes.length;
    }

    const nodePositions = new Map(
      organicData.nodes.map((node) => {
        const stored = storedPositions[node.id];
        const basePosition = stored
          ? { x: stored.x, y: stored.y }
          : applyScaledLayout(node.position, centerPoint, layoutScale);
        return [node.id, basePosition] as const;
      }),
    );

    const sourceHandlesMap = new Map<string, Set<HandleDirection>>();
    const targetHandlesMap = new Map<string, Set<HandleDirection>>();

    const ensureHandleSet = (
      map: Map<string, Set<HandleDirection>>,
      nodeId: string,
    ) => {
      if (!map.has(nodeId)) {
        map.set(nodeId, new Set<HandleDirection>());
      }
      return map.get(nodeId)!;
    };

    const oppositeDirection: Record<HandleDirection, HandleDirection> = {
      right: 'left',
      left: 'right',
      top: 'bottom',
      bottom: 'top',
    };

    const determineDirection = (
      sourcePosition: { x: number; y: number },
      targetPosition: { x: number; y: number },
    ): HandleDirection => {
      const dx = targetPosition.x - sourcePosition.x;
      const dy = targetPosition.y - sourcePosition.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx === 0 && absDy === 0) {
        return 'right';
      }

      if (absDx >= absDy) {
        return dx >= 0 ? 'right' : 'left';
      }

      return dy >= 0 ? 'bottom' : 'top';
    };

    const edges: Edge<CustomEdgeData>[] = organicData.edges.map((edge) => {
      const sourcePosition = nodePositions.get(edge.source);
      const targetPosition = nodePositions.get(edge.target);

      let direction: HandleDirection = 'right';
      if (sourcePosition && targetPosition) {
        direction = determineDirection(sourcePosition, targetPosition);
      }

      const targetDirection = oppositeDirection[direction];

      ensureHandleSet(sourceHandlesMap, edge.source).add(direction);
      ensureHandleSet(targetHandlesMap, edge.target).add(targetDirection);

      const reactionDetail = {
        label: edge.label,
        reactionInfo: {
          reagents: edge.reactionInfo.reagents,
          conditions: edge.reactionInfo.conditions,
          mechanism: edge.reactionInfo.mechanism,
          equation: edge.reactionInfo.equation,
        },
      };

      const customEdge: Edge<CustomEdgeData> = {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'custom',
        sourceHandle: `source-${direction}`,
        targetHandle: `target-${targetDirection}`,
        data: {
          label: edge.label,
          reactionInfo: reactionDetail.reactionInfo,
        },
      };

      customEdge.data = {
        ...customEdge.data,
        onShowInfo: () => {
          setSelectedEdge(customEdge);
        },
      };

      return customEdge;
    });

    const nodes: Node[] = organicData.nodes.map((node) => {
      const scaledPosition = nodePositions.get(node.id) ?? node.position;
      const sourceHandles = sourceHandlesMap.get(node.id);
      const targetHandles = targetHandlesMap.get(node.id);

      return {
        id: node.id,
        type: 'chemical',
        position: scaledPosition,
        data: {
          label: node.label,
          smiles: node.smiles,
          info: node.info,
          sourceHandles: sourceHandles
            ? Array.from(sourceHandles)
            : (['right'] as HandleDirection[]),
          targetHandles: targetHandles
            ? Array.from(targetHandles)
            : (['left'] as HandleDirection[]),
        },
        draggable: true,
        selectable: true,
      };
    });

    return { nodes, edges };
  }, [organicData, setSelectedEdge]);

  useEffect(() => {
    setNodes(initialNodes as Node<ChemicalNodeData>[]);
    setEdges(initialEdges);
  }, [initialEdges, initialNodes, setEdges, setNodes]);

  useEffect(() => {
    if (initialNodes.length === 0 && initialEdges.length === 0) {
      return;
    }

    const snapshot = buildOrganicDatasetSnapshot(
      initialNodes as Node<ChemicalNodeData>[],
      initialEdges,
      {
        baselineNodes: baselineNodesMap,
        baselineEdges: baselineEdgesMap,
      },
    );

    writeStoredDataset(snapshot);
  }, [baselineEdgesMap, baselineNodesMap, initialEdges, initialNodes]);

  const handleNodeClick = useCallback<NodeMouseHandler>(
    (_event, node) => {
      setSelectedNode(node as Node<ChemicalNodeData>);
    },
    [setSelectedNode],
  );

  const handleEdgeClick = useCallback<EdgeMouseHandler>(
    (_event, edge) => {
      setSelectedEdge(edge as Edge<CustomEdgeData>);
    },
    [setSelectedEdge],
  );

const handleNodesChange = useCallback(
  (changes: NodeChange[]) => {
    applyNodeChangesToStore(changes);

    const shouldPersist = changes.some((change) => change.type === 'position');
    if (!shouldPersist) {
      return;
    }

    const latestState = useMapStore.getState();
    const snapshot = buildOrganicDatasetSnapshot(
      latestState.nodes,
      latestState.edges,
      {
        baselineNodes: baselineNodesMap,
        baselineEdges: baselineEdgesMap,
      },
    );

    writeStoredDataset(snapshot);
  },
  [applyNodeChangesToStore, baselineEdgesMap, baselineNodesMap],
);

const handleNodeDragStop = useCallback(
  (
    _event: unknown,
    _node: Node<ChemicalNodeData>,
    nodesState?: Node<ChemicalNodeData>[],
  ) => {
    const latestState = useMapStore.getState();
    const nodesToPersist = nodesState ?? latestState.nodes;
    const snapshot = buildOrganicDatasetSnapshot(
      nodesToPersist,
      latestState.edges,
      {
        baselineNodes: baselineNodesMap,
        baselineEdges: baselineEdgesMap,
      },
    );

    writeStoredDataset(snapshot);
  },
  [baselineEdgesMap, baselineNodesMap],
);

  const restoreViewport = useCallback(
    (instance: ReactFlowInstance) => {
      if (typeof window === 'undefined') {
        return false;
      }

      const storedViewport = window.localStorage.getItem(VIEWPORT_STORAGE_KEY);
      if (!storedViewport) {
        return false;
      }

      try {
        const parsed = JSON.parse(storedViewport) as Partial<Viewport>;
        if (
          typeof parsed.x === 'number' &&
          typeof parsed.y === 'number' &&
          typeof parsed.zoom === 'number'
        ) {
          // Apply the saved viewport after React Flow has finished layout work.
          requestAnimationFrame(() => {
            instance.setViewport(
              {
                x: parsed.x as number,
                y: parsed.y as number,
                zoom: parsed.zoom as number,
              },
              { duration: 0 },
            );
          });
          return true;
        }
      } catch {
        // Ignore malformed data and fall back to default fit view
      }

      return false;
    },
    [],
  );

  const handleInit = useCallback(
    (instance: ReactFlowInstance) => {
      setReactFlowInstance(instance);

      const restored = restoreViewport(instance);
      if (!restored) {
        // Default behavior matches previous fitView configuration
        requestAnimationFrame(() => {
          instance.fitView({
            padding: 0.2,
            includeHiddenNodes: false,
            duration: 400,
          });
        });
      }
    },
    [restoreViewport, setReactFlowInstance],
  );

  const handleMoveEnd = useCallback(
    (_event: unknown, viewport: Viewport) => {
      if (typeof window === 'undefined') {
        return;
      }

      const { x, y, zoom } = viewport;
      window.localStorage.setItem(
        VIEWPORT_STORAGE_KEY,
        JSON.stringify({ x, y, zoom }),
      );
    },
    [],
  );

  const edgeOptions = useMemo(
    () => ({
      animated: false,
      style: {
        stroke: tokens.flow.edgeStroke,
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 10,
        height: 10,
        color: tokens.flow.edgeStroke,
      },
    }),
    [tokens.flow.edgeStroke],
  );

  const highlightColor = isDark
    ? 'rgba(250, 204, 21, 0.75)'
    : 'rgba(245, 158, 11, 0.8)';

  const isInitialLoading = isOrganicDataLoading && initialNodes.length === 0;
  const isInitialError =
    !!organicDataError && initialNodes.length === 0 && !isOrganicDataLoading;

  return (
    <div
      className="relative w-full transition-colors duration-300"
      style={{
        backgroundColor: tokens.flow.background,
        height: 'calc(100vh - var(--ocm-header-height, 3.5rem))',
        minHeight: 'calc(100dvh - var(--ocm-header-height, 3.5rem))',
      }}
    >
      {isInitialLoading || isInitialError ? (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-3 text-center text-slate-700 dark:text-neutral-200 transition-colors duration-300"
          style={{
            background: tokens.flow.background,
          }}
        >
          <p className="text-base font-semibold sm:text-lg">
            {isInitialLoading
              ? 'Loading organic chemistry map...'
              : 'Unable to load organic chemistry map.'}
          </p>
          {isInitialError && (
            <>
              <p className="max-w-md text-sm opacity-80 sm:text-base">
                {organicDataError?.message ?? 'Please try again in a moment.'}
              </p>
              <button
                type="button"
                onClick={reloadOrganicData}
                className="rounded-md px-4 py-2 text-sm font-medium transition-transform duration-200 hover:scale-[1.02]"
                style={{
                  background: tokens.actions.primary.background,
                  color: tokens.actions.primary.text,
                  boxShadow: tokens.actions.primary.shadow,
                }}
              >
                Try again
              </button>
            </>
          )}
        </div>
      ) : (
        <ReactFlow
          nodes={mapNodes}
          edges={mapEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={edgeOptions}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onNodesChange={handleNodesChange}
          onNodeDragStop={handleNodeDragStop}
          onPaneClick={clearSelection}
          onInit={handleInit}
          minZoom={0.1}
          maxZoom={8}
          onMoveEnd={handleMoveEnd}
          attributionPosition="bottom-left"
          className="text-slate-900 dark:text-neutral-100 transition-colors duration-300 h-full"
          style={{
            background: tokens.flow.background,
            width: '100%',
            height: '100%',
          }}
        >
          {/* Background pattern */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color={tokens.flow.backgroundPattern}
          />

          {/* Navigation controls */}
          <Controls
            position="bottom-left"
            className={`backdrop-blur-sm border rounded-lg transition-all duration-300 ${tokens.flow.controlBackground} ${tokens.flow.controlBorder} ${tokens.flow.controlShadow} text-slate-700 dark:text-neutral-200`}
          />
        </ReactFlow>
      )}

      {/* Custom styles for highlighted nodes */}
      <style>{`
        .highlighted-node {
          filter: drop-shadow(0 0 10px ${highlightColor});
        }

        .react-flow__edge.animated {
          stroke-dasharray: 5;
          animation: dashdraw 0.5s linear infinite;
        }

        @keyframes dashdraw {
          to {
            stroke-dashoffset: -10;
          }
        }
      `}</style>

      <InfoPanel selected={selectedInfo} onClose={clearSelection} />
    </div>
  );
};

export default MapPage;
