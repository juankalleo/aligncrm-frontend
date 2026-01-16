import apiClient, { setAuthToken, removeAuthToken } from './api';
import { LoginCredenciais, RegistroCredenciais, AuthResponse, Usuario, ApiResponse } from '@/tipos';

export class ServerError extends Error {
  status?: number;
  errors?: string[];
  constructor(message: string, status?: number, errors?: string[]) {
    super(message);
    this.name = 'ServerError';
    this.status = status;
    this.errors = errors;
  }
}

// Serviço de Autenticação
export const authServico = {
  // Login
  async login(credenciais: LoginCredenciais): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credenciais);
    
    if (response.data.sucesso && response.data.dados) {
      setAuthToken(response.data.dados.token);
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao fazer login');
  },
  
  // Registro
  async registrar(dados: RegistroCredenciais): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', dados);

      if (response.data.sucesso && response.data.dados) {
        setAuthToken(response.data.dados.token);
        return response.data.dados;
      }

      const msg = response.data.mensagem || (response.data.erros ? response.data.erros.join('; ') : 'Erro ao criar conta');
      throw new ServerError(msg, undefined, response.data.erros);
    } catch (err: any) {
      // axios error -> extract server body
      if (err?.response?.data) {
        const body = err.response.data;
        const msg = body.mensagem || (body.erros ? body.erros.join('; ') : 'Erro ao criar conta');
        throw new ServerError(msg, err.response.status, body.erros);
      }
      throw err;
    }
  },
  
  // Logout
  async logout(): Promise<void> {
    try {
      await apiClient.delete('/auth/logout');
    } finally {
      removeAuthToken();
    }
  },
  
  // Verificar sessão atual
  async verificarSessao(): Promise<Usuario> {
    const response = await apiClient.get<ApiResponse<Usuario>>('/auth/me');
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error('Sessão inválida');
  },
  
  // Atualizar perfil
  async atualizarPerfil(dados: Partial<Usuario>): Promise<Usuario> {
    const response = await apiClient.patch<ApiResponse<Usuario>>('/auth/profile', dados);
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao atualizar perfil');
  },
  
  // Alterar senha
  async alterarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
    const response = await apiClient.patch<ApiResponse<void>>('/auth/password', {
      senhaAtual,
      novaSenha,
    });
    
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagem || 'Erro ao alterar senha');
    }
  },
  
  // Solicitar recuperação de senha
  async recuperarSenha(email: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>('/auth/forgot-password', { email });
    
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagem || 'Erro ao solicitar recuperação');
    }
  },
  
  // Resetar senha com token
  async resetarSenha(token: string, novaSenha: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>('/auth/reset-password', {
      token,
      novaSenha,
    });
    
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagem || 'Erro ao resetar senha');
    }
  },
};

export default authServico;
