import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const PlaceholderPage = ({ name }) => (
  <div className="container mx-auto px-4 py-8 text-center">
    <h1 className="text-3xl font-bold text-red-500 mb-4">{name}</h1>
    <p className="text-gray-400">Trang này sẽ được phát triển ở các tuần tiếp theo...</p>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<PlaceholderPage name="Trang Chủ" />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="comics" element={<PlaceholderPage name="Danh Sách Truyện" />} />

        <Route path="profile" element={<PlaceholderPage name="Hồ Sơ Cá Nhân" />} />
        <Route path="library" element={<PlaceholderPage name="Thư Viện" />} />
        <Route path="history" element={<PlaceholderPage name="Lịch Sử" />} />
        <Route path="admin" element={<PlaceholderPage name="Trang Quản Lý" />} />

        <Route path="*" element={<PlaceholderPage name="Trang Không Tồn Tại" />} />
      </Route>
    </Routes>
  );
}

export default App;
