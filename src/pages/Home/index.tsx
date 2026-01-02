import AuthedHome from './components/AuthedHome';
import GuestHome from './components/GuestHome';

export default function Home() {
  const isLoggedIn = !!localStorage.getItem('AUTH_TOKEN_KEY');

  return <>{isLoggedIn ? <AuthedHome /> : <GuestHome />}</>;
}
