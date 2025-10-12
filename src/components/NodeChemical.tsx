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

interface ChemicalNodeProps extends NodeProps {
  data: ChemicalNodeData;
}

const NodeChemical = memo(({ data, selected }: ChemicalNodeProps) => {
  const { tokens } = useTheme();

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
      {/* Input handle for incoming connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-slate-100 dark:border-neutral-900 shadow-sm transition-colors duration-300"
      />

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

      {/* Output handle for outgoing connections */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500 border-2 border-slate-100 dark:border-neutral-900 shadow-sm transition-colors duration-300"
      />
    </div>
  );
});

NodeChemical.displayName = 'NodeChemical';

export default NodeChemical;
