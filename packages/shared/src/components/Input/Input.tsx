import clsx from 'clsx';
import type { ReactNode, SVGProps } from 'react';
import styles from './Input.module.scss';

export type InputMessageState = 'error' | 'warning' | 'success' | 'info';

interface InputProps {
  label?: string;
  message?: string;
  messageState?: InputMessageState;
  required?: boolean;
  children: ReactNode;
}

const ICON_COLOR_BY_STATE: Record<InputMessageState, string> = {
  error: '#ff5470',
  warning: '#ffb800',
  success: '#11b76b',
  info: '#008eff',
};

function MessageCircleIcon({
  color,
  ...props
}: SVGProps<SVGSVGElement> & { color: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="7" fill={color} />
      <path
        d="M8 4.25a.875.875 0 1 1 0 1.75.875.875 0 0 1 0-1.75Zm1 7H7V7h2v4.25Z"
        fill="#fff"
      />
    </svg>
  );
}

export function InputRoot({
  label,
  message,
  messageState,
  required,
  children,
}: InputProps) {
  return (
    <div className={styles.wrapper}>
      {label ? (
        <label className={styles.label}>
          {label}
          {required ? <span className={styles.required}>*</span> : null}
        </label>
      ) : null}

      {children}

      {message ? (
        <div className={styles.infoWrapper}>
          {messageState ? (
            <MessageCircleIcon
              className={styles.messageIcon}
              color={ICON_COLOR_BY_STATE[messageState]}
            />
          ) : null}
          <div className={clsx(styles.message, messageState && styles[messageState])}>
            {message}
          </div>
        </div>
      ) : null}
    </div>
  );
}
