// Tipos principais do Align CRM

// ============================================
// USUÁRIO
// ============================================
export type Role = 'admin' | 'manager' | 'user' | 'viewer';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  avatar?: string;
  role: Role;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  projetos?: Projeto[];
}

export interface UsuarioPreferencias {
  userId: string;
  tema: 'claro' | 'escuro' | 'sistema';
  sidebarEstilo: 'padrao' | 'glass' | 'minimal';
  idioma: string;
}

// ============================================
// AUTENTICAÇÃO
// ============================================
export interface LoginCredenciais {
  email: string;
  senha: string;
}

export interface RegistroCredenciais {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
  expiresIn: number;
}

// ============================================
// PROJETOS
// ============================================
export type StatusProjeto = 'planejamento' | 'em_andamento' | 'pausado' | 'concluido' | 'cancelado';

export interface Projeto {
  id: string;
  nome: string;
  descricao?: string;
  status: StatusProjeto;
  cor?: string;
  icone?: string;
  dataInicio?: string;
  dataFim?: string;
  proprietarioId: string;
  proprietario?: Usuario;
  membros?: Usuario[];
  tarefasTotal: number;
  tarefasConcluidas: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CriarProjetoDTO {
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  dataInicio?: string;
  dataFim?: string;
  membrosIds?: string[];
  observacoes?: string;
}

// ============================================
// TAREFAS
// ============================================
export type StatusTarefa = 'backlog' | 'todo' | 'em_progresso' | 'revisao' | 'concluida' | 'cancelada';
export type PrioridadeTarefa = 'urgente' | 'alta' | 'media' | 'baixa';

export interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  status: StatusTarefa;
  prioridade: PrioridadeTarefa;
  projetoId: string;
  projeto?: Projeto;
  responsavelId?: string;
  responsavel?: Usuario;
  prazo?: string;
  estimativaHoras?: number;
  tags?: string[];
  ordem: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CriarTarefaDTO {
  titulo: string;
  descricao?: string;
  status?: StatusTarefa;
  prioridade?: PrioridadeTarefa;
  projetoId: string;
  responsavelId?: string;
  prazo?: string;
  estimativaHoras?: number;
  tags?: string[];
}

export interface AtualizarOrdemTarefaDTO {
  tarefaId: string;
  novoStatus: StatusTarefa;
  novaOrdem: number;
}

// ============================================
// HISTÓRICO (AUDIT LOG)
// ============================================
export type TipoAcao = 
  | 'criar' 
  | 'atualizar' 
  | 'excluir' 
  | 'arquivar' 
  | 'restaurar'
  | 'login'
  | 'logout'
  | 'permissao_alterada';

export type EntidadeAuditada = 
  | 'projeto' 
  | 'tarefa' 
  | 'usuario' 
  | 'arquivo' 
  | 'link' 
  | 'fluxograma' 
  | 'evento';

export interface RegistroHistorico {
  id: string;
  acao: TipoAcao;
  entidade: EntidadeAuditada;
  entidadeId: string;
  entidadeNome?: string;
  usuarioId: string;
  usuario?: Usuario;
  detalhes?: Record<string, unknown>;
  ip?: string;
  criadoEm: string;
}

export interface FiltrosHistorico {
  usuarioId?: string;
  projetoId?: string;
  entidade?: EntidadeAuditada;
  acao?: TipoAcao;
  dataInicio?: string;
  dataFim?: string;
  pagina?: number;
  porPagina?: number;
}

// ============================================
// FLUXOGRAMAS
// ============================================
export interface Fluxograma {
  id: string;
  nome: string;
  descricao?: string;
  projetoId: string;
  projeto?: Projeto;
  dados: string; // JSON do Excalidraw
  criadorId: string;
  criador?: Usuario;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CriarFluxogramaDTO {
  nome: string;
  descricao?: string;
  projetoId: string;
  dados: string;
}

// ============================================
// AGENDA
// ============================================
export type TipoEvento = 'reuniao' | 'prazo' | 'lembrete' | 'marco' | 'outro';

export interface Evento {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: TipoEvento;
  dataInicio: string;
  dataFim?: string;
  diaInteiro: boolean;
  projetoId?: string;
  projeto?: Projeto;
  participantesIds?: string[];
  participantes?: Usuario[];
  localizacao?: string;
  linkReuniao?: string;
  cor?: string;
  lembrete?: number; // minutos antes
  criadorId: string;
  criador?: Usuario;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CriarEventoDTO {
  titulo: string;
  descricao?: string;
  tipo: TipoEvento;
  dataInicio: string;
  dataFim?: string;
  diaInteiro?: boolean;
  projetoId?: string;
  participantesIds?: string[];
  localizacao?: string;
  linkReuniao?: string;
  cor?: string;
  lembrete?: number;
}

// ============================================
// ARQUIVOS E LINKS
// ============================================
export type TipoArquivo = 'documento' | 'imagem' | 'video' | 'audio' | 'outro';

export interface Arquivo {
  id: string;
  nome: string;
  nomeOriginal: string;
  tipo: TipoArquivo;
  mimetype: string;
  tamanho: number;
  url: string;
  projetoId?: string;
  projeto?: Projeto;
  uploaderInId: string;
  uploader?: Usuario;
  criadoEm: string;
}

export type CategoriaLink = 'github' | 'frontend' | 'backend' | 'ambiente' | 'documentacao' | 'outro';

export interface Link {
  id: string;
  nome: string;
  url: string;
  categoria: CategoriaLink;
  descricao?: string;
  projetoId?: string;
  projeto?: Projeto;
  criadorId: string;
  criador?: Usuario;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CriarLinkDTO {
  nome: string;
  url: string;
  categoria: CategoriaLink;
  descricao?: string;
  projetoId?: string;
}

// ============================================
// API RESPONSES
// ============================================
export interface ApiResponse<T> {
  sucesso: boolean;
  dados?: T;
  mensagem?: string;
  erros?: string[];
}

export interface PaginatedResponse<T> {
  dados: T[];
  meta: {
    total: number;
    pagina: number;
    porPagina: number;
    totalPaginas: number;
  };
}

// ============================================
// WORKSPACE
// ============================================
export interface Workspace {
  id: string;
  nome: string;
  codigo?: string;
  proprietarioId: string;
  criadoEm: string;
  atualizadoEm: string;
  storageUsado: number; // em bytes
  storageLimite: number; // em bytes
  storageDisponivel: number; // em bytes
  percentualUsoStorage: number; // 0-100
  projetos?: Projeto[];
}

export interface CriarWorkspaceDTO {
  nome: string;
  codigo?: string;
}

// ============================================
// DOMÍNIOS
// ============================================
export interface Dominio {
  id: string;
  nome: string;
  porta?: number | null;
  nginx_server?: string | null;
  expires_at?: string | null;
  notified?: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CriarDominioDTO {
  nome: string;
  porta?: number | null;
  nginx_server?: string | null;
  expires_at?: string | null;
  notified?: boolean;
}

// ============================================
// VPS E SENHAS
// ============================================
export interface Vps {
  id: string;
  nome: string;
  login_root: string;
  senha_root?: string | null;
  email_relacionado?: string | null;
  storage_gb?: number | null;
  comprado_em?: string | null; // ISO date
  comprado_em_local?: string | null; // texto livre onde foi comprado
  projetos?: Projeto[]; // projetos rodando na VPS
  criadoEm: string;
  atualizadoEm: string;
}

export interface CriarVpsDTO {
  nome: string;
  login_root: string;
  senha_root?: string | null;
  email_relacionado?: string | null;
  storage_gb?: number | null;
  comprado_em?: string | null;
  comprado_em_local?: string | null;
  projetos_ids?: string[];
}

// ============================================
// PERMISSÕES
// ============================================
export interface Permissao {
  id: string;
  nome: string;
  descricao: string;
  codigo: string;
}

export interface RolePermissoes {
  role: Role;
  permissoes: Permissao[];
}

// ============================================
// FINANCEIRO
// ============================================
export type TipoFinanceiro = 'a_pagar' | 'a_receber';

export interface Financeiro {
  id: string;
  projetoId?: string;
  categoria: string; // 'vps' | 'dominio' | 'custo_projeto' | 'outro'
  tipo: TipoFinanceiro;
  descricao?: string;
  valor: number;
  data?: string; // ISO date
  vencimento?: string; // data de cobrança/recebimento (opcional)
  pago: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CriarFinanceiroDTO {
  projeto_id?: string;
  categoria: string;
  tipo: TipoFinanceiro;
  descricao?: string;
  valor: number;
  data?: string;
  vencimento?: string;
  pago?: boolean;
}
