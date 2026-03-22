import { Link, useLocation } from 'react-router-dom';
import { postLogout } from '@/api/auth/';
import OrderPingLogo from '@/assets/logo/ORDERPING_LOGO_TEXT.png';
import { useAuth } from '@/utils/hooks/useAuth';
import styles from './Header.module.scss';

const BASE_URL = import.meta.env.VITE_KAKAO_LOGIN;

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
        {!isAuthHeaderPage ? (
          <>
            <Link to={menuManagePath} className={`${styles.navItem} ${isStoreMenuPage ? styles.navItemActive : ''}`}>
              {'\uBA54\uB274 \uAD00\uB9AC'}
            </Link>
            <Link to={orderManagePath} className={`${styles.navItem} ${isStoreOrdersPage ? styles.navItemActive : ''}`}>
              {'\uC8FC\uBB38 \uC870\uD68C'}
            </Link>
            <Link to={tableManagePath} className={`${styles.navItem} ${isStoreStartPage ? styles.navItemActive : ''}`}>
              {'\uD14C\uC774\uBE14 \uAD00\uB9AC'}
            </Link>
            <Link to={statisticsPath} className={`${styles.navItem} ${isStoreStatisticsPage ? styles.navItemActive : ''}`}>
              {'\uC8FC\uBB38 \uD1B5\uACC4'}
            </Link>
          </>
        ) : isBootstrapping ? null : isLoggedIn ? (
          <>
            <Link to="/mypage" className={`${styles.navItem} ${isMyPage ? styles.navItemActive : ''}`}>
              {'\uB9C8\uC774\uD398\uC774\uC9C0'}
            </Link>
            <button type="button" className={styles.navItem} onClick={handleLogout}>
              {'\uB85C\uADF8\uC544\uC6C3'}
            </button>
          </>
        ) : (
          <button type="button" className={styles.navItem} onClick={handleKakaoLogin}>
            {'\uB85C\uADF8\uC778'}
          </button>
        )}
      </nav>
    </header>
  );
}
