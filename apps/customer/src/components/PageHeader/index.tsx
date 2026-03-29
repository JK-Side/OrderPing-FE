import type { CSSProperties, ReactNode } from 'react';
import BackIcon from '@/assets/icons/back.svg?react';
import styles from './PageHeader.module.scss';

interface PageHeaderProps {
  title: string;
  onBack: () => void;
  rightSlot?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function PageHeader({
  title,
  onBack,
  rightSlot,
  className,
  style,
}: PageHeaderProps) {
  return (
    <header
      className={[styles.pageHeader, className].filter(Boolean).join(' ')}
      style={style}
    >
      <button
        type='button'
        className={styles.pageHeader__backButton}
        onClick={onBack}
        aria-label='뒤로가기'
      >
        <BackIcon />
      </button>
      <div className={styles.pageHeader__title}>{title}</div>
      <div className={styles.pageHeader__right}>{rightSlot}</div>
    </header>
  );
}
