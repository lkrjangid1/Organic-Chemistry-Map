import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Expand, Minimize } from 'lucide-react';
import { useTheme } from '../theme';

type AtomProjection = {
  x: number;
  y: number;
  depth: number;
  element: string;
  index: number;
};

type BondProjection = {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  depth: number;
  order: number;
};

type ParsedStructure = {
  atoms: Array<{
    element: string;
    x: number;
    y: number;
    z: number;
  }>;
  bonds: Array<{
    source: number;
    target: number;
    order: number;
  }>;
};

const loadStructure = async (smiles: string): Promise<ParsedStructure> => {
  if (typeof window === 'undefined') {
    throw new Error('Viewer unavailable during SSR');
  }

  const module = await import('smiles-drawer');
  const SmilesDrawer = (module as { default?: any }).default ?? module;

  const drawer = new SmilesDrawer.Drawer({
    width: 300,
    height: 300,
    isomeric: true,
    terminalCarbons: true,
    explicitHydrogens: true,
    experimentalSSSR: true,
  });

  const parseTree = SmilesDrawer.Parser.parse(smiles);
  const preprocessor = drawer.svgDrawer.preprocessor;
  preprocessor.initDraw(parseTree, 'light', true, []);
  preprocessor.processGraph();

  const vertices = preprocessor.graph.vertices as Array<{
    id: number;
    position: { x: number; y: number };
    value: { element: string; rings: number[] };
  }>;
  const edges = preprocessor.graph.edges as Array<{
    sourceId: number;
    targetId: number;
    weight: number;
  }>;

  if (!vertices.length) {
    throw new Error('No atoms located in SMILES graph');
  }

  const adjacency = vertices.map(() => [] as number[]);
  for (const edge of edges) {
    adjacency[edge.sourceId].push(edge.targetId);
    adjacency[edge.targetId].push(edge.sourceId);
  }

  const depths = new Array(vertices.length).fill(0);
  const visited = new Array(vertices.length).fill(false);
  const queue: Array<{ id: number; depth: number }> = [{ id: 0, depth: 0 }];
  visited[0] = true;

  while (queue.length) {
    const { id, depth } = queue.shift()!;
    depths[id] = depth;

    for (const neighbour of adjacency[id]) {
      if (!visited[neighbour]) {
        visited[neighbour] = true;
        queue.push({ id: neighbour, depth: depth + 1 });
      }
    }
  }

  const maxDepth = depths.reduce((acc, value) => Math.max(acc, value), 0) || 1;

  const xs = vertices.map((vertex) => vertex.position.x);
  const ys = vertices.map((vertex) => vertex.position.y);
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

  const atoms = vertices.map((vertex, index) => {
    const normalizedX = vertex.position.x - centerX;
    const normalizedY = vertex.position.y - centerY;
    const depthOffset = depths[index] - maxDepth / 2;
    const ringOffset = vertex.value.rings.length > 0 ? (index % 2 === 0 ? 0.6 : -0.6) : 0;

    return {
      element: vertex.value.element,
      x: normalizedX,
      y: normalizedY,
      z: depthOffset * 0.7 + ringOffset,
    };
  });

  const maxRadius = atoms.reduce((acc, atom) => Math.max(acc, Math.hypot(atom.x, atom.y)), 0) || 1;
  const maxAbsZ = atoms.reduce((acc, atom) => Math.max(acc, Math.abs(atom.z)), 0) || 1;

  for (const atom of atoms) {
    atom.x /= maxRadius;
    atom.y /= maxRadius;
    atom.z = (atom.z / maxAbsZ) * 0.8;
  }

  const bonds = edges.map((edge) => ({
    source: edge.sourceId,
    target: edge.targetId,
    order: edge.weight ?? 1,
  }));

  return { atoms, bonds };
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const adjustColor = (hex: string, amount: number) => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  if (Number.isNaN(bigint)) {
    return hex;
  }

  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  const targetR = amount >= 0 ? 255 : 0;
  const targetG = amount >= 0 ? 255 : 0;
  const targetB = amount >= 0 ? 255 : 0;
  const mixAmount = Math.abs(clamp(amount, -1, 1));

  const mixChannel = (channel: number, target: number) =>
    Math.round(channel + (target - channel) * mixAmount);

  const newR = mixChannel(r, targetR);
  const newG = mixChannel(g, targetG);
  const newB = mixChannel(b, targetB);

  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
};

