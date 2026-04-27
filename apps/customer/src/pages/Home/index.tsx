import type { CSSProperties } from 'react';
import type { CustomerStoreOrderMenu } from '../../api/customer/entity';
import BottomActionBar from '../../components/BottomActionBar';
import PageHeader from '../../components/PageHeader';
import { useCart } from '../../stores/cart';
import DEFAULTIMG from '../../assets/imgs/store_default.svg?react';
import { buildOrderHistoryPath, parsePositiveInt } from '../../utils/orderFlow';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStoreOrder } from './hooks/useStoreOrder';
import styles from './Home.module.scss';

type TabKey = 'tableFee' | 'main' | 'side';

const CATEGORY_MAIN = 1;
const CATEGORY_SIDE = 2;
const CATEGORY_TABLE_FEE = 3;
const HEADER_HEIGHT_PX = 74;
const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const mixChannel = (from: number, to: number, progress: number) =>
  Math.round(from + (to - from) * progress);

interface MenuCardProps {
  menu: CustomerStoreOrderMenu;
  onClick: (menuId: number) => void;
}

function MenuCard({ menu, onClick }: MenuCardProps) {
  return (
    <article
      className={`${styles.home__menuCard} ${
        menu.isSoldOut ? styles['home__menuCard--soldOut'] : ''
      }`}
      onClick={() => onClick(menu.id)}
      role='button'
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick(menu.id);
        }
      }}
    >
      <div className={styles.home__menuInfo}>
        <div className={styles.home__menuTitleRow}>
          <div className={styles.home__menuName}>{menu.name}</div>
          {menu.isSoldOut ? (
            <span className={styles.home__soldOutBadge}>품절</span>
          ) : null}
        </div>

        <div className={styles.home__menuPrice}>{formatPrice(menu.price)}</div>
        <div className={styles.home__menuDescription}>
          {menu.isSoldOut ? '현재 품절된 메뉴입니다.' : ''}
        </div>
      </div>

      {menu.imageUrl ? (
        <img
          src={menu.imageUrl}
          alt={menu.name}
          className={styles.home__menuImage}
        />
      ) : (
        <div className={styles.home__menuImageFallback}>이미지가 없어요</div>
      )}
    </article>
  );
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('tableFee');
  const [isTabSticky, setIsTabSticky] = useState(false);
  const [headerProgress, setHeaderProgress] = useState(0);
  const { storeId: storeIdParam } = useParams<{ storeId?: string }>();
  const [searchParams] = useSearchParams();
  const storeId = useMemo(() => parsePositiveInt(storeIdParam), [storeIdParam]);
  const tableNum = useMemo(
    () => parsePositiveInt(searchParams.get('tableNum')),
    [searchParams],
  );

  const heroSectionRef = useRef<HTMLElement | null>(null);
  const tableFeeSectionRef = useRef<HTMLElement | null>(null);
  const mainSectionRef = useRef<HTMLElement | null>(null);
  const sideSectionRef = useRef<HTMLElement | null>(null);
  const tabContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollTargetTabRef = useRef<TabKey | null>(null);
  const scrollTargetClearTimerRef = useRef<number | null>(null);

  const navigate = useNavigate();
  const { totalPrice, totalQuantity, setActiveTable } = useCart();

  const { data, isLoading, error } = useStoreOrder(storeId, tableNum);
  const categories = useMemo(() => data?.categories ?? [], [data]);

  const tableFeeCategory = useMemo(
    () =>
      categories.find((category) => category.id === CATEGORY_TABLE_FEE) ?? null,
    [categories],
  );

  const mainCategory = useMemo(() => {
    if (categories.length === 0) return null;
    return (
      categories.find((category) => category.id === CATEGORY_MAIN) ??
      categories.find((category) => /main/i.test(category.name)) ??
      categories.find((category) => category.id !== CATEGORY_TABLE_FEE) ??
      null
    );
  }, [categories]);

  const sideCategory = useMemo(() => {
    if (!mainCategory) return null;
    return (
      categories.find(
        (category) =>
          category.id === CATEGORY_SIDE && category.id !== mainCategory.id,
      ) ??
      categories.find(
        (category) =>
          category.id !== mainCategory.id &&
          category.id !== CATEGORY_TABLE_FEE &&
          /side/i.test(category.name),
      ) ??
      categories.find(
        (category) =>
          category.id !== mainCategory.id &&
          category.id !== CATEGORY_TABLE_FEE,
      ) ??
      null
    );
  }, [categories, mainCategory]);

  const tableFeeMenus = tableFeeCategory?.menus ?? [];
  const mainMenus = mainCategory?.menus ?? [];
  const sideMenus = sideCategory?.menus ?? [];

  const tableFeeSectionLabel = tableFeeCategory?.name ?? '테이블비';
  const mainSectionLabel = mainCategory?.name ?? '메인 메뉴';
  const sideSectionLabel = sideCategory?.name ?? '사이드 메뉴';
  const hasTableFeeSection = tableFeeCategory !== null;
  const hasSideSection = sideCategory !== null;
  const hasNotFoundError =
    (error as { status?: number } | null)?.status === 404;
  const hasTableContext = storeId !== null && tableNum !== null;

  const headerStyle = useMemo(() => {
    const colorChannel = mixChannel(255, 17, headerProgress);
    const greenChannel = mixChannel(255, 24, headerProgress);
    const blueChannel = mixChannel(255, 39, headerProgress);

    return {
      '--page-header-background': `rgba(255, 255, 255, ${0.24 + headerProgress * 0.76})`,
      '--page-header-border': `rgba(229, 231, 235, ${0.08 + headerProgress * 0.92})`,
      '--page-header-color': `rgb(${colorChannel}, ${greenChannel}, ${blueChannel})`,
      '--page-header-backdrop': 'saturate(180%) blur(16px)',
      '--page-header-shadow': `0 8px 24px rgba(15, 23, 42, ${headerProgress * 0.08})`,
    } as CSSProperties;
  }, [headerProgress]);

  useEffect(() => {
    setActiveTable(tableNum);
  }, [setActiveTable, tableNum]);

  useEffect(() => {
    return () => {
      if (scrollTargetClearTimerRef.current !== null) {
        window.clearTimeout(scrollTargetClearTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoading && categories.length > 0 && !hasTableFeeSection && activeTab === 'tableFee') {
      setActiveTab('main');
    }
  }, [activeTab, categories.length, hasTableFeeSection, isLoading]);

  useEffect(() => {
    if (hasTableFeeSection) {
      setActiveTab('tableFee');
    }
  }, [hasTableFeeSection]);

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = heroSectionRef.current?.offsetHeight ?? 0;
      const transitionDistance = Math.max(heroHeight - HEADER_HEIGHT_PX, 1);
      const nextProgress = clamp(window.scrollY / transitionDistance, 0, 1);
      const top =
        tabContainerRef.current?.getBoundingClientRect().top ?? Infinity;

      setHeaderProgress(nextProgress);
      setIsTabSticky(top <= HEADER_HEIGHT_PX);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const tab = entry.target.getAttribute('data-tab');
          if (tab === 'tableFee' || tab === 'main' || tab === 'side') {
            const scrollTargetTab = scrollTargetTabRef.current;
            if (scrollTargetTab && tab !== scrollTargetTab) {
              return;
            }

            setActiveTab(tab);
            scrollTargetTabRef.current = null;
            if (scrollTargetClearTimerRef.current !== null) {
              window.clearTimeout(scrollTargetClearTimerRef.current);
              scrollTargetClearTimerRef.current = null;
            }
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '-30% 0px -55% 0px',
      },
    );

    if (tableFeeSectionRef.current && hasTableFeeSection) {
      observer.observe(tableFeeSectionRef.current);
    }
    if (mainSectionRef.current) observer.observe(mainSectionRef.current);
    if (sideSectionRef.current && hasSideSection) {
      observer.observe(sideSectionRef.current);
    }

    return () => observer.disconnect();
  }, [
    hasTableFeeSection,
    hasSideSection,
    tableFeeMenus.length,
    mainMenus.length,
    sideMenus.length,
  ]);

  const scrollToTabSection = (tab: TabKey) => {
    if (tab === 'tableFee' && !hasTableFeeSection) return;
    if (tab === 'side' && !hasSideSection) return;

    setActiveTab(tab);
    scrollTargetTabRef.current = tab;
    if (scrollTargetClearTimerRef.current !== null) {
      window.clearTimeout(scrollTargetClearTimerRef.current);
    }
    scrollTargetClearTimerRef.current = window.setTimeout(() => {
      scrollTargetTabRef.current = null;
      scrollTargetClearTimerRef.current = null;
    }, 900);

    const target =
      tab === 'tableFee'
        ? tableFeeSectionRef.current
        : tab === 'main'
          ? mainSectionRef.current
          : sideSectionRef.current;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleMenuCardClick = (menuId: number) => {
    navigate(
      hasTableContext
        ? `/stores/${storeId}/menus/${menuId}?tableNum=${tableNum}`
        : `/menus/${menuId}`,
    );
  };

  const openCartPage = () => {
    navigate(
      hasTableContext
        ? `/cart?storeId=${storeId}&tableNum=${tableNum}`
        : '/cart',
    );
  };

  const openOrderHistoryPage = () => {
    navigate(hasTableContext ? buildOrderHistoryPath(storeId, tableNum) : '/');
  };

  return (
    <main className={styles.home}>
      <PageHeader
        className={styles.home__pageHeader}
        style={headerStyle}
        title={data?.storeName ?? '메뉴판'}
        onBack={() => navigate('/')}
        rightSlot={
          hasTableContext ? (
            <button
              type='button'
              className={styles.home__headerActionButton}
              onClick={openOrderHistoryPage}
            >
              주문 내역
            </button>
          ) : null
        }
      />

      <section ref={heroSectionRef} className={styles.home__hero}>
        {data?.storeImageUrl ? (
          <img
            src={data.storeImageUrl}
            alt={data.storeName}
            className={styles.home__heroImage}
          />
        ) : (
          <div className={styles.home__heroFallback}>
            <DEFAULTIMG />
          </div>
        )}
      </section>

      <section className={styles.home__storeMeta}>
        <div className={styles.home__titleRow}>
          <div className={styles.home__storeName}>
            {data?.storeName ?? '매장 정보를 불러오는 중...'}
          </div>
          <span
            className={styles.home__tableText}
          >{`${data?.tableNum ?? '-'}번 테이블`}</span>
        </div>

        <div className={styles.home__descriptionBox}>
          <span className={styles.home__descriptionIcon} aria-hidden='true'>
            i
          </span>
          <p className={styles.home__descriptionText}>
            {data?.storeDescription ?? '매장 소개가 없어요.'}
          </p>
        </div>
      </section>

      <div
        ref={tabContainerRef}
        className={`${styles.home__tabStickyWrap} ${
          isTabSticky ? styles['home__tabStickyWrap--stuck'] : ''
        }`}
      >
        <div className={styles.home__tabHeader}>
          <div className={styles.home__tabList}>
            {hasTableFeeSection ? (
              <button
                type='button'
                className={`${styles.home__tabButton} ${
                  activeTab === 'tableFee'
                    ? styles['home__tabButton--active']
                    : ''
                }`}
                onClick={() => scrollToTabSection('tableFee')}
              >
                테이블비
              </button>
            ) : null}
            <button
              type='button'
              className={`${styles.home__tabButton} ${
                activeTab === 'main' ? styles['home__tabButton--active'] : ''
              }`}
              onClick={() => scrollToTabSection('main')}
            >
              메인 메뉴
            </button>
            {hasSideSection ? (
              <button
                type='button'
                className={`${styles.home__tabButton} ${
                  activeTab === 'side' ? styles['home__tabButton--active'] : ''
                }`}
                onClick={() => scrollToTabSection('side')}
              >
                사이드 메뉴
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {!hasTableContext ? (
        <div className={styles.home__statusBox}>테이블 정보가 없어요.</div>
      ) : null}
      {hasTableContext && isLoading ? (
        <div className={styles.home__statusBox}>메뉴를 불러오는 중...</div>
      ) : null}
      {hasTableContext && !isLoading && hasNotFoundError ? (
        <div className={styles.home__statusBox}>
          테이블 또는 매장을 찾을 수 없어요.
        </div>
      ) : null}
      {hasTableContext && !isLoading && !hasNotFoundError && error ? (
        <div className={styles.home__statusBox}>메뉴를 불러오지 못했어요.</div>
      ) : null}

      {hasTableContext && !isLoading && !error ? (
        <>
          {hasTableFeeSection ? (
            <section
              ref={tableFeeSectionRef}
              data-tab='tableFee'
              className={styles.home__menuSection}
            >
              <div className={styles.home__sectionTitle}>
                {tableFeeSectionLabel}
              </div>
              {tableFeeMenus.length > 0 ? (
                <div className={styles.home__menuList}>
                  {tableFeeMenus.map((menu) => (
                    <MenuCard
                      key={menu.id}
                      menu={menu}
                      onClick={handleMenuCardClick}
                    />
                  ))}
                </div>
              ) : (
                <p className={styles.home__emptyMessage}>
                  테이블비 메뉴가 없어요.
                </p>
              )}
            </section>
          ) : null}

          {hasTableFeeSection ? (
            <div className={styles.home__sectionDivider} />
          ) : null}

          <section
            ref={mainSectionRef}
            data-tab='main'
            className={styles.home__menuSection}
          >
            <div className={styles.home__sectionTitle}>{mainSectionLabel}</div>
            {mainMenus.length > 0 ? (
              <div className={styles.home__menuList}>
                {mainMenus.map((menu) => (
                  <MenuCard
                    key={menu.id}
                    menu={menu}
                    onClick={handleMenuCardClick}
                  />
                ))}
              </div>
            ) : (
              <p className={styles.home__emptyMessage}>메인 메뉴가 없어요.</p>
            )}
          </section>

          {hasSideSection ? (
            <div className={styles.home__sectionDivider} />
          ) : null}

          {hasSideSection ? (
            <section
              ref={sideSectionRef}
              data-tab='side'
              className={styles.home__menuSection}
            >
              <h2 className={styles.home__sectionTitle}>{sideSectionLabel}</h2>
              {sideMenus.length > 0 ? (
                <div className={styles.home__menuList}>
                  {sideMenus.map((menu) => (
                    <MenuCard
                      key={menu.id}
                      menu={menu}
                      onClick={handleMenuCardClick}
                    />
                  ))}
                </div>
              ) : (
                <p className={styles.home__emptyMessage}>
                  사이드 메뉴가 없어요.
                </p>
              )}
            </section>
          ) : null}

          <div className={styles.home__emptySpace}>@order-ping</div>
        </>
      ) : null}

      {totalQuantity > 0 ? (
        <BottomActionBar>
          <button
            type='button'
            className={styles.home__cartButton}
            onClick={openCartPage}
          >
            <span className={styles.home__cartCount}>{totalQuantity}</span>
            <span>{`${formatPrice(totalPrice)} 장바구니 보기`}</span>
          </button>
        </BottomActionBar>
      ) : null}
    </main>
  );
}
