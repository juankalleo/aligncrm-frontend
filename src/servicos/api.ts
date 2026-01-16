import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// Configuração base do cliente API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Criar instância do Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor de Request - Adiciona token JWT
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('align_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Interceptor de Response - Tratamento de erros
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    
    // Token expirado ou inválido
    if (status === 401) {
      Cookies.remove('align_token');
      
      // Redirecionar para login se não estiver na página de login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Erro de permissão
    if (status === 403) {
      console.error('Acesso negado: Você não tem permissão para esta ação');
    }
    
    // Erro interno do servidor
    if (status && status >= 500) {
      console.error('Erro no servidor. Tente novamente mais tarde.');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

// Funções utilitárias para requisições
export const setAuthToken = (token: string) => {
  Cookies.set('align_token', token, { 
    expires: 7, // 7 dias
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
};

export const removeAuthToken = () => {
  Cookies.remove('align_token');
};

export const getAuthToken = (): string | undefined => {
  return Cookies.get('align_token');
};
