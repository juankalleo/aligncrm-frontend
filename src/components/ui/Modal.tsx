'use client';

import React from 'react';
import { cn } from '@/utils';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  titulo?: string;
  descricao?: string;
  children: React.ReactNode;
  tamanho?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  titulo,
  descricao,
  children,
  tamanho = 'md',
  showCloseButton = true,
}: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  // Fechar com ESC
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'relative w-full bg-light-card dark:bg-dark-card rounded-xl shadow-premium',
              'border border-light-border dark:border-dark-border',
              sizeClasses[tamanho],
              'max-h-[90vh] overflow-hidden'
            )}
          >
            {/* Header */}
            {(titulo || showCloseButton) && (() => {
              const compact = !titulo && !descricao && showCloseButton
              const headerPadding = compact ? 'p-2' : 'p-6'
              const closeBtnPos = compact ? 'right-2 top-2' : 'right-3 top-3'

              return (
                <div className={`relative ${headerPadding} ${compact ? '' : 'border-b border-light-border dark:border-dark-border'}`}>
                  <div>
                    {titulo && (
                      <h2 className="text-lg font-semibold text-light-text dark:text-dark-text">
                        {titulo}
                      </h2>
                    )}
                    {descricao && (
                      <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
                        {descricao}
                      </p>
                    )}
                  </div>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className={`absolute ${closeBtnPos} p-1 rounded-lg text-light-muted dark:text-dark-muted hover:bg-light-hover dark:hover:bg-dark-hover transition-colors`}
                      aria-label="Fechar"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              )
            })()}

            {/* Content */}
            <div className="p-6 overflow-auto max-h-[70vh]">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// CONFIRM DIALOG
// ============================================
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo: string;
  mensagem: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variante?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  titulo,
  mensagem,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variante = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const variantClasses = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} titulo={titulo} tamanho="sm">
      <p className="text-light-muted dark:text-dark-muted">{mensagem}</p>
      
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="btn-secondary"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            'px-4 py-2 rounded-lg font-medium text-white',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            variantClasses[variante]
          )}
        >
          {isLoading ? 'Processando...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export default Modal;
