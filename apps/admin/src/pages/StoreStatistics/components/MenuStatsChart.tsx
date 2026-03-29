import styles from './MenuStatsChart.module.scss';

type MenuStatsChartItem = {
  menuId: number;
  menuName: string;
  stock: number;
  soldQuantity: number;
  stockRatio: number;
  soldRatio: number;
};

interface MenuStatsChartProps {
  items: MenuStatsChartItem[];
  maxValue: number;
}

const GRID_ROWS = 6;

const toBarHeight = (ratio: number) => {
  if (ratio <= 0) return '0%';
  const percent = Math.round(ratio * 100);
  const clamped = Math.min(100, Math.max(6, percent));
  return `${clamped}%`;
};

export default function MenuStatsChart({ items, maxValue }: MenuStatsChartProps) {
  const chartMinWidth = Math.max(760, items.length * 120);
  const safeMaxValue = Math.max(1, maxValue);
  const axisStep = safeMaxValue / (GRID_ROWS - 1);
  const yAxisTicks = Array.from({ length: GRID_ROWS }).map((_, index) => {
    const value = Math.round(Math.max(0, safeMaxValue - axisStep * index));
    return value.toLocaleString('ko-KR');
  });

  return (
    <div className={styles.chart}>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotStock}`} aria-hidden='true' />
          재고량
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotSold}`} aria-hidden='true' />
          판매량
        </span>
      </div>

      <div className={styles.chartBody}>
        <div className={styles.yAxis} aria-hidden='true'>
          {yAxisTicks.map((tick, index) => (
            <span key={`tick-${index}`} className={styles.yAxisTick}>
              {tick}
            </span>
          ))}
        </div>

        <div className={styles.chartViewport}>
          <div className={styles.chartCanvas} style={{ minWidth: `${chartMinWidth}px` }}>
            <div className={styles.plotArea}>
              <div className={styles.gridLines} aria-hidden='true'>
                {Array.from({ length: GRID_ROWS }).map((_, index) => (
                  <span key={`line-${index}`} className={styles.gridLine} />
                ))}
              </div>

              <div className={styles.barsGroups}>
                {items.map((item) => (
                  <div key={item.menuId} className={styles.barGroup}>
                    <span
                      className={`${styles.bar} ${styles.stockBar}`}
                      style={{ height: toBarHeight(item.stockRatio) }}
                      title={`재고량 ${item.stock.toLocaleString('ko-KR')}`}
                    />
                    <span
                      className={`${styles.bar} ${styles.soldBar}`}
                      style={{ height: toBarHeight(item.soldRatio) }}
                      title={`판매량 ${item.soldQuantity.toLocaleString('ko-KR')}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.labelsRow}>
              {items.map((item) => (
                <span key={`label-${item.menuId}`} className={styles.label} title={item.menuName}>
                  {item.menuName}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
