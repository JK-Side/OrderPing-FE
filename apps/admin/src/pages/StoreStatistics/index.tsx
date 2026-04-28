import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import ArrowDownIcon from '@/assets/icons/arrow-down.svg?react';
import Button from '@/components/Button';
import { useStoreById } from '@/pages/StoreOperate/hooks/useStore';
import MenuStatsChart from '@/pages/StoreStatistics/components/MenuStatsChart';
import { useMenuStatistics } from '@/pages/StoreStatistics/hooks/useMenuStatistics';
import { useStatistics } from '@/pages/StoreStatistics/hooks/useStatistics';
import styles from './StoreStatistics.module.scss';

type StatisticsTab = 'orders' | 'menus';
type PeriodPreset = 'ALL' | 'TODAY' | 'YESTERDAY' | 'CUSTOM';
type NormalizedMenuStat = {
  menuId: number;
  menuName: string;
  stock: number;
  soldQuantity: number;
  maxValue: number;
  stockRatio: number;
  soldRatio: number;
};

const PERIOD_PRESET_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'TODAY', label: '오늘' },
  { value: 'YESTERDAY', label: '어제' },
  { value: 'CUSTOM', label: '직접 선택' },
];
const CHART_INTERVALS = 5;

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

  return menus.map((menu) => `${menu.menuName}${menu.isService ? ' (서비스)' : ''} × ${menu.quantity}`).join(', ');
};

const resolveRoundedAxisMax = (rawMaxValue: number, intervals: number) => {
  if (rawMaxValue <= 0) return 10;

  const safeIntervals = Math.max(1, intervals);
  const roundedByTen = Math.ceil(rawMaxValue / 10) * 10;
  return Math.ceil(roundedByTen / safeIntervals) * safeIntervals;
};

const resolveMenuStock = (menu: { stock?: number; initialStock?: number }) => {
  if (typeof menu.stock === 'number') return menu.stock;
  if (typeof menu.initialStock === 'number') return menu.initialStock;
  return 0;
};

