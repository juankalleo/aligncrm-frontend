import apiClient from './api';
import { Dominio, ApiResponse } from '@/tipos';

const dominioServico = {
  async listar(): Promise<Dominio[]> {
    const response = await apiClient.get<ApiResponse<Dominio[]>>('/dominios');
    if (response.data.sucesso && response.data.dados) return response.data.dados;
    throw new Error(response.data.mensagem || 'Erro ao listar domínios');
  },

  async buscarPorId(id: string): Promise<Dominio> {
    const response = await apiClient.get<ApiResponse<Dominio>>(`/dominios/${id}`);
    if (response.data.sucesso && response.data.dados) return response.data.dados;
    throw new Error(response.data.mensagem || 'Domínio não encontrado');
  },

  async criar(dados: Partial<Dominio>): Promise<Dominio> {
    const response = await apiClient.post<ApiResponse<Dominio>>('/dominios', dados);
    if (response.data.sucesso && response.data.dados) return response.data.dados;
    throw new Error(response.data.mensagem || 'Erro ao criar domínio');
  },

  async atualizar(id: string, dados: Partial<Dominio>): Promise<Dominio> {
    const response = await apiClient.patch<ApiResponse<Dominio>>(`/dominios/${id}`, dados);
    if (response.data.sucesso && response.data.dados) return response.data.dados;
    throw new Error(response.data.mensagem || 'Erro ao atualizar domínio');
  },

  async excluir(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/dominios/${id}`);
    if (!response.data.sucesso) throw new Error(response.data.mensagem || 'Erro ao excluir domínio');
  },

  async expiradosCount(): Promise<number> {
    const response = await apiClient.get<ApiResponse<{ count: number }>>('/dominios/expirados_count');
    if (response.data.sucesso && response.data.dados) return (response.data.dados as any).count || 0;
    return 0;
  },
};

export default dominioServico;
