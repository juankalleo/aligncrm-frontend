'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UsuarioPreferencias } from '@/tipos';

export type Tema = 'claro' | 'escuro' | 'sistema';
export type SidebarEstilo = 'padrao' | 'glass' | 'minimal';

interface TemaContextType {
  tema: Tema;
  sidebarEstilo: SidebarEstilo;
  isDark: boolean;
  setTema: (tema: Tema) => void;
  setSidebarEstilo: (estilo: SidebarEstilo) => void;
  toggleTema: () => void;
}

const TemaContext = createContext<TemaContextType | undefined>(undefined);

const STORAGE_KEY_TEMA = 'align_tema';
const STORAGE_KEY_SIDEBAR = 'align_sidebar_estilo';

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTemaState] = useState<Tema>('sistema');
  const [sidebarEstilo, setSidebarEstiloState] = useState<SidebarEstilo>('padrao');
  const [isDark, setIsDark] = useState(false);

  // Detectar preferência do sistema
  const getSystemPreference = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  // Aplicar tema ao documento
  const applyTheme = useCallback((dark: boolean) => {
    if (typeof document === 'undefined') return;
    
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setIsDark(dark);
  }, []);

  // Calcular e aplicar tema
  const updateTheme = useCallback((selectedTema: Tema) => {
    let shouldBeDark = false;
    
    switch (selectedTema) {
      case 'escuro':
        shouldBeDark = true;
        break;
      case 'claro':
        shouldBeDark = false;
        break;
      case 'sistema':
      default:
        shouldBeDark = getSystemPreference();
    }
    
    applyTheme(shouldBeDark);
  }, [getSystemPreference, applyTheme]);

  // Carregar preferências salvas
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const temaSalvo = localStorage.getItem(STORAGE_KEY_TEMA) as Tema | null;
    const sidebarSalva = localStorage.getItem(STORAGE_KEY_SIDEBAR) as SidebarEstilo | null;

    if (temaSalvo) {
      setTemaState(temaSalvo);
      updateTheme(temaSalvo);
    } else {
      updateTheme('sistema');
    }

    if (sidebarSalva) {
      setSidebarEstiloState(sidebarSalva);
    }
  }, [updateTheme]);

  // Listener para mudanças no tema do sistema
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (tema === 'sistema') {
        updateTheme('sistema');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [tema, updateTheme]);

  const setTema = (novoTema: Tema) => {
    setTemaState(novoTema);
    localStorage.setItem(STORAGE_KEY_TEMA, novoTema);
    updateTheme(novoTema);
  };

  const setSidebarEstilo = (estilo: SidebarEstilo) => {
    setSidebarEstiloState(estilo);
    localStorage.setItem(STORAGE_KEY_SIDEBAR, estilo);
  };

  const toggleTema = () => {
    const novoTema = isDark ? 'claro' : 'escuro';
    setTema(novoTema);
  };

  return (
    <TemaContext.Provider
      value={{
        tema,
        sidebarEstilo,
        isDark,
        setTema,
        setSidebarEstilo,
        toggleTema,
      }}
    >
      {children}
    </TemaContext.Provider>
  );
}

export function useTema() {
  const context = useContext(TemaContext);
  
  if (context === undefined) {
    throw new Error('useTema deve ser usado dentro de um TemaProvider');
  }
  
  return context;
}

export default TemaContext;
