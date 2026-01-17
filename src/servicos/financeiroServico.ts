import apiClient from './api';
import { Financeiro, ApiResponse, CriarFinanceiroDTO } from '@/tipos';

const financeiroServico = {
  async listar(projetoId?: string): Promise<Financeiro[]> {
    const params = projetoId ? { projeto_id: projetoId } : {};
    const response = await apiClient.get<ApiResponse<Financeiro[]>>('/financeiros', { params });
    if (response.data.sucesso && response.data.dados) return response.data.dados;
    throw new Error(response.data.mensagem || 'Erro ao listar financeiros');
  },

  async criar(dados: CriarFinanceiroDTO): Promise<Financeiro> {
    const response = await apiClient.post<ApiResponse<Financeiro>>('/financeiros', dados);
    if (response.data.sucesso && response.data.dados) return response.data.dados;
    throw new Error(response.data.mensagem || 'Erro ao criar registro financeiro');
  },

  async atualizar(id: string, dados: Partial<CriarFinanceiroDTO>): Promise<Financeiro> {
    const response = await apiClient.patch<ApiResponse<Financeiro>>(`/financeiros/${id}`, dados);
    if (response.data.sucesso && response.data.dados) return response.data.dados;
    throw new Error(response.data.mensagem || 'Erro ao atualizar registro financeiro');
  },

  async excluir(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/financeiros/${id}`);
    if (!response.data.sucesso) throw new Error(response.data.mensagem || 'Erro ao excluir registro financeiro');
  }
}

export default financeiroServico;
