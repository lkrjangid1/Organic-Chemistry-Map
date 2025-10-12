import { memo } from 'react';
import { ExternalLink, X } from 'lucide-react';

import { useTheme } from '../theme';
import SmilesRenderer from './SmilesRenderer';
import ConformerViewer from './ConformerViewer';
import type { ChemicalNodeData } from './NodeChemical';
import type { ReactionInfo } from './CustomEdge';

export type SelectedInfo =
  | { type: 'node'; payload: ChemicalNodeData }
  | { type: 'edge'; payload: { label: string; reactionInfo: ReactionInfo } };

interface InfoPanelProps {
  selected: SelectedInfo | null;
  onClose: () => void;
}

const InfoPanel = memo(({ selected, onClose }: InfoPanelProps) => {
  const { tokens } = useTheme();

  if (!selected) {
    return null;
  }

  const isNode = selected.type === 'node';
  const title = isNode ? selected.payload.label : selected.payload.label;

  const pubchemUrl = isNode
    ? `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(selected.payload.smiles)}`
    : null;

  const reactionLookupUrl = !isNode && selected.payload.reactionInfo.equation
    ? `https://chemequations.com/en/?s=${encodeURIComponent(selected.payload.reactionInfo.equation)}`
    : null;

  const infoRows = isNode
    ? (
        <div className="space-y-3 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-600 dark:text-neutral-400">
              Formula
            </div>
            <div className="font-semibold text-slate-900 dark:text-neutral-100" style={{ color: tokens.node.text }}>
              {selected.payload.info.formula}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-600 dark:text-neutral-400">
              IUPAC Name
            </div>
            <div className="font-medium text-slate-900 dark:text-neutral-100" style={{ color: tokens.node.text }}>
              {selected.payload.info.iupac}
            </div>
          </div>

          {selected.payload.info.notes && (
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-600 dark:text-neutral-400">
                Notes
              </div>
              <p className="leading-snug text-slate-700 dark:text-neutral-300" style={{ color: tokens.node.text }}>
                {selected.payload.info.notes}
              </p>
            </div>
          )}

          {selected.payload.info.properties && (
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-600 dark:text-neutral-400">
                Key Properties
              </div>
              <p className="leading-snug text-slate-700 dark:text-neutral-300" style={{ color: tokens.node.text }}>
                {selected.payload.info.properties}
              </p>
            </div>
          )}
        </div>
      )
    : (
        <div className="space-y-3 text-sm">
          {selected.payload.reactionInfo.reagents && (
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-600 dark:text-neutral-400">
                Reagents
              </div>
              <div className="font-medium text-slate-900 dark:text-neutral-200" style={{ color: tokens.node.text }}>
                {selected.payload.reactionInfo.reagents}
              </div>
            </div>
          )}

          {selected.payload.reactionInfo.conditions && (
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-600 dark:text-neutral-400">
                Conditions
              </div>
              <div className="text-slate-700 dark:text-neutral-300" style={{ color: tokens.node.text }}>
                {selected.payload.reactionInfo.conditions}
              </div>
            </div>
          )}

          {selected.payload.reactionInfo.mechanism && (
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-600 dark:text-neutral-400">
                Mechanism
              </div>
              <p className="leading-snug text-slate-700 dark:text-neutral-300" style={{ color: tokens.node.text }}>
                {selected.payload.reactionInfo.mechanism}
              </p>
            </div>
          )}

          {selected.payload.reactionInfo.equation && (
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-600 dark:text-neutral-400">
                Equation
              </div>
              <div className="font-mono text-xs text-slate-900 dark:text-neutral-200" style={{ color: tokens.node.text }}>
                {selected.payload.reactionInfo.equation}
              </div>
            </div>
          )}
        </div>
      );

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] transition-opacity md:hidden"
        onClick={onClose}
      />
      <aside
        className="fixed bottom-0 left-0 right-0 md:left-auto md:right-4 md:bottom-4 w-full md:w-[300px] md:rounded-2xl rounded-t-3xl shadow-2xl border border-slate-200/70 dark:border-neutral-800/80 overflow-hidden h-[55vh] md:h-auto md:max-h-[70vh]"
        style={{
          background: tokens.flow.infoBackground,
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70 dark:border-neutral-800/80">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-600 dark:text-neutral-400">
              {isNode ? 'Element' : 'Reaction'}
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-neutral-100 leading-tight" style={{ color: tokens.node.text }}>
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {(pubchemUrl || reactionLookupUrl) && (
              <a
                href={pubchemUrl ?? reactionLookupUrl!}
                target="_blank"
                rel="noreferrer"
                className="rounded-full p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 dark:text-neutral-300 dark:hover:text-neutral-100 dark:hover:bg-neutral-700/60"
                aria-label={isNode ? 'View on PubChem' : 'Open reaction on ChemEquations'}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-700/60"
              aria-label="Close info"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-4 py-3 space-y-4 h-[calc(55vh-3.5rem)] md:h-auto md:max-h-[60vh]">
          {isNode && (
            <div className="flex justify-center">
              <SmilesRenderer
                smiles={selected.payload.smiles}
                width={160}
                height={140}
                className="border rounded-lg"
              />
            </div>
          )}

          {isNode && (
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-600 dark:text-neutral-400 mb-2">
                3D Conformer
              </div>
              <ConformerViewer smiles={selected.payload.smiles} height={220} />
            </div>
          )}

          {infoRows}
        </div>
      </aside>
    </>
  );
});

InfoPanel.displayName = 'InfoPanel';

export default InfoPanel;
