import { Download, X } from 'lucide-react';
import type { CSSProperties } from 'react';
import { usePWAInstall } from '../pwa/PWAInstallProvider';
import { useTheme } from '../theme';

const InstallPromptDialog = () => {
  const { isPromptOpen, closePrompt, requestInstall, canInstall } = usePWAInstall();
  const { tokens } = useTheme();

  if (!isPromptOpen) {
    return null;
  }

  const panelTokens = tokens.panel;
  const hoverSurfaceVars = {
    '--panel-surface-hover': panelTokens.surfaceHover,
  } as CSSProperties;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={() => closePrompt({ rememberDismissal: true })}
      />
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl border shadow-2xl"
        style={{
          background: panelTokens.background,
          borderColor: panelTokens.border,
          boxShadow: panelTokens.shadow,
          color: panelTokens.text,
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: panelTokens.divider }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: panelTokens.surface }}
            >
              <Download className="h-6 w-6" style={{ color: panelTokens.icon }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: panelTokens.heading }}>
                Install Organic Chemistry Map
              </h3>
              <p className="text-sm" style={{ color: panelTokens.textMuted }}>
                Access the map instantly, even when you are offline.
              </p>
            </div>
          </div>
          <button
            onClick={() => closePrompt({ rememberDismissal: true })}
            className="rounded-full p-1.5 transition-colors hover:bg-[var(--panel-surface-hover)]"
            style={{ color: panelTokens.icon, ...hoverSurfaceVars }}
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <ul className="space-y-2 text-sm" style={{ color: panelTokens.textMuted }}>
            <li>• Install once and use without visiting the website.</li>
            <li>• Works offline with cached reactions and pathways.</li>
            <li>• Cleaner fullscreen experience without browser chrome.</li>
          </ul>

          <button
            onClick={requestInstall}
            disabled={!canInstall}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: canInstall ? tokens.actions.primary.background : panelTokens.surface,
              color: canInstall ? tokens.actions.primary.text : panelTokens.textMuted,
              boxShadow: tokens.actions.primary.shadow,
            }}
          >
            {canInstall ? 'Install app' : 'Installation not supported'}
          </button>

          <button
            onClick={() => closePrompt({ rememberDismissal: false })}
            className="w-full rounded-xl px-4 py-2 text-sm transition-colors hover:bg-[var(--panel-surface-hover)]"
            style={{
              color: panelTokens.textMuted,
              ...hoverSurfaceVars,
            }}
          >
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPromptDialog;
