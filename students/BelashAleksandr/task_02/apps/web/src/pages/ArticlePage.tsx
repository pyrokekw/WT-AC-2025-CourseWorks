import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Article } from '../shared/types';
import { useAuthStore } from '../features/auth/authStore';
import './ArticlePage.css';

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportReason, setReportReason] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const res = await api.get(`/feed/${id}`);
      setArticle(res.data.data);
    } catch (error) {
      console.error('Failed to fetch article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToFavorites = async () => {
    try {
      await api.post('/favorites', { articleId: id });
      alert('Добавлено в избранное!');
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      alert('Не удалось добавить в избранное');
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/reports', { articleId: id, reason: reportReason });
      alert('Жалоба отправлена!');
      setShowReportForm(false);
      setReportReason('');
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Не удалось отправить жалобу');
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!article) {
    return <div className="error">Статья не найдена</div>;
  }

  return (
    <div className="article-page">
      <button onClick={() => navigate(-1)} className="btn btn-secondary back-btn">
        ← Назад
      </button>
      
      <article className="article-detail">
        <h1>{article.title}</h1>
        
        <div className="article-meta">
          <span className="article-source">
            Источник: <strong>{article.source.name}</strong>
          </span>
          <span className="article-date">
            {new Date(article.publishedAt).toLocaleDateString('ru-RU')}
          </span>
        </div>

        <div className="article-tags">
          {article.tags.map((tag) => (
            <span key={tag.id} className="tag">
              {tag.name}
            </span>
          ))}
        </div>

        {article.content && (
          <div className="article-content">
            <p>{article.content}</p>
          </div>
        )}

        {article.url && (
          <p>
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="article-link">
              Читать полностью на сайте источника →
            </a>
          </p>
        )}

        {isAuthenticated && user?.role === 'user' && (
          <div className="article-actions">
            <button onClick={handleAddToFavorites} className="btn btn-primary">
              Добавить в избранное
            </button>
            <button 
              onClick={() => setShowReportForm(!showReportForm)} 
              className="btn btn-danger"
            >
              Пожаловаться
            </button>
          </div>
        )}

        {showReportForm && (
          <form onSubmit={handleSubmitReport} className="report-form">
            <h3>Подать жалобу</h3>
            <div className="form-group">
              <label htmlFor="reason">Причина жалобы:</label>
              <textarea
                id="reason"
                className="form-input"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
                required
                minLength={10}
                placeholder="Опишите причину жалобы (минимум 10 символов)"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Отправить жалобу
              </button>
              <button 
                type="button" 
                onClick={() => setShowReportForm(false)} 
                className="btn btn-secondary"
              >
                Отмена
              </button>
            </div>
          </form>
        )}
      </article>
    </div>
  );
}
