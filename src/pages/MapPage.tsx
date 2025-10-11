import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import NodeChemical from '../components/NodeChemical';
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
  const initialNodes: Node[] = useMemo(() => {
    return data.nodes.map((node) => ({
      id: node.id,
      type: 'chemical',
      position: node.position,
      data: {
        label: node.label,
        smiles: node.smiles,
        info: node.info,
      },
      draggable: false,
      selectable: true,
    }));
  }, []);

  const initialEdges = useMemo(() => {
    return data.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'custom', // use our custom edge
      data: {
        reagents: edge.reactionInfo.reagents,
        label: edge.label,
        conditions: edge.reactionInfo.conditions,
      },
    }));
  }, [data.edges]);

  const edgeOptions = useMemo(
    () => ({
      animated: false,
      style: {
        stroke: tokens.flow.edgeStroke,
        strokeWidth: 2,
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
