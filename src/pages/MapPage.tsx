import { useMemo } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  MarkerType,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

import NodeChemical, { HandleDirection } from '../components/NodeChemical';
import data from '../data/jee_organic.json';
import CustomEdge from '../components/CustomEdge';
import { useTheme } from '../theme';

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

const MapPage = () => {
  const { tokens, isDark } = useTheme();

  // Transform JSON data to React Flow format
  const { nodes: initialNodes, edges: initialEdges } = useMemo<{
    nodes: Node[];
    edges: Edge[];
  }>(() => {
    const nodePositions = new Map(
      data.nodes.map((node) => [node.id, node.position]),
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

    const edges: Edge[] = data.edges.map((edge) => {
      const sourcePosition = nodePositions.get(edge.source);
      const targetPosition = nodePositions.get(edge.target);

      let direction: HandleDirection = 'right';
      if (sourcePosition && targetPosition) {
        direction = determineDirection(sourcePosition, targetPosition);
      }

      const targetDirection = oppositeDirection[direction];

      ensureHandleSet(sourceHandlesMap, edge.source).add(direction);
      ensureHandleSet(targetHandlesMap, edge.target).add(targetDirection);

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'custom',
        sourceHandle: `source-${direction}`,
        targetHandle: `target-${targetDirection}`,
        data: {
          reagents: edge.reactionInfo.reagents,
          label: edge.label,
          conditions: edge.reactionInfo.conditions,
        },
      };
    });

    const nodes: Node[] = data.nodes.map((node) => {
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
  }, []);

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

  return (
    <div
      className="relative w-full transition-colors duration-300"
      style={{
        backgroundColor: tokens.flow.background,
        height: 'calc(100vh - var(--ocm-header-height, 3.5rem))',
        minHeight: 'calc(100dvh - var(--ocm-header-height, 3.5rem))',
      }}
    >
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={edgeOptions}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        minZoom={0.1}
        maxZoom={8}
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
    </div>
  );
};

export default MapPage;
