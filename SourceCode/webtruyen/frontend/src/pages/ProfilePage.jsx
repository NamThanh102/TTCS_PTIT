import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentPassword || !newPassword) {
      toast.error('Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const res = await api.put('/users/password', {
        currentPassword,
        newPassword,
      });

      toast.success(res.data.message || 'Đã đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100">Hồ sơ cá nhân</h1>
          <p className="text-gray-400 mt-2">Chỉ hỗ trợ đổi mật khẩu trong trang này.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-900/90 p-6 shadow-lg shadow-black/20">
          <div className="border-b border-white/10 pb-4 mb-6">
            <button className="border-b-2 border-red-500 px-1 pb-3 text-sm font-semibold text-red-300">Đổi mật khẩu</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mật khẩu hiện tại</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-gray-100 focus:outline-none focus:border-red-400"
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-gray-100 focus:outline-none focus:border-red-400"
                placeholder="Nhập mật khẩu mới"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-gray-100 focus:outline-none focus:border-red-400"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-red-600 py-3 font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;