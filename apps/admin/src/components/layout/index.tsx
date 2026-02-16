import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header/Header';

export default function AppLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
}
