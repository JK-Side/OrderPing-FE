import { Navigate, Route, Routes } from 'react-router-dom';
import CartPage from './pages/Cart';
import CustomerHomePage from './pages/CustomerHome';
import HomePage from './pages/Home';
import OrderHistoryPage from './pages/OrderHistory';
import MenuDetailPage from './pages/MenuDetail';
import OrderConfirmPage from './pages/OrderConfirm';
import OrderIssuePage from './pages/OrderIssue';
import OrderStatusPage from './pages/OrderStatus';
import PaymentAccountPage from './pages/PaymentAccount';
import PaymentWaitPage from './pages/PaymentWait';

function App() {
  return (
    <Routes>
      <Route path='/' element={<CustomerHomePage />} />
      <Route path='/stores/:storeId' element={<HomePage />} />
      <Route path='/menus/:menuId' element={<MenuDetailPage />} />
      <Route
        path='/stores/:storeId/menus/:menuId'
        element={<MenuDetailPage />}
      />
      <Route path='/cart' element={<CartPage />} />
      <Route path='/stores/:storeId/cart' element={<CartPage />} />
      <Route path='/stores/:storeId/orders/confirm' element={<OrderConfirmPage />} />
      <Route path='/stores/:storeId/orders/payment' element={<PaymentWaitPage />} />
      <Route path='/stores/:storeId/orders/payment/account' element={<PaymentAccountPage />} />
      <Route path='/stores/:storeId/orders/history' element={<OrderHistoryPage />} />
      <Route path='/stores/:storeId/orders/status' element={<OrderStatusPage />} />
      <Route path='/stores/:storeId/orders/issue' element={<OrderIssuePage />} />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

export default App;
