import { Link, useLocation } from 'react-router-dom';
import { postLogout } from '@/api/auth/';
import OrderPingLogo from '@/assets/logo/ORDERPING_LOGO_TEXT.png';
import { useAuth } from '@/utils/hooks/useAuth';
import styles from './Header.module.scss';

const BASE_URL = import.meta.env.VITE_KAKAO_LOGIN;
const REFRESH_BLOCKED_KEY = 'auth:refresh-blocked';

export default function Header() {
  const { pathname } = useLocation();
  const { isBootstrapping, isLoggedIn, clearAccessToken } = useAuth();
  const isHomePage = pathname === '/';
  const isMyPage = pathname === '/mypage';
  const isStoreCreatePage = pathname.startsWith('/store/create');
  const isAuthHeaderPage = isHomePage || isMyPage || isStoreCreatePage;
  const storeId =
    pathname.match(/^\/store\/operate\/([^/]+)/)?.[1] ??
    pathname.match(/^\/store\/([^/]+)\/(start|orders|menu|qr-print|statistics)/)?.[1];
  const isStoreStartPage = /^\/store\/[^/]+\/(start|qr-print)/.test(pathname);
  const isStoreOrdersPage = /^\/store\/[^/]+\/orders/.test(pathname);
  const isStoreStatisticsPage = /^\/store\/[^/]+\/statistics/.test(pathname);
  const isStoreMenuPage = /^\/store\/operate\/[^/]+/.test(pathname);
  const menuManagePath = storeId ? `/store/operate/${storeId}` : '/';
  const orderManagePath = storeId ? `/store/${storeId}/orders` : '/';
  const tableManagePath = storeId ? `/store/${storeId}/start` : '/';
  const statisticsPath = storeId ? `/store/${storeId}/statistics` : '/';

  const handleKakaoLogin = () => {
    window.location.href = `${BASE_URL}`;
  };

  const handleLogout = async () => {
    sessionStorage.setItem(REFRESH_BLOCKED_KEY, '1');

    try {
      await postLogout({ skipRefresh: true });
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
        {!isAuthHeaderPage ? (
          <>
            <Link to={menuManagePath} className={`${styles.navItem} ${isStoreMenuPage ? styles.navItemActive : ''}`}>
              메뉴 관리
            </Link>
            <Link to={orderManagePath} className={`${styles.navItem} ${isStoreOrdersPage ? styles.navItemActive : ''}`}>
              주문 조회
            </Link>
            <Link to={tableManagePath} className={`${styles.navItem} ${isStoreStartPage ? styles.navItemActive : ''}`}>
              테이블 관리
            </Link>
            <Link to={statisticsPath} className={`${styles.navItem} ${isStoreStatisticsPage ? styles.navItemActive : ''}`}>
              주문 통계
            </Link>
          </>
        ) : isBootstrapping ? null : isLoggedIn ? (
          <>
            <Link to="/mypage" className={`${styles.navItem} ${isMyPage ? styles.navItemActive : ''}`}>
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