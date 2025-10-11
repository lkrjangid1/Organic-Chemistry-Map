import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import SmilesRenderer from './SmilesRenderer';

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

  return (
    <div
      className={`
        min-w-[100px] max-w-[120px]
        ${selected ? 'bg-white rounded-lg border-2 shadow-lg border-blue-500 ring-2 ring-blue-200' : ''}
      `}
    >
      {/* Input handle for incoming connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white shadow-sm"
      />

      {/* Molecular structure display */}
      <div className="flex justify-center mb-2">
        <SmilesRenderer
          smiles={data.smiles}
          width={100}
          height={100}
          className="border border-gray-200 rounded bg-white"
        />
      </div>

      {/* Compound information */}
      <div className="text-center space-y-1">
        <h3 className="font-semibold text-sm text-gray-800 leading-tight">
          {data.label}
        </h3>
      </div>

      {/* Output handle for outgoing connections */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500 border-2 border-white shadow-sm"
      />
    </div>
  );
});

NodeChemical.displayName = 'NodeChemical';

export default NodeChemical;