import { Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/layout';
import Home from '@/pages/Home';
import './App.css';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        {/* <Route path="/login" element={<Login  />} /> */}
      </Route>
    </Routes>
  );
}

export default App;
