'use client';

import React from 'react';
import { cn } from '@/utils';
import StarField from '@/components/ui/StarField';

interface AuthLayoutProps {
  children: React.ReactNode;
  hideSubtitle?: boolean;
}

export function AuthLayout({ children, hideSubtitle = false }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
      <StarField />
      <div className="w-full max-w-md p-8 relative z-10">
        <div className="flex flex-col items-center mb-2">
          <div className="w-28 h-28 flex items-center justify-center mb-1">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <linearGradient id="alignA" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="#2563eb" />
                  <stop offset="1" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              <path d="M3 20 L12 4 L21 20 H16 L12 12 L8 20 H3 Z" fill="url(#alignA)" />
            </svg>
          </div>
          {!hideSubtitle && (
            <span
              className="text-2xl text-white mt-1"
              style={{
                fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
                fontWeight: 300,
              }}
            >
              Entre no Align
            </span>
          )}
        </div>

        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
