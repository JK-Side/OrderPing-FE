import { useQueryClient } from '@tanstack/react-query';
import { useState, type ChangeEvent } from 'react';
import type { TableResponse } from '@/api/table/entity';
import Button from '@/components/Button';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/Modal';
import { useToast } from '@/components/Toast/useToast';
import { useUpdateTableMemo } from '@/pages/TableOperate/hooks/useUpdateTableMemo';
import styles from './TableOrderModal.module.scss';

interface TableOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServiceAdd?: () => void;
  onDirectOrderAdd?: () => void;
  table: TableResponse | null;
}

const MEMO_MAX_LENGTH = 100;

const formatCurrency = (value: number) => `${value.toLocaleString('ko-KR')}원`;

const formatTableLabel = (tableNum: number) => `테이블 ${String(tableNum).padStart(2, '0')}`;

export default function TableOrderModal({ open, onOpenChange, onServiceAdd, onDirectOrderAdd, table }: TableOrderModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { mutateAsync: updateTableMemo, isPending: isSavingMemo } = useUpdateTableMemo();
  const [memoDraft, setMemoDraft] = useState<{ tableId: number | null; value: string }>({
    tableId: null,
    value: '',
  });

  const handleModalOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setMemoDraft({
        tableId: null,
        value: '',
      });
    }
    onOpenChange(nextOpen);
  };

  if (!table) return null;

  const orderMenus = table.orderMenus ?? [];
  const serviceMenus = table.serviceMenus ?? [];
  const isEmpty = table.orderStatus === null;
  const memo = memoDraft.tableId === table.id ? memoDraft.value : (table.memo ?? '');
  const originalMemo = table.memo ?? '';
  const isMemoTooLong = memo.length > MEMO_MAX_LENGTH;
  const isMemoDirty = memo !== originalMemo;

  const handleMemoChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setMemoDraft({
      tableId: table.id,
      value: event.target.value,
    });
  };

  const handleSaveMemo = async () => {
    if (isSavingMemo || !isMemoDirty || isMemoTooLong) return;

    try {
      const updatedTable = await updateTableMemo({
        tableId: table.id,
        body: {
          memo,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ['tables', table.storeId] });
      setMemoDraft({
        tableId: table.id,
        value: updatedTable.memo ?? '',
      });
      toast({
        message: '메모를 저장했습니다.',
        variant: 'info',
      });
    } catch (error) {
      const status = (error as { status?: number })?.status;
      const message =
        status === 400
          ? '메모는 100자 이하로 입력해 주세요.'
          : status === 401
            ? '로그인이 필요한 기능입니다.'
            : status === 403
              ? '본인 매장 테이블만 수정할 수 있습니다.'
              : status === 404
                ? '테이블을 찾을 수 없습니다.'
                : '메모 저장에 실패했습니다.';
      toast({
        message,
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      });
    }
  };

  return (
    <Modal open={open} onOpenChange={handleModalOpenChange}>
      <ModalContent className={styles.modalContent}>
        <ModalHeader>
          <ModalTitle className={styles.tableTitle}>{formatTableLabel(table.tableNum)}</ModalTitle>
        </ModalHeader>
        <ModalBody className={styles.body}>
          <div className={styles.menuTable}>
            {isEmpty && <div className={styles.menuTable__empty}>아직 주문이 들어오지 않았어요!</div>}

            {orderMenus.length > 0 && (
              <div className={styles.menuHeader}>
                <span className={styles.menuHeaderTitle}>메뉴명</span>
                <span className={styles.menuQuantity}>수량</span>
                <span className={styles.menuHeaderPrice}>가격</span>
              </div>
            )}

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

          {/* <div className={styles.qrSection}>
            <div className={styles.qrTitle}>테이블 QR</div>
            {table.qrImageUrl ? (
              <img src={table.qrImageUrl} className={styles.qrImg} alt="qr 이미지" />
            ) : (
              <div className={styles.qrPlaceholder}>QR코드가 존재하지 않습니다.</div>
            )}
          </div> */}

          <div className={styles.memoSection}>
            <div className={styles.memoHeader}>
              <span className={styles.memoTitle}>테이블 메모</span>
              <div className={styles.memoHeader}>
                <span className={`${styles.memoCount} ${isMemoTooLong ? styles.memoCountError : ''}`}>
                  {memo.length}/{MEMO_MAX_LENGTH}
                </span>
                <div className={styles.memoActions}>
                  <Button
                    type='button'
                    className={styles.memoSaveButton}
                    onClick={handleSaveMemo}
                    disabled={isSavingMemo || !isMemoDirty || isMemoTooLong}
                    isLoading={isSavingMemo}
                  >
                    저장
                  </Button>
                </div>
              </div>
            </div>
            <textarea
              className={styles.memoInput}
              value={memo}
              onChange={handleMemoChange}
              maxLength={MEMO_MAX_LENGTH}
              placeholder='손님의 요청사항을 입력해 주세요.'
              aria-label='테이블 메모'
            />
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
            <Button type='button' className={styles.footerButton} onClick={onServiceAdd} disabled={!onServiceAdd}>
              서비스 추가
            </Button>
            <Button
              type='button'
              variant='secondary'
              className={styles.footerButton}
              onClick={onDirectOrderAdd}
              disabled={!onDirectOrderAdd}
            >
              주문 직접 추가
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
