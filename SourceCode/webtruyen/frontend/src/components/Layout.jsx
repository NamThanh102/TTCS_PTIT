import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { FaHome, FaBook, FaHeart, FaHistory, FaCog } from 'react-icons/fa';

const Layout = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navClass = (path) =>
    isActive(path)
      ? 'text-red-400 font-semibold'
      : 'text-gray-300 hover:text-red-400 transition-colors';

  return (
    <div className="min-h-screen flex flex-col relative text-gray-100">
      <div
        className="fixed inset-0 -z-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black"
      />
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            'linear-gradient(135deg, rgba(18, 18, 18, 0.82) 0%, rgba(26, 26, 26, 0.74) 50%, rgba(18, 18, 18, 0.82) 100%)',
        }}
      />

      <header className="sticky top-0 z-50 bg-neutral-900/95 backdrop-blur border-b border-red-400/30 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center font-bold text-white">M</div>
            <span className="font-bold text-xl text-red-500">MeTruyen</span>
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-base font-bold">
            <Link to="/" className={navClass('/')}><FaHome className="inline mr-1 mb-0.5" />Trang chủ</Link>
            <Link to="/comics" className={navClass('/comics')}><FaBook className="inline mr-1 mb-0.5" />Truyện tranh</Link>
            <Link to="/library" className={navClass('/library')}><FaHeart className="inline mr-1 mb-0.5" />Yêu thích</Link>
            <Link to="/history" className={navClass('/history')}><FaHistory className="inline mr-1 mb-0.5" />Lịch sử</Link>
            <Link to="/admin" className={navClass('/admin')}><FaCog className="inline mr-1 mb-0.5" />Quản lý</Link>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/login" className="text-sm text-gray-300 hover:text-red-400">Đăng nhập</Link>
            <Link to="/register" className="text-sm px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white">Đăng ký</Link>
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
