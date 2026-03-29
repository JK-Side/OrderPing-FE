import { forwardRef, type TextareaHTMLAttributes } from 'react';
import styles from './Input.module.scss';

// export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
//   return <textarea className={styles.textarea} {...props} />;
// }

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`${styles.textarea} ${className || ''}`.trim()}
      {...props}
    />
  );
});

TextArea.displayName = 'TextArea';
