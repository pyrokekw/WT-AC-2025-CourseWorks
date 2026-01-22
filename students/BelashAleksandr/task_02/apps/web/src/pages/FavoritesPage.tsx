import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Favorite } from '../shared/types';
import './FavoritesPage.css';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await api.get('/favorites');
      setFavorites(res.data.data.favorites || []);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Удалить из избранного?')) return;

    try {
      await api.delete(`/favorites/${id}`);
      setFavorites(favorites.filter((fav) => fav.id !== id));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      alert('Не удалось удалить из избранного');
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="favorites-page">
      <h1>Избранное</h1>

      {favorites.length === 0 ? (
        <p className="empty-state">
          У вас пока нет избранных статей. <Link to="/feed">Перейти к ленте</Link>
        </p>
      ) : (
        <div className="favorites-list">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="favorite-item">
              <div className="favorite-content">
                <h2>
                  <Link to={`/article/${favorite.article.id}`}>
                    {favorite.article.title}
                  </Link>
                </h2>
                <div className="article-meta">
                  <span className="article-source">{favorite.article.source.name}</span>
                  <span className="article-date">
                    Добавлено: {new Date(favorite.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="article-tags">
                  {favorite.article.tags.map((tag) => (
                    <span key={tag.id} className="tag">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleRemove(favorite.id)}
                className="btn btn-danger btn-remove"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
