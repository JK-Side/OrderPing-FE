import * as ToastPrimitive from '@radix-ui/react-toast';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import CheckIcon from '@/assets/icons/check.svg?react';
import { ToastContext, type ToastOptions, type ToastVariant } from './toast-context';
import styles from './Toast.module.scss';

interface ToastItem extends ToastOptions {
  id: string;
  open: boolean;
  variant: ToastVariant;
}

const TOAST_REMOVE_DELAY = 150;
const DEFAULT_TOAST_DURATION = 3000;

const createToastId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const removeTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const scheduleRemove = useCallback((id: string) => {
    const existing = removeTimeouts.current.get(id);
    if (existing) {
      clearTimeout(existing);
    }

    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
      removeTimeouts.current.delete(id);
    }, TOAST_REMOVE_DELAY);

    removeTimeouts.current.set(id, timeout);
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      setToasts((prev) =>
        prev.map((toast) =>
          toast.id === id ? { ...toast, open: false } : toast,
        ),
      );
      scheduleRemove(id);
    },
    [scheduleRemove],
  );

  const toast = useCallback((options: ToastOptions) => {
    const id = createToastId();

    setToasts((prev) => [
      ...prev,
      {
        id,
        open: true,
        message: options.message,
        description: options.description,
        variant: options.variant ?? 'success',
        duration: options.duration,
      },
    ]);

    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  useEffect(() => {
    const timeouts = removeTimeouts.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  return (
    <ToastPrimitive.Provider swipeDirection="right" duration={DEFAULT_TOAST_DURATION}>
      <ToastContext.Provider value={value}>
        {children}
        {toasts.map((toastItem) => {
          const duration = toastItem.duration ?? DEFAULT_TOAST_DURATION;

          return (
            <ToastPrimitive.Root
              key={toastItem.id}
              className={clsx(styles.toast, styles[`toast--${toastItem.variant}`])}
              open={toastItem.open}
              duration={duration}
              onOpenChange={(open) => {
                if (!open) {
                  dismiss(toastItem.id);
                }
              }}
            >
              <CheckIcon className={styles.toast__icon} aria-hidden="true" />
              <ToastPrimitive.Title className={styles.toast__message}>
                {toastItem.message}
              </ToastPrimitive.Title>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className={styles.viewport} />
      </ToastContext.Provider>
    </ToastPrimitive.Provider>
  );
}
