import type { Metadata } from 'next';
import '@/estilos/globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Align',
  description: 'CRM corporativo premium inspirado no Linear para gestão de projetos, tarefas e equipes.',
  keywords: ['CRM', 'gestão de projetos', 'tarefas', 'Linear', 'produtividade'],
  authors: [{ name: 'Align Team' }],
  // viewport and themeColor moved to `generateViewport` to satisfy Next.js routing warnings
};

export function generateViewport() {
  return {
    viewport: 'width=device-width, initial-scale=1',
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: '#ffffff' },
      { media: '(prefers-color-scheme: dark)', color: '#0d0d0f' },
    ],
  }
}

// favicon / icons
metadata.icons = {
  icon: '/favicon.svg',
  shortcut: '/favicon.svg',
  apple: '/favicon.svg',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
