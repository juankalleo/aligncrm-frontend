// Exportação central de todos os serviços
export { default as apiClient, setAuthToken, removeAuthToken, getAuthToken } from './api';
export { default as authServico } from './authServico';
export { default as projetoServico } from './projetoServico';
export { default as tarefaServico } from './tarefaServico';
export { default as usuarioServico } from './usuarioServico';
export { default as historicoServico } from './historicoServico';
export { default as agendaServico } from './agendaServico';
export { arquivoServico, linkServico } from './arquivosServico';
export { default as fluxogramaServico } from './fluxogramaServico';
export { default as workspaceServico } from './workspaceServico';
export { default as dominioServico } from './dominioServico';
