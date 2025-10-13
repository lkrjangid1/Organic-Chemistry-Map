import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Expand, Info, Minimize, X } from 'lucide-react';
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
  sourceElement: string;
  targetElement: string;
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

const normalizeElementSymbol = (element: string) => (
  element.length > 1
    ? element.charAt(0).toUpperCase() + element.slice(1).toLowerCase()
    : element.toUpperCase()
);

const getElementColor = (element: string, palette: Record<string, string>) => {
  const normalized = normalizeElementSymbol(element);
  return palette[element] ?? palette[normalized] ?? palette[element.toUpperCase()] ?? '#1e293b';
};

const mixHexColors = (colorA: string, colorB: string, ratio = 0.5) => {
  const sanitize = (hex: string) => {
    const clean = hex.replace('#', '');
    if (clean.length === 3) {
      return clean.split('').map((char) => char + char).join('');
    }
    return clean.padStart(6, '0').slice(-6);
  };

  const a = sanitize(colorA);
  const b = sanitize(colorB);
  const ai = parseInt(a, 16);
  const bi = parseInt(b, 16);
  if (Number.isNaN(ai) || Number.isNaN(bi)) {
    return colorA;
  }

  const ar = (ai >> 16) & 255;
  const ag = (ai >> 8) & 255;
  const ab = ai & 255;

  const br = (bi >> 16) & 255;
  const bg = (bi >> 8) & 255;
  const bb = bi & 255;

  const mix = (ac: number, bc: number) => Math.round(ac + (bc - ac) * ratio);

  const r = mix(ar, br);
  const g = mix(ag, bg);
  const bOut = mix(ab, bb);

  return `#${((1 << 24) + (r << 16) + (g << 8) + bOut).toString(16).slice(1)}`;
};

const SCALE_MIN = 0.55;
const SCALE_MAX = 2.4;
const TRANSLATE_LIMIT_FACTOR = 0.42;
const TRANSLATE_EASING = 0.18;

interface ConformerViewerProps {
  smiles: string;
  height?: number;
}

