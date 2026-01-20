'use client';

import React, { useState } from 'react';
import { cn } from '@/utils';
import { Sidebar, Header } from '@/components/navegacao';
import { useAgendaNotifications } from '@/hooks';

interface MainLayoutProps {
  children: React.ReactNode;
  titulo?: string;
  subtitulo?: string;
  acoes?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  showDashboardLogo?: boolean;
}

export function MainLayout({ children, titulo, subtitulo, acoes, searchValue, onSearchChange, showDashboardLogo }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [sidebarHoverExpanded, setSidebarHoverExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Enable agenda notifications
  useAgendaNotifications();

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex relative">
      {/* decorative background sheen that repeats every 10s */}
      <div className="global-sheen pointer-events-none" aria-hidden="true" />
      {showDashboardLogo && (
        <div className="dashboard-bg-logo pointer-events-none" aria-hidden="true">
          <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              <linearGradient id="gA_main" x1="0" x2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.14" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
              </linearGradient>
            </defs>
            <g transform="translate(10,12) scale(0.92)" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M40 70 L60 14 L80 70" />
              <path d="M32 70 L48 70" />
              <path d="M72 70 L88 70" />
            </g>
          </svg>
        </div>
      )}
      <style jsx global>{` 
        .global-sheen {
          position: absolute;
          inset: 0;
          z-index: -2;
          pointer-events: none;
          background: linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.00) 40%, rgba(255,255,255,0.03) 49%, rgba(255,255,255,0.04) 51%, rgba(255,255,255,0.00) 60%, rgba(255,255,255,0.00) 100%);
          transform: translateZ(0);
          opacity: 0;
          mix-blend-mode: overlay;
          filter: blur(14px) saturate(120%);
          animation: backgroundSheen 10s linear infinite;
        }

        .dashboard-bg-logo {
          position: absolute;
          left: 50%;
          top: 40px;
          transform: translateX(-50%);
          width: min(48vw, 520px);
          height: auto;
          max-width: 520px;
          opacity: 0.12;
          z-index: 0;
          pointer-events: none;
          color: rgba(0,0,0,0.12);
        }

        .dark .dashboard-bg-logo { color: rgba(255,255,255,0.12); opacity: 0.12; }

        @media (max-width: 768px) {
          .dashboard-bg-logo { width: min(70vw, 380px); top: 24px; opacity: 0.05; }
        }

        @keyframes backgroundSheen {
          0% { opacity: 0; transform: translateX(-40%) scaleX(0.6); }
          8% { opacity: 0.0; }
          10% { opacity: 0.18; transform: translateX(10%) scaleX(1); }
          18% { opacity: 0.0; }
          100% { opacity: 0; transform: translateX(120%) scaleX(1.1); }
        }
      `}</style>
      {/* Sidebar Desktop */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onHoverChange={(v) => setSidebarHoverExpanded(v)}
        />
      </div>

      {/* Sidebar Mobile */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 z-40 lg:hidden">
            <Sidebar onToggle={() => setMobileMenuOpen(false)} />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className={cn('flex-1 transition-all duration-300 lg:pl-16 flex flex-col relative z-10')}> 
        <Header
          titulo={titulo}
          subtitulo={subtitulo}
          onMenuClick={() => setMobileMenuOpen(true)}
          acoes={acoes}
          sidebarCollapsed={sidebarCollapsed}
          sidebarHoverExpanded={sidebarHoverExpanded}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
        />

        <main className="pt-16 p-6 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;

/* global styles for background sheen */
export const __MAINLAYOUT_STYLES = `
.global-sheen {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.00) 40%, rgba(255,255,255,0.03) 49%, rgba(255,255,255,0.04) 51%, rgba(255,255,255,0.00) 60%, rgba(255,255,255,0.00) 100%);
  transform: translateZ(0);
  opacity: 0;
  mix-blend-mode: overlay;
  filter: blur(14px) saturate(120%);
  animation: backgroundSheen 10s linear infinite;
}

@keyframes backgroundSheen {
  0% { opacity: 0; transform: translateX(-40%) scaleX(0.6); }
  8% { opacity: 0.0; }
  10% { opacity: 0.18; transform: translateX(10%) scaleX(1); }
  18% { opacity: 0.0; }
  100% { opacity: 0; transform: translateX(120%) scaleX(1.1); }
}
`;
