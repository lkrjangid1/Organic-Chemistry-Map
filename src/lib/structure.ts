/**
 * Build-time molecule drawing with RDKit (WASM). Output is inline SVG,
 * so structures are visible to crawlers and cost no client JavaScript.
 */
import initRDKitModule from '@rdkit/rdkit';

type RDKit = Awaited<ReturnType<typeof initRDKitModule>>;
let rdkitPromise: Promise<RDKit> | null = null;
const cache = new Map<string, string | null>();

const getRDKit = () => {
  rdkitPromise ??= initRDKitModule();
  return rdkitPromise;
};

export async function moleculeSvg(
  smiles: string | undefined,
  { width = 220, height = 160 }: { width?: number; height?: number } = {},
): Promise<string | null> {
  if (!smiles) return null;
  const key = `${smiles}|${width}|${height}`;
  if (cache.has(key)) return cache.get(key)!;

  const rdkit = await getRDKit();
  const mol = rdkit.get_mol(smiles);
  if (!mol || !mol.is_valid()) {
    mol?.delete();
    cache.set(key, null);
    return null;
  }
  try {
    let svg = mol.get_svg_with_highlights(
      JSON.stringify({
        width,
        height,
        backgroundColour: [1, 1, 1, 0],
        bondLineWidth: 1.6,
        fixedFontSize: 15,
        padding: 0.08,
        clearBackground: false,
      }),
    );
    svg = svg
      .replace(/<\?xml[^>]*\?>\s*/, '')
      .replace(/<!-- END OF HEADER -->/, '')
      .replace(/<rect[^>]*style='opacity:1\.0;fill:#FFFFFF[^>]*><\/rect>/, '')
      .replace(/width='\d+px' height='\d+px'/, `viewBox='0 0 ${width} ${height}' width='${width}' height='${height}' role='img'`);
    cache.set(key, svg);
    return svg;
  } finally {
    mol.delete();
  }
}
