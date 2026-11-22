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

interface ChemicalNodeProps extends NodeProps<ChemicalNodeData> {}

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
      className="group relative rounded-xl border transition-all duration-300"
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
      <div className="flex flex-col items-center gap-3 px-3 py-3 sm:px-4 sm:py-4">
        <div
          className="flex items-center justify-center rounded-lg border p-2 shadow-sm transition-colors duration-300"
          style={{
            borderColor: tokens.node.smilesBorder,
            background: tokens.node.smilesBackground,
          }}
        >
          <SmilesRenderer
            smiles={data.smiles}
            width={96}
            height={96}
            className="rounded-md"
          />
        </div>

        {/* Compound information */}
        <div className="flex flex-col items-center gap-1 text-center transition-colors duration-300">
          <h2
            className="font-semibold text-sm leading-tight sm:text-base"
            style={{ color: tokens.node.text }}
          >
            {data.label}
          </h2>
        </div>
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
