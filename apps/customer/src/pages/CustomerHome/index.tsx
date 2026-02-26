import styles from "./CustomerHome.module.scss";

export default function CustomerHomePage() {
  return (
    <main className={styles.landing}>
      <div className={styles.landing__backgroundGlow} aria-hidden="true" />

      <section className={styles.landing__hero}>
        <div className={styles.landing__brandBadge}>ORDER PING</div>
        <h1 className={styles.landing__title}>
          테이블 QR로
          <br />
          바로 주문을 시작하세요
        </h1>
        <p className={styles.landing__subtitle}>
          매장 테이블에 있는 QR을 스캔하면 메뉴 확인부터 주문까지 빠르게 진행할
          수 있어요.
        </p>

        <div className={styles.landing__phoneQrPreview}>
          <div className={styles.landing__phoneQrBox} aria-hidden="true" />
          <div className={styles.landing__phoneQrText}>
            <strong>QR 스캔 후 자동 입장</strong>
            <span>매장/테이블 정보가 포함된 링크로 연결돼요</span>
          </div>
        </div>
      </section>

      <section className={styles.landing__guide}>
        <h2 className={styles.landing__guideTitle}>이용 방법</h2>
        <ol className={styles.landing__guideList}>
          <li className={styles.landing__guideItem}>
            <span className={styles.landing__guideNumber}>1</span>
            <div>
              <strong>테이블 QR 스캔</strong>
              <p>테이블에 비치된 QR을 카메라로 스캔해 주세요.</p>
            </div>
          </li>
          <li className={styles.landing__guideItem}>
            <span className={styles.landing__guideNumber}>2</span>
            <div>
              <strong>메뉴 선택</strong>
              <p>메뉴를 둘러보고 원하는 메뉴를 장바구니에 담아 주세요.</p>
            </div>
          </li>
          <li className={styles.landing__guideItem}>
            <span className={styles.landing__guideNumber}>3</span>
            <div>
              <strong>장바구니 확인 후 주문</strong>
              <p>수량과 금액을 확인하고 주문을 진행하면 끝이에요.</p>
            </div>
          </li>
        </ol>
      </section>
    </main>
  );
}
