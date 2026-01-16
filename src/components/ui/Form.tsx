'use client';

import React from 'react';
import { cn } from '@/utils';

// ============================================
// BUTTON
// ============================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primary' | 'secondary' | 'ghost' | 'danger';
  // alias in English for some callers
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  tamanho?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  iconeEsquerda?: React.ReactNode;
  iconeDireita?: React.ReactNode;
}

export function Button({
  children,
  variante = 'primary',
  variant,
  tamanho = 'md',
  isLoading = false,
  iconeEsquerda,
  iconeDireita,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const selectedVariant = variant || variante;
  const variantClasses = {
    primary: 'bg-align-600 text-white hover:bg-align-700 active:bg-align-800 focus:ring-align-500',
    secondary: 'bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border hover:bg-light-hover dark:hover:bg-dark-hover',
    ghost: 'text-light-muted dark:text-dark-muted hover:bg-light-hover dark:hover:bg-dark-hover hover:text-light-text dark:hover:text-dark-text',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-bg',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[selectedVariant as keyof typeof variantClasses],
        sizeClasses[tamanho],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : iconeEsquerda}
      {children}
      {!isLoading && iconeDireita}
    </button>
  );
}

// ============================================
// INPUT
// ============================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  erro?: string;
  iconeEsquerda?: React.ReactNode;
  iconeDireita?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, erro, iconeEsquerda, iconeDireita, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-light-text dark:text-dark-text">
            {label}
          </label>
        )}
        <div className="relative">
          {iconeEsquerda && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted">
              {iconeEsquerda}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full px-4 py-3 rounded-lg',
              'bg-light-bg dark:bg-dark-bg',
              'border border-light-border dark:border-dark-border',
              'text-light-text dark:text-dark-text',
              'placeholder:text-light-muted dark:placeholder:text-dark-muted',
              'focus:outline-none focus:ring-2 focus:ring-align-500 focus:border-transparent',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              iconeEsquerda && 'pl-10',
              iconeDireita && 'pr-10',
              erro && 'border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
          {iconeDireita && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted">
              {iconeDireita}
            </div>
          )}
        </div>
        {erro && (
          <p className="text-sm text-red-500">{erro}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================
// TEXTAREA
// ============================================
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  erro?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, erro, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-light-text dark:text-dark-text">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-lg resize-none',
            'bg-light-bg dark:bg-dark-bg',
            'border border-light-border dark:border-dark-border',
            'text-light-text dark:text-dark-text',
            'placeholder:text-light-muted dark:placeholder:text-dark-muted',
            'focus:outline-none focus:ring-2 focus:ring-align-500 focus:border-transparent',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            erro && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {erro && (
          <p className="text-sm text-red-500">{erro}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ============================================
// SELECT
// ============================================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  erro?: string;
  opcoes?: { valor: string; label: string }[];
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, erro, opcoes, options, placeholder, className, ...props }, ref) => {
    const listaOpcoes = opcoes || options?.map(o => ({ valor: o.value, label: o.label })) || [];
    
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-light-text dark:text-dark-text">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-lg appearance-none cursor-pointer',
            'bg-light-bg dark:bg-dark-bg',
            'border border-light-border dark:border-dark-border',
            'text-light-text dark:text-dark-text',
            'focus:outline-none focus:ring-2 focus:ring-align-500 focus:border-transparent',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            erro && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {listaOpcoes.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.label}
              </option>
            ))}
            {/* Preserve any children passed (allows inline <option> usage) */}
            {props.children}
        </select>
        {erro && (
          <p className="text-sm text-red-500">{erro}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// ============================================
// CHECKBOX
// ============================================
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            'w-4 h-4 rounded',
            'border border-light-border dark:border-dark-border',
            'text-align-600 focus:ring-align-500',
            'transition-all duration-200',
            className
          )}
          {...props}
        />
        {label && (
          <span className="text-sm text-light-text dark:text-dark-text">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
