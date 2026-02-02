import type { HTMLAttributes } from 'react';
import type { OrderStatus } from '@/api/order/entity';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import BackIcon from '@/assets/icons/back.svg?react';
import CheckIcon from '@/assets/icons/check.svg?react';
import CloseIcon from '@/assets/icons/close.svg?react';
import Button from '@/components/Button';
import styles from './OrderLookupCard.module.scss';

type ClickHandler = () => void;

interface OrderLookupCardProps extends HTMLAttributes<HTMLElement> {
  tableNumber: number | string;
  depositorName: string;
  depositAmount: number;
  couponAmount?: number;
  stat?: OrderStatus;
  onDetailClick?: ClickHandler;
  onAccept?: ClickHandler;
  onReject?: ClickHandler;
  isAccepting?: boolean;
  isAcceptDisabled?: boolean;
}

const formatTableNumber = (value: number | string) => {
  if (typeof value === 'number') {
    return `테이블 ${String(value).padStart(2, '0')}`;
  }

  if (value.startsWith('테이블')) {
    return value;
  }

  return `테이블 ${value}`;
};

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number' || value === 0) return '-';
  return `${value.toLocaleString('ko-KR')}원`;
};

export default function OrderLookupCard({
  tableNumber,
  depositorName,
  depositAmount,
  couponAmount,
  stat,
  onDetailClick,
  onAccept,
  onReject,
  isAccepting = false,
  isAcceptDisabled = false,
  className,
  ...rest
}: OrderLookupCardProps) {
  const cardClassName = className ? `${styles.card} ${className}` : styles.card;

  const prevBtnText = stat === 'PENDING' ? '거절' : '이전';
  const nextBtnText = stat === 'PENDING' ? '수락' : '다음';

  return (
    <article className={cardClassName} data-status={stat} {...rest}>
      <div className={styles.header}>
        <span className={styles.tableNumber}>{formatTableNumber(tableNumber)}</span>
        <button type="button" className={styles.detailButton} onClick={onDetailClick}>
          자세히보기
          <ArrowRightIcon className={styles.detailIcon} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.depositorName}>{depositorName}</div>
        <div className={styles.amountList}>
          {!!depositAmount && (
            <div className={styles.amountRow}>
              <span className={styles.amountLabel}>입금</span>
              <span className={styles.amountValue}>{formatCurrency(depositAmount)}</span>
            </div>
          )}
          {!!couponAmount && (
            <div className={styles.amountRow}>
              <span className={styles.amountLabel}>쿠폰</span>
              <span className={styles.amountValue}>{formatCurrency(couponAmount)}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.rejectButton} onClick={onReject}>
          {stat === 'PENDING' ? (
            <CloseIcon className={`${styles.actionIcon} ${styles.rejectIcon}`} aria-hidden="true" />
          ) : (
            <BackIcon className={`${styles.actionIcon} ${styles.rejectIcon}`} aria-hidden="true" />
          )}
          {prevBtnText}
        </button>
        {stat !== 'COMPLETE' && (
          <Button
            type="button"
            size="sm"
            className={styles.actionButton}
            onClick={onAccept}
            isLoading={isAccepting}
            disabled={isAcceptDisabled || isAccepting}
          >
            <CheckIcon className={styles.actionIcon} aria-hidden="true" />
            {nextBtnText}
          </Button>
        )}
      </div>
    </article>
  );
}
