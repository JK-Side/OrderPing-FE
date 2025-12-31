import type { SelectHTMLAttributes } from 'react';
import styles from './Input.module.scss';

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={styles.select} {...props} />;
}
