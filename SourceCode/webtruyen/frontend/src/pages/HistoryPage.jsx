import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FaHistory } from 'react-icons/fa';

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const fallbackCover = '/assets/a1.jpg';

  const getCoverUrl = (coverImage) => {
    if (!coverImage) return fallbackCover;

    if (typeof coverImage === 'string') {
      const trimmed = coverImage.trim();

      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed);
          return parsed?.url || parsed?.secure_url || fallbackCover;
        } catch {
          return fallbackCover;
        }
      }

      return trimmed || fallbackCover;
    }

    if (typeof coverImage === 'object') {
      return coverImage.url || coverImage.secure_url || fallbackCover;
    }

    return fallbackCover;
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const buildLocalHistory = () => {
    try {
      const readingHistory = JSON.parse(localStorage.getItem('readingHistory') || '{}');
      return Object.values(readingHistory)
        .map((item) => ({
          _id: item.chapterId || item.comicSlug || item.comicTitle,
          comicId: {
            title: item.comicTitle,
            slug: item.comicSlug,
            coverImage: item.coverImage
          },
          chapterId: {
            _id: item.chapterId,
            chapterNumber: item.chapterNumber,
            title: item.chapterTitle
          },
          lastReadAt: item.timestamp
        }))
        .filter((item) => item.comicId?.title && item.chapterId?._id);
    } catch {
      return [];
    }
  };

  const fetchHistory = async () => {
    let serverHistory = [];

    try {
      const response = await api.get('/users/library');
      const data = response.data.data;
      serverHistory = Array.isArray(data.history) ? data.history : [];
    } catch {
      serverHistory = [];
    } finally {
      const localHistory = buildLocalHistory();
      const mergedHistory = [...serverHistory];

      for (const localItem of localHistory) {
        const exists = mergedHistory.some((serverItem) => {
          const serverComicSlug = serverItem.comicId?.slug;
          const serverChapterId = serverItem.chapterId?._id || serverItem.chapterId;
          return (
            (serverComicSlug && serverComicSlug === localItem.comicId?.slug) ||
            String(serverChapterId) === String(localItem.chapterId?._id)
          );
        });

        if (!exists) {
          mergedHistory.push(localItem);
        }
      }

      mergedHistory.sort((a, b) => new Date(b.lastReadAt) - new Date(a.lastReadAt));
      setHistory(mergedHistory);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen" style={{ color: 'var(--text-primary)' }}>
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><FaHistory/>Lịch sử đọc truyện</h1>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4" style={{ borderColor: 'var(--border)', borderRightColor: '#ef4444' }}></div>
        </div>
      ) : (
        <div>
          {history.length === 0 ? (
            <div className="rounded-lg p-12 text-center" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '1rem' }}>
                Chưa có lịch sử đọc truyện
              </p>
              <Link to="/comics" className="font-medium transition-colors" style={{ color: '#ef4444' }}>
                Bắt đầu đọc →
              </Link>
            </div>
          ) : (
            <>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Bạn có <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{history.length}</span> truyện đã đọc
              </div>
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-lg p-4 transition-all hover:shadow-lg"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={getCoverUrl(item.comicId?.coverImage)}
                        alt={item.comicId?.title}
                        className="w-12 h-16 object-cover rounded"
                        onError={(e) => (e.currentTarget.src = fallbackCover)}
                      />
                      <div className="flex-1">
                        <Link
                          to={`/comics/${item.comicId?.slug}`}
                          className="font-semibold transition-colors hover:text-red-500"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {item.comicId?.title}
                        </Link>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          Đọc đến: Chapter {item.chapterId?.chapterNumber}
                          {item.chapterId?.title && ` - ${item.chapterId.title}`}
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                          {new Date(item.lastReadAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <Link
                        to={`/read/${item.chapterId?._id}`}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
                        style={{ backgroundColor: '#ef4444' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
                      >
                        Đọc tiếp
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
