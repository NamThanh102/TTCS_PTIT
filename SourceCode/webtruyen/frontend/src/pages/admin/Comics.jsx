import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Comics = () => {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchComics();
  }, []);

  const fetchComics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/comics?limit=100');
      const data = res.data.data.comics || res.data.data;
      setComics(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách truyện');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xác nhận xóa truyện này?')) return;
    try {
      await api.delete(`/comics/${id}`);
      toast.success('Đã xóa truyện');
      fetchComics();
    } catch (err) {
      toast.error('Xóa thất bại');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-100">Quản lý truyện</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/admin/comics/new')} className="px-4 py-2 bg-blue-600 rounded text-white">Thêm truyện mới</button>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded p-4">
          {loading ? <p className="text-gray-400">Đang tải...</p> : (
            <div className="space-y-3">
              {comics.map(c => (
                <div key={c._id} className="flex items-center justify-between p-3 bg-zinc-800 rounded">
                  <div>
                    <div className="font-medium text-gray-100">{c.title} <span className="text-sm text-gray-400">by {c.author}</span></div>
                    <div className="text-sm text-gray-400">{c.description?.slice(0, 120)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/admin/comics/${c._id}/chapters/new`} className="px-3 py-1 bg-blue-600 rounded text-white">+ Chương</Link>
                    <Link to={`/admin/comics/${c._id}/edit`} className="px-3 py-1 bg-yellow-600 rounded text-white">Sửa</Link>
                    <button onClick={() => handleDelete(c._id)} className="px-3 py-1 bg-red-600 rounded text-white">Xóa</button>
                  </div>
                </div>
              ))}
              {comics.length === 0 && <p className="text-gray-400">Chưa có truyện nào.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comics;