const ConformerViewer = memo(({ smiles, height = 220 }: ConformerViewerProps) => {
  const { tokens, isDark } = useTheme();
  const palette = tokens.node.smilesPalette as Record<string, string>;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const rotationRef = useRef({ x: -0.35, y: 0.5, z: 0 });
  const autoRotateRef = useRef(true);
  const dragStateRef = useRef<{
    active: boolean;
    lastX: number;
    lastY: number;
    timeout: number | null;
    mode: 'idle' | 'rotate' | 'pinch';
  }>({
    active: false,
    lastX: 0,
    lastY: 0,
    timeout: null,
    mode: 'idle',
  });
  const scaleRef = useRef(1);
  const targetScaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const targetTranslateRef = useRef({ x: 0, y: 0 });
  const pointerCacheRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchDistanceRef = useRef<number | null>(null);
  const pinchCenterRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef(0);

  const [structure, setStructure] = useState<ParsedStructure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);

  const resetView = useCallback(() => {
    rotationRef.current = { x: -0.35, y: 0.5, z: 0 };
    targetScaleRef.current = 1;
    scaleRef.current = 1;
    targetTranslateRef.current = { x: 0, y: 0 };
    translateRef.current = { x: 0, y: 0 };
    pinchCenterRef.current = null;
    autoRotateRef.current = true;
  }, []);

  const legendEntries = useMemo(() => {
    if (!structure) {
      return [];
    }

    const unique = new Map<string, string>();
    for (const atom of structure.atoms) {
      const symbol = normalizeElementSymbol(atom.element);
      if (!unique.has(symbol)) {
        unique.set(symbol, getElementColor(atom.element, palette));
      }
    }

    return Array.from(unique.entries())
      .map(([element, color]) => ({ element, color }))
      .sort((a, b) => a.element.localeCompare(b.element));
  }, [structure, palette]);

  useEffect(() => {
    let cancelled = false;

    const prepare = async () => {
      try {
        setError(null);
        const parsed = await loadStructure(smiles);
        if (!cancelled) {
          setStructure(parsed);
          resetView();
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
  }, [smiles, resetView]);

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

      targetScaleRef.current = clamp(targetScaleRef.current, SCALE_MIN, SCALE_MAX);
      scaleRef.current = clamp(
        scaleRef.current + (targetScaleRef.current - scaleRef.current) * 0.12,
        SCALE_MIN,
        SCALE_MAX,
      );

      const maxTranslateX = width * TRANSLATE_LIMIT_FACTOR;
      const maxTranslateY = heightPx * TRANSLATE_LIMIT_FACTOR;

      targetTranslateRef.current.x = clamp(targetTranslateRef.current.x, -maxTranslateX, maxTranslateX);
      targetTranslateRef.current.y = clamp(targetTranslateRef.current.y, -maxTranslateY, maxTranslateY);

      translateRef.current.x += (targetTranslateRef.current.x - translateRef.current.x) * TRANSLATE_EASING;
      translateRef.current.y += (targetTranslateRef.current.y - translateRef.current.y) * TRANSLATE_EASING;

      const projected = projectStructure(
        structure,
        rotationRef.current,
        width,
        heightPx,
        scaleRef.current,
        translateRef.current,
      );
      drawStructure(
        ctx,
        projected.atoms,
        projected.bonds,
        palette,
        isDark ? tokens.node.text : '#0f172a',
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
  }, [structure, height, palette, isDark, tokens]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const previous = canvas.style.touchAction;
    canvas.style.touchAction = 'none';

    return () => {
      canvas.style.touchAction = previous;
    };
  }, []);

  useEffect(() => {
    if (!showInfoSheet) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowInfoSheet(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showInfoSheet]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const state = dragStateRef.current;
    const pointerCache = pointerCacheRef.current;

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

    const resetPinchState = () => {
      pinchDistanceRef.current = null;
      pinchCenterRef.current = null;
    };

    const getPinchState = () => {
      if (pointerCache.size < 2) {
        return null;
      }
      const [first, second] = Array.from(pointerCache.values());
      const distance = Math.hypot(first.x - second.x, first.y - second.y) || 0;
      const center = {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      };
      return { distance, center };
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!canvas) {
        return;
      }

      if (event.pointerType === 'touch') {
        event.preventDefault();
      }

      clearTimeoutSafe();
      autoRotateRef.current = false;
      pointerCache.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (event.pointerType === 'touch' && pointerCache.size === 1) {
        const now = performance.now();
        if (now - lastTapRef.current < 280) {
          resetView();
        }
        lastTapRef.current = now;
      }

      if (pointerCache.size === 1) {
        state.mode = 'rotate';
        state.active = true;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
        pinchCenterRef.current = { x: event.clientX, y: event.clientY };
        try {
          canvas.setPointerCapture(event.pointerId);
        } catch (err) {
          // silently ignore pointer capture issues
        }
      } else if (pointerCache.size === 2) {
        state.mode = 'pinch';
        state.active = false;
        const pinchState = getPinchState();
        if (pinchState) {
          pinchDistanceRef.current = pinchState.distance || null;
          pinchCenterRef.current = pinchState.center;
        }
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerCache.has(event.pointerId)) {
        return;
      }

      pointerCache.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointerCache.size >= 2) {
        const pinchState = getPinchState();
        if (!pinchState) {
          resetPinchState();
          return;
        }

        const { distance, center } = pinchState;

        if (pinchDistanceRef.current && pinchDistanceRef.current > 0 && distance > 0) {
          const scaleDelta = distance / pinchDistanceRef.current;
          targetScaleRef.current = clamp(targetScaleRef.current * scaleDelta, SCALE_MIN, SCALE_MAX);
        }

        if (pinchCenterRef.current) {
          const deltaX = center.x - pinchCenterRef.current.x;
          const deltaY = center.y - pinchCenterRef.current.y;
          const scaleAdjustment = 1 / Math.max(scaleRef.current, 0.001);
          targetTranslateRef.current.x += deltaX * scaleAdjustment;
          targetTranslateRef.current.y += deltaY * scaleAdjustment;
        }

        pinchDistanceRef.current = distance || pinchDistanceRef.current;
        pinchCenterRef.current = center;
        return;
      }

      if (!state.active || state.mode !== 'rotate') {
        return;
      }

      const deltaX = event.clientX - state.lastX;
      const deltaY = event.clientY - state.lastY;
      state.lastX = event.clientX;
      state.lastY = event.clientY;

      rotationRef.current.y += deltaX * 0.01;
      rotationRef.current.x += deltaY * 0.01;
      rotationRef.current.x = clamp(rotationRef.current.x, -Math.PI / 2, Math.PI / 2);
      pinchCenterRef.current = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (pointerCache.has(event.pointerId)) {
        pointerCache.delete(event.pointerId);
      }

      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch (err) {
        // ignore capture release failures
      }

      if (pointerCache.size === 0) {
        state.active = false;
        state.mode = 'idle';
        resetPinchState();
        scheduleAutoRotate();
        return;
      }

      if (pointerCache.size === 1) {
        const [remaining] = Array.from(pointerCache.values());
        state.mode = 'rotate';
        state.active = true;
        state.lastX = remaining.x;
        state.lastY = remaining.y;
        pinchDistanceRef.current = null;
        pinchCenterRef.current = { x: remaining.x, y: remaining.y };
        return;
      }

      const pinchState = getPinchState();
      if (pinchState) {
        pinchDistanceRef.current = pinchState.distance;
        pinchCenterRef.current = pinchState.center;
      }
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      clearTimeoutSafe();
      autoRotateRef.current = false;

      const delta = clamp(event.deltaY, -180, 180);
      const factor = clamp(1 - delta * 0.0025, 0.75, 1.3);
      const nextTarget = clamp(targetScaleRef.current * factor, SCALE_MIN, SCALE_MAX);
      targetScaleRef.current = nextTarget;
      scheduleAutoRotate();
    };

    const handleDoubleClick = () => {
      clearTimeoutSafe();
      resetView();
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('dblclick', handleDoubleClick);

    return () => {
      clearTimeoutSafe();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('dblclick', handleDoubleClick);
      pointerCache.clear();
      pinchDistanceRef.current = null;
      pinchCenterRef.current = null;
    };
  }, [resetView]);

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
        setShowInfoSheet(false);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        setShowInfoSheet(false);
      }
    } catch (err) {
      console.error('Fullscreen request failed', err);
    }
  };

  useEffect(() => {
    const handleChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active) {
        setShowInfoSheet(false);
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

      {isFullscreen && (
        <button
          type="button"
          onClick={() => setShowInfoSheet((prev) => !prev)}
          className="absolute left-3 bottom-3 z-10 rounded-full border border-slate-200/70 bg-white/85 p-2 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-neutral-800/80 dark:bg-neutral-900/70 dark:text-neutral-200 dark:hover:bg-neutral-900"
          aria-pressed={showInfoSheet}
          aria-label={showInfoSheet ? 'Hide viewer info' : 'Show viewer info'}
        >
          <Info className="h-4 w-4" />
        </button>
      )}

      <canvas
        ref={canvasRef}
        style={containerStyle}
        className="w-full rounded-lg bg-white/60 dark:bg-neutral-900/50 border border-slate-200/70 dark:border-neutral-800/80 shadow-sm"
      />

      {legendEntries.length > 0 && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-3 right-3 min-w-[160px] flex-col gap-2 rounded-lg border border-slate-200/70 bg-white/85 px-3 py-2 text-xs shadow-sm backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-900/75 ${isFullscreen ? 'flex' : 'hidden lg:flex'}`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-neutral-400">
            Element Colors
          </span>
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {legendEntries.map(({ element, color }) => (
              <div key={element} className="flex items-center gap-1.5">
                <span
                  className="inline-flex h-2.5 w-2.5 rounded-full shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium text-slate-600 dark:text-neutral-200">
                  {element}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isFullscreen && showInfoSheet && (
        <div
          className="pointer-events-auto absolute inset-0 z-20 flex flex-col justify-end bg-slate-950/35 backdrop-blur-sm dark:bg-black/40"
          onClick={() => setShowInfoSheet(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Conformer viewer controls"
            className="mx-auto w-full max-w-xl rounded-t-3xl border border-slate-200/70 bg-white/95 px-5 pb-6 pt-4 shadow-2xl dark:border-neutral-800/80 dark:bg-neutral-950/95"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-neutral-200">
                Viewer Controls
              </h2>
              <button
                type="button"
                onClick={() => setShowInfoSheet(false)}
                className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                aria-label="Close viewer info"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-600 dark:text-neutral-300">
              <div className="flex items-start gap-2">
                <span className="mt-[0.35rem] inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-500" />
                <p>
                  <span className="font-semibold text-slate-700 dark:text-neutral-100">Rotate:</span> Drag with one finger on touch or click-drag with a mouse/trackpad.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-[0.35rem] inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                <p>
                  <span className="font-semibold text-slate-700 dark:text-neutral-100">Zoom:</span> Pinch with two fingers or scroll the mouse wheel.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-[0.35rem] inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                <p>
                  <span className="font-semibold text-slate-700 dark:text-neutral-100">Pan:</span> Move two fingers together while pinched to nudge the structure in view.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-[0.35rem] inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-fuchsia-500" />
                <p>
                  <span className="font-semibold text-slate-700 dark:text-neutral-100">Reset:</span> Double-tap (touch) or double-click to re-center and restore the default angle.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-[0.35rem] inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-500" />
                <p>
                  <span className="font-semibold text-slate-700 dark:text-neutral-100">Colors:</span> Element colors remain visible in the legend on the lower right.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ConformerViewer.displayName = 'ConformerViewer';

const projectStructure = (
  structure: ParsedStructure,
  rotation: { x: number; y: number; z: number },
  width: number,
  height: number,
  scale: number,
  translate: { x: number; y: number },
) => {
  const projectedAtoms: AtomProjection[] = [];
  const bonds: BondProjection[] = [];

  const baseScale = Math.min(width, height) * 0.42 * scale;
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
      x: width / 2 + x2 * perspective + translate.x,
      y: height / 2 + y2 * perspective + translate.y,
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
      sourceElement: structure.atoms[bond.source]?.element ?? 'C',
      targetElement: structure.atoms[bond.target]?.element ?? 'C',
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
  const sortedBonds = [...bonds].sort((a, b) => a.depth - b.depth);

  for (const bond of sortedBonds) {
    const depthShade = clamp((bond.depth + 1) / 2, 0, 1);
    const sourceColor = getElementColor(bond.sourceElement, palette);
    const targetColor = getElementColor(bond.targetElement, palette);
    const coreColor = mixHexColors(sourceColor, targetColor, 0.5);
    const rodWidth = 5.5 + bond.order * 1.4 + depthShade * 1.1;

    const gradient = ctx.createLinearGradient(bond.ax, bond.ay, bond.bx, bond.by);
    gradient.addColorStop(0, adjustColor(sourceColor, 0.2));
    gradient.addColorStop(0.5, adjustColor(coreColor, depthShade * -0.18));
    gradient.addColorStop(1, adjustColor(targetColor, 0.2));

    const outlineGradient = ctx.createLinearGradient(bond.ax, bond.ay, bond.bx, bond.by);
    outlineGradient.addColorStop(0, adjustColor(sourceColor, -0.45));
    outlineGradient.addColorStop(1, adjustColor(targetColor, -0.45));

    const drawRod = (offsetX: number, offsetY: number, widthFactor: number) => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.globalAlpha = 0.9;
      ctx.lineWidth = rodWidth * widthFactor + 1.4;
      ctx.strokeStyle = outlineGradient;
      ctx.beginPath();
      ctx.moveTo(bond.ax + offsetX, bond.ay + offsetY);
      ctx.lineTo(bond.bx + offsetX, bond.by + offsetY);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.lineWidth = rodWidth * widthFactor;
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(bond.ax + offsetX, bond.ay + offsetY);
      ctx.lineTo(bond.bx + offsetX, bond.by + offsetY);
      ctx.stroke();

      const highlightGradient = ctx.createLinearGradient(
        bond.ax + offsetX,
        bond.ay + offsetY,
        bond.bx + offsetX,
        bond.by + offsetY,
      );
      highlightGradient.addColorStop(0, adjustColor(sourceColor, 0.7));
      highlightGradient.addColorStop(1, adjustColor(targetColor, 0.7));
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = Math.max(rodWidth * widthFactor * 0.32, 1.4);
      ctx.strokeStyle = highlightGradient;
      ctx.beginPath();
      ctx.moveTo(bond.ax + offsetX, bond.ay + offsetY);
      ctx.lineTo(bond.bx + offsetX, bond.by + offsetY);
      ctx.stroke();

      ctx.restore();
    };

    if (bond.order <= 1) {
      drawRod(0, 0, 1);
    } else {
      const dx = bond.bx - bond.ax;
      const dy = bond.by - bond.ay;
      const length = Math.hypot(dx, dy) || 1;
      const offsetMagnitude = Math.min(rodWidth * 0.45, length * 0.28);
      const offsetX = (-dy / length) * offsetMagnitude;
      const offsetY = (dx / length) * offsetMagnitude;

      if (bond.order === 2) {
        drawRod(offsetX, offsetY, 0.78);
        drawRod(-offsetX, -offsetY, 0.78);
      } else {
        drawRod(0, 0, 0.72);
        drawRod(offsetX, offsetY, 0.62);
        drawRod(-offsetX, -offsetY, 0.62);
      }
    }
  }

  const sortedAtoms = [...atoms].sort((a, b) => a.depth - b.depth);

  ctx.font = '600 13px "Inter", "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const atom of sortedAtoms) {
    const capitalized = normalizeElementSymbol(atom.element);
    const baseColor = getElementColor(atom.element, palette);
    const shade = clamp((atom.depth + 1) / 2, 0, 1);
    const radius = 11 + shade * 5;

    ctx.save();
    ctx.shadowColor = adjustColor(baseColor, -0.55);
    ctx.shadowBlur = 6 * (0.6 + shade * 0.4);

    const gradient = ctx.createRadialGradient(
      atom.x - radius * 0.35,
      atom.y - radius * 0.35,
      radius * 0.18,
      atom.x,
      atom.y,
      radius,
    );
    gradient.addColorStop(0, adjustColor(baseColor, 0.75));
    gradient.addColorStop(0.45, adjustColor(baseColor, 0.35));
    gradient.addColorStop(1, adjustColor(baseColor, -0.45));

    ctx.fillStyle = gradient;
    ctx.strokeStyle = adjustColor(baseColor, -0.55);
    ctx.lineWidth = 1.6;

    ctx.beginPath();
    ctx.arc(atom.x, atom.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.restore();

    ctx.fillStyle = shade > 0.55 ? textColorDark : textColorLight;
    ctx.fillText(capitalized, atom.x, atom.y);
  }
};

export default ConformerViewer;
