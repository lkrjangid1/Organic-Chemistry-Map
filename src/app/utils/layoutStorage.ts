import type { Edge, Node } from 'reactflow';
import type { ChemicalNodeData } from '../components/NodeChemical';
import type { CustomEdgeData } from '../components/CustomEdge';
import type {
  OrganicData,
  OrganicEdge,
  OrganicNode,
} from '../data/OrganicDataContext';

export const USER_LAYOUT_STORAGE_KEY = 'ocm:user-layout:v1';

export type LayoutPoint = {
  x: number;
  y: number;
};

const isValidCoordinate = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const normalizeOrganicNode = (
  node: Node<ChemicalNodeData>,
  baseline: OrganicNode | undefined,
): OrganicNode => {
  const info =
    node.data?.info ??
    baseline?.info ?? {
      formula: '',
      iupac: '',
      notes: undefined,
      properties: undefined,
    };

  return {
    id: node.id,
    label: node.data?.label ?? baseline?.label ?? node.id,
    smiles: node.data?.smiles ?? baseline?.smiles ?? '',
    type: baseline?.type,
    info,
    position: {
      x: node.position.x,
      y: node.position.y,
    },
  };
};

const normalizeOrganicEdge = (
  edge: Edge<CustomEdgeData>,
  baseline: OrganicEdge | undefined,
): OrganicEdge => {
  const label =
    edge.data?.label ??
    edge.label ??
    baseline?.label ??
    `${edge.source} → ${edge.target}`;

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label,
    type: baseline?.type,
    reactionInfo: {
      reagents: edge.data?.reactionInfo?.reagents ?? baseline?.reactionInfo?.reagents,
      conditions: edge.data?.reactionInfo?.conditions ?? baseline?.reactionInfo?.conditions,
      mechanism: edge.data?.reactionInfo?.mechanism ?? baseline?.reactionInfo?.mechanism,
      equation: edge.data?.reactionInfo?.equation ?? baseline?.reactionInfo?.equation,
    },
  };
};

export const buildOrganicDatasetSnapshot = (
  nodes: Node<ChemicalNodeData>[],
  edges: Edge<CustomEdgeData>[],
  options?: {
    baselineNodes?: Map<string, OrganicNode>;
    baselineEdges?: Map<string, OrganicEdge>;
  },
): OrganicData => {
  const baselineNodes = options?.baselineNodes;
  const baselineEdges = options?.baselineEdges;

  const organicNodes: OrganicNode[] = nodes.map((node) =>
    normalizeOrganicNode(node, baselineNodes?.get(node.id)),
  );

  const organicEdges: OrganicEdge[] = edges.map((edge) =>
    normalizeOrganicEdge(edge, baselineEdges?.get(edge.id)),
  );

  return {
    nodes: organicNodes,
    edges: organicEdges,
  };
};

export const extractLayoutFromNodes = (
  nodes: Node<ChemicalNodeData>[],
): Record<string, LayoutPoint> =>
  nodes.reduce<Record<string, LayoutPoint>>((acc, node) => {
    acc[node.id] = {
      x: node.position.x,
      y: node.position.y,
    };
    return acc;
  }, {});

export const writeStoredDataset = (snapshot: OrganicData) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(USER_LAYOUT_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage errors such as quota limits.
  }
};

export const readStoredDataset = (): OrganicData | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(USER_LAYOUT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown as OrganicData;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const extractPositionsFromDataset = (
  dataset: OrganicData | null,
): Record<string, LayoutPoint> => {
  if (!dataset) {
    return {};
  }

  const positions: Record<string, LayoutPoint> = {};

  dataset.nodes.forEach((node) => {
    if (node && node.position && isValidCoordinate(node.position.x) && isValidCoordinate(node.position.y)) {
      positions[node.id] = {
        x: node.position.x,
        y: node.position.y,
      };
    }
  });

  return positions;
};
