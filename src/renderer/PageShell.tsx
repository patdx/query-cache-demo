import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../shared/idb-cache';
import type { PageContext } from './types';
import { PageContextProvider } from './usePageContext';
import 'tailwindcss/tailwind.css';

export { PageShell };

function PageShell({
  children,
  pageContext,
}: {
  children: React.ReactNode;
  pageContext: PageContext;
}) {
  return (
    <React.StrictMode>
      <PageContextProvider pageContext={pageContext}>
        <QueryClientProvider client={queryClient}>
          <Layout>{children}</Layout>
        </QueryClientProvider>
      </PageContextProvider>
    </React.StrictMode>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
