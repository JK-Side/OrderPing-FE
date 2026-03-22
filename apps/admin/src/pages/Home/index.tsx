import EmptyMain from './components/EmptyMain';
import GuestHome from './components/GuestHome';
import HomeError from './components/HomeError';
import HomeLoading from './components/HomeLoading';
import ReadyMain from './components/ReadyMain';
import { useHomeState } from './hooks/useHomeState';

export default function Home() {
  const homeState = useHomeState();

  switch (homeState.status) {
    case 'bootstrapping':
    case 'loading-user':
      return <HomeLoading />;
    case 'guest':
      return <GuestHome />;
    case 'user-error':
      return <HomeError error={homeState.error} />;
    case 'no-store':
      return <EmptyMain userName={homeState.userName} />;
    case 'ready':
      return <ReadyMain userName={homeState.userName} store={homeState.store} />;
    default:
      return null;
  }
}
