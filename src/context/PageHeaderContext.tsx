import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface PageHeaderContent {
  eyebrow: string;
  title: string;
  sub?: string;
}

const DEFAULT_HEADER: PageHeaderContent = {
  eyebrow: 'Back-office',
  title: 'B&C Teranga',
  sub: '',
};

interface PageHeaderContextValue {
  header: PageHeaderContent;
  setHeader: (content: PageHeaderContent) => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<PageHeaderContent>(DEFAULT_HEADER);
  const value = useMemo(() => ({ header, setHeader }), [header]);
  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

/**
 * Permet à une page de renseigner le bandeau supérieur partagé
 * (eyebrow / titre / sous-titre) affiché par <Header />.
 *
 * Usage dans une page :
 *   usePageHeader({ eyebrow: 'Pilotage', title: 'Tableau de bord', sub: '...' });
 */
export function usePageHeader(content: PageHeaderContent) {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) throw new Error('usePageHeader must be used within PageHeaderProvider');
  const { setHeader } = ctx;
  // Stringify pour éviter une boucle infinie si l'appelant passe un objet inline recréé à chaque render
  const key = `${content.eyebrow}|${content.title}|${content.sub ?? ''}`;
  useEffect(() => {
    setHeader(content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

export function usePageHeaderValue() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) throw new Error('usePageHeaderValue must be used within PageHeaderProvider');
  return ctx.header;
}
