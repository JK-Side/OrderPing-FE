import type { ReactNode } from 'react';
import styles from './BottomActionBar.module.scss';

interface BottomActionBarProps {
  children: ReactNode;
  className?: string;
}

export default function BottomActionBar({
  children,
  className,
}: BottomActionBarProps) {
  return (
    <footer
      className={[styles.bottomActionBar, className].filter(Boolean).join(' ')}
    >
      {children}
    </footer>
  );
}