interface ConformerViewerProps {
  smiles: string;
  height?: number;
}

const ConformerViewer = memo(({ smiles, height = 220 }: ConformerViewerProps) => {
  const { tokens, isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const rotationRef = useRef({ x: -0.35, y: 0.5, z: 0 });
  const autoRotateRef = useRef(true);
  const dragStateRef = useRef<{ active: boolean; lastX: number; lastY: number; timeout: number | null }>({
    active: false,
    lastX: 0,
    lastY: 0,
    timeout: null,
  });

  const [structure, setStructure] = useState<ParsedStructure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const prepare = async () => {
      try {
        setError(null);
        const parsed = await loadStructure(smiles);
        if (!cancelled) {
          setStructure(parsed);
        }
      } catch (err) {
        if (!cancelled) {
          setStructure(null);
          setError(err instanceof Error ? err.message : 'Unable to build conformer');
        }
      }
    };

    prepare();

    return () => {
      cancelled = true;
    };
  }, [smiles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !structure) {
      return undefined;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return undefined;
    }

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio ?? 1;
      const width = rect.width || 1;
      const heightPx = rect.height || height;

      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(heightPx * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(heightPx * dpr);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, heightPx);

      if (autoRotateRef.current && !dragStateRef.current.active) {
        rotationRef.current.y += 0.0075;
      }

      const projected = projectStructure(structure, rotationRef.current, width, heightPx);
      drawStructure(
        ctx,
        projected.atoms,
        projected.bonds,
        tokens.node.smilesPalette as Record<string, string>,
        isDark
          ? tokens.node.text
          : '#0f172a',
        isDark ? '#e5e5e5' : '#f8fafc',
      );

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [structure, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const state = dragStateRef.current;

    const clearTimeoutSafe = () => {
      if (state.timeout !== null) {
        window.clearTimeout(state.timeout);
        state.timeout = null;
      }
    };

    const scheduleAutoRotate = () => {
      clearTimeoutSafe();
      state.timeout = window.setTimeout(() => {
        autoRotateRef.current = true;
        state.timeout = null;
      }, 2400);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!canvas) {
        return;
      }
      autoRotateRef.current = false;
      state.active = true;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!state.active) {
        return;
      }

      const deltaX = event.clientX - state.lastX;
      const deltaY = event.clientY - state.lastY;
      state.lastX = event.clientX;
      state.lastY = event.clientY;

      rotationRef.current.y += deltaX * 0.01;
      rotationRef.current.x += deltaY * 0.01;
      rotationRef.current.x = clamp(rotationRef.current.x, -Math.PI / 2, Math.PI / 2);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!state.active) {
        return;
      }

      state.active = false;
      canvas?.releasePointerCapture(event.pointerId);
      scheduleAutoRotate();
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      clearTimeoutSafe();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);

  const containerStyle = useMemo(() => ({
    height: isFullscreen ? '100%' : height,
  }), [height, isFullscreen]);

  const toggleFullscreen = async () => {
    try {
      if (!containerRef.current) {
        return;
      }

      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen request failed', err);
    }
  };

  useEffect(() => {
    const handleChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
    };
  }, []);

  if (error) {
    return (
      <div className="text-xs text-red-500 border border-red-200 rounded-md px-3 py-2 bg-red-50/60 dark:border-red-600/40 dark:bg-red-900/20">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
    >
      <button
        type="button"
        onClick={toggleFullscreen}
        className="absolute right-3 top-3 z-10 rounded-full bg-white/80 dark:bg-neutral-900/70 border border-slate-200/70 dark:border-neutral-800/80 text-slate-600 dark:text-neutral-200 p-1 hover:bg-white hover:shadow-sm transition"
        aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
      >
        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
      </button>

      <canvas
        ref={canvasRef}
        style={containerStyle}
        className="w-full rounded-lg bg-white/60 dark:bg-neutral-900/50 border border-slate-200/70 dark:border-neutral-800/80 shadow-sm"
      />
    </div>
  );
});

ConformerViewer.displayName = 'ConformerViewer';

