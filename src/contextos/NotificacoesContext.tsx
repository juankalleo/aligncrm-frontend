'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface Notificacao {
  id: string;
  tipo: 'tarefa' | 'projeto' | 'agenda' | 'membro';
  titulo: string;
  descricao: string;
  lida: boolean;
  createdAt: string;
  link?: string;
  metadata?: any;
}

interface NotificacoesContextData {
  notificacoes: Notificacao[];
  naoLidas: number;
  marcarComoLida: (id: string) => void;
  marcarTodasComoLidas: () => void;
  adicionarNotificacao: (notificacao: Omit<Notificacao, 'id' | 'lida' | 'createdAt'>) => void;
  removerNotificacao: (id: string) => void;
}

const NotificacoesContext = createContext<NotificacoesContextData>({} as NotificacoesContextData);

export function NotificacoesProvider({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (usuario) {
      const stored = localStorage.getItem(`notificacoes_${usuario.id}`);
      if (stored) {
        try {
          setNotificacoes(JSON.parse(stored));
        } catch (err) {
          console.error('Erro ao carregar notificações:', err);
        }
      }
    }
  }, [usuario]);

  // Save to localStorage whenever notifications change
  useEffect(() => {
    if (usuario && notificacoes.length > 0) {
      localStorage.setItem(`notificacoes_${usuario.id}`, JSON.stringify(notificacoes));
    }
  }, [notificacoes, usuario]);

  // Update favicon when there are unread notifications
  useEffect(() => {
    const unread = notificacoes.filter(n => !n.lida).length;
    if (typeof document === 'undefined') return;

    const prevTitle = document.title;
    const existingLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    const prevHref = existingLink?.href || null;
    let createdLink: HTMLLinkElement | null = null;

    if (unread > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(24, 8, 8, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(unread > 9 ? '9+' : String(unread), 24, 8);

        const dataUrl = canvas.toDataURL();
        if (existingLink) {
          existingLink.href = dataUrl;
        } else {
          createdLink = document.createElement('link');
          createdLink.type = 'image/x-icon';
          createdLink.rel = 'shortcut icon';
          createdLink.href = dataUrl;
          document.head.appendChild(createdLink);
        }
      }

      document.title = `(${unread}) Align CRM`;
    } else {
      document.title = 'Align CRM';
      if (existingLink && prevHref) {
        existingLink.href = prevHref;
      }
    }

    return () => {
      // cleanup: restore previous favicon/title if we created/modified them
      try {
        if (createdLink && createdLink.parentNode) createdLink.parentNode.removeChild(createdLink);
        if (existingLink && prevHref) existingLink.href = prevHref;
        document.title = prevTitle;
      } catch (err) {
        // ignore cleanup errors
      }
    };
  }, [notificacoes]);

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  const marcarComoLida = (id: string) => {
    setNotificacoes(prev =>
      prev.map(n => (n.id === id ? { ...n, lida: true } : n))
    );
  };

  const marcarTodasComoLidas = () => {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  };

  const adicionarNotificacao = (notificacao: Omit<Notificacao, 'id' | 'lida' | 'createdAt'>) => {
    const nova: Notificacao = {
      ...notificacao,
      id: `${Date.now()}_${Math.random()}`,
      lida: false,
      createdAt: new Date().toISOString(),
    };
    
    setNotificacoes(prev => [nova, ...prev].slice(0, 50)); // Keep only last 50
    
    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notificacao.titulo, {
        body: notificacao.descricao,
        icon: '/logo.png',
      });
    }
  };

  const removerNotificacao = (id: string) => {
    setNotificacoes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificacoesContext.Provider
      value={{
        notificacoes,
        naoLidas,
        marcarComoLida,
        marcarTodasComoLidas,
        adicionarNotificacao,
        removerNotificacao,
      }}
    >
      {children}
    </NotificacoesContext.Provider>
  );
}

export function useNotificacoes() {
  const context = useContext(NotificacoesContext);
  if (!context) {
    throw new Error('useNotificacoes must be used within NotificacoesProvider');
  }
  return context;
}
