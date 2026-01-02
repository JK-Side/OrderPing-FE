import { Link } from 'react-router-dom';
import { postLogout } from '@/api/auth';
import OrderPingLogo from '@/assets/logo/ORDERPING_LOGO_TEXT.png';
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/constants/auth';
import styles from './Header.module.scss';

const BASE_URL = import.meta.env.VITE_KAKAO_LOGIN;

export default function Header() {
  const isLoggedIn = Boolean(localStorage.getItem(AUTH_TOKEN_KEY));

  const handleKakaoLogin = () => {
    window.location.href = `${BASE_URL}`;
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    try {
      if (refreshToken) {
        await postLogout(refreshToken);
      }
    } catch (e) {
      console.error('logout error', e);
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);

      window.location.href = '/';
    }
  };

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>
        <img src={OrderPingLogo} alt="Order ping Logo" height={50} />
      </Link>

      <nav className={styles.nav}>
        {isLoggedIn ? (
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
