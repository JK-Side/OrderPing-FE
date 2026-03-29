import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { postLogout } from '@/api/auth/';
import MenuIcon from '@/assets/icons/menu.svg?react';
import OrderPingLogo from '@/assets/logo/ORDERPING_LOGO_TEXT.png';
import { useAuth } from '@/utils/hooks/useAuth';
import styles from './Header.module.scss';

const BASE_URL = import.meta.env.VITE_KAKAO_LOGIN;

export default function Header() {
  const { pathname } = useLocation();
  const { isLoggedIn, clearAccessToken } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
  const isStoreMenuPage = /^\/store\/operate\/[^/]+/.test(pathname) || /^\/store\/[^/]+\/menu(?:\/|$)/.test(pathname);
  const menuManagePath = storeId ? `/store/operate/${storeId}` : '/';
  const orderManagePath = storeId ? `/store/${storeId}/orders` : '/';
  const tableManagePath = storeId ? `/store/${storeId}/start` : '/';
  const statisticsPath = storeId ? `/store/${storeId}/statistics` : '/';

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

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

  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  const navClassName = `${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`;

  return (
    <header className={styles.header}>
      <Link to='/' className={styles.logo} onClick={handleMenuClose}>
        <img src={OrderPingLogo} alt='Order ping Logo' className={styles.logoImage} />
      </Link>

      <button
        type='button'
        className={styles.menuButton}
        aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
        aria-expanded={isMenuOpen}
        aria-controls='admin-header-navigation'
        onClick={handleMenuToggle}
      >
        <MenuIcon className={styles.menuButtonIcon} />
      </button>

      <nav id='admin-header-navigation' className={navClassName}>
        {!isAuthHeaderPage ? (
          <>
            <Link
              to={menuManagePath}
              className={`${styles.navItem} ${isStoreMenuPage ? styles.navItemActive : ''}`}
              onClick={handleMenuClose}
            >
              메뉴 관리
            </Link>
            <Link
              to={orderManagePath}
              className={`${styles.navItem} ${isStoreOrdersPage ? styles.navItemActive : ''}`}
              onClick={handleMenuClose}
            >
              주문 조회
            </Link>
            <Link
              to={tableManagePath}
              className={`${styles.navItem} ${isStoreStartPage ? styles.navItemActive : ''}`}
              onClick={handleMenuClose}
            >
              테이블 관리
            </Link>
            <Link
              to={statisticsPath}
              className={`${styles.navItem} ${isStoreStatisticsPage ? styles.navItemActive : ''}`}
              onClick={handleMenuClose}
            >
              주문 통계
            </Link>
          </>
        ) : isLoggedIn ? (
          <>
            <Link
              to='/mypage'
              className={`${styles.navItem} ${isMyPage ? styles.navItemActive : ''}`}
              onClick={handleMenuClose}
            >
              마이페이지
            </Link>
            <button
              type='button'
              className={styles.navItem}
              onClick={() => {
                handleMenuClose();
                void handleLogout();
              }}
            >
              로그아웃
            </button>
          </>
        ) : (
          <button
            type='button'
            className={styles.navItem}
            onClick={() => {
              handleMenuClose();
              handleKakaoLogin();
            }}
          >
            로그인
          </button>
        )}
      </nav>
    </header>
  );
}
