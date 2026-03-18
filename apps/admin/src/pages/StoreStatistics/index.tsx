import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import ArrowDownIcon from '@/assets/icons/arrow-down.svg?react';
import { useStoreById } from '@/pages/StoreOperate/hooks/useStore';
import styles from './StoreStatistics.module.scss';

type StatisticsTab = 'orders' | 'menus';
type PeriodPreset = 'ALL' | 'TODAY' | 'YESTERDAY' | 'CUSTOM';

type SampleOrderRow = {
  orderNumber: string;
  tableNum: string;
  orderedAt: string;
  menus: string;
  totalPrice: number;
  depositorName: string;
};

const PERIOD_PRESET_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'TODAY', label: '오늘' },
  { value: 'YESTERDAY', label: '어제' },
  { value: 'CUSTOM', label: '직접 선택' },
];

const SAMPLE_ORDER_ROWS: SampleOrderRow[] = [
  {
    orderNumber: '0001',
    tableNum: '3번',
    orderedAt: '19:48',
    menus: '마라탕 밀키트 × 1, 감자튀김 × 2, 마라탕 밀키트 × 1, 감자튀김 × 2, 감자튀김 × 2, 마라탕 밀키트 × 1',
    totalPrice: 39000,
    depositorName: '김오더',
  },
];

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatCurrency = (value: number) => `${value.toLocaleString('ko-KR')}원`;

const parseDateString = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatDate(parsed);
};

export default function StoreStatistics() {
  const { id } = useParams();
  const parsedId = id ? Number(id) : undefined;
  const storeId = Number.isFinite(parsedId) ? parsedId : undefined;
  const { data: storeDetail } = useStoreById(storeId);

  const [tab, setTab] = useState<StatisticsTab>('orders');
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const today = useMemo(() => formatDate(new Date()), []);
  const yesterday = useMemo(() => formatDate(addDays(new Date(), -1)), []);
  const storeCreatedAt = useMemo(() => parseDateString(storeDetail?.createdAt), [storeDetail?.createdAt]);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('TODAY');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const hasOrders = SAMPLE_ORDER_ROWS.length > 0;
  const selectedPreset = PERIOD_PRESET_OPTIONS.find((option) => option.value === periodPreset)?.label ?? '오늘';

  const applyPreset = useCallback(
    (nextPreset: PeriodPreset) => {
      setPeriodPreset(nextPreset);

      if (nextPreset === 'TODAY') {
        setFromDate(today);
        setToDate(today);
        return;
      }

      if (nextPreset === 'YESTERDAY') {
        setFromDate(yesterday);
        setToDate(yesterday);
        return;
      }

      if (nextPreset === 'ALL') {
        setFromDate(storeCreatedAt ?? today);
        setToDate(today);
      }
    },
    [storeCreatedAt, today, yesterday],
  );

  useEffect(() => {
    if (periodPreset === 'ALL' && storeCreatedAt) {
      setFromDate(storeCreatedAt);
      setToDate(today);
    }
  }, [periodPreset, storeCreatedAt, today]);

  const handlePresetClick = (preset: PeriodPreset) => {
    applyPreset(preset);
    setIsPresetOpen(false);
  };

  const handleChangeFromDate = (value: string) => {
    setFromDate(value);
    if (toDate < value) {
      setToDate(value);
    }
  };

  const handleChangeToDate = (value: string) => {
    setToDate(value);
    if (fromDate > value) {
      setFromDate(value);
    }
  };

  return (
    <section className={styles.storeStatistics}>
      <div className={styles.filterBar}>
        <div className={styles.periodSelect}>
          <button type="button" className={styles.periodButton} onClick={() => setIsPresetOpen((prev) => !prev)}>
            {selectedPreset}
            <ArrowDownIcon
              className={`${styles.periodIcon} ${isPresetOpen ? styles.periodIconOpen : ''}`}
              aria-hidden="true"
            />
          </button>
          {isPresetOpen ? (
            <ul className={styles.periodOptions}>
              {PERIOD_PRESET_OPTIONS.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    className={`${styles.periodOption} ${periodPreset === option.value ? styles.periodOptionActive : ''}`}
                    onClick={() => handlePresetClick(option.value)}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className={styles.periodDivider} />
        {periodPreset === 'CUSTOM' ? (
          <div className={styles.customDateRange}>
            <input
              type="date"
              className={styles.dateInput}
              value={fromDate}
              max={toDate}
              onChange={(event) => handleChangeFromDate(event.target.value)}
            />
            <span className={styles.dateRangeMark}>~</span>
            <input
              type="date"
              className={styles.dateInput}
              value={toDate}
              min={fromDate}
              max={today}
              onChange={(event) => handleChangeToDate(event.target.value)}
            />
          </div>
        ) : (
          <>
            <span className={styles.dateText}>{fromDate}</span>
            <span className={styles.dateRangeMark}>~</span>
            <span className={styles.dateText}>{toDate}</span>
          </>
        )}
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <h2 className={styles.summaryLabel}>총 매출</h2>
          <p className={styles.summaryValue}>580,000원</p>
        </article>
        <article className={styles.summaryCard}>
          <h2 className={styles.summaryLabel}>계좌 입금</h2>
          <p className={`${styles.summaryValue} ${styles.summaryValueAccent}`}>430,000원</p>
        </article>
        <article className={styles.summaryCard}>
          <h2 className={styles.summaryLabel}>쿠폰 사용</h2>
          <p className={styles.summaryValue}>150,000원</p>
        </article>
        <article className={styles.summaryCard}>
          <h2 className={styles.summaryLabel}>주문 수</h2>
          <p className={styles.summaryValue}>32건</p>
        </article>
      </div>

      <div className={styles.tabGroup}>
        <button
          type="button"
          className={`${styles.tabButton} ${tab === 'orders' ? styles.tabButtonActive : ''}`}
          onClick={() => setTab('orders')}
        >
          전체 주문 조회
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${tab === 'menus' ? styles.tabButtonActive : ''}`}
          onClick={() => setTab('menus')}
        >
          메뉴별 주문
        </button>
      </div>

      <section className={styles.tablePanel}>
        <div className={styles.tableHead}>
          {tab === 'orders' ? (
            <>
              <span>주문번호</span>
              <span>테이블</span>
              <span>주문일시</span>
              <span>메뉴</span>
              <span>총금액</span>
              <span>입금자명</span>
            </>
          ) : (
            <>
              <span>메뉴명</span>
              <span>재고</span>
              <span>판매량</span>
            </>
          )}
        </div>

        <div className={styles.tableBody}>
          {tab === 'orders' ? (
            hasOrders ? (
              SAMPLE_ORDER_ROWS.map((row) => (
                <div key={row.orderNumber} className={styles.orderRow}>
                  <span>{row.orderNumber}</span>
                  <span>{row.tableNum}</span>
                  <span>{row.orderedAt}</span>
                  <span className={styles.menuCell}>{row.menus}</span>
                  <span>{formatCurrency(row.totalPrice)}</span>
                  <span>{row.depositorName}</span>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>해당 기간에 주문이 없어요!</div>
            )
          ) : (
            <div className={styles.emptyState}>메뉴별 통계가 표시됩니다.</div>
          )}
        </div>
      </section>
    </section>
  );
}
