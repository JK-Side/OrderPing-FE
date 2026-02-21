import type { CustomerStoreOrderMenu } from '../../api/customer/entity';
import { useCart } from '../../stores/cart';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoreOrder } from './hooks/useStoreOrder';
import styles from './Home.module.scss';

type TabKey = 'main' | 'side';

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

const getTableIdFromUrl = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const tableIdFromQuery = Number(searchParams.get('tableId'));
  if (Number.isInteger(tableIdFromQuery) && tableIdFromQuery > 0) {
    return tableIdFromQuery;
  }

  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  if (pathSegments.length === 0) {
    return null;
  }

  const tableIdFromPath = Number(decodeURIComponent(pathSegments[pathSegments.length - 1]));
  if (Number.isInteger(tableIdFromPath) && tableIdFromPath > 0) {
    return tableIdFromPath;
  }

  return null;
};

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
      role="button"
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
          {menu.isSoldOut ? <span className={styles.home__soldOutBadge}>품절</span> : null}
        </div>

        <div className={styles.home__menuPrice}>{formatPrice(menu.price)}</div>
        <div className={styles.home__menuDescription}>
          {menu.isSoldOut ? '현재 품절된 메뉴입니다.' : ''}
        </div>
      </div>

      {menu.imageUrl ? (
        <img src={menu.imageUrl} alt={menu.name} className={styles.home__menuImage} />
      ) : (
        <div className={styles.home__menuImageFallback}>이미지가 없어요.</div>
      )}
    </article>
  );
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('main');
  const [isTabSticky, setIsTabSticky] = useState(false);
  const tableId = useMemo(() => getTableIdFromUrl(), []);

  const mainSectionRef = useRef<HTMLElement | null>(null);
  const sideSectionRef = useRef<HTMLElement | null>(null);
  const tabContainerRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();
  const { totalPrice, totalQuantity } = useCart();

  const { data, isLoading, error } = useStoreOrder(tableId);
  const categories = useMemo(() => data?.categories ?? [], [data]);

  const mainCategory = useMemo(() => {
    if (categories.length === 0) return null;
    return categories.find((category) => /main/i.test(category.name)) ?? categories[0];
  }, [categories]);

  const sideCategory = useMemo(() => {
    if (!mainCategory) return null;
    return (
      categories.find((category) => category.id !== mainCategory.id && /side/i.test(category.name)) ??
      categories.find((category) => category.id !== mainCategory.id) ??
      null
    );
  }, [categories, mainCategory]);

  const mainMenus = mainCategory?.menus ?? [];
  const sideMenus = sideCategory?.menus ?? [];

  const mainSectionLabel = mainCategory?.name ?? '메인 메뉴';
  const sideSectionLabel = sideCategory?.name ?? '사이드 메뉴';
  const hasSideSection = sideCategory !== null;
  const hasNotFoundError = (error as { status?: number } | null)?.status === 404;

  useEffect(() => {
    const handleScroll = () => {
      const top = tabContainerRef.current?.getBoundingClientRect().top ?? 0;
      setIsTabSticky(top <= 0);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const tab = entry.target.getAttribute('data-tab');
          if (tab === 'main' || tab === 'side') {
            setActiveTab(tab);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '-30% 0px -55% 0px',
      },
    );

    if (mainSectionRef.current) observer.observe(mainSectionRef.current);
    if (sideSectionRef.current && hasSideSection) observer.observe(sideSectionRef.current);

    return () => observer.disconnect();
  }, [hasSideSection, mainMenus.length, sideMenus.length]);

  const scrollToTabSection = (tab: TabKey) => {
    if (tab === 'side' && !hasSideSection) return;

    setActiveTab(tab);
    const target = tab === 'main' ? mainSectionRef.current : sideSectionRef.current;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleMenuCardClick = (menuId: number) => {
    navigate(tableId ? `/menus/${menuId}?tableId=${tableId}` : `/menus/${menuId}`);
  };

  const openCartPage = () => {
    navigate(`/cart${tableId ? `?tableId=${tableId}` : ''}`);
  };

  return (
    <main className={styles.home}>
      <section className={styles.home__hero}>
        {data?.storeImageUrl ? (
          <img src={data.storeImageUrl} alt={data.storeName} className={styles.home__heroImage} />
        ) : (
          <div className={styles.home__heroFallback}>이미지가 없어요.</div>
        )}

        <button type="button" className={styles.home__historyFloatingButton}>
          주문 내역
        </button>
      </section>

      <section className={styles.home__storeMeta}>
        <div className={styles.home__titleRow}>
          <div className={styles.home__storeName}>{data?.storeName ?? '매장 정보를 불러오는 중...'}</div>
          <span className={styles.home__tableText}>{`${data?.tableNum ?? '-'}번 테이블`}</span>
        </div>

        <div className={styles.home__descriptionBox}>
          <span className={styles.home__descriptionIcon} aria-hidden="true">
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
            <button
              type="button"
              className={`${styles.home__tabButton} ${
                activeTab === 'main' ? styles['home__tabButton--active'] : ''
              }`}
              onClick={() => scrollToTabSection('main')}
            >
              메인 메뉴
            </button>
            {hasSideSection ? (
              <button
                type="button"
                className={`${styles.home__tabButton} ${
                  activeTab === 'side' ? styles['home__tabButton--active'] : ''
                }`}
                onClick={() => scrollToTabSection('side')}
              >
                사이드 메뉴
              </button>
            ) : null}
          </div>

          {isTabSticky ? (
            <button type="button" className={styles.home__historyTabButton}>
              주문 내역
            </button>
          ) : null}
        </div>
      </div>

      {!tableId ? <div className={styles.home__statusBox}>테이블 정보가 없어요.</div> : null}
      {tableId && isLoading ? <div className={styles.home__statusBox}>메뉴를 불러오는 중...</div> : null}
      {tableId && !isLoading && hasNotFoundError ? (
        <div className={styles.home__statusBox}>테이블 또는 매장을 찾을 수 없어요.</div>
      ) : null}
      {tableId && !isLoading && !hasNotFoundError && error ? (
        <div className={styles.home__statusBox}>메뉴를 불러오지 못했어요.</div>
      ) : null}

      {tableId && !isLoading && !error ? (
        <>
          <section ref={mainSectionRef} data-tab="main" className={styles.home__menuSection}>
            <div className={styles.home__sectionTitle}>{mainSectionLabel}</div>
            {mainMenus.length > 0 ? (
              <div className={styles.home__menuList}>
                {mainMenus.map((menu) => (
                  <MenuCard key={menu.id} menu={menu} onClick={handleMenuCardClick} />
                ))}
              </div>
            ) : (
              <p className={styles.home__emptyMessage}>메인 메뉴가 없어요.</p>
            )}
          </section>

          {hasSideSection ? <div className={styles.home__sectionDivider} /> : null}

          {hasSideSection ? (
            <section ref={sideSectionRef} data-tab="side" className={styles.home__menuSection}>
              <h2 className={styles.home__sectionTitle}>{sideSectionLabel}</h2>
              {sideMenus.length > 0 ? (
                <div className={styles.home__menuList}>
                  {sideMenus.map((menu) => (
                    <MenuCard key={menu.id} menu={menu} onClick={handleMenuCardClick} />
                  ))}
                </div>
              ) : (
                <p className={styles.home__emptyMessage}>사이드 메뉴가 없어요.</p>
              )}
            </section>
          ) : null}

          <div className={styles.home__emptySpace}>@order-ping</div>
        </>
      ) : null}

      {totalQuantity > 0 ? (
        <footer className={styles.home__cartBottom}>
          <button type="button" className={styles.home__cartButton} onClick={openCartPage}>
            <span className={styles.home__cartCount}>{totalQuantity}</span>
            <span>{`${formatPrice(totalPrice)} 장바구니 보기`}</span>
          </button>
        </footer>
      ) : null}
    </main>
  );
}
