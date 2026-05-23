import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import './styles/globals.css';
import App from './App.tsx';
import { queryClient } from '@/lib/queryClient';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
            padding: '10px 14px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          },
          success: { iconTheme: { primary: '#15803d', secondary: '#fff' } },
          error: { duration: 6000, iconTheme: { primary: '#dc2626', secondary: '#fff' } },
        }}
      />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>,
);
