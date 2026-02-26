import { Navigate, Route, Routes } from "react-router-dom";
import CartPage from "./pages/Cart";
import CustomerHomePage from "./pages/CustomerHome";
import HomePage from "./pages/Home";
import MenuDetailPage from "./pages/MenuDetail";
// import OrderCompletePage from "./pages/OrderComplete";

function App() {
  return (
    <Routes>
      <Route path="/" element={<CustomerHomePage />} />
      <Route path="/stores/:storeId" element={<HomePage />} />
      <Route path="/menus/:menuId" element={<MenuDetailPage />} />
      <Route
        path="/stores/:storeId/menus/:menuId"
        element={<MenuDetailPage />}
      />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/stores/:storeId/cart" element={<CartPage />} />
      {/* <Route path="/orders/completed" element={<OrderCompletePage />} /> */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
