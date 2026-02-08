import { useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import type { TableResponse } from '@/api/table/entity';
import Button from '@/components/Button';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/Modal';
import { useToast } from '@/components/Toast/useToast';
import { useClearTable } from '@/pages/TableOperate/hooks/useClearTable';
import styles from './TableOrderModal.module.scss';

interface TableOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServiceAdd?: () => void;
  table: TableResponse | null;
}

const formatCurrency = (value: number) => `${value.toLocaleString('ko-KR')}원`;

const formatTableLabel = (tableNum: number) => `테이블 ${String(tableNum).padStart(2, '0')}`;

const QR_DISPLAY_SIZE = 100;

const isSvgImageUrl = (url: string) => /\.svg(\?|#|$)/i.test(url) || url.startsWith('data:image/svg+xml');

const resolveOrderStatuses = (rawStatus: TableResponse['orderStatus']) => {
  if (!rawStatus) return [];
  return Array.isArray(rawStatus) ? rawStatus : [rawStatus];
};

const isTableClearable = (rawStatus: TableResponse['orderStatus']) => {
  const statuses = resolveOrderStatuses(rawStatus);
  return statuses.length > 0 && statuses.every((status) => status === 'COMPLETE');
};

const resolveQrValue = (table: TableResponse) => {
  if (table.qrImageUrl) return table.qrImageUrl;
  if (typeof window === 'undefined') return '';
  const url = new URL(`/customer/store/${table.storeId}`, window.location.origin);
  url.searchParams.set('tableId', String(table.tableNum));
  return url.toString();
};

export default function TableOrderModal({ open, onOpenChange, onServiceAdd, table }: TableOrderModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { mutateAsync: clearTable, isPending: isClearing } = useClearTable();

  if (!table) return null;

  const orderMenus = table.orderMenus ?? [];
  const serviceMenus = table.serviceMenus ?? [];
  const canClearTable = isTableClearable(table.orderStatus);

  const handleClearTable = async () => {
    if (!canClearTable) {
      toast({
        message: '모든 주문이 완료된 테이블만 비울 수 있습니다.',
        variant: 'error',
      });
      return;
    }

    try {
      await clearTable(table.id);
      await queryClient.invalidateQueries({ queryKey: ['tables', table.storeId] });
      toast({
        message: '테이블 비우기가 완료되었습니다.',
        variant: 'info',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        message: '테이블 비우기에 실패했습니다.',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      });
      console.error('Failed to clear table', error);
    }
  };
  const qrValue = resolveQrValue(table);
  const qrNode =
    isSvgImageUrl(table.qrImageUrl) && qrValue ? (
      <QRCodeSVG
        className={styles.qrImage}
        value={qrValue}
        size={QR_DISPLAY_SIZE}
        level="M"
        includeMargin
        role="img"
        aria-label="Table QR"
      />
    ) : (
      <img className={styles.qrImage} src={table.qrImageUrl} alt="Table QR" />
    );

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className={styles.modalContent}>
        <ModalHeader>
          <ModalTitle className={styles.tableTitle}>{formatTableLabel(table.tableNum)}</ModalTitle>
        </ModalHeader>
        <ModalBody className={styles.body}>
          <div className={styles.menuTable}>
            <div className={styles.menuHeader}>
              <span className={styles.menuHeaderTitle}>메뉴명</span>
              <span className={styles.menuQuantity}>수량</span>
              <span className={styles.menuHeaderPrice}>가격</span>
            </div>

            {orderMenus.length > 0 &&
              orderMenus.map((item) => (
                <div key={`order-${item.menuId}-${item.menuName}`} className={styles.menuRow}>
                  <span className={styles.menuName}>{item.menuName}</span>
                  <span className={styles.menuQuantity}>{item.quantity}</span>
                  <span className={styles.menuPrice}>{formatCurrency(item.price)}</span>
                </div>
              ))}

            {serviceMenus.length > 0 &&
              serviceMenus.map((item) => (
                <div key={`service-${item.menuId}-${item.menuName}`} className={styles.menuRow}>
                  <span className={styles.menuName}>{item.menuName}</span>
                  <span className={styles.menuQuantity}>{item.quantity}</span>
                  <span className={styles.menuPrice}>서비스</span>
                </div>
              ))}
          </div>

          <div className={styles.qrSection}>
            <div className={styles.qrTitle}>테이블 QR</div>
            {table.qrImageUrl ? qrNode : <div className={styles.qrPlaceholder}>QR코드가 존재하지 않습니다.</div>}
          </div>

          <div className={styles['summary-group']}>
            <div className={styles.summary}>
              <span>총 금액</span>
              <span className={styles.summary__text}>{formatCurrency(table.totalOrderAmount ?? 0)}</span>
            </div>

            <div className={styles['payment-group']}>
              <div className={styles.payment}>
                <span>입금 금액</span>
                <span className={styles.payment__text}>{formatCurrency(table.totalOrderAmount ?? 0)}</span>
              </div>
              <div className={styles.payment}>
                <span>쿠폰 금액</span>
                <span className={styles.payment__text}>{formatCurrency(table.totalOrderAmount ?? 0)}</span>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className={styles.footer}>
          <div className={styles.footerButtons}>
            <Button type="button" className={styles.footerButton} onClick={onServiceAdd} disabled={!onServiceAdd}>
              서비스 추가
            </Button>
            <Button
              type="button"
              variant="danger"
              className={styles.footerButton}
              onClick={handleClearTable}
              disabled={isClearing || !canClearTable}
              isLoading={isClearing}
            >
              테이블 비우기
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