const resolveSoldQuantity = (menu: { soldQuantity?: number }) => {
  if (typeof menu.soldQuantity === 'number') return menu.soldQuantity;
  return 0;
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
  const resolvedFromDate = periodPreset === 'ALL' ? (storeCreatedAt ?? fromDate) : fromDate;
  const resolvedToDate = periodPreset === 'ALL' ? today : toDate;

  const selectedPreset = PERIOD_PRESET_OPTIONS.find((option) => option.value === periodPreset)?.label ?? '오늘';

  const queryParams = useMemo(() => {
    if (!storeId || !resolvedFromDate || !resolvedToDate) return undefined;
    return {
      storeId,
      from: resolvedFromDate,
      to: resolvedToDate,
    };
  }, [resolvedFromDate, resolvedToDate, storeId]);

  const { data: statistics, isPending: isStatisticsPending, isError: isStatisticsError } = useStatistics(queryParams);
  const {
    data: menuStatistics,
    isPending: isMenuStatisticsPending,
    isError: isMenuStatisticsError,
  } = useMenuStatistics(queryParams, tab === 'menus');

  const isSingleDay = resolvedFromDate === resolvedToDate;
  const orderRows = useMemo(() => statistics?.orders ?? [], [statistics?.orders]);
  const menuRows = useMemo(() => menuStatistics?.menus ?? [], [menuStatistics?.menus]);
  const menuChartMaxValue = useMemo(() => {
    const rawMaxValue = menuRows.reduce((acc, menu) => {
      const stock = resolveMenuStock(menu);
      const soldQuantity = resolveSoldQuantity(menu);
      const currentMax = Math.max(stock, soldQuantity);
      return currentMax > acc ? currentMax : acc;
    }, 0);

    return resolveRoundedAxisMax(rawMaxValue, CHART_INTERVALS);
  }, [menuRows]);
  const normalizedMenuRows = useMemo<NormalizedMenuStat[]>(
    () =>
      menuRows.map((menu) => {
        const stock = resolveMenuStock(menu);
        const soldQuantity = resolveSoldQuantity(menu);

        return {
        menuId: menu.menuId,
        menuName: menu.menuName,
        stock,
        soldQuantity,
        maxValue: Math.max(stock, soldQuantity),
        stockRatio: stock / menuChartMaxValue,
        soldRatio: soldQuantity / menuChartMaxValue,
      };
      }),
    [menuChartMaxValue, menuRows],
  );

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
          <button type='button' className={styles.periodButton} onClick={() => setIsPresetOpen((prev) => !prev)}>
            {selectedPreset}
            <ArrowDownIcon
              className={`${styles.periodIcon} ${isPresetOpen ? styles.periodIconOpen : ''}`}
              aria-hidden='true'
            />
          </button>
          {isPresetOpen ? (
            <ul className={styles.periodOptions}>
              {PERIOD_PRESET_OPTIONS.map((option) => (
                <li key={option.value}>
                  <button
                    type='button'
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
              type='date'
              className={styles.dateInput}
              value={fromDate}
              max={toDate}
              onChange={(event) => handleChangeFromDate(event.target.value)}
            />
            <span className={styles.dateRangeMark}>~</span>
            <input
              type='date'
              className={styles.dateInput}
              value={toDate}
              min={fromDate}
              max={today}
              onChange={(event) => handleChangeToDate(event.target.value)}
            />
          </div>
        ) : (
          <>
            <span className={styles.dateText}>{resolvedFromDate}</span>
            <span className={styles.dateRangeMark}>~</span>
            <span className={styles.dateText}>{resolvedToDate}</span>
          </>
        )}
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>총 매출</div>
          <div className={styles.summaryValue}>{formatCurrency(statistics?.totalRevenue ?? 0)}</div>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>계좌 입금</div>
          <div className={`${styles.summaryValue} ${styles.summaryValueAccent}`}>
            {formatCurrency(statistics?.transferRevenue ?? 0)}
          </div>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>쿠폰 사용</div>
          <div className={styles.summaryValue}>{formatCurrency(statistics?.couponRevenue ?? 0)}</div>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>테이블비</div>
          <div className={styles.summaryValue}>{formatCurrency(statistics?.tableFeeRevenue ?? 0)}</div>
          {/* <div className={styles.summaryLabel}>주문 수</div>
          <div className={styles.summaryValue}>{(statistics?.orderCount ?? 0).toLocaleString('ko-KR')}건</div> */}
        </article>
      </div>

      <div className={styles.tabGroup}>
        <Button
          type='button'
          size='md'
          className={`${styles.tabButton} ${tab === 'orders' ? styles.tabButtonActive : styles.tabButtonInactive}`}
          onClick={() => setTab('orders')}
        >
          전체 주문 조회
        </Button>
        <Button
          type='button'
          size='md'
          className={`${styles.tabButton} ${tab === 'menus' ? styles.tabButtonActive : styles.tabButtonInactive}`}
          onClick={() => setTab('menus')}
        >
          메뉴별 주문
        </Button>
      </div>

      {tab === 'orders' ? (
        <section className={styles.tablePanel}>
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
        </section>
      ) : (
        <section className={styles.menuChartPanel}>
          {!storeId || isMenuStatisticsError ? (
            <div className={styles.emptyState}>메뉴 통계를 불러오지 못했어요!</div>
          ) : isMenuStatisticsPending ? (
            <div className={styles.emptyState}>메뉴 통계를 불러오는 중입니다.</div>
          ) : normalizedMenuRows.length === 0 ? (
            <div className={styles.emptyState}>해당 기간에 판매된 메뉴가 없어요!</div>
          ) : (
            <MenuStatsChart items={normalizedMenuRows} maxValue={menuChartMaxValue} />
          )}
        </section>
      )}
    </section>
  );
}


