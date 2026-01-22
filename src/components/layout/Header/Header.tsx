import { Link, useLocation } from 'react-router-dom';
import { postLogout } from '@/api/auth';
import OrderPingLogo from '@/assets/logo/ORDERPING_LOGO_TEXT.png';
import { useAuth } from '@/utils/hooks/useAuth';
import styles from './Header.module.scss';

const BASE_URL = import.meta.env.VITE_KAKAO_LOGIN;

export default function Header() {
  const { pathname } = useLocation();
  const { isLoggedIn, clearAccessToken } = useAuth();
  const isStoreStartPage = /^\/store\/[^/]+\/start/.test(pathname);
  const storeIdMatch = pathname.match(/^\/store\/([^/]+)\/start/);
  const storeId = storeIdMatch?.[1];
  const menuManagePath = storeId ? `/store/operate/${storeId}` : '/';
  const tableManagePath = storeId ? `/store/${storeId}/start` : '/';

  const handleKakaoLogin = () => {
    window.location.href = `${BASE_URL}`;
  };

  const handleLogout = async () => {
    try {
      await postLogout();
    } catch (e) {
      console.error('logout error', e);
    } finally {
      clearAccessToken();

      window.location.href = '/';
    }
  };

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>
        <img src={OrderPingLogo} alt="Order ping Logo" height={50} />
      </Link>

      <nav className={styles.nav}>
        {isStoreStartPage ? (
          <>
            <Link to={menuManagePath} className={styles.navItem}>
              메뉴 관리
            </Link>
            <span className={styles.navItem}>주문 조회</span>
            <Link to={tableManagePath} className={`${styles.navItem} ${styles.navItemActive}`}>
              테이블 관리
            </Link>
            <span className={styles.navItem}>주문 통계</span>
          </>
        ) : isLoggedIn ? (
          <>
            <Link to="/mypage" className={styles.navItem}>
              마이페이지
            </Link>
            <button type="button" className={styles.navItem} onClick={handleLogout}>
              로그아웃
            </button>
          </>
        ) : (
          <button type="button" className={styles.navItem} onClick={handleKakaoLogin}>
            로그인
          </button>
        )}
      </nav>
    </header>
  );
}
