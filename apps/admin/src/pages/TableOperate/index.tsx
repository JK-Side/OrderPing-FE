import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { TableResponse } from '@/api/table/entity';
import AddTableIcon from '@/assets/icons/add-table.svg?react';
import CloseIcon from '@/assets/icons/close.svg?react';
import DownloadIcon from '@/assets/icons/download.svg?react';
import InfoIcon from '@/assets/icons/info-circle.svg?react';
import Button from '@/components/Button';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/Modal';
import { useToast } from '@/components/Toast/useToast';
import OrderCard from '@/pages/TableOperate/components/OrderCard';
import TableCreateModal from '@/pages/TableOperate/components/TableCreateModal';
import TableDirectOrderModal from '@/pages/TableOperate/components/TableDirectOrderModal';
import TableOrderModal from '@/pages/TableOperate/components/TableOrderModal';
import TableServiceModal from '@/pages/TableOperate/components/TableServiceModal';
import { useClearTables } from '@/pages/TableOperate/hooks/useClearTables';
import { useDeleteTables } from '@/pages/TableOperate/hooks/useDeleteTables';
import { useTablesByStore } from '@/pages/TableOperate/hooks/useTablesByStore';
import styles from './TableOperate.module.scss';

const ORDER_STATUS_PRIORITY = ['PENDING', 'COOKING', 'COMPLETE'] as const;
const TABLE_GUIDE_BANNER_DISMISSED_KEY = 'table-guide-banner-dismissed';

const formatTableName = (tableNum: number) => `테이블 ${String(tableNum).padStart(2, '0')}`;

const resolvePriorityOrderStatus = (rawStatus: TableResponse['orderStatus']) => {
  if (!rawStatus) return undefined;
  const statuses = Array.isArray(rawStatus) ? rawStatus : [rawStatus];
  return ORDER_STATUS_PRIORITY.find((status) => statuses.includes(status));
};

const resolveOrderStatuses = (rawStatus: TableResponse['orderStatus']) => {
  if (!rawStatus) return [];
  return Array.isArray(rawStatus) ? rawStatus : [rawStatus];
};

const hasIncompleteOrderOnTable = (table: TableResponse) => {
  const statuses = resolveOrderStatuses(table.orderStatus);
  return statuses.some((status) => status === 'PENDING' || status === 'COOKING');
};

const hasOrdersForTable = (table: TableResponse) =>
  (table.orderMenus?.length ?? 0) > 0 ||
  (table.serviceMenus?.length ?? 0) > 0 ||
  (table.totalOrderAmount ?? 0) > 0 ||
  !!table.orderStatus;

const isOrderableTable = (table?: TableResponse | null) => table?.status === 'OCCUPIED' || table?.status === 'EMPTY';

