import * as ToastPrimitive from '@radix-ui/react-toast';
import clsx from 'clsx';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from 'react';

import CloseIcon from '@/assets/icons/close.svg?react';
import ErrorIcon from '@/assets/icons/error-circle.svg?react';
import InfoIcon from '@/assets/icons/info-circle.svg?react';
import SuccessIcon from '@/assets/icons/success-circle.svg?react';
import WarningIcon from '@/assets/icons/warning-circle.svg?react';
import { ToastContext, type ToastOptions, type ToastVariant } from './toast-context';
import styles from './Toast.module.scss';

interface ToastItem extends ToastOptions {
  id: string;
  open: boolean;
  variant: ToastVariant;
  paused: boolean;
}

const TOAST_REMOVE_DELAY = 200;
const DEFAULT_TOAST_DURATION = 4000;

const iconByVariant = {
  info: InfoIcon,
  success: SuccessIcon,
  warning: WarningIcon,
  error: ErrorIcon,
} satisfies Record<ToastVariant, ComponentType<SVGProps<SVGSVGElement>>>;

const createToastId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

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
      setToasts((prev) => prev.map((toast) => (toast.id === id ? { ...toast, open: false } : toast)));
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
        variant: options.variant ?? 'info',
        duration: options.duration,
        paused: false,
      },
    ]);

    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  useEffect(() => {
    return () => {
      removeTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      removeTimeouts.current.clear();
    };
  }, []);

  return (
    <ToastPrimitive.Provider swipeDirection="right" duration={DEFAULT_TOAST_DURATION}>
      <ToastContext.Provider value={value}>
        {children}
        {toasts.map((toastItem) => {
          const Icon = iconByVariant[toastItem.variant];
          const duration = toastItem.duration ?? DEFAULT_TOAST_DURATION;
          const style: CSSProperties & { '--toast-duration'?: string } = {
            '--toast-duration': `${duration}ms`,
          };

          return (
            <ToastPrimitive.Root
              key={toastItem.id}
              className={clsx(styles.toast, styles[toastItem.variant])}
              open={toastItem.open}
              duration={duration}
              style={style}
              data-paused={toastItem.paused ? 'true' : 'false'}
              onPause={() => {
                setToasts((prev) =>
                  prev.map((toast) =>
                    toast.id === toastItem.id ? { ...toast, paused: true } : toast,
                  ),
                );
              }}
              onResume={() => {
                setToasts((prev) =>
                  prev.map((toast) =>
                    toast.id === toastItem.id ? { ...toast, paused: false } : toast,
                  ),
                );
              }}
              onOpenChange={(open) => {
                if (!open) {
                  dismiss(toastItem.id);
                }
              }}
            >
              <div className={styles.icon}>
                <Icon aria-hidden="true" />
              </div>
              <div className={styles.content}>
                <ToastPrimitive.Title className={styles.title}>{toastItem.message}</ToastPrimitive.Title>
                {toastItem.description && (
                  <ToastPrimitive.Description className={styles.description}>
                    {toastItem.description}
                  </ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close className={styles.closeButton} aria-label="닫기">
                <CloseIcon aria-hidden="true" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className={styles.viewport} />
      </ToastContext.Provider>
    </ToastPrimitive.Provider>
  );
}
