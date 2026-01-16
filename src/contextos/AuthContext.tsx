'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Usuario, LoginCredenciais, RegistroCredenciais } from '@/tipos';
import { authServico } from '@/servicos';
import { getAuthToken } from '@/servicos/api';

interface AuthContextType {
  usuario: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credenciais: LoginCredenciais) => Promise<void>;
  registrar: (dados: RegistroCredenciais) => Promise<void>;
  logout: () => Promise<void>;
  atualizarPerfil: (dados: Partial<Usuario>) => Promise<void>;
  verificarAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const verificarAuth = useCallback(async () => {
    const token = getAuthToken();
    
    if (!token) {
      setUsuario(null);
      setIsLoading(false);
      return;
    }

    try {
      const usuarioAtual = await authServico.verificarSessao();
      setUsuario(usuarioAtual);
    } catch {
      setUsuario(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verificarAuth();
  }, [verificarAuth]);

  const login = async (credenciais: LoginCredenciais) => {
    setIsLoading(true);
    try {
      const response = await authServico.login(credenciais);
      setUsuario(response.usuario);
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const registrar = async (dados: RegistroCredenciais) => {
    setIsLoading(true);
    try {
      const response = await authServico.registrar(dados);
      setUsuario(response.usuario);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authServico.logout();
    } finally {
      setUsuario(null);
    }
  };

  const atualizarPerfil = async (dados: Partial<Usuario>) => {
    const usuarioAtualizado = await authServico.atualizarPerfil(dados);
    setUsuario(usuarioAtualizado);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isLoading,
        isAuthenticated: !!usuario,
        login,
        registrar,
        logout,
        atualizarPerfil,
        verificarAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}

export default AuthContext;
