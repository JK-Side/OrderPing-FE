import { useState } from 'react';
import styles from './QuantityControl.module.scss';

type QuantityAction = 'decrease' | 'increase';

interface QuantityControlProps {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseDisabled?: boolean;
  increaseDisabled?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  className?: string;
}

export default function QuantityControl({
  value,
  onDecrease,
  onIncrease,
  decreaseDisabled = false,
  increaseDisabled = false,
  disabled = false,
  min = 1,
  max = 99,
  className = '',
}: QuantityControlProps) {
  const [pressedAction, setPressedAction] = useState<QuantityAction | null>(null);

  const isMin = value <= min;
  const isMax = value >= max;

  const decreaseBlocked = disabled || decreaseDisabled || isMin;
  const increaseBlocked = disabled || increaseDisabled || isMax;

  const runAction = (action: QuantityAction) => {
    if (action === 'decrease') {
      onDecrease();
      return;
    }

    onIncrease();
  };

  const startPress = (action: QuantityAction, blocked: boolean) => {
    if (blocked) return;
    setPressedAction(action);
  };

  const endPress = () => {
    setPressedAction(null);
  };

  const getButtonClassName = (action: QuantityAction, blocked: boolean) => {
    const isPressed = pressedAction === action && !blocked;

    return [
      styles.quantityControl__button,
      blocked ? styles['quantityControl__button--blocked'] : '',
      isPressed ? styles['quantityControl__button--pressed'] : '',
    ]
      .filter(Boolean)
      .join(' ');
  };

  return (
    <div className={`${styles.quantityControl} ${className}`.trim()}>
      <button
        type="button"
        className={getButtonClassName('decrease', decreaseBlocked)}
        onClick={() => runAction('decrease')}
        onPointerDown={() => startPress('decrease', decreaseBlocked)}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onPointerCancel={endPress}
        onBlur={endPress}
        disabled={decreaseBlocked}
        aria-label="수량 감소"
      >
        -
      </button>
      <span className={styles.quantityControl__value} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={getButtonClassName('increase', increaseBlocked)}
        onClick={() => runAction('increase')}
        onPointerDown={() => startPress('increase', increaseBlocked)}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onPointerCancel={endPress}
        onBlur={endPress}
        disabled={increaseBlocked}
        aria-label="수량 증가"
      >
        +
      </button>
    </div>
  );
}
