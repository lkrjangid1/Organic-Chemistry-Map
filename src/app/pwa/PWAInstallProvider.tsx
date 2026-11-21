import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type InstallContextValue = {
  canInstall: boolean;
  hasInstalled: boolean;
  isPromptOpen: boolean;
  openPrompt: () => void;
  closePrompt: (options?: { rememberDismissal?: boolean }) => void;
  requestInstall: () => Promise<void>;
};

const InstallContext = createContext<InstallContextValue | undefined>(undefined);

const DISMISS_KEY = 'organic-chem-map::pwa-dismissed';
const INSTALLED_KEY = 'organic-chem-map::pwa-installed';

const isStandaloneDisplay = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const mediaQuery = window.matchMedia?.('(display-mode: standalone)');
  const navigatorStandalone =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true;

  return Boolean(mediaQuery?.matches || navigatorStandalone);
};

export const PWAInstallProvider = ({ children }: { children: ReactNode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [hasInstalled, setHasInstalled] = useState<boolean>(() => isStandaloneDisplay());

  const canInstall = Boolean(deferredPrompt);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const beforeInstallPromptEvent = event as unknown as BeforeInstallPromptEvent;
      setDeferredPrompt(beforeInstallPromptEvent);

      const dismissed = window.localStorage.getItem(DISMISS_KEY) === 'true';
      const installed =
        window.localStorage.getItem(INSTALLED_KEY) === 'true' || isStandaloneDisplay();

      if (!dismissed && !installed) {
        setIsPromptOpen(true);
      }
    };

    const handleAppInstalled = () => {
      window.localStorage.setItem(INSTALLED_KEY, 'true');
      window.localStorage.removeItem(DISMISS_KEY);
      setHasInstalled(true);
      setIsPromptOpen(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    const mediaQuery = window.matchMedia?.('(display-mode: standalone)');
    const updateStandaloneStatus = () => {
      const standalone = isStandaloneDisplay();
      if (standalone) {
        window.localStorage.setItem(INSTALLED_KEY, 'true');
      }
      setHasInstalled(standalone || window.localStorage.getItem(INSTALLED_KEY) === 'true');
    };

    updateStandaloneStatus();
    if (mediaQuery) {
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', updateStandaloneStatus);
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(updateStandaloneStatus);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery) {
        if (typeof mediaQuery.removeEventListener === 'function') {
          mediaQuery.removeEventListener('change', updateStandaloneStatus);
        } else if (typeof mediaQuery.removeListener === 'function') {
          mediaQuery.removeListener(updateStandaloneStatus);
        }
      }
    };
  }, []);

  const openPrompt = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(DISMISS_KEY);
    }
    setIsPromptOpen(true);
  }, []);

  const closePrompt = useCallback(
    (options?: { rememberDismissal?: boolean }) => {
      const rememberDismissal = options?.rememberDismissal ?? true;

      if (rememberDismissal && typeof window !== 'undefined') {
        window.localStorage.setItem(DISMISS_KEY, 'true');
      }

      setIsPromptOpen(false);
    },
    [],
  );

  const requestInstall = useCallback(async () => {
    if (!deferredPrompt) {
      openPrompt();
      return;
    }

    setIsPromptOpen(false);
    deferredPrompt.prompt();

    try {
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(INSTALLED_KEY, 'true');
          window.localStorage.removeItem(DISMISS_KEY);
        }
        setHasInstalled(true);
      } else if (typeof window !== 'undefined') {
        window.localStorage.setItem(DISMISS_KEY, 'true');
      }
    } finally {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt, openPrompt]);

  const value = useMemo(
    () => ({
      canInstall,
      hasInstalled,
      isPromptOpen,
      openPrompt,
      closePrompt,
      requestInstall,
    }),
    [canInstall, closePrompt, hasInstalled, isPromptOpen, openPrompt, requestInstall],
  );

  return <InstallContext.Provider value={value}>{children}</InstallContext.Provider>;
};

export const usePWAInstall = () => {
  const context = useContext(InstallContext);
  if (!context) {
    throw new Error('usePWAInstall must be used within a PWAInstallProvider');
  }
  return context;
};
