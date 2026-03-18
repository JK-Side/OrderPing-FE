import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import ArrowDownIcon from '@/assets/icons/arrow-down.svg?react';
import { useStoreById } from '@/pages/StoreOperate/hooks/useStore';
import { useMenuStatistics } from '@/pages/StoreStatistics/hooks/useMenuStatistics';
import { useStatistics } from '@/pages/StoreStatistics/hooks/useStatistics';
import styles from './StoreStatistics.module.scss';

type StatisticsTab = 'orders' | 'menus';
type PeriodPreset = 'ALL' | 'TODAY' | 'YESTERDAY' | 'CUSTOM';

const PERIOD_PRESET_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'TODAY', label: '오늘' },
  { value: 'YESTERDAY', label: '어제' },
  { value: 'CUSTOM', label: '직접 선택' },
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

const parseDateString = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatDate(parsed);
};

const formatCurrency = (value: number) => `${value.toLocaleString('ko-KR')}원`;

const formatOrderNumber = (value: number) => String(value).padStart(4, '0');

const formatOrderedAt = (value: string, isSingleDay: boolean) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const hour = String(parsed.getHours()).padStart(2, '0');
  const minute = String(parsed.getMinutes()).padStart(2, '0');

  if (isSingleDay) {
    return `${hour}:${minute}`;
  }

  return `${month}-${day} ${hour}:${minute}`;
};

const formatMenus = (
  menus: {
    menuName: string;
    quantity: number;
    isService: boolean;
  }[],
) => {
  if (menus.length === 0) return '-';

  return menus
    .map((menu) => `${menu.menuName}${menu.isService ? ' (서비스)' : ''} × ${menu.quantity}`)
    .join(', ');
};

export default function StoreStatistics() {
  const { id } = useParams();
  const parsedId = id ? Number(id) : undefined;
  const storeId = Number.isFinite(parsedId) ? parsedId : undefined;
  const { data: storeDetail } = useStoreById(storeId);

  const [tab, setTab] = useState<StatisticsTab>('orders');
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const periodSelectRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => formatDate(new Date()), []);
  const yesterday = useMemo(() => formatDate(addDays(new Date(), -1)), []);
  const storeCreatedAt = useMemo(() => parseDateString(storeDetail?.createdAt), [storeDetail?.createdAt]);

  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('TODAY');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const selectedPreset = PERIOD_PRESET_OPTIONS.find((option) => option.value === periodPreset)?.label ?? '오늘';

  const queryParams = useMemo(() => {
    if (!storeId || !fromDate || !toDate) return undefined;
    return {
      storeId,
      from: fromDate,
      to: toDate,
    };
  }, [fromDate, storeId, toDate]);

  const { data: statistics, isPending: isStatisticsPending, isError: isStatisticsError } = useStatistics(queryParams);
  const {
    data: menuStatistics,
    isPending: isMenuStatisticsPending,
    isError: isMenuStatisticsError,
  } = useMenuStatistics(queryParams, tab === 'menus');

  const isSingleDay = fromDate === toDate;
  const orderRows = statistics?.orders ?? [];
  const menuRows = menuStatistics?.menus ?? [];

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
    if (!isPresetOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!periodSelectRef.current) return;
      if (!periodSelectRef.current.contains(event.target as Node)) {
        setIsPresetOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPresetOpen]);

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
        <div className={styles.periodSelect} ref={periodSelectRef}>
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
          <p className={styles.summaryValue}>{formatCurrency(statistics?.totalRevenue ?? 0)}</p>
        </article>
        <article className={styles.summaryCard}>
          <h2 className={styles.summaryLabel}>계좌 입금</h2>
          <p className={`${styles.summaryValue} ${styles.summaryValueAccent}`}>
            {formatCurrency(statistics?.transferRevenue ?? 0)}
          </p>
        </article>
        <article className={styles.summaryCard}>
          <h2 className={styles.summaryLabel}>쿠폰 사용</h2>
          <p className={styles.summaryValue}>{formatCurrency(statistics?.couponRevenue ?? 0)}</p>
        </article>
        <article className={styles.summaryCard}>
          <h2 className={styles.summaryLabel}>주문 수</h2>
          <p className={styles.summaryValue}>{(statistics?.orderCount ?? 0).toLocaleString('ko-KR')}건</p>
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
        {tab === 'orders' ? (
          <>
            <div className={`${styles.tableHead} ${styles.tableHeadOrders}`}>
              <span>주문번호</span>
              <span>테이블</span>
              <span>주문일시</span>
              <span>메뉴</span>
              <span>총금액</span>
              <span>입금자명</span>
            </div>

            <div className={styles.tableBody}>
              {!storeId || isStatisticsError ? (
                <div className={styles.emptyState}>통계를 불러오지 못했어요!</div>
              ) : isStatisticsPending ? (
                <div className={styles.emptyState}>통계를 불러오는 중입니다.</div>
              ) : orderRows.length === 0 ? (
                <div className={styles.emptyState}>해당 기간에 주문이 없어요!</div>
              ) : (
                orderRows.map((order) => (
                  <div key={order.orderNumber} className={styles.orderRow}>
                    <span>{formatOrderNumber(order.orderNumber)}</span>
                    <span>{order.tableNum}번</span>
                    <span>{formatOrderedAt(order.orderedAt, isSingleDay)}</span>
                    <span className={styles.menuCell}>{formatMenus(order.menus)}</span>
                    <span>{formatCurrency(order.totalPrice)}</span>
                    <span>{order.depositorName}</span>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className={`${styles.tableHead} ${styles.tableHeadMenus}`}>
              <span>메뉴명</span>
              <span>재고</span>
              <span>판매량</span>
            </div>

            <div className={styles.tableBody}>
              {!storeId || isMenuStatisticsError ? (
                <div className={styles.emptyState}>메뉴 통계를 불러오지 못했어요!</div>
              ) : isMenuStatisticsPending ? (
                <div className={styles.emptyState}>메뉴 통계를 불러오는 중입니다.</div>
              ) : menuRows.length === 0 ? (
                <div className={styles.emptyState}>해당 기간에 판매된 메뉴가 없어요!</div>
              ) : (
                menuRows.map((menu) => (
                  <div key={menu.menuId} className={styles.menuRow}>
                    <span>{menu.menuName}</span>
                    <span>{menu.stock.toLocaleString('ko-KR')}</span>
                    <span>{menu.soldQuantity.toLocaleString('ko-KR')}</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </section>
    </section>
  );
}
