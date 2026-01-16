'use client';

import React from 'react';
import { AuthProvider, TemaProvider, NotificacoesProvider } from '@/contextos';
import { Toaster } from 'react-hot-toast';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <TemaProvider>
      <AuthProvider>
        <NotificacoesProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-text)',
                border: '1px solid var(--toast-border)',
              },
            }}
          />
        </NotificacoesProvider>
      </AuthProvider>
    </TemaProvider>
  );
}
