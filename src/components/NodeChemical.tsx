import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import SmilesRenderer from './SmilesRenderer';
import { useTheme } from '../theme';

/**
 * Custom node type for displaying chemical compounds with SMILES structures
 * Features:
 * - Renders molecular structure using SMILES Drawer
 * - Shows compound name and formula
 * - Handles for React Flow connections
 * - Responsive design with hover effects
 */

export type HandleDirection = 'left' | 'right' | 'top' | 'bottom';

export interface ChemicalNodeData {
  label: string;
  smiles: string;
  info: {
    formula: string;
    iupac: string;
    notes?: string;
    properties?: string;
  };
  sourceHandles?: HandleDirection[];
  targetHandles?: HandleDirection[];
}

interface ChemicalNodeProps extends NodeProps<ChemicalNodeData> {
  data: ChemicalNodeData;
}

const directionToPosition: Record<HandleDirection, Position> = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
};

const defaultSourceHandles: HandleDirection[] = ['right'];
const defaultTargetHandles: HandleDirection[] = ['left'];

const NodeChemical = memo(({ data, selected }: ChemicalNodeProps) => {
  const { tokens } = useTheme();

  const uniqueSourceHandles = data.sourceHandles?.length
    ? Array.from(new Set(data.sourceHandles))
    : defaultSourceHandles;
  const uniqueTargetHandles = data.targetHandles?.length
    ? Array.from(new Set(data.targetHandles))
    : defaultTargetHandles;

  return (
    <div
      className="rounded-lg border transition-all duration-300 p-2 sm:p-3"
      style={{
        borderColor: selected ? tokens.node.borderSelected : 'transparent',
        borderWidth: selected ? 1 : 0,
        padding: 0,
        margin: 0,
        boxShadow: selected
          ? `0 0 0 3px ${tokens.node.ring}`
          : '',
      }}
    >
      {/* Input handles for incoming connections */}
      {uniqueTargetHandles.map((direction) => (
        <Handle
          key={`target-${direction}`}
          id={`target-${direction}`}
          type="target"
          position={directionToPosition[direction]}
          className="w-3 h-3 bg-blue-500 border-2 border-slate-100 dark:border-neutral-900 shadow-sm transition-colors duration-300"
        />
      ))}

      {/* Molecular structure display */}
      <div className="flex justify-center mb-2">
        <SmilesRenderer
          smiles={data.smiles}
          width={96}
          height={86}
          className="border rounded transition-colors duration-300"
        />
      </div>

      {/* Compound information */}
      <div className="text-center space-y-1">
        <h3
          className="font-semibold text-sm leading-tight transition-colors duration-300"
          style={{ color: tokens.node.text }}
        >
          {data.label}
        </h3>
      </div>

      {/* Output handles for outgoing connections */}
      {uniqueSourceHandles.map((direction) => (
        <Handle
          key={`source-${direction}`}
          id={`source-${direction}`}
          type="source"
          position={directionToPosition[direction]}
          className="w-3 h-3 bg-green-500 border-2 border-slate-100 dark:border-neutral-900 shadow-sm transition-colors duration-300"
        />
      ))}
    </div>
  );
});

NodeChemical.displayName = 'NodeChemical';

export default NodeChemical;
