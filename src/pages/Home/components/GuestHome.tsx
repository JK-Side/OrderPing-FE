import LockIcon from '@/assets/icons/lock.svg?react';
import styles from './GuestHome.module.scss';

export default function GuestHome() {
  return (
    <section className={styles.guestHome}>
      <div className={styles.hero}>
        <div className={styles.copy}>
          <h1 className={styles.title}>
            엑셀보다 <span className={styles.accent}>빠르고</span> 종이보다{' '}
            <span className={styles.accent}>정확한</span>, 스마트 주점 파트너
          </h1>

          <div className={styles.descriptions}>
            <p className={styles.description}>주문 폭주로 꼬여버린 순서, 없는 재고 때문에 당황하셨나요?</p>
            <p className={styles.description}>
              ORDER PING은 실시간 주문 관리부터 자동 정산까지, 주점 운영에 꼭 필요한 핵심 기능만 가볍게 담았습니다.
            </p>
            <p className={styles.description}>가장 스마트한 축제 운영의 시작, 지금 경험해 보세요.</p>
          </div>
        </div>

        <div className={styles.lockPanel}>
          <div className={styles.lockBox}>
            <LockIcon width={32} height={32} fill="#8e8e93" />
          </div>
          <p className={styles.lockText}>로그인 후 주점을 생성해 보세요!</p>
        </div>
      </div>
    </section>
  );
}
