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
  stat: OrderStatus;
  onDetailClick?: ClickHandler;
  onAccept?: ClickHandler;
  onPrev?: ClickHandler;
  onReject?: ClickHandler;
  onCancel?: ClickHandler;
  isAccepting?: boolean;
  isReverting?: boolean;
  isAcceptDisabled?: boolean;
}

const formatTableNumber = (value: number | string | null | undefined) => {
  if (typeof value === 'number') {
    return `테이블 ${String(value).padStart(2, '0')}`;
  }

  if (typeof value !== 'string') {
    return '-';
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

type StatusActionConfig = {
  prevLabel: string;
  prevIcon: 'close' | 'back';
  prevAction: 'reject' | 'prev' | 'cancel';
  nextLabel?: string;
};

const STATUS_ACTION_CONFIG: Record<OrderStatus, StatusActionConfig> = {
  PENDING: {
    prevLabel: '거절',
    prevIcon: 'close',
    prevAction: 'reject',
    nextLabel: '수락',
  },
  COOKING: {
    prevLabel: '이전',
    prevIcon: 'back',
    prevAction: 'prev',
    nextLabel: '다음',
  },
  COMPLETE: {
    prevLabel: '이전',
    prevIcon: 'back',
    prevAction: 'prev',
  },
};

export default function OrderLookupCard({
  tableNumber,
  depositorName,
  depositAmount,
  couponAmount,
  stat,
  onDetailClick,
  onAccept,
  onPrev,
  onReject,
  onCancel,
  isAccepting = false,
  isReverting = false,
  isAcceptDisabled = false,
  className,
  ...rest
}: OrderLookupCardProps) {
  const cardClassName = className ? `${styles.card} ${className}` : styles.card;

  const isServiceOrder = depositorName === '서비스';
  const actionConfig: StatusActionConfig = isServiceOrder
    ? {
        prevLabel: '취소',
        prevIcon: 'close',
        prevAction: 'cancel',
        nextLabel: undefined,
      }
    : STATUS_ACTION_CONFIG[stat];
  const handlePrevClick =
    actionConfig.prevAction === 'reject' ? onReject : actionConfig.prevAction === 'cancel' ? onCancel : onPrev;

  return (
    <article className={cardClassName} data-status={stat} {...rest}>
      <div className={styles.header}>
        <span className={styles.tableNumber}>{formatTableNumber(tableNumber)}</span>
        <button type="button" className={styles.detailButton} onClick={onDetailClick}>
          자세히 보기
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
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={styles.rejectButton}
          onClick={handlePrevClick}
          isLoading={isReverting}
          disabled={isReverting}
        >
          {actionConfig.prevIcon === 'close' ? (
            <CloseIcon className={`${styles.actionIcon} ${styles.rejectIcon}`} aria-hidden="true" />
          ) : (
            <BackIcon className={`${styles.actionIcon} ${styles.rejectIcon}`} aria-hidden="true" />
          )}
          {actionConfig.prevLabel}
        </Button>
        {!!actionConfig.nextLabel && (
          <Button
            type="button"
            size="sm"
            className={styles.actionButton}
            onClick={onAccept}
            isLoading={isAccepting}
            disabled={isAcceptDisabled || isAccepting}
          >
            <CheckIcon className={styles.actionIcon} aria-hidden="true" />
            {actionConfig.nextLabel}
          </Button>
        )}
      </div>
    </article>
  );
}
