import { Link } from 'react-router-dom';
import { postLogout } from '@/api/auth';
import OrderPingLogo from '@/assets/logo/ORDERPING_LOGO_TEXT.png';
import { useAuth } from '@/utils/hooks/useAuth';
import styles from './Header.module.scss';

const BASE_URL = import.meta.env.VITE_KAKAO_LOGIN;

export default function Header() {
  const { isLoggedIn, refreshToken, clearAccessToken, clearRefreshToken } = useAuth();

  const handleKakaoLogin = () => {
    window.location.href = `${BASE_URL}`;
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await postLogout(refreshToken);
      }
    } catch (e) {
      console.error('logout error', e);
    } finally {
      clearAccessToken();
      clearRefreshToken();

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
