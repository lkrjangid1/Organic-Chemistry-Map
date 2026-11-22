/** Structure drawings used by the study tools, one static SVG per SMILES. */
import type { APIRoute } from 'astro';
import { moleculeSvg } from '../../lib/structure';
import { molKey, toolSmiles } from '../../lib/tools';

export async function getStaticPaths() {
  return (await toolSmiles()).map((smiles) => ({ params: { key: molKey(smiles) }, props: { smiles } }));
}

export const GET: APIRoute = async ({ props }) => {
  const svg = (await moleculeSvg(props.smiles as string, { width: 220, height: 160 })) ?? "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 160'/>";
  return new Response(svg.includes('xmlns=') ? svg : svg.replace('<svg', "<svg xmlns='http://www.w3.org/2000/svg'"), {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
};
