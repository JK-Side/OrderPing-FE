import { Navigate, Route, Routes } from 'react-router-dom';
import CartPage from './pages/Cart';
import HomePage from './pages/Home';
import MenuDetailPage from './pages/MenuDetail';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/menus/:menuId" element={<MenuDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
