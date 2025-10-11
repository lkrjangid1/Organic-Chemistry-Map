import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import NodeChemical from '../components/NodeChemical';
import data from '../data/jee_organic.json';

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

// Styling for different edge types
const edgeOptions = {
  animated: false,
  style: {
    stroke: '#6366f1',
    strokeWidth: 2,
  },
};

const MapPage = () => {

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
      draggable: true,
      selectable: true,
    }));
  }, []);

  const initialEdges: Edge[] = useMemo(() => {
    return data.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'smoothstep',
      style: {
        stroke: '#6366f1',
        strokeWidth: 2,
      },
      labelStyle: {
        fontSize: 11,
        fontWeight: 500,
        fill: '#374151',
        background: 'rgba(255, 255, 255, 0.8)',
      },
    }));
  }, []);

  return (
    <div className="w-full h-screen bg-slate-50">
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={edgeOptions}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        {/* Background pattern */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#e2e8f0"
        />

        {/* Navigation controls */}
        <Controls
          className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
        />

        {/* Minimap for navigation */}
        <MiniMap
          className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg"
          nodeColor="#6366f1"
          nodeStrokeWidth={2}
          maskColor="rgba(0, 0, 0, 0.1)"
          position="top-right"
        />
      </ReactFlow>

      {/* Custom styles for highlighted nodes */}
      <style>{`
        .highlighted-node {
          filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.8));
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