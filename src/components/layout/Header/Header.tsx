import { Link } from 'react-router-dom';
import OrderPingLogo from '@/assets/logo/ORDERPING_LOGO_TEXT.png';
import styles from './Header.module.scss';

export default function Header() {
  const isLogin = true; // 후에 로그인 확인 훅(ex. useAuth())으로 교체

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>
        <img src={OrderPingLogo} alt="Order ping Logo" height={50} />
      </Link>

      <nav className={styles.nav}>
        {isLogin ? (
          <>
            <Link to="/mypage" className={styles.navItem}>
              마이페이지
            </Link>
            <button type="button" className={styles.navItem}>
              로그아웃
            </button>
          </>
        ) : (
          <Link to="/login" className={styles.navItem}>
            로그인
          </Link>
        )}
      </nav>
    </header>
  );
}

/* 머하지.. 커밋하고 홈화면 UI 상하차 ㄱ */
