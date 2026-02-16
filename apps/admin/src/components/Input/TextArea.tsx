import type { TextareaHTMLAttributes } from 'react';
import styles from './Input.module.scss';

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={styles.textarea} {...props} />;
}
