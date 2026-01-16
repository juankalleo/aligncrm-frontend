import apiClient from './api';
import { 
  Usuario, 
  Role,
  ApiResponse, 
  PaginatedResponse 
} from '@/tipos';

// Serviço de Usuários (Admin)
export const usuarioServico = {
  // Listar todos os usuários
  async listar(pagina = 1, porPagina = 20): Promise<PaginatedResponse<Usuario>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Usuario>>>('/usuarios', {
      params: { pagina, porPagina },
    });
    
    if (response.data.sucesso && response.data.dados) {
      // Backend returns { sucesso: true, dados: [...], meta: { ... } }
      // Normalize to PaginatedResponse shape: { dados: [...], meta: {...} }
      return {
        dados: response.data.dados as unknown as Usuario[],
        meta: (response.data as any).meta,
      };
    }
    
    throw new Error(response.data.mensagem || 'Erro ao listar usuários');
  },
  
  // Listar usuários de um workspace
  async listarPorWorkspace(workspaceId: string, pagina = 1, porPagina = 100): Promise<PaginatedResponse<Usuario>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Usuario>>>(
      `/workspaces/${workspaceId}/usuarios`,
      { params: { pagina, porPagina } }
    );
    
    if (response.data.sucesso && response.data.dados) {
      return {
        dados: response.data.dados as unknown as Usuario[],
        meta: (response.data as any).meta,
      };
    }
    
    throw new Error(response.data.mensagem || 'Erro ao listar usuários do workspace');
  },

  // Remover usuário de um workspace (remove de todos os projetos do workspace)
  async removerDoWorkspace(workspaceId: string, usuarioId: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/workspaces/${workspaceId}/usuarios/${usuarioId}`
    );
    
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagem || 'Erro ao remover usuário do workspace');
    }
  },
  
  // Buscar usuário por ID
  async buscarPorId(id: string): Promise<Usuario> {
    const response = await apiClient.get<ApiResponse<Usuario>>(`/usuarios/${id}`);
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Usuário não encontrado');
  },
  
  // Criar novo usuário (Admin)
  async criar(dados: {
    nome: string;
    email: string;
    senha: string;
    role: Role;
  }): Promise<Usuario> {
    const response = await apiClient.post<ApiResponse<Usuario>>('/usuarios', dados);
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao criar usuário');
  },
  
  // Atualizar usuário
  async atualizar(id: string, dados: Partial<Usuario>): Promise<Usuario> {
    const response = await apiClient.patch<ApiResponse<Usuario>>(`/usuarios/${id}`, dados);
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao atualizar usuário');
  },
  
  // Alterar role do usuário (Admin)
  async alterarRole(id: string, role: Role): Promise<Usuario> {
    const response = await apiClient.patch<ApiResponse<Usuario>>(
      `/usuarios/${id}/role`,
      { role }
    );
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao alterar permissão');
  },
  
  // Desativar usuário
  async desativar(id: string): Promise<void> {
    const response = await apiClient.patch<ApiResponse<void>>(`/usuarios/${id}/desativar`);
    
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagem || 'Erro ao desativar usuário');
    }
  },
  
  // Reativar usuário
  async reativar(id: string): Promise<void> {
    const response = await apiClient.patch<ApiResponse<void>>(`/usuarios/${id}/reativar`);
    
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagem || 'Erro ao reativar usuário');
    }
  },
  
  // Upload de avatar
  async uploadAvatar(id: string, arquivo: File): Promise<string> {
    const formData = new FormData();
    formData.append('avatar', arquivo);
    
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      `/usuarios/${id}/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados.url;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao fazer upload do avatar');
  },
};

export default usuarioServico;
