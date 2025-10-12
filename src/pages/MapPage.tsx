import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  type EdgeMouseHandler,
  MarkerType,
  Node,
  type NodeMouseHandler,
  type ReactFlowInstance,
  type Viewport,
} from 'reactflow';
import 'reactflow/dist/style.css';

import NodeChemical, { HandleDirection } from '../components/NodeChemical';
import type { ChemicalNodeData } from '../components/NodeChemical';
import { useOrganicData } from '../data/OrganicDataContext';
import CustomEdge, { type CustomEdgeData, type ReactionInfo } from '../components/CustomEdge';
import { useTheme } from '../theme';
import InfoPanel, { type SelectedInfo } from '../components/InfoPanel';
import { useMapStore } from '../store/useMapStore';

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

    const nodePositions = new Map(
      organicData.nodes.map((node) => [node.id, node.position]),
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
      const sourceHandles = sourceHandlesMap.get(node.id);
      const targetHandles = targetHandlesMap.get(node.id);

      return {
        id: node.id,
        type: 'chemical',
        position: node.position,
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
        draggable: false,
        selectable: true,
      };
    });

    return { nodes, edges };
  }, [organicData, setSelectedEdge]);

  useEffect(() => {
    setNodes(initialNodes as Node<ChemicalNodeData>[]);
    setEdges(initialEdges);
  }, [initialEdges, initialNodes, setEdges, setNodes]);

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
          nodes={initialNodes}
          edges={initialEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={edgeOptions}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
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
