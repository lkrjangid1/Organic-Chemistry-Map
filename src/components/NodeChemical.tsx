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
      className="min-w-[100px] max-w-[120px] rounded-lg border transition-all duration-300 p-2"
      style={{
        backgroundColor: tokens.node.background,
        borderColor: selected ? tokens.node.borderSelected : tokens.node.border,
        borderWidth: selected ? 2 : 1,
        borderStyle: 'solid',
        boxShadow: selected
          ? `0 0 0 3px ${tokens.node.ring}`
          : '0 8px 18px rgba(15, 23, 42, 0.12)',
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
          width={100}
          height={100}
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
