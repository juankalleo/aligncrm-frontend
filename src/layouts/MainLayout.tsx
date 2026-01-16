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
}

export function MainLayout({ children, titulo, subtitulo, acoes, searchValue, onSearchChange }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [sidebarHoverExpanded, setSidebarHoverExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Enable agenda notifications
  useAgendaNotifications();

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex">
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
      <div className={cn('flex-1 transition-all duration-300 lg:pl-16 flex flex-col')}> 
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
