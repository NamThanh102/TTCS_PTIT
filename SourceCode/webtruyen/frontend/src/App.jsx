import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ComicsPage from './pages/ComicsPage';
import ComicDetailPage from './pages/ComicDetailPage';
import ReaderPage from './pages/ReaderPage';
import LibraryPage from './pages/LibraryPage';
import HistoryPage from './pages/HistoryPage';
import useAuthStore from './store/authStore';

const PlaceholderPage = ({ name }) => (
  <div className="container mx-auto px-4 py-8 text-center">
    <h1 className="text-3xl font-bold text-red-500 mb-4">{name}</h1>
    <p className="text-gray-400">Trang này sẽ được phát triển ở các tuần tiếp theo...</p>
  </div>
);

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="comics" element={<ComicsPage />} />
        <Route path="comics/:slug" element={<ComicDetailPage />} />
        <Route path="read/:chapterId" element={<ReaderPage />} />

        <Route element={<PrivateRoute />}>
          <Route path="profile" element={<PlaceholderPage name="Hồ Sơ Cá Nhân" />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="history" element={<HistoryPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="admin" element={<PlaceholderPage name="Trang Quản Lý" />} />
        </Route>

        <Route path="*" element={<PlaceholderPage name="Trang Không Tồn Tại" />} />
      </Route>
    </Routes>
  );
}

export default App;
