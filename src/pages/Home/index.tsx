import { useState } from 'react';
import AuthedHome from './components/AuthedHome';
import GuestHome from './components/GuestHome';

export default function Home() {
  const [isLogin] = useState(false);

  return <>{isLogin ? <AuthedHome /> : <GuestHome />}</>;
}
