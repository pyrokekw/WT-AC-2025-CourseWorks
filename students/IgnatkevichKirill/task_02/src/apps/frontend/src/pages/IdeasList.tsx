import { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, User, Plus } from 'lucide-react';

interface Idea {
  id: string;
  title: string;
  description: string;
  rating: number;
  tags: { name: string }[];
  author: { name: string };
  _count: { comments: number };
}

export default function IdeasList() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        // Получаем только одобренные идеи
        const res = await api.get('/ideas?status=APPROVED');
        setIdeas(res.data);
      } catch (err: any) {
        setError('Не удалось загрузить идеи. Попробуйте войти заново.');
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, []);

  const handleVote = async (ideaId: string) => {
    try {
      await api.post(`/votes/idea/${ideaId}`, { value: 1 });
      // Обновляем локально рейтинг +1
      setIdeas(prev =>
        prev.map(idea =>
          idea.id === ideaId ? { ...idea, rating: idea.rating + 1 } : idea
        )
      );
    } catch (err: any) {
      alert('Ошибка голосования: ' + (err.response?.data?.message || 'Неизвестная ошибка'));
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
        <p className="mt-2">Загрузка идей...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <h4 className="alert-heading">Ошибка!</h4>
          <p>{error}</p>
          <button 
            className="btn btn-outline-danger"
            onClick={() => window.location.reload()}
          >
            Обновить страницу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Заголовок и кнопка */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">💡 Идеи сообщества</h1>
        <button
          onClick={() => navigate('/ideas/new')}
          className="btn btn-success"
        >
          <Plus size={18} className="me-2" />
          Добавить идею
        </button>
      </div>

      {ideas.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-4">
            <i className="bi bi-lightbulb" style={{ fontSize: '4rem', color: '#6c757d' }}></i>
          </div>
          <h3 className="text-muted">Пока идей нет</h3>
          <p className="text-muted">Будьте первым, кто предложит идею!</p>
          <button
            onClick={() => navigate('/ideas/new')}
            className="btn btn-primary mt-3"
          >
            <Plus size={18} className="me-2" />
            Создать первую идею
          </button>
        </div>
      ) : (
        <div className="row">
          {ideas.map(idea => (
            <div key={idea.id} className="col-md-6 col-lg-4 mb-4">
              <div 
                className="card h-100 shadow-sm hover-shadow"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/ideas/${idea.id}`)}
              >
                <div className="card-body">
                  <h5 className="card-title">{idea.title}</h5>
                  <p 
                    className="card-text text-muted" 
                    style={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {idea.description}
                  </p>
                  
                  {/* Теги */}
                  {idea.tags && idea.tags.length > 0 && (
                    <div className="mb-3">
                      {idea.tags.map(tag => (
                        <span
                          key={tag.name}
                          className="badge bg-info me-1 mb-1"
                          style={{ fontSize: '0.8rem' }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Автор и статистика */}
                  <div className="d-flex justify-content-between align-items-center text-muted mb-3">
                    <div>
                      <User size={14} className="me-1" />
                      <small>{idea.author?.name || 'Аноним'}</small>
                    </div>
                    <div>
                      <MessageCircle size={14} className="me-1" />
                      <small>{idea._count?.comments || 0}</small>
                    </div>
                  </div>
                  
                  {/* Рейтинг */}
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <strong className="text-primary" style={{ fontSize: '1.5rem' }}>
                        {idea.rating}
                      </strong>
                      <small className="text-muted d-block">рейтинг</small>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(idea.id);
                      }}
                      className="btn btn-outline-primary btn-sm"
                    >
                      <Heart size={16} className="me-1" />
                      Лайк
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}