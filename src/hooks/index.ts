// Exportação central de hooks
export { useLoading } from './useLoading';
export { useModal } from './useModal';
export { useDebounce, useDebouncedCallback } from './useDebounce';
export { useClickOutside } from './useClickOutside';
export { usePagination } from './usePagination';
export { useAgendaNotifications } from './useAgendaNotifications';

// Re-exportar hooks dos contextos
export { useAuth } from '@/contextos/AuthContext';
export { useTema } from '@/contextos/TemaContext';
