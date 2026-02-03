import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { TableResponse } from '@/api/table/entity';
import AddMenuIcon from '@/assets/icons/add-menu.svg?react';
import AddTableIcon from '@/assets/icons/add-table.svg?react';
import CloseIcon from '@/assets/icons/close.svg?react';
import InfoIcon from '@/assets/icons/info-circle.svg?react';
import StoreDefault from '@/assets/imgs/store_default.svg?url';
import Button from '@/components/Button';
import StoreSummaryCard from '@/components/StoreSummaryCard';
import summaryStyles from '@/components/StoreSummaryCard/StoreSummaryCard.module.scss';
import { useToast } from '@/components/Toast/useToast';
import StoreSettingsModal from '@/pages/StoreOperate/components/StoreSettingsModal';
import { useStoreById } from '@/pages/StoreOperate/hooks/useStore';
import OrderCard from '@/pages/TableOperate/components/OrderCard';
import TableCreateModal from '@/pages/TableOperate/components/TableCreateModal';
import { useClearTable } from '@/pages/TableOperate/hooks/useClearTable';
import { useTablesByStore } from '@/pages/TableOperate/hooks/useTablesByStore';
import styles from './TableOperate.module.scss';

type OrderStatus = 'served' | 'cooking' | 'payment';

const ORDER_STATUS_PRIORITY = ['PENDING', 'COOKING', 'COMPLETE'] as const;

const formatTableName = (tableNum: number) => `테이블 ${String(tableNum).padStart(2, '0')}`;
const getLayoutStorageKey = (storeId: number) => `table-layout:${storeId}`;
const parseStoredLayout = (value: string | null) => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as { columns?: number; rows?: number };
    if (
      typeof parsed?.columns === 'number' &&
      typeof parsed?.rows === 'number' &&
      parsed.columns > 0 &&
      parsed.rows > 0
    ) {
      return { columns: parsed.columns, rows: parsed.rows };
    }
  } catch {
    return null;
  }
  return null;
};

const resolvePriorityOrderStatus = (rawStatus: TableResponse['orderStatus']) => {
  if (!rawStatus) return undefined;
  const statuses = Array.isArray(rawStatus) ? rawStatus : [rawStatus];
  return ORDER_STATUS_PRIORITY.find((status) => statuses.includes(status));
};

