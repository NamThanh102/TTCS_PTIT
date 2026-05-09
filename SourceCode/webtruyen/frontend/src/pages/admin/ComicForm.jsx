import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ComicForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', author: '', description: '', status: 'ongoing', categories: [] });
  const [cover, setCover] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (isEdit) fetchComic();
  }, [id]);

  const fetchCategories = async () => {
    try {
      await api.get('/categories');
    } catch (err) {
      // ignore
    }
  };

  const fetchComic = async () => {
    try {
      const res = await api.get(`/comics/${id}`);
      const c = res.data.data.comic || res.data.data;
      setForm({ title: c.title, author: c.author || '', description: c.description || '', status: c.status || 'ongoing', categories: c.categories?.map(x=>x._id||x) || [] });
    } catch (err) {
      toast.error('Không thể tải thông tin truyện');
      navigate('/admin/comics');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) return toast.error('Vui lòng điền tên và tác giả');
    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('author', form.author);
      data.append('description', form.description);
      data.append('status', form.status);
      data.append('categories', JSON.stringify(form.categories));
      if (cover) data.append('coverImage', cover);

      if (isEdit) await api.put(`/comics/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await api.post('/comics', data, { headers: { 'Content-Type': 'multipart/form-data' } });

      toast.success(isEdit ? 'Cập nhật thành công' : 'Thêm thành công');
      navigate('/admin/comics');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-100 mb-4">{isEdit ? 'Sửa truyện' : 'Thêm truyện'}</h1>
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded p-4 space-y-3">
          <input value={form.title} onChange={e=>setForm({...form, title: e.target.value})} placeholder="Tên truyện" className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-gray-100" />
          <input value={form.author} onChange={e=>setForm({...form, author: e.target.value})} placeholder="Tác giả" className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-gray-100" />
          <textarea value={form.description} onChange={e=>setForm({...form, description: e.target.value})} placeholder="Mô tả" className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-gray-100" />
          <select value={form.status} onChange={e=>setForm({...form, status: e.target.value})} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-gray-100">
            <option value="ongoing">Đang cập nhật</option>
            <option value="completed">Hoàn thành</option>
            <option value="hiatus">Tạm dừng</option>
          </select>
          <input type="file" accept="image/*" onChange={e=>setCover(e.target.files[0])} />
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 rounded text-white" disabled={loading}>{loading ? 'Đang...' : (isEdit ? 'Cập nhật' : 'Thêm')}</button>
            <button type="button" onClick={()=>navigate('/admin/comics')} className="px-4 py-2 bg-zinc-700 rounded text-gray-200">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComicForm;
