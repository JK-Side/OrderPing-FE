import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

import styles from './Button.module.scss';

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'secondary';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: ReactNode;
}

/* ----------------------------------------------
  사용법

  <Button>확인</Button>
  <Button variant="ghost">확인</Button>

---------------------------------------------- */

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  isLoading = false,
  loadingText,
  className,
  children,
  ...props
}: ButtonProps) {
  const isButtonDisabled = disabled || isLoading;

  return (
    <button
      type="button"
      disabled={isButtonDisabled}
      aria-busy={isLoading || undefined}
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        {
          [styles.fullWidth]: fullWidth,
          [styles.disabled]: isButtonDisabled,
        },
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <span className={styles.loadingContent}>
          <span className={styles.spinner} aria-hidden="true" />
          {loadingText ?? children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