export default function TableOperate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { id } = useParams();
  const parsedId = id ? Number(id) : undefined;
  const storeId = Number.isFinite(parsedId) ? parsedId : undefined;

  const tableLayout =
    storeId && typeof window !== 'undefined'
      ? parseStoredLayout(localStorage.getItem(getLayoutStorageKey(storeId)))
      : null;

  const { data: storeDetail } = useStoreById(storeId);
  const { data: tables = [] } = useTablesByStore(storeId);
  const { mutateAsync: clearTable, isPending: isClearing } = useClearTable();
  const { toast } = useToast();

  const storeName = storeDetail?.name ?? '주점';
  const storeImageUrl = storeDetail?.imageUrl ?? '';
  const storeImage = storeImageUrl || StoreDefault;
  const storeDescription = storeDetail?.description ?? '';

  const sortedTables = [...tables].sort((a, b) => a.tableNum - b.tableNum);
  const hasTables = tables.length > 0;
  const hasActiveOrders = tables.some((table: TableResponse) => table.status === 'OCCUPIED');
  const tableButtonLabel = hasTables ? '테이블 수정' : '테이블 추가';
  const [isNoticeVisible, setIsNoticeVisible] = useState(true);
  const [selectedTableIds, setSelectedTableIds] = useState<number[]>([]);

  const useGridLayout = !!tableLayout && tableLayout.columns > 0 && tableLayout.rows > 0;
  const tableGridStyle = useGridLayout
    ? {
        gridTemplateColumns: `repeat(${tableLayout.columns}, minmax(220px, 300px))`,
        gridTemplateRows: `repeat(${tableLayout.rows}, 222px)`,
      }
    : undefined;

  const handleLayoutSave = (layout: { columns: number; rows: number }) => {
    if (!storeId || typeof window === 'undefined') return;
    localStorage.setItem(getLayoutStorageKey(storeId), JSON.stringify(layout));
  };

  const handleToggleSelect = (tableId: number) => {
    setSelectedTableIds((prev) => (prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]));
  };

  const handleClearTables = async () => {
    if (!storeId || selectedTableIds.length === 0 || isClearing) return;

    const selectedTables = tables.filter((table) => selectedTableIds.includes(table.id));
    const hasOrderTables = selectedTables.some((table) => table.orderStatus && table.orderStatus !== 'COMPLETE');

    if (hasOrderTables) {
      toast({
        message: '주문이 있는 테이블은 비울 수 없습니다.',
        variant: 'error',
      });
      return;
    }

    try {
      await Promise.all(selectedTableIds.map((tableId) => clearTable(tableId)));
      await queryClient.invalidateQueries({ queryKey: ['tables', storeId] });
      setSelectedTableIds([]);
      toast({
        message: '테이블 비우기가 완료되었습니다.',
        variant: 'info',
      });
    } catch (error) {
      toast({
        message: 'Failed to clear tables.',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      });
      console.error('Failed to clear tables', error);
    }
  };

  return (
    <section className={styles.tableOperate}>
      <div className={styles.panel}>
        <div className={styles.summaryRow}>
          <StoreSummaryCard
            storeName={storeName}
            storeDescription={storeDescription}
            imageUrl={storeImageUrl}
            actions={
              <>
                <Button
                  className={summaryStyles.actionButton}
                  size="md"
                  onClick={() => id && navigate(`/store/${id}/menu/create`)}
                >
                  <AddMenuIcon className={summaryStyles.actionIcon} aria-hidden="true" />
                  메뉴 추가
                </Button>
                {storeId ? (
                  <StoreSettingsModal
                    storeId={storeId}
                    storeName={storeName}
                    storeDescription={storeDescription}
                    storeImageUrl={storeImage}
                  />
                ) : null}
              </>
            }
          />
          <div className={styles.sidePanel}>
            {isNoticeVisible ? (
              <div className={styles.noticeCard}>
                <InfoIcon className={styles.noticeIcon} aria-hidden="true" />
                <p className={styles.noticeText}>테이블의 체크박스를 누르고 테이블을 비워보세요!</p>
                <button
                  type="button"
                  className={styles.noticeClose}
                  aria-label="안내 닫기"
                  onClick={() => setIsNoticeVisible(false)}
                >
                  <CloseIcon className={styles.noticeCloseIcon} aria-hidden="true" />
                </button>
              </div>
            ) : null}
            <div className={styles.actionButtons}>
              <TableCreateModal
                storeId={storeId}
                onCreated={(_, layout) => handleLayoutSave(layout)}
                hasActiveOrders={hasActiveOrders}
                name={tableButtonLabel}
              />
              <Button
                className={styles.clearButton}
                size="md"
                onClick={handleClearTables}
                disabled={selectedTableIds.length === 0 || isClearing}
                isLoading={isClearing}
              >
                테이블 비우기
              </Button>
            </div>
          </div>
        </div>
        {hasTables ? (
          <div
            className={`${styles.orderPreview} ${useGridLayout ? styles.orderPreviewGrid : ''}`}
            style={tableGridStyle}
          >
            {sortedTables.map((table: TableResponse) => {
              const hasOrders =
                (table.orderMenus?.length ?? 0) > 0 || (table.totalOrderAmount ?? 0) > 0 || !!table.orderStatus;
              const isEmpty = !hasOrders;
              const statusMap: Record<NonNullable<TableResponse['orderStatus']>, OrderStatus> = {
                PENDING: 'payment',
                COOKING: 'cooking',
                COMPLETE: 'served',
              };
              const resolvedOrderStatus = resolvePriorityOrderStatus(table.orderStatus);
              const status = hasOrders && resolvedOrderStatus ? statusMap[resolvedOrderStatus] : undefined;
              const items = table.orderMenus?.map((menu) => ({
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
                  totalPrice={table.totalOrderAmount}
                  isSelected={selectedTableIds.includes(table.id)}
                  onToggleSelect={() => handleToggleSelect(table.id)}
                />
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <AddTableIcon className={styles.emptyIcon} aria-hidden="true" />
            <p className={styles.emptyText}>테이블을 추가해 보세요!</p>
          </div>
        )}
      </div>
    </section>
  );
}