const projectStructure = (
  structure: ParsedStructure,
  rotation: { x: number; y: number; z: number },
  width: number,
  height: number,
) => {
  const projectedAtoms: AtomProjection[] = [];
  const bonds: BondProjection[] = [];

  const baseScale = Math.min(width, height) * 0.42;
  const cosY = Math.cos(rotation.y);
  const sinY = Math.sin(rotation.y);
  const cosX = Math.cos(rotation.x);
  const sinX = Math.sin(rotation.x);
  const cosZ = Math.cos(rotation.z);
  const sinZ = Math.sin(rotation.z);
  const cameraDistance = 6;

  for (let index = 0; index < structure.atoms.length; index += 1) {
    const atom = structure.atoms[index];
    const x0 = atom.x * baseScale;
    const y0 = atom.y * baseScale;
    const z0 = atom.z * baseScale;

    const x1 = x0 * cosY + z0 * sinY;
    const z1 = -x0 * sinY + z0 * cosY;

    const y1 = y0 * cosX - z1 * sinX;
    const z2 = y0 * sinX + z1 * cosX;

    const x2 = x1 * cosZ - y1 * sinZ;
    const y2 = x1 * sinZ + y1 * cosZ;

    const zNormalized = z2 / baseScale;
    const perspective = cameraDistance / (cameraDistance - zNormalized);

    projectedAtoms.push({
      index,
      element: atom.element,
      x: width / 2 + x2 * perspective,
      y: height / 2 + y2 * perspective,
      depth: zNormalized,
    });
  }

  for (const bond of structure.bonds) {
    const source = projectedAtoms[bond.source];
    const target = projectedAtoms[bond.target];
    if (!source || !target) {
      continue;
    }

    bonds.push({
      ax: source.x,
      ay: source.y,
      bx: target.x,
      by: target.y,
      depth: (source.depth + target.depth) / 2,
      order: bond.order,
    });
  }

  return { atoms: projectedAtoms, bonds };
};

const drawStructure = (
  ctx: CanvasRenderingContext2D,
  atoms: AtomProjection[],
  bonds: BondProjection[],
  palette: Record<string, string>,
  textColorDark: string,
  textColorLight: string,
) => {
  ctx.lineCap = 'round';

  const sortedBonds = [...bonds].sort((a, b) => a.depth - b.depth);

  for (const bond of sortedBonds) {
    const shade = clamp((bond.depth + 1) / 2, 0, 1);
    ctx.strokeStyle = adjustColor('#334155', shade * -0.35);
    ctx.lineWidth = 2 + bond.order * 0.7;

    ctx.beginPath();
    ctx.moveTo(bond.ax, bond.ay);
    ctx.lineTo(bond.bx, bond.by);
    ctx.stroke();

    if (bond.order >= 2) {
      const dx = bond.bx - bond.ax;
      const dy = bond.by - bond.ay;
      const length = Math.hypot(dx, dy) || 1;
      const offsetScale = (bond.order === 2 ? 4 : 6) / length;
      const offsetX = -dy * offsetScale;
      const offsetY = dx * offsetScale;

      ctx.beginPath();
      ctx.moveTo(bond.ax + offsetX, bond.ay + offsetY);
      ctx.lineTo(bond.bx + offsetX, bond.by + offsetY);
      ctx.stroke();

      if (bond.order === 3) {
        ctx.beginPath();
        ctx.moveTo(bond.ax - offsetX, bond.ay - offsetY);
        ctx.lineTo(bond.bx - offsetX, bond.by - offsetY);
        ctx.stroke();
      }
    }
  }

  const sortedAtoms = [...atoms].sort((a, b) => a.depth - b.depth);

  ctx.font = '600 12px "Inter", "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const atom of sortedAtoms) {
    const capitalized = atom.element.length > 1
      ? atom.element.charAt(0).toUpperCase() + atom.element.slice(1).toLowerCase()
      : atom.element.toUpperCase();
    const baseColor = palette[atom.element] ?? palette[capitalized] ?? palette[atom.element.toUpperCase()] ?? '#1e293b';
    const shade = clamp((atom.depth + 1) / 2, 0, 1);
    const fill = adjustColor(baseColor, 0.35 + shade * 0.3);
    const outline = adjustColor(baseColor, -0.45);
    const radius = 10 + shade * 4;

    ctx.fillStyle = fill;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(atom.x, atom.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = shade > 0.55 ? textColorDark : textColorLight;
    ctx.fillText(atom.element, atom.x, atom.y);
  }
};

export default ConformerViewer;
