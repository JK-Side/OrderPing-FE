import type { ComponentType, MouseEventHandler, SVGProps } from 'react';
import CheckIcon from '@/assets/icons/check.svg?react';
import CookingIcon from '@/assets/icons/cooking.svg?react';
import PaymentIcon from '@/assets/icons/payment.svg?react';
import ServedIcon from '@/assets/icons/served.svg?react';
import styles from './OrderCard.module.scss';

type OrderStatus = 'PENDING' | 'COOKING' | 'COMPLETE';
type ClickHandler = () => void;

interface OrderMenuItem {
  name: string;
  quantity: number;
}

interface OrderCardProps {
  tableName: string;
  items?: OrderMenuItem[];
  totalPrice?: number;
  status?: OrderStatus;
  isEmpty?: boolean;
  isSelected?: boolean;
  onToggleSelect?: ClickHandler;
  onOpenDetail?: ClickHandler;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    Icon: ComponentType<SVGProps<SVGSVGElement>>;
    badgeClassName: string;
    cardClassName: string;
  }
> = {
  COMPLETE: {
    label: '서빙 완료',
    Icon: ServedIcon,
    badgeClassName: styles.statusServed,
    cardClassName: styles.cardServed,
  },
  COOKING: {
    label: '조리 중',
    Icon: CookingIcon,
    badgeClassName: styles.statusCooking,
    cardClassName: styles.cardCooking,
  },
  PENDING: {
    label: '결제 전',
    Icon: PaymentIcon,
    badgeClassName: styles.statusPayment,
    cardClassName: styles.cardPayment,
  },
};

export default function OrderCard({
  tableName,
  items = [],
  totalPrice,
  status,
  isEmpty,
  isSelected = false,
  onToggleSelect,
  onOpenDetail,
}: OrderCardProps) {
  const isEmptyState = isEmpty ?? items.length === 0;
  const displayItems = items.slice(0, 3);
  const extraCount = Math.max(items.length - 3, 0);
  const statusConfig = status ? STATUS_CONFIG[status] : null;

  const cardClassName = !isEmptyState && statusConfig ? statusConfig.cardClassName : '';
  const selectBoxClassName = isSelected ? `${styles.selectBox} ${styles.selectBoxSelected}` : styles.selectBox;

  const handleSelectClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    onToggleSelect?.();
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <article className={`${styles.card} ${cardClassName}`} onClick={onOpenDetail}>
      <div className={styles.headerRow}>
        <h4 className={styles.tableName}>{tableName}</h4>
        <button
          type="button"
          className={selectBoxClassName}
          aria-label={`${tableName} 선택`}
          aria-pressed={isSelected}
          onClick={handleSelectClick}
        >
          {isSelected ? <CheckIcon className={styles.selectIcon} aria-hidden="true" /> : null}
        </button>
      </div>

      {isEmptyState ? (
        <div className={styles.emptyMessage}>아직 주문이 들어오지 않았어요!</div>
      ) : (
        <ul className={styles.menuList}>
          {displayItems.map((item) => (
            <li key={item.name} className={styles.menuItem}>
              <span className={styles.menuName}>{item.name}</span>
              <span className={styles.menuCount}>({item.quantity})</span>
            </li>
          ))}
          {extraCount > 0 && <li className={styles.extraItem}>외 {extraCount}개</li>}
        </ul>
      )}

      {!isEmptyState && statusConfig && (
        <div className={styles.footer}>
          <span className={`${styles.statusBadge} ${statusConfig.badgeClassName}`}>
            <statusConfig.Icon className={styles.statusIcon} aria-hidden="true" />
            {statusConfig.label}
          </span>
          {typeof totalPrice === 'number' && (
            <span className={styles.price}>{totalPrice.toLocaleString('ko-KR')}원</span>
          )}
        </div>
      )}
    </article>
  );
}
