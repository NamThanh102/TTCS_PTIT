import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { getStatusLabel } from '../utils/statusHelper';

const ComicDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [comic, setComic] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug || slug === 'undefined') return;

    const fetchData = async () => {
      try {
        const [comicRes, chaptersRes] = await Promise.all([
          api.get(`/comics/slug/${slug}`),
          api.get(`/comics/slug/${slug}/chapters`)
        ]);

        const comicData = comicRes.data.data;
        setComic(comicData);
        setChapters(chaptersRes.data.data || []);
        await api.post(`/comics/${comicData._id}/view`);
      } catch {
        navigate('/comics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, navigate]);

  const getCoverUrl = (coverImage) => {
    if (!coverImage) return '/assets/default-cover.png';
    if (typeof coverImage === 'string') {
      const trimmed = coverImage.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed);
          return parsed?.url || parsed?.secure_url || '/assets/default-cover.png';
        } catch {
          return '/assets/default-cover.png';
        }
      }
      return trimmed;
    }
    return coverImage?.url || coverImage?.secure_url || '/assets/default-cover.png';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-zinc-700 border-r-red-500" />
      </div>
    );
  }

  if (!comic) return null;

  return (
    <div className="min-h-screen pt-4">
      {comic.bannerImage && (
        <div className="h-64 md:h-96 relative">
          <img src={comic.bannerImage?.url || comic.bannerImage} alt={comic.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
        </div>
      )}

      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl shadow-lg p-6 mb-6" style={{ marginTop: comic.bannerImage ? '-80px' : '0', position: 'relative', zIndex: 10 }}>
          <div className="flex flex-col md:flex-row gap-6">
            <img src={getCoverUrl(comic.coverImage)} alt={comic.title} className="w-48 h-64 object-cover rounded-lg shadow-lg" />

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-100 mb-2">{comic.title}</h1>
              <p className="text-gray-400 mb-4">Tác giả: {comic.author || 'Đang cập nhật'}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {comic.categories?.map((category) => (
                  <span
                    key={category._id || category}
                    className="px-3 py-1 rounded-full text-sm text-white"
                    style={{ backgroundColor: category.color || '#3B82F6' }}
                  >
                    {category.name}
                  </span>
                ))}
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    comic.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : comic.status === 'ongoing'
                        ? 'bg-blue-100 text-blue-700'
                        : comic.status === 'hiatus'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                  }`}
                >
                  {getStatusLabel(comic.status)}
                </span>
              </div>

              <div className="flex items-center gap-6 mb-4 text-gray-400">
                <span>{comic.statistics?.totalViews || 0} lượt xem</span>
                <span>{comic.statistics?.totalBookmarks || 0} yêu thích</span>
                <span>{chapters.length} chương</span>
              </div>

              <p className="text-gray-300 mb-6 leading-relaxed">{comic.description}</p>

              {chapters.length > 0 && (
                <Link to={`/read/${chapters[0]._id}`} className="px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-500">
                  Đọc ngay
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">Danh sách chương</h2>

          {chapters.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Chưa có chương nào</p>
          ) : (
            <div className="space-y-2">
              {chapters.map((chapter) => (
                <Link
                  key={chapter._id}
                  to={`/read/${chapter._id}`}
                  className="flex items-center justify-between p-4 hover:bg-zinc-800 rounded-lg transition-colors group border border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-200 group-hover:text-cyan-400 font-medium">
                      Chapter {chapter.chapterNumber}
                      {chapter.title && `: ${chapter.title}`}
                    </span>
                    {chapter.isVIPOnly && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded border border-amber-500/30">
                        VIP
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-400">{new Date(chapter.createdAt).toLocaleDateString('vi-VN')}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComicDetailPage;