export default function TableOperate() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { id } = useParams();
  const parsedId = id ? Number(id) : undefined;
  const storeId = Number.isFinite(parsedId) ? parsedId : undefined;

  const { data: tables = [] } = useTablesByStore(storeId);
  const { mutateAsync: clearTables, isPending: isClearing } = useClearTables();
  const { mutateAsync: clearTablesForDelete } = useClearTables();
  const { mutateAsync: deleteTables, isPending: isDeleting } = useDeleteTables();
  const { toast } = useToast();

  const sortedTables = [...tables].sort((a, b) => a.tableNum - b.tableNum);
  const hasTables = tables.length > 0;
  const hasActiveOrders = tables.some(hasIncompleteOrderOnTable);
  const tableButtonLabel = hasTables ? '테이블 수정' : '테이블 추가';
  const [selectedTableIds, setSelectedTableIds] = useState<number[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [serviceTableId, setServiceTableId] = useState<number | null>(null);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isDirectOrderOpen, setIsDirectOrderOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [directOrderReturnTableId, setDirectOrderReturnTableId] = useState<number | null>(null);
  const [isDismissed, setIsDismissed] = useState(() => {
    return window.localStorage.getItem(TABLE_GUIDE_BANNER_DISMISSED_KEY) === 'true';
  });

  const selectableTableIds = sortedTables.map((table) => table.id);
  const isAllSelected =
    selectableTableIds.length > 0 && selectableTableIds.every((tableId) => selectedTableIds.includes(tableId));

  const handleToggleSelect = (tableId: number) => {
    setSelectedTableIds((prev) => (prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]));
  };

  const handleToggleSelectAll = () => {
    if (selectableTableIds.length === 0) return;
    setSelectedTableIds(isAllSelected ? [] : selectableTableIds);
  };

  const handleOpenQrPrint = () => {
    if (!storeId) return;
    navigate(`/store/${storeId}/qr-print`);
  };

  const handleClearTables = async () => {
    if (!storeId || selectedTableIds.length === 0 || isClearing) return;

    const selectedTables = tables.filter((table) => selectedTableIds.includes(table.id));
    if (selectedTables.length === 0) return;
    const hasOrderTables = selectedTables.some(hasIncompleteOrderOnTable);

    if (hasOrderTables) {
      toast({
        message: '주문이 있는 테이블은 비울 수 없습니다.',
        variant: 'error',
      });
      return;
    }

    const hasAlreadyEmptyTables = selectedTables.some(
      (table) => table.status === 'CLOSED' || !hasOrdersForTable(table),
    );

    if (hasAlreadyEmptyTables) {
      toast({
        message: '이미 빈 테이블은 다시 비울 수 없습니다.',
        variant: 'error',
      });
      return;
    }

    try {
      await clearTables({
        storeId,
        tableNums: selectedTables.map((table) => table.tableNum),
      });
      await queryClient.invalidateQueries({ queryKey: ['tables', storeId] });
      setSelectedTableIds([]);
      setIsClearConfirmOpen(false);
      toast({
        message: '테이블 비우기가 완료되었습니다.',
        variant: 'info',
      });
    } catch (error) {
      const status = (error as { status?: number })?.status;
      const message =
        status === 401
          ? '로그인이 필요한 기능입니다.'
          : status === 403
            ? '본인 매장의 테이블만 비울 수 있습니다.'
            : status === 404
              ? '비울 테이블을 찾을 수 없습니다.'
              : '테이블 비우기에 실패했습니다.';

      toast({
        message,
        variant: 'error',
      });
      console.error('Failed to clear tables', error);
    }
  };

  const handleDeleteTables = async () => {
    if (!storeId || selectedTableIds.length === 0 || isDeleting) return;

    const selectedTables = tables.filter((table) => selectedTableIds.includes(table.id));
    if (selectedTables.length === 0) return;
    const hasOrderTables = selectedTables.some(hasIncompleteOrderOnTable);

    if (hasOrderTables) {
      toast({
        message: '주문이 있는 테이블은 삭제할 수 없습니다.',
        variant: 'error',
      });
      return;
    }

    try {
      const tablesNeedClearBeforeDelete = selectedTables.filter(
        (table) => table.status !== 'CLOSED' && hasOrdersForTable(table),
      );

      if (tablesNeedClearBeforeDelete.length > 0) {
        await clearTablesForDelete({
          storeId,
          tableNums: tablesNeedClearBeforeDelete.map((table) => table.tableNum),
        });
      }

      await deleteTables({
        storeId,
        tableNums: selectedTables.map((table) => table.tableNum),
      });
      await queryClient.invalidateQueries({ queryKey: ['tables', storeId] });
      setSelectedTableIds([]);
      setIsDeleteConfirmOpen(false);
      toast({
        message: '테이블 삭제가 완료되었습니다.',
        variant: 'info',
      });
    } catch (error) {
      const status = (error as { status?: number })?.status;

      const message =
        status === 400
          ? '주문이 있는 테이블은 삭제할 수 없습니다.'
          : status === 401
            ? '로그인이 필요한 기능입니다.'
            : status === 403
              ? '자신의 주점의 테이블만 삭제 가능합니다.'
              : status === 404
                ? '주점을 찾을 수 없습니다.'
                : '테이블 삭제에 실패했습니다.';

      toast({
        message,
        variant: 'error',
      });
    }
  };

  const handleOpenDetail = (table: TableResponse) => {
    setSelectedTableId(table.id);
    setIsDetailOpen(true);
  };

  const handleDetailOpenChange = (open: boolean) => {
    setIsDetailOpen(open);
    if (!open) {
      setSelectedTableId(null);
    }
  };

  const handleServiceOpen = (table: TableResponse) => {
    if (!isOrderableTable(table)) return;
    setServiceTableId(table.id);
    setIsServiceOpen(true);
    handleDetailOpenChange(false);
  };

  const handleServiceOpenChange = (open: boolean) => {
    setIsServiceOpen(open);
    if (!open) {
      setServiceTableId(null);
    }
  };

  const selectedTable = selectedTableId ? (tables.find((table) => table.id === selectedTableId) ?? null) : null;
  const serviceTable = serviceTableId ? (tables.find((table) => table.id === serviceTableId) ?? null) : null;
  const directOrderTable = directOrderReturnTableId
    ? (tables.find((table) => table.id === directOrderReturnTableId) ?? null)
    : null;
  const canServiceAdd = isOrderableTable(selectedTable);

  const handleClose = () => {
    window.localStorage.setItem(TABLE_GUIDE_BANNER_DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  const handleDirectOrderOpenChange = (open: boolean) => {
    setIsDirectOrderOpen(open);
  };

  const handleDirectOrderFromDetail = () => {
    if (!selectedTableId) return;
    setDirectOrderReturnTableId(selectedTableId);
    handleDetailOpenChange(false);
    handleDirectOrderOpenChange(true);
  };

  const handleDirectOrderCancel = () => {
    if (!directOrderReturnTableId) return;
    setSelectedTableId(directOrderReturnTableId);
    setIsDetailOpen(true);
    setDirectOrderReturnTableId(null);
  };

  return (
    <section className={styles.tableOperate}>
      <div className={styles.panel}>
        <div className={styles.summaryRow}>
          <div className={styles.summaryRow__title}>테이블 배치</div>
          <div className={styles.sidePanel}>
            {!isDismissed && (
              <div className={styles.noticeCard}>
                <InfoIcon className={styles.noticeIcon} aria-hidden='true' />
                <p className={styles.noticeText}>테이블의 체크박스를 누르고 테이블을 비워보세요!</p>
                <button
                  type='button'
                  className={styles.noticeClose}
                  aria-label='안내 닫기'
                  // onClick={() => setIsNoticeVisible(false)}
                  onClick={handleClose}
                >
                  <CloseIcon className={styles.noticeCloseIcon} aria-hidden='true' />
                </button>
              </div>
            )}
            <div className={styles.actionButtons}>
              {selectedTableIds.length > 0 ? (
                <Button
                  className={styles.deleteButton}
                  type='button'
                  variant='danger'
                  size='md'
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  disabled={isDeleting}
                  isLoading={isDeleting}
                >
                  테이블 삭제
                </Button>
              ) : null}

              {selectedTableIds.length > 0 ? (
                <Button
                  className={styles.clearButton}
                  size='md'
                  onClick={() => setIsClearConfirmOpen(true)}
                  disabled={selectedTableIds.length === 0 || isClearing}
                  isLoading={isClearing}
                >
                  테이블 비우기
                </Button>
              ) : null}

              {hasTables ? (
                <Button
                  className={styles.selectAllButton}
                  type='button'
                  variant='ghost'
                  size='md'
                  onClick={handleToggleSelectAll}
                >
                  {isAllSelected ? '선택 해제' : '전체 선택'}
                </Button>
              ) : null}

              <Button
                className={styles.printButton}
                variant='secondary'
                size='md'
                onClick={handleOpenQrPrint}
                disabled={!storeId}
              >
                <DownloadIcon className={styles.printButtonIcon} aria-hidden='true' />
                QR 일괄 출력
              </Button>

              <TableCreateModal
                storeId={storeId}
                hasActiveOrders={hasActiveOrders}
                name={tableButtonLabel}
                mode={hasTables ? 'edit' : 'create'}
                tables={sortedTables}
                initialValues={
                  hasTables
                    ? {
                        tableCount: tables.length,
                      }
                    : null
                }
              />
            </div>
          </div>
        </div>

        <div className={styles.sectionDivider} />

        {hasTables ? (
          <div className={styles.orderPreviewScroll}>
            <div className={styles.orderPreview}>
              {sortedTables.map((table: TableResponse) => {
                const hasOrders = hasOrdersForTable(table);
                const isEmpty = !hasOrders;
                const resolvedOrderStatus = resolvePriorityOrderStatus(table.orderStatus);
                const status = hasOrders && resolvedOrderStatus ? resolvedOrderStatus : undefined;
                const items = table.orderMenus?.map((menu) => ({
                  name: menu.menuName,
                  quantity: menu.quantity,
                }));
                const serviceMenus = table.serviceMenus?.map((menu) => ({
                  name: menu.menuName,
                  quantity: menu.quantity,
                }));

                return (
                  <OrderCard
                    key={table.id}
                    tableName={formatTableName(table.tableNum)}
                    isEmpty={isEmpty}
                    status={status}
                    items={items}
                    serviceMenus={serviceMenus}
                    totalPrice={table.totalOrderAmount}
                    isSelected={selectedTableIds.includes(table.id)}
                    onToggleSelect={() => handleToggleSelect(table.id)}
                    onOpenDetail={() => handleOpenDetail(table)}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <AddTableIcon className={styles.emptyIcon} aria-hidden='true' />
            <p className={styles.emptyText}>테이블을 추가해 보세요!</p>
          </div>
        )}
      </div>

      <TableOrderModal
        open={isDetailOpen}
        onOpenChange={handleDetailOpenChange}
        onServiceAdd={canServiceAdd && selectedTable ? () => handleServiceOpen(selectedTable) : undefined}
        onDirectOrderAdd={selectedTable ? handleDirectOrderFromDetail : undefined}
        table={selectedTable}
      />

      <TableServiceModal open={isServiceOpen} onOpenChange={handleServiceOpenChange} table={serviceTable} />

      <Modal open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>테이블 비우기</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <p className={styles.clearConfirmMessage}>
              해당 테이블의 현재 주문 내역이 모두 삭제됩니다.
              <br />
              단, 완료된 판매 이력은 주문 통계에 반영되므로
              <br />
              매출 집계에는 영향을 주지 않습니다.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              type='button'
              variant='ghost'
              size='md'
              fullWidth
              onClick={handleClearTables}
              isLoading={isClearing}
            >
              테이블 비우기
            </Button>
            <Button type='button' variant='danger' size='md' fullWidth onClick={() => setIsClearConfirmOpen(false)}>
              취소
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>테이블 삭제</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <p className={styles.deleteConfirmMessage}>
              한 번 삭제된 테이블은 되돌릴 수 없습니다. <br /> 계속하시겠습니까?
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              type='button'
              variant='ghost'
              size='md'
              fullWidth
              onClick={handleDeleteTables}
              isLoading={isDeleting}
            >
              테이블 삭제
            </Button>
            <Button type='button' variant='danger' size='md' fullWidth onClick={() => setIsDeleteConfirmOpen(false)}>
              취소
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <TableDirectOrderModal
        open={isDirectOrderOpen}
        onOpenChange={handleDirectOrderOpenChange}
        onCancel={handleDirectOrderCancel}
        table={directOrderTable}
      />
    </section>
  );
}
