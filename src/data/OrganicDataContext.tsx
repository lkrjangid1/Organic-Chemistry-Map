import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface OrganicNodeInfo {
  formula: string;
  iupac: string;
  notes?: string;
  properties?: string;
}

export interface OrganicNode {
  id: string;
  label: string;
  smiles: string;
  type?: string;
  info: OrganicNodeInfo;
  position: {
    x: number;
    y: number;
  };
}

export interface OrganicReactionInfo {
  reagents?: string;
  conditions?: string;
  mechanism?: string;
  equation?: string;
}

export interface OrganicEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type?: string;
  reactionInfo: OrganicReactionInfo;
}

export interface OrganicData {
  nodes: OrganicNode[];
  edges: OrganicEdge[];
}

export type OrganicDataSource = 'remote' | 'local';

export interface OrganicDataContextValue {
  data: OrganicData | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
  loadLocalData: (data: OrganicData) => void;
  source: OrganicDataSource;
}

export const ORGANIC_DATA_URL =
  'https://raw.githubusercontent.com/lkrjangid1/Organic-Chemistry-Map/main/src/data/jee_organic.json';

const OrganicDataContext = createContext<OrganicDataContextValue | undefined>(undefined);

export const OrganicDataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<OrganicData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);
  const [source, setSource] = useState<OrganicDataSource>('remote');

  useEffect(() => {
    if (source !== 'remote') {
      return;
    }

    let isSubscribed = true;
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(ORGANIC_DATA_URL, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Organic data request failed with status ${response.status}`);
        }

        const json = (await response.json()) as OrganicData;

        if (isSubscribed) {
          setData(json);
        }
      } catch (cause) {
        if (controller.signal.aborted) {
          return;
        }

        if (isSubscribed) {
          const error =
            cause instanceof Error
              ? cause
              : new Error('Unknown error while loading organic data');
          setError(error);
          setData(null);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      isSubscribed = false;
      controller.abort();
    };
  }, [source, version]);

  const loadLocalData = useCallback((nextData: OrganicData) => {
    setSource('local');
    setData(nextData);
    setError(null);
    setLoading(false);
  }, []);

  const reload = useCallback(() => {
    setSource('remote');
    setVersion((current) => current + 1);
  }, []);

  const value = useMemo<OrganicDataContextValue>(
    () => ({
      data,
      loading,
      error,
      reload,
      loadLocalData,
      source,
    }),
    [data, error, loadLocalData, loading, reload, source],
  );

  return (
    <OrganicDataContext.Provider value={value}>{children}</OrganicDataContext.Provider>
  );
};

export const useOrganicData = () => {
  const context = useContext(OrganicDataContext);
  if (!context) {
    throw new Error('useOrganicData must be used within an OrganicDataProvider');
  }
  return context;
};
