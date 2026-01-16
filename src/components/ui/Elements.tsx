'use client';

import React from 'react';
import { cn } from '@/utils';
import { gerarIniciais, stringParaCor } from '@/utils';

// ============================================
// CARD
// ============================================
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Card({ children, className, hover = false, onClick, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-light-card dark:bg-dark-card',
        'border border-light-border dark:border-dark-border',
        'rounded-xl p-6',
        'transition-all duration-200',
        hover && 'hover:shadow-lg hover:border-align-500/50 cursor-pointer',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

// ============================================
// BADGE
// ============================================
interface BadgeProps {
  children: React.ReactNode;
  variante?: 'default' | 'success' | 'warning' | 'error' | 'info';
  // alias
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export function Badge({ children, variante = 'default', variant, className }: BadgeProps) {
  const selected = variant || variante;
  const variantClasses = {
    default: 'bg-light-hover dark:bg-dark-hover text-light-text dark:text-dark-text',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[selected as keyof typeof variantClasses],
        className
      )}
    >
      {children}
    </span>
  );
}

// ============================================
// PRIORITY BADGE
// ============================================
interface PriorityBadgeProps {
  prioridade: 'urgente' | 'alta' | 'media' | 'baixa';
}

export function PriorityBadge({ prioridade }: PriorityBadgeProps) {
  const config = {
    urgente: { label: 'Urgente', class: 'bg-red-500 text-white' },
    alta: { label: 'Alta', class: 'bg-orange-500 text-white' },
    media: { label: 'Média', class: 'bg-yellow-500 text-white' },
    baixa: { label: 'Baixa', class: 'bg-green-500 text-white' },
  };

  const { label, class: className } = config[prioridade];

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', className)}>
      {label}
    </span>
  );
}

// ============================================
// STATUS BADGE
// ============================================
interface StatusBadgeProps {
  status: 'backlog' | 'todo' | 'em_progresso' | 'revisao' | 'concluida' | 'cancelada';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    backlog: { label: 'Backlog', variante: 'default' as const },
    todo: { label: 'A Fazer', variante: 'info' as const },
    em_progresso: { label: 'Em Progresso', variante: 'warning' as const },
    revisao: { label: 'Em Revisão', variante: 'info' as const },
    concluida: { label: 'Concluída', variante: 'success' as const },
    cancelada: { label: 'Cancelada', variante: 'error' as const },
  };

  const { label, variante } = config[status];

  return <Badge variante={variante}>{label}</Badge>;
}

// ============================================
// AVATAR
// ============================================
interface AvatarProps {
  nome: string;
  src?: string;
  tamanho?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ nome, src, tamanho = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const backgroundColor = stringParaCor(nome);

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden flex items-center justify-center font-medium text-white',
        sizeClasses[tamanho],
        className
      )}
      style={{ backgroundColor }}
    >
      {src ? (
        <img src={src} alt={nome} className="w-full h-full object-cover" />
      ) : (
        gerarIniciais(nome)
      )}
    </div>
  );
}

// ============================================
// AVATAR GROUP
// ============================================
interface AvatarGroupProps {
  usuarios: { nome: string; avatar?: string }[];
  max?: number;
  tamanho?: 'sm' | 'md' | 'lg';
}

export function AvatarGroup({ usuarios, max = 4, tamanho = 'sm' }: AvatarGroupProps) {
  const visibleUsers = usuarios.slice(0, max);
  const remainingCount = usuarios.length - max;

  return (
    <div className="flex -space-x-2">
      {visibleUsers.map((usuario, index) => (
        <Avatar
          key={index}
          nome={usuario.nome}
          src={usuario.avatar}
          tamanho={tamanho}
          className="ring-2 ring-light-bg dark:ring-dark-bg"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-light-hover dark:bg-dark-hover',
            'text-light-muted dark:text-dark-muted font-medium',
            'ring-2 ring-light-bg dark:ring-dark-bg',
            tamanho === 'sm' && 'w-8 h-8 text-xs',
            tamanho === 'md' && 'w-10 h-10 text-sm',
            tamanho === 'lg' && 'w-12 h-12 text-base'
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

// ============================================
// SKELETON LOADER
// ============================================
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-light-hover dark:bg-dark-hover rounded',
        className
      )}
    />
  );
}

// ============================================
// EMPTY STATE
// ============================================
interface EmptyStateProps {
  icone?: React.ReactNode;
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}

export function EmptyState({ icone, titulo, descricao, acao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icone && (
        <div className="w-16 h-16 rounded-full bg-light-hover dark:bg-dark-hover flex items-center justify-center mb-4 text-light-muted dark:text-dark-muted">
          {icone}
        </div>
      )}
      <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
        {titulo}
      </h3>
      {descricao && (
        <p className="mt-1 text-sm text-light-muted dark:text-dark-muted max-w-sm">
          {descricao}
        </p>
      )}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}

// ============================================
// PROGRESS BAR
// ============================================
interface ProgressBarProps {
  valor?: number;
  // alias for older callers
  progresso?: number;
  max?: number;
  showLabel?: boolean;
  className?: string;
  // legacy aliases
  altura?: string;
  cor?: string;
}

export function ProgressBar({ valor, progresso, max = 100, showLabel = false, className, altura, cor }: ProgressBarProps) {
  const value = typeof valor === 'number' ? valor : (typeof progresso === 'number' ? progresso : 0);
  const porcentagem = Math.min(100, Math.max(0, (value / max) * 100));
  const finalClass = cn('w-full', className, altura || '');
  const innerClass = cor || 'bg-gradient-to-r from-align-500 to-align-600';

  return (
    <div className={finalClass}>
      {showLabel && (
        <div className="flex justify-between mb-1 text-sm">
          <span className="text-light-muted dark:text-dark-muted">Progresso</span>
          <span className="text-light-text dark:text-dark-text font-medium">
            {Math.round(porcentagem)}%
          </span>
        </div>
      )}
      <div className="h-2 bg-light-hover dark:bg-dark-hover rounded-full overflow-hidden">
        <div
          className={`h-full ${innerClass} rounded-full transition-all duration-300`}
          style={{ width: `${porcentagem}%` }}
        />
      </div>
    </div>
  );
}
