'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils';
import { useTema } from '@/contextos';
import useProjetoStore from '@/contextos/ProjetoStore'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  History,
  CreditCard,
  GitBranch,
  Calendar,
  FileText,
  Link2,
  Globe,
  Server,
  Settings,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  onHoverChange?: (hovered: boolean) => void;
}

interface NavItem {
  nome: string;
  href: string;
  icone: React.ReactNode;
  badge?: number;
}

const navPrincipal: NavItem[] = [
  { nome: 'Dashboard', href: '/dashboard', icone: <LayoutDashboard size={22} /> },
  { nome: 'Projetos', href: '/projetos', icone: <FolderKanban size={22} /> },
  { nome: 'Tarefas', href: '/tarefas', icone: <CheckSquare size={22} /> },
  { nome: 'Usuários', href: '/usuarios', icone: <Users size={22} /> },
  { nome: 'Financeiro', href: '/financeiro', icone: <CreditCard size={22} /> },
];

const navSecundaria: NavItem[] = [
  { nome: 'Histórico', href: '/historico', icone: <History size={22} /> },
  { nome: 'Fluxogramas', href: '/fluxogramas', icone: <GitBranch size={22} /> },
  { nome: 'Agenda', href: '/agenda', icone: <Calendar size={22} /> },
];

const navRecursos: NavItem[] = [
  { nome: 'Arquivos', href: '/arquivos', icone: <FileText size={22} /> },
  { nome: 'Links', href: '/links', icone: <Link2 size={22} /> },
  { nome: 'Domínios', href: '/dominios', icone: <Globe size={22} /> },
  { nome: 'VPS e Senhas', href: '/vps', icone: <Server size={22} /> },
];

export function Sidebar({ collapsed = false, onToggle, onHoverChange }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarEstilo, isDark, toggleTema } = useTema();
  const projetoAtual = useProjetoStore(state => state.projetoAtual)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  
  // Only access localStorage after component mounts on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWorkspaceId(localStorage.getItem('workspaceId'))
    }
  }, [])
  
  const prefix = workspaceId ? `/${workspaceId}` : (projetoAtual ? `/${projetoAtual.id}` : '')

  const getSidebarClasses = () => {
    const baseClasses = 'fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 group overflow-hidden';
    const widthClasses = collapsed ? 'w-16 hover:w-56' : 'w-56';
    
    switch (sidebarEstilo) {
      case 'glass':
        // Use a lighter glass style in light mode and darker glass in dark mode
        return cn(
          baseClasses,
          widthClasses,
          (isDark ? 'glass' : 'glass-light') + ' border-r-0'
        );
      case 'minimal':
        return cn(
          baseClasses,
          widthClasses,
          'bg-transparent border-r border-light-border dark:border-dark-border'
        );
      default:
        return cn(
          baseClasses,
          widthClasses,
          'bg-light-card dark:bg-dark-card border-r border-light-border dark:border-dark-border'
        );
    }
  };
  // Routes that should not be prefixed with workspace/project id
  // Keep empty so all app routes (including '/dominios') are prefixed
  const globalRoutes: string[] = [];

  const isActive = (href: string) => {
    const full = globalRoutes.includes(href) ? href : prefix + href;
    return pathname === full || pathname.startsWith(`${full}/`) || pathname === href || pathname.startsWith(href + '/');
  };

  const renderNavItem = (item: NavItem) => {
    const paddingClasses = collapsed
      ? 'justify-center px-2 group-hover:justify-start group-hover:pl-4 group-hover:pr-3'
      : 'justify-start pl-4 pr-3';
    const fullHref = globalRoutes.includes(item.href) ? item.href : prefix + item.href;

    return (
      <Link
        key={item.href}
        href={fullHref}
        className={cn(
          'flex items-center gap-2 py-2 rounded-lg transition-all duration-200 w-full h-9',
          'text-light-muted dark:text-dark-muted',
          'hover:bg-light-hover dark:hover:bg-dark-hover',
          'hover:text-light-text dark:hover:text-dark-text',
          isActive(item.href) && 'bg-align-600/30 text-white dark:bg-align-500/30 dark:text-white font-semibold hover:bg-align-600/40',
          paddingClasses
        )}
        title={collapsed ? item.nome : undefined}
      >
        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center transform-none">{item.icone}</span>
        <span className={cn('font-medium text-sm truncate transition-all duration-200 transform', collapsed ? 'hidden group-hover:inline-block group-hover:opacity-100 group-hover:translate-x-0' : 'opacity-100 translate-x-0')}>
          {item.nome}
        </span>
        {item.badge !== undefined && item.badge > 0 && (
          <span className={cn(collapsed ? 'hidden group-hover:inline-flex ml-auto' : 'ml-auto', 'bg-align-500 text-white text-xs px-2 py-0.5 rounded-full transition-all duration-200 transform', collapsed ? 'group-hover:opacity-100 group-hover:scale-100' : 'opacity-100 scale-100')}>
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const renderNavSection = (_title: string, items: NavItem[]) => (
    <div className="space-y-1">
      {items.map(renderNavItem)}
    </div>
  );

  return (
    <aside
      className={getSidebarClasses()}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4',
        collapsed && 'justify-center px-2'
      )}>
        <Link href={prefix + '/dashboard'} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-align-500 to-align-700 rounded-lg flex items-center justify-center shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M3 20 L12 4 L21 20 H16 L12 12 L8 20 H3 Z" fill="white" opacity="0.98" />
              <path d="M11 16 L13 16 L12 13 L11 16 Z" fill="#ffffff" opacity="0.06" />
            </svg>
          </div>
          <span className={cn('font-bold text-xl tracking-tight text-gray-900 dark:text-white', collapsed ? 'hidden group-hover:block' : '')}>Align</span>
        </Link>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-2">
        {renderNavSection('Principal', navPrincipal)}
        {renderNavSection('Ferramentas', navSecundaria)}
        {renderNavSection('Recursos', navRecursos)}
      </nav>

      {/* Rodapé removido */}
    </aside>
  );
}

export default Sidebar;
