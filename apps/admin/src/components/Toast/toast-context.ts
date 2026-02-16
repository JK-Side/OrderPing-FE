import { createContext } from 'react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  message: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
