'use client';

import React, { useState, useRef } from 'react';
import { cn } from '@/utils';
import { useAuth } from '@/contextos';
import { useNotificacoes } from '@/contextos';
import { gerarIniciais, stringParaCor } from '@/utils';
import {
  Search,
  Bell,
  Plus,
  Menu,
  LogOut,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useClickOutside } from '@/hooks';
import { workspaceServico } from '@/servicos/workspaceServico';

interface HeaderProps {
  titulo?: string;
  subtitulo?: string;
  onMenuClick?: () => void;
  acoes?: React.ReactNode;
  sidebarCollapsed?: boolean;
  sidebarHoverExpanded?: boolean;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
}

export function Header({ titulo, subtitulo, onMenuClick, acoes, sidebarCollapsed = false, sidebarHoverExpanded = false, searchValue, onSearchChange }: HeaderProps) {
  const { usuario, logout } = useAuth();
  const { notificacoes, naoLidas, marcarComoLida, marcarTodasComoLidas } = useNotificacoes();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  useClickOutside(menuRef, () => setMenuOpen(false));
  useClickOutside(notifRef, () => setNotifOpen(false));

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Load workspace name from localStorage (if selected)
  React.useEffect(() => {
    const load = async () => {
      try {
        const wid = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null;
        if (wid) {
          const w = await workspaceServico.buscarPorId(wid);
          setWorkspaceName(w?.nome || null);
        } else {
          setWorkspaceName(null);
        }
      } catch (err) {
        setWorkspaceName(null);
      }
    };

    // reload whenever pathname or menuOpen changes so SPA navigation updates workspace name
    load();
  }, [pathname, menuOpen]);

  return (
    <header
      className={cn(
        'fixed right-0 top-0 h-16 z-40 border-b transition-colors duration-200',
        // offset from left to avoid overlaying sidebar on large screens
        sidebarCollapsed ? (sidebarHoverExpanded ? 'lg:left-56' : 'lg:left-16') : 'lg:left-56',
        scrolled
          ? 'bg-white/60 dark:bg-black/60 border-light-border dark:border-dark-border backdrop-blur-sm'
          : 'bg-transparent border-transparent'
      )}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Lado Esquerdo */}
        <div className="flex items-center gap-4">
          {/* Botão Menu Mobile */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover"
          >
            <Menu size={20} />
          </button>

          {/* Título da Página */}
          <div>
            {titulo && (
              <h1 className="text-xl font-semibold text-light-text dark:text-dark-text">
                {titulo}
              </h1>
            )}
            {subtitulo && (
              <p className="text-sm text-light-muted dark:text-dark-muted">
                {subtitulo}
              </p>
            )}
          </div>
        </div>

        {/* Lado Direito */}
        <div className="flex items-center gap-3">
            {/* Busca compacta: ícone que expande para a esquerda ao passar o mouse/focar */}
            <div className="hidden md:flex items-center">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchValue ?? ''}
                  onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                  className={cn(
                    'absolute top-1/2 -translate-y-1/2 right-10',
                    'w-0 group-hover:w-64 group-focus-within:w-64',
                    'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
                    'pl-4 pr-4 py-2 rounded-lg text-sm',
                    'bg-light-card dark:bg-dark-card',
                    'border border-light-border dark:border-dark-border',
                    'text-light-text dark:text-dark-text',
                    'placeholder:text-light-muted dark:placeholder:text-dark-muted',
                    'focus:outline-none focus:ring-2 focus:ring-align-500 focus:border-transparent',
                    'transition-all duration-200 ease-out',
                    'z-40'
                  )}
                />

                <button
                  aria-label="Buscar"
                  className="p-2 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover absolute right-0 top-1/2 -translate-y-1/2"
                >
                  <Search size={18} className="text-light-muted dark:text-dark-muted" />
                </button>
              </div>
            </div>

          {/* Ações Customizadas */}
          {acoes}

          {/* Botão Criar removido por não ter uso */}

          {/* Notificações */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setNotifOpen(v => !v)}
              className="relative p-2 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover"
            >
              <Bell size={20} className="text-light-muted dark:text-dark-muted" />
              {naoLidas > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {naoLidas > 9 ? '9+' : naoLidas}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-[500px] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
                  {naoLidas > 0 && (
                    <button
                      onClick={marcarTodasComoLidas}
                      className="text-xs text-align-600 hover:text-align-700 font-medium"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>

                <div className="overflow-y-auto flex-1">
                  {notificacoes.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma notificação</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {notificacoes.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            marcarComoLida(notif.id)
                            if (notif.link) {
                              router.push(notif.link)
                              setNotifOpen(false)
                            }
                          }}
                          className={cn(
                            'p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors',
                            !notif.lida && 'bg-blue-50 dark:bg-blue-900/10'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                              !notif.lida ? 'bg-blue-500' : 'bg-transparent'
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notif.titulo}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {notif.descricao}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                {new Date(notif.createdAt).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Avatar do Usuário */}
          {usuario && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover"
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: stringParaCor(usuario.nome) }}
                >
                  {usuario.avatar ? (
                    <img
                      src={usuario.avatar}
                      alt={usuario.nome}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    gerarIniciais(usuario.nome)
                  )}
                </div>
                <span className="hidden md:block text-sm font-medium text-light-text dark:text-dark-text">
                  {usuario.nome.split(' ')[0]}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 py-1">
                  {workspaceName && (
                    <div className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                      Workspace: {workspaceName}
                    </div>
                  )}
                  <Link href="/configuracoes" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Settings size={16} />
                    <span>Configurações</span>
                  </Link>
                  <button
                    onClick={async () => { await logout(); router.push('/login') }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <LogOut size={16} />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
