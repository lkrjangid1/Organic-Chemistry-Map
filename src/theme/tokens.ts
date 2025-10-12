export type ThemeName = 'light' | 'dark';

type ThemeTokens = {
  appBackground: string;
  header: {
    background: string;
    border: string;
    text: string;
    subtext: string;
    buttonText: string;
    buttonHoverBg: string;
  };
  flow: {
    background: string;
    backgroundPattern: string;
    edgeStroke: string;
    controlBackground: string;
    controlBorder: string;
    controlShadow: string;
    labelBackground: string;
    infoBackground: string;
    labelText: string;
    labelMuted: string;
    labelReagents: string;
    labelBorder: string;
    labelShadow: string;
    minimapMask: string;
  };
  node: {
    background: string;
    border: string;
    borderSelected: string;
    ring: string;
    text: string;
    smilesBackground: string;
    smilesBorder: string;
    smilesBond: string;
    smilesPalette: {
      C: string;
      O: string;
      N: string;
      S: string;
      P: string;
      F: string;
      Cl: string;
      Br: string;
      I: string;
      H: string;
      B: string;
    };
  };
  panel: {
    background: string;
    border: string;
    shadow: string;
    text: string;
    textMuted: string;
    heading: string;
    divider: string;
    icon: string;
    inputBackground: string;
    inputBorder: string;
    surface: string;
    surfaceHover: string;
    badgeBackground: string;
  };
};

export const themeTokens: Record<ThemeName, ThemeTokens> = {
  light: {
    appBackground: 'bg-slate-50',
    header: {
      background: 'bg-white/90',
      border: 'border-gray-200',
      text: '#111827',
      subtext: 'text-gray-600',
      buttonText: 'text-gray-600',
      buttonHoverBg: 'hover:bg-gray-100 hover:text-gray-900',
    },
    flow: {
      background: '#f8fafc',
      backgroundPattern: '#e2e8f0',
      edgeStroke: '#6366f1',
      controlBackground: 'bg-white/80',
      controlBorder: 'border-gray-200',
      controlShadow: 'shadow-lg',
      labelBackground: 'rgba(255,255,255,0.85)',
      infoBackground: 'rgba(255,255,255)',
      labelText: '#111827',
      labelMuted: '#6b7280',
      labelReagents: '#2563eb',
      labelBorder: 'rgba(148,163,184,0.35)',
      labelShadow: '0 4px 10px rgba(15, 23, 42, 0.12)',
      minimapMask: 'rgba(248,250,252,0.3)',
    },
    node: {
      background: '#ffffff',
      border: '#e2e8f0',
      borderSelected: '#3b82f6',
      ring: 'rgba(191, 219, 254, 0.8)',
      text: '#1f2937',
      smilesBackground: 'transparent',
      smilesBorder: '#e5e7eb',
      smilesBond: '#1f2933',
      smilesPalette: {
        C: '#111827',
        O: '#dc2626',
        N: '#2563eb',
        S: '#f59e0b',
        P: '#d97706',
        F: '#059669',
        Cl: '#059669',
        Br: '#a855f7',
        I: '#7c3aed',
        H: '#4b5563',
        B: '#d97706',
      },
    },
    panel: {
      background: 'rgba(255, 255, 255, 0.92)',
      border: 'rgba(226, 232, 240, 0.85)',
      shadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
      text: '#1f2937',
      textMuted: '#64748b',
      heading: '#0f172a',
      divider: 'rgba(226, 232, 240, 0.7)',
      icon: '#475569',
      inputBackground: 'rgba(255, 255, 255, 0.96)',
      inputBorder: 'rgba(203, 213, 225, 0.85)',
      surface: 'rgba(248, 250, 252, 0.94)',
      surfaceHover: 'rgba(191, 219, 254, 0.45)',
      badgeBackground: 'rgba(37, 99, 235, 0.1)',
    },
  },
  dark: {
    appBackground: 'bg-neutral-950',
    header: {
      background: 'bg-neutral-950/90',
      border: 'border-neutral-800',
      text: 'text-neutral-100',
      subtext: 'text-neutral-400',
      buttonText: 'text-neutral-300',
      buttonHoverBg: 'hover:bg-neutral-800 hover:text-neutral-100',
    },
    flow: {
      background: '#09090b',
      backgroundPattern: '#27272a',
      edgeStroke: '#f97316',
      controlBackground: 'bg-neutral-900/80',
      controlBorder: 'border-neutral-800',
      controlShadow: 'shadow-lg',
      labelBackground: 'rgba(17,17,17,0.9)',
      infoBackground: 'rgba(17,17,17)',
      labelText: '#f4f4f5',
      labelMuted: '#a1a1aa',
      labelReagents: '#f97316',
      labelBorder: 'rgba(63,63,70,0.8)',
      labelShadow: '0 8px 20px rgba(0, 0, 0, 0.7)',
      minimapMask: 'rgba(9,9,11,0.35)',
    },
    node: {
      background: '#111113',
      border: '#27272a',
      borderSelected: '#f97316',
      ring: 'rgba(250, 204, 21, 0.35)',
      text: '#f4f4f5',
      smilesBackground: 'transparent',
      smilesBorder: '#27272a',
      smilesBond: '#f4f4f5',
      smilesPalette: {
        C: '#f4f4f5',
        O: '#f87171',
        N: '#60a5fa',
        S: '#facc15',
        P: '#fbbf24',
        F: '#86efac',
        Cl: '#86efac',
        Br: '#f472b6',
        I: '#c4b5fd',
        H: '#a1a1aa',
        B: '#fbbf24',
      },
    },
    panel: {
      background: 'rgba(17, 17, 19, 0.88)',
      border: 'rgba(63, 63, 70, 0.75)',
      shadow: '0 18px 40px rgba(0, 0, 0, 0.45)',
      text: '#e4e4e7',
      textMuted: '#a1a1aa',
      heading: '#f4f4f5',
      divider: 'rgba(63, 63, 70, 0.7)',
      icon: '#d4d4d8',
      inputBackground: 'rgba(24, 24, 27, 0.88)',
      inputBorder: 'rgba(63, 63, 70, 0.8)',
      surface: 'rgba(39, 39, 42, 0.78)',
      surfaceHover: 'rgba(250, 204, 21, 0.22)',
      badgeBackground: 'rgba(249, 115, 22, 0.15)',
    },
  },
};

export const DEFAULT_THEME: ThemeName = 'light';
