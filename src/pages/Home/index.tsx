import AuthedHome from './components/AuthedHome';
import GuestHome from './components/GuestHome';
import { useAuth } from '@/utils/hooks/useAuth';

export default function Home() {
  const { isLoggedIn } = useAuth();

  return <>{isLoggedIn ? <AuthedHome /> : <GuestHome />}</>;
}
