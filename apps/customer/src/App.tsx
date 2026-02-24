import { Navigate, Route, Routes } from "react-router-dom";
import CartPage from "./pages/Cart";
import HomePage from "./pages/Home";
import MenuDetailPage from "./pages/MenuDetail";
// import OrderCompletePage from './pages/OrderComplete';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/tables/:tableId" element={<HomePage />} />
      <Route path="/menus/:menuId" element={<MenuDetailPage />} />
      <Route
        path="/tables/:tableId/menus/:menuId"
        element={<MenuDetailPage />}
      />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/tables/:tableId/cart" element={<CartPage />} />
      {/* <Route path="/orders/completed" element={<OrderCompletePage />} /> */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
