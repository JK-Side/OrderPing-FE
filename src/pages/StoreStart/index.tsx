import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { TableResponse, TableStatus } from '@/api/table/entity';
import AddMenuIcon from '@/assets/icons/add-menu.svg?react';
import AddTableIcon from '@/assets/icons/add-table.svg?react';
import CloseIcon from '@/assets/icons/close.svg?react';
import InfoIcon from '@/assets/icons/info-circle.svg?react';
import AlternativeImg from '@/assets/img/basic-img.png';
import Button from '@/components/Button';
import StoreSummaryCard from '@/components/StoreSummaryCard';
import summaryStyles from '@/components/StoreSummaryCard/StoreSummaryCard.module.scss';
import StoreSettingsModal from '@/pages/StoreOperate/components/StoreSettingsModal';
import { useStoreById } from '@/pages/StoreOperate/hooks/useStore';
import OrderCard from '@/pages/StoreStart/components/OrderCard';
import TableCreateModal from '@/pages/StoreStart/components/TableCreateModal';
import { useTablesByStore } from '@/pages/StoreStart/hooks/useTablesByStore';
import styles from './StoreStart.module.scss';

type OrderStatus = 'served' | 'cooking' | 'payment';
const DEFAULT_ORDER_STATUS: OrderStatus = 'cooking';

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

export default function StoreStart() {
  const navigate = useNavigate();

  const [tableLayout, setTableLayout] = useState<{ columns: number; rows: number } | null>(null);

  const { id } = useParams();
  const parsedId = id ? Number(id) : undefined;
  const storeId = Number.isFinite(parsedId) ? parsedId : undefined;

  const { data: storeDetail } = useStoreById(storeId);
  const { data: tables = [] } = useTablesByStore(storeId);

  const storeName = storeDetail?.name ?? '주점';
  const storeImageUrl = storeDetail?.imageUrl ?? '';
  const storeImage = storeImageUrl || AlternativeImg;
  const storeDescription = storeDetail?.description ?? '';

  const hasTables = tables.length > 0;
  const tableButtonLabel = hasTables ? '테이블 수정' : '테이블 추가';

  const useGridLayout = !!tableLayout && tableLayout.columns > 0 && tableLayout.rows > 0;
  const tableGridStyle = useGridLayout
    ? {
        gridTemplateColumns: `repeat(${tableLayout.columns}, minmax(220px, 300px))`,
        gridTemplateRows: `repeat(${tableLayout.rows}, 222px)`,
      }
    : undefined;

  useEffect(() => {
    if (!storeId || typeof window === 'undefined') {
      setTableLayout(null);
      return;
    }
    const stored = parseStoredLayout(localStorage.getItem(getLayoutStorageKey(storeId)));
    setTableLayout(stored);
  }, [storeId]);

  useEffect(() => {
    if (!storeId || typeof window === 'undefined') return;
    const key = getLayoutStorageKey(storeId);
    if (tableLayout && tableLayout.columns > 0 && tableLayout.rows > 0) {
      localStorage.setItem(key, JSON.stringify(tableLayout));
    } else {
      localStorage.removeItem(key);
    }
  }, [storeId, tableLayout]);

  return (
    <section className={styles.storeStart}>
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
            <div className={styles.noticeCard}>
              <InfoIcon className={styles.noticeIcon} aria-hidden="true" />
              <p className={styles.noticeText}>테이블의 체크박스를 누르고 테이블을 비워보세요!</p>
              <button type="button" className={styles.noticeClose} aria-label="안내 닫기">
                <CloseIcon className={styles.noticeCloseIcon} aria-hidden="true" />
              </button>
            </div>
            <div className={styles.actionButtons}>
              <TableCreateModal
                storeId={storeId}
                onCreated={(_, layout) => setTableLayout(layout)}
                name={tableButtonLabel}
              />
              <Button className={styles.clearButton} size="md" disabled>
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
            {tables.map((table: TableResponse) => {
              const isOccupied = table.status === 'OCCUPIED';
              const isEmpty = !isOccupied;
              const status = isOccupied ? DEFAULT_ORDER_STATUS : undefined;

              return (
                <OrderCard
                  key={table.id}
                  tableName={formatTableName(table.tableNum)}
                  isEmpty={isEmpty}
                  status={status}
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
