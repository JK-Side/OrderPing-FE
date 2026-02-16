import { useAuth } from '@order-ping/shared/utils/hooks/useAuth';
import AuthedHome from './components/AuthedHome';
import GuestHome from './components/GuestHome';

export default function Home() {
  const { isLoggedIn } = useAuth();

  return <>{isLoggedIn ? <AuthedHome /> : <GuestHome />}</>;
}
