import { createContext, useContext, type ReactNode } from 'react';

/** A link from the map to a page of the site: title and site-relative href. */
export interface PageLink {
  t: string;
  h: string;
}

/** Built at site build time (src/lib/maplinks.ts) and passed to the map as a prop. */
export interface MapLinks {
  /** Map edge id → the reaction or test pages that cover it. */
  edges: Record<string, PageLink[]>;
  /** Map node id → its compound page. */
  compounds: Record<string, PageLink>;
}

const empty: MapLinks = { edges: {}, compounds: {} };
const PageLinksContext = createContext<MapLinks>(empty);

export function PageLinksProvider({ links, children }: { links?: MapLinks; children: ReactNode }) {
  return <PageLinksContext.Provider value={links ?? empty}>{children}</PageLinksContext.Provider>;
}

export const usePageLinks = () => useContext(PageLinksContext);
