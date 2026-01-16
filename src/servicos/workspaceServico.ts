import apiClient from './api';
import { ApiResponse, Workspace, CriarWorkspaceDTO } from '@/tipos';

export const workspaceServico = {
  async listar(pagina = 1, porPagina = 50): Promise<Workspace[]> {
    const response = await apiClient.get<ApiResponse<Workspace[]>>('/workspaces', { params: { pagina, porPagina } });
    if (response.data.sucesso) {
      return response.data.dados || [];
    }
    throw new Error(response.data.mensagem || 'Erro ao listar workspaces');
  },

  async buscarPorId(id: string): Promise<Workspace> {
    const response = await apiClient.get<ApiResponse<Workspace>>(`/workspaces/${id}`);
    if (response.data.sucesso && response.data.dados) return response.data.dados;
    throw new Error(response.data.mensagem || 'Workspace não encontrado');
  },

  async criar(dados: CriarWorkspaceDTO): Promise<Workspace> {
    const response = await apiClient.post<ApiResponse<Workspace>>('/workspaces', { workspace: dados });
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    throw new Error(response.data.mensagem || 'Erro ao criar workspace');
  },

  async atualizar(id: string, dados: Partial<CriarWorkspaceDTO>): Promise<Workspace> {
    const response = await apiClient.put<ApiResponse<Workspace>>(`/workspaces/${id}`, { workspace: dados });
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    throw new Error(response.data.mensagem || 'Erro ao atualizar workspace');
  },

  // Criar convite para workspace (retorna token e expiry)
  async criarConvite(id: string): Promise<{ token: string; expires_at: string }> {
    const response = await apiClient.post<ApiResponse<{ token: string; expires_at: string }>>(`/workspaces/${id}/invites`);
    if (response.data.sucesso && response.data.dados) return response.data.dados;
    throw new Error(response.data.mensagem || 'Erro ao criar convite');
  }
};

export default workspaceServico;
