import type { CustomerStoreOrderMenu } from "../../api/customer/entity";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStoreOrder } from "./hooks/useStoreOrder";
import styles from "./Home.module.scss";

type TabKey = "main" | "side";

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

const normalizeCategoryName = (name: string) => name.replace(/\s/g, "");

const getTableIdFromUrl = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const tableIdFromQuery = Number(searchParams.get("tableId"));
  if (Number.isInteger(tableIdFromQuery) && tableIdFromQuery > 0) {
    return tableIdFromQuery;
  }

  const pathSegments = window.location.pathname.split("/").filter(Boolean);
  if (pathSegments.length === 0) {
    return null;
  }

  const tableIdFromPath = Number(
    decodeURIComponent(pathSegments[pathSegments.length - 1]),
  );
  if (Number.isInteger(tableIdFromPath) && tableIdFromPath > 0) {
    return tableIdFromPath;
  }

  return null;
};

function MenuCard({ menu }: { menu: CustomerStoreOrderMenu }) {
  return (
    <article
      className={`${styles.home__menuCard} ${
        menu.isSoldOut ? styles["home__menuCard--soldOut"] : ""
      }`}
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
          {menu.isSoldOut && "해당 메뉴는 품절되었습니다."}
        </div>
      </div>

      {menu.imageUrl ? (
        <img
          src={menu.imageUrl}
          alt={menu.name}
          className={styles.home__menuImage}
        />
      ) : (
        <div className={styles.home__menuImageFallback}>이미지 준비 중</div>
      )}
    </article>
  );
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("main");
  const [isTabSticky, setIsTabSticky] = useState(false);

  const tableId = useMemo(() => getTableIdFromUrl(), []);
  const mainSectionRef = useRef<HTMLElement | null>(null);
  const sideSectionRef = useRef<HTMLElement | null>(null);
  const tabContainerRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, error } = useStoreOrder(tableId);
  const categories = useMemo(() => data?.categories ?? [], [data]);

  const mainCategory = useMemo(
    () =>
      categories.find((category) =>
        normalizeCategoryName(category.name).includes("\uBA54\uC778"),
      ),
    [categories],
  );
  const sideCategory = useMemo(
    () =>
      categories.find((category) =>
        normalizeCategoryName(category.name).includes("\uC0AC\uC774\uB4DC"),
      ),
    [categories],
  );

  const fallbackMainCategory = mainCategory ?? categories[0];
  const fallbackSideCategory =
    sideCategory ??
    categories.find((category) => category.id !== fallbackMainCategory?.id) ??
    null;

  const mainMenus = fallbackMainCategory?.menus ?? [];
  const sideMenus = fallbackSideCategory?.menus ?? [];

  const mainSectionLabel = fallbackMainCategory?.name ?? "메인";
  const sideSectionLabel = fallbackSideCategory?.name ?? "사이드";

  useEffect(() => {
    const handleScroll = () => {
      const top = tabContainerRef.current?.getBoundingClientRect().top ?? 0;
      setIsTabSticky(top <= 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const tab = entry.target.getAttribute("data-tab");
          if (tab === "main" || tab === "side") {
            setActiveTab(tab);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "-30% 0px -55% 0px",
      },
    );

    if (mainSectionRef.current) observer.observe(mainSectionRef.current);
    if (sideSectionRef.current) observer.observe(sideSectionRef.current);

    return () => observer.disconnect();
  }, [mainMenus.length, sideMenus.length]);

  const scrollToTabSection = (tab: TabKey) => {
    setActiveTab(tab);
    const target =
      tab === "main" ? mainSectionRef.current : sideSectionRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const hasNotFoundError =
    (error as { status?: number } | null)?.status === 404;

  return (
    <main className={styles.home}>
      <section className={styles.home__hero}>
        {data?.storeImageUrl ? (
          <img
            src={data.storeImageUrl}
            alt={data.storeName}
            className={styles.home__heroImage}
          />
        ) : (
          <div className={styles.home__heroFallback}>이미지 준비 중</div>
        )}

        <button type="button" className={styles.home__historyFloatingButton}>
          주문 내역
        </button>
      </section>

      <section className={styles.home__storeMeta}>
        <div className={styles.home__titleRow}>
          <div className={styles.home__storeName}>
            {data?.storeName ?? "가게 정보 준비 중"}
          </div>
          <span
            className={styles.home__tableText}
          >{`${data?.tableNum ?? "-"}번 테이블`}</span>
        </div>

        <div className={styles.home__descriptionBox}>
          <span className={styles.home__descriptionIcon} aria-hidden="true">
            i
          </span>
          <p className={styles.home__descriptionText}>
            {data?.storeDescription ?? "가게 소개가 없어요!"}
          </p>
        </div>
      </section>

      <div
        ref={tabContainerRef}
        className={`${styles.home__tabStickyWrap} ${
          isTabSticky ? styles["home__tabStickyWrap--stuck"] : ""
        }`}
      >
        <div className={styles.home__tabHeader}>
          <div className={styles.home__tabList}>
            <button
              type="button"
              className={`${styles.home__tabButton} ${
                activeTab === "main" ? styles["home__tabButton--active"] : ""
              }`}
              onClick={() => scrollToTabSection("main")}
            >
              메인 메뉴
            </button>
            <button
              type="button"
              className={`${styles.home__tabButton} ${
                activeTab === "side" ? styles["home__tabButton--active"] : ""
              }`}
              onClick={() => scrollToTabSection("side")}
            >
              사이드 메뉴
            </button>
          </div>

          {isTabSticky ? (
            <button type="button" className={styles.home__historyTabButton}>
              주문 내역
            </button>
          ) : null}
        </div>
      </div>

      {!tableId ? (
        <div className={styles.home__statusBox}>
          테이블 id가 존재하지 않아요!
        </div>
      ) : null}
      {tableId && isLoading ? (
        <div className={styles.home__statusBox}>메뉴를 로딩 중입니다.</div>
      ) : null}
      {tableId && !isLoading && hasNotFoundError ? (
        <div className={styles.home__statusBox}>
          테이블 또는 메뉴를 찾을 수 없어요!
        </div>
      ) : null}
      {tableId && !isLoading && !hasNotFoundError && error ? (
        <div className={styles.home__statusBox}>
          테이블 정보를 불러오지 못했어요!
        </div>
      ) : null}

      {tableId && !isLoading && !error ? (
        <>
          <section
            ref={mainSectionRef}
            data-tab="main"
            className={styles.home__menuSection}
          >
            <div
              className={styles.home__sectionTitle}
            >{`${mainSectionLabel} 메뉴`}</div>
            {mainMenus.length > 0 ? (
              <div className={styles.home__menuList}>
                {mainMenus.map((menu) => (
                  <MenuCard key={menu.id} menu={menu} />
                ))}
              </div>
            ) : (
              <p className={styles.home__emptyMessage}>메인 메뉴가 없어요!</p>
            )}
          </section>

          <div className={styles.home__sectionDivider} />

          <section
            ref={sideSectionRef}
            data-tab="side"
            className={styles.home__menuSection}
          >
            <h2 className={styles.home__sectionTitle}>{sideSectionLabel}</h2>
            {sideMenus.length > 0 ? (
              <div className={styles.home__menuList}>
                {sideMenus.map((menu) => (
                  <MenuCard key={menu.id} menu={menu} />
                ))}
              </div>
            ) : (
              <p className={styles.home__emptyMessage}>사이드 메뉴가 없어요!</p>
            )}
          </section>

          <div className={styles.home__emptySpace}>@order-ping</div>
        </>
      ) : null}
    </main>
  );
}
