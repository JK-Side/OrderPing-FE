import { Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/layout';
import Home from '@/pages/Home';
import MenuCreate from '@/pages/MenuCreate';
import OAuthCallback from '@/pages/OAuthCallback';
import StoreCreate from '@/pages/StoreCreate';
import StoreOperate from '@/pages/StoreOperate';
import { useAuthInit } from '@/utils/hooks/useAuthInit';
import './App.css';

function App() {
  useAuthInit();

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/store/create" element={<StoreCreate />} />
        <Route path="/store/operate/:id" element={<StoreOperate />} />
        <Route path="/store/:id/menu/create" element={<MenuCreate />} />
      </Route>

      <Route path="/callback" element={<OAuthCallback />} />
    </Routes>
  );
}

export default App;
