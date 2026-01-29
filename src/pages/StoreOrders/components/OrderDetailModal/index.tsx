import Button from '@/components/Button';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/Modal';
import type { OrderLookupResponse } from '@/mocks/orderLookup';
import styles from './OrderDetailModal.module.scss';

export type OrderDetailItem = {
  name: string;
  quantity: number;
  price: number;
};

interface OrderDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderLookupResponse | null;
  items: OrderDetailItem[];
}

const formatCurrency = (value: number) => `${value.toLocaleString('ko-KR')}원`;

const formatDateTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatTableLabel = (tableId: number) => `테이블 ${String(tableId).padStart(2, '0')}`;

export default function OrderDetailModal({ open, onOpenChange, order, items }: OrderDetailModalProps) {
  if (!order) return null;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className={styles.modalContent}>
        <ModalHeader>
          <div className={styles.headerContent}>
            <span className={styles.orderBadge}>주문번호 {order.id}</span>
            <ModalTitle className={styles.tableTitle}>{formatTableLabel(order.tableId)}</ModalTitle>
          </div>
        </ModalHeader>
        <ModalBody className={styles.body}>
          <div className={styles.menuTable}>
            <div className={styles.menuHeader}>
              <span className={styles.menuHeader__title}>메뉴명</span>
              <span className={styles.menuQuantity}>수량</span>
              <span className={styles.menuHeaderPrice}>가격</span>
            </div>
            {items.map((item) => (
              <div key={item.name} className={styles.menuRow}>
                <span className={styles.menuName}>{item.name}</span>
                <span className={styles.menuQuantity}>{item.quantity}</span>
                <span className={styles.menuPrice}>{formatCurrency(item.price)}</span>
              </div>
            ))}
          </div>

          <div className={styles.summary}>
            <div className={styles['summary-row']}>
              <span>주문일시</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>

            <div className={styles['summary-group']}>
              <div className={styles['summary-row__strong']}>
                <span>입금자명</span>
                <span className={styles.summaryValue}>{order.depositorName}</span>
              </div>

              <div className={styles['summary-group__value']}>
                <div className={styles['summary-row__strong']}>
                  <span>총 금액</span>
                  <span className={styles.summaryValueAccent}>{formatCurrency(order.totalPrice)}</span>
                </div>
                <div className={styles['summary-group__detail']}>
                  <div className={styles['summary-row']}>
                    <span>입금 금액</span>
                    <span className={styles.summaryValueAccent}>{formatCurrency(order.cashAmount)}</span>
                  </div>
                  <div className={styles['summary-row']}>
                    <span>쿠폰 금액</span>
                    <span className={styles.summaryValueAccent}>{formatCurrency(order.couponAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className={styles.footer}>
          <div className={styles.footerButtons}>
            <Button type="button" variant="danger" className={styles.footerButton}>
              거절
            </Button>
            <Button type="button" className={styles.footerButton}>
              수락
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
