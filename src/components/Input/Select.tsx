import { useCallback, useState, type SelectHTMLAttributes } from 'react';
import styles from './Input.module.scss';

export function Select({
  onBlur,
  onChange,
  onKeyDown,
  onMouseDown,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const [isOpen, setIsOpen] = useState(false);

  const handleMouseDown = useCallback<React.MouseEventHandler<HTMLSelectElement>>(
    (event) => {
      if (event.currentTarget.disabled) {
        onMouseDown?.(event);
        return;
      }

      setIsOpen((prev) => !prev);
      onMouseDown?.(event);
    },
    [onMouseDown],
  );

  const handleBlur = useCallback<React.FocusEventHandler<HTMLSelectElement>>(
    (event) => {
      setIsOpen(false);
      onBlur?.(event);
    },
    [onBlur],
  );

  const handleChange = useCallback<React.ChangeEventHandler<HTMLSelectElement>>(
    (event) => {
      setIsOpen(false);
      onChange?.(event);
    },
    [onChange],
  );

  const handleKeyDown = useCallback<React.KeyboardEventHandler<HTMLSelectElement>>(
    (event) => {
      if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        setIsOpen(true);
      }

      if (event.key === 'Escape' || event.key === 'Tab' || event.key === 'Enter') {
        setIsOpen(false);
      }

      onKeyDown?.(event);
    },
    [onKeyDown],
  );

  return (
    <div className={isOpen ? `${styles.selectWrapper} ${styles.selectWrapperOpen}` : styles.selectWrapper}>
      <select
        className={styles.select}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        {...props}
      />
    </div>
  );
}
