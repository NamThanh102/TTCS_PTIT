import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { FaHome, FaBook, FaHeart, FaHistory, FaCoins,FaCog } from 'react-icons/fa';
import useAuthStore from '../store/authStore';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const isActive = (path) => location.pathname === path;

  const navClass = (path) =>
    isActive(path)
      ? 'text-red-400 font-semibold'
      : 'text-gray-300 hover:text-red-400 transition-colors';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col relative text-gray-100">
      <div className="fixed inset-0 -z-20 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/assets/a3.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            filter: 'blur(2px)',
            transform: 'scale(1.05)',
            opacity: 0.25,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(10, 10, 10, 0.55) 0%, rgba(12, 12, 12, 0.48) 50%, rgba(8, 8, 8, 0.58) 100%)',
          }}
        />
      </div>

      <header className="sticky top-0 z-50 bg-neutral-900/95 backdrop-blur border-b border-red-400/30 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/assets/a1.jpg"
              alt="MeTruyen"
              className="w-8 h-8 rounded object-cover border border-red-400/40"
            />
            <span className="font-bold text-xl text-red-500">MeTruyen</span>
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-base font-bold">
            <Link to="/" className={navClass('/')}><FaHome className="inline mr-1 mb-0.5" />Trang chủ</Link>
            <Link to="/comics" className={navClass('/comics')}><FaBook className="inline mr-1 mb-0.5" />Truyện tranh</Link>
            {user && <Link to="/library" className={navClass('/library')}><FaHeart className="inline mr-1 mb-0.5" />Yêu thích</Link>}
            {user && <Link to="/history" className={navClass('/history')}><FaHistory className="inline mr-1 mb-0.5" />Lịch sử</Link>}
            {user && <Link to="/recharge" className={navClass('/recharge')}><FaCoins className="inline mr-1 mb-0.5" />Nạp Point</Link>}
            {user?.role === 'admin' && (
              <Link to="/admin" className={navClass('/admin')}><FaCog className="inline mr-1 mb-0.5" />Quản lý</Link>
            )}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <>
                <span className="hidden sm:block text-sm text-gray-300">Hello, {user.username}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm px-4 py-2 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-300 hover:text-red-400">Đăng nhập</Link>
                <Link to="/register" className="text-sm px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-0">
        <Outlet />
      </main>

      <footer className="bg-neutral-900/95 backdrop-blur mt-14 border-t border-red-400/30">
        <div className="container mx-auto px-4 py-10">
          <div className="text-center text-sm text-gray-500">
            © 2026 MeTruyen - Nền tảng đọc truyện tranh online
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
