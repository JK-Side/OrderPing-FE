import type { OrderStatus } from '../../api/customer/entity';
import { getOrderStatusMeta } from '../../utils/orderStatus';
import styles from './OrderStatusBadge.module.scss';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export default function OrderStatusBadge({ status, className = '' }: OrderStatusBadgeProps) {
  const meta = getOrderStatusMeta(status);

  const toneClassName = {
    red: styles['orderStatusBadge--red'],
    green: styles['orderStatusBadge--green'],
    blue: styles['orderStatusBadge--blue'],
  }[meta.tone];

  return (
    <span className={[styles.orderStatusBadge, toneClassName, className].filter(Boolean).join(' ')}>
      {meta.label}
    </span>
  );
}
