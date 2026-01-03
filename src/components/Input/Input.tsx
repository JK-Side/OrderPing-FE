import clsx from 'clsx';
import ErrorIcon from '@/assets/icons/error-circle.svg?react';
import styles from './Input.module.scss';

interface InputProps {
  label?: string;
  message?: string;
  messageState?: 'error' | 'warning' | 'success' | 'info';
  required?: boolean;
  children: React.ReactNode;
}

export function InputRoot({ label, message, messageState, required, children }: InputProps) {
  return (
    <div className={styles.wrapper}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      {children}

      {message && (
        <div className={styles['info-wrapper']}>
          <ErrorIcon />
          <div className={clsx(styles.message, styles[messageState ?? ''])}>{message}</div>
        </div>
      )}
    </div>
  );
}
