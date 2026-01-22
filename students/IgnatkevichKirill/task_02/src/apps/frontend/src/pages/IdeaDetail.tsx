import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Heart, 
  MessageCircle, 
  User, 
  ArrowLeft,
  Calendar,
  Tag,
  Send,
  Trash2
} from 'lucide-react';

interface Idea {
  id: string;
  title: string;
  description: string;
  rating: number;
  tags: { id: string; name: string }[];
  author: { id: string; name: string };
  comments: any[];
  votes: any[];
  createdAt: string;
  updatedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  authorId: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
}

export default function IdeaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [idea, setIdea] = useState<Idea | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [voting, setVoting] = useState(false);

  // Загрузка идеи и комментариев
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Загружаем идею
        const ideaRes = await api.get(`/ideas/${id}`);
        setIdea(ideaRes.data);
        
        // Загружаем комментарии отдельно
        try {
          const commentsRes = await api.get(`/comments/idea/${id}`);
          setComments(commentsRes.data);
        } catch (commentErr) {
          console.warn('Не удалось загрузить комментарии:', commentErr);
          // Используем комментарии из ответа идеи, если есть
          if (ideaRes.data.comments) {
            setComments(ideaRes.data.comments);
          }
        }
        
      } catch (err: any) {
        console.error('Ошибка загрузки:', err);
        if (err.response?.status === 404) {
          toast.error('Идея не найдена');
          navigate('/');
        } else {
          toast.error('Не удалось загрузить данные');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, navigate]);

  // Голосование за идею
  const handleVote = async () => {
    if (!idea || voting) return;
    
    try {
      setVoting(true);
      await api.post(`/votes/idea/${idea.id}`, { value: 1 });
      
      // Оптимистичное обновление
      setIdea(prev => prev ? { 
        ...prev, 
        rating: prev.rating + 1
      } : null);
      
      toast.success('Ваш голос учтен!');
    } catch (err: any) {
      console.error('Ошибка голосования:', err);
      toast.error(err.response?.data?.message || 'Ошибка голосования');
    } finally {
      setVoting(false);
    }
  };

  // Отправка комментария
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !idea || submittingComment) return;
    
    try {
      setSubmittingComment(true);
      const res = await api.post(`/comments/idea/${idea.id}`, {
        content: newComment.trim()
      });
      
      // Добавляем новый комментарий в начало списка
      setComments(prev => [res.data, ...prev]);
      setNewComment('');
      
      toast.success('Комментарий добавлен');
    } catch (err: any) {
      console.error('Ошибка добавления комментария:', err);
      toast.error(err.response?.data?.message || 'Ошибка добавления комментария');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Удаление комментария
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Удалить комментарий?')) return;
    
    try {
      await api.delete(`/comments/${commentId}`);
      
      // Удаляем из списка
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      
      toast.success('Комментарий удален');
    } catch (err: any) {
      console.error('Ошибка удаления:', err);
      toast.error(err.response?.data?.message || 'Не удалось удалить комментарий');
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
        <p className="mt-2">Загрузка идеи...</p>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <h4 className="alert-heading">Идея не найдена</h4>
          <p>Возможно, она была удалена или вы перешли по неверной ссылке.</p>
          <button 
            onClick={() => navigate('/')}
            className="btn btn-outline-danger"
          >
            Вернуться к списку идей
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      {/* Кнопка назад */}
      <button
        onClick={() => navigate('/')}
        className="btn btn-outline-secondary mb-4"
      >
        <ArrowLeft size={18} className="me-2" />
        Назад к списку
      </button>

      {/* Карточка идеи */}
      <div className="card shadow-lg mb-5">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h1 className="h3 mb-2">{idea.title}</h1>
              <div className="d-flex align-items-center gap-3">
                <span className="badge bg-light text-dark">
                  <User size={14} className="me-1" />
                  {idea.author.name}
                </span>
                <span className="badge bg-light text-dark">
                  <Calendar size={14} className="me-1" />
                  {formatDate(idea.createdAt)}
                </span>
                {idea.status !== 'APPROVED' && (
                  <span className={`badge ${idea.status === 'PENDING' ? 'bg-warning' : 'bg-danger'}`}>
                    {idea.status === 'PENDING' ? 'На модерации' : 'Отклонено'}
                  </span>
                )}
              </div>
            </div>
            <div className="text-end">
              <div className="d-flex align-items-center mb-2">
                <Heart size={20} className="text-danger me-2" />
                <h2 className="mb-0">{idea.rating}</h2>
              </div>
              <small className="text-white-50">рейтинг</small>
            </div>
          </div>
        </div>
        
        <div className="card-body">
          {/* Описание */}
          <div className="mb-4">
            <h5 className="text-muted mb-3">Описание</h5>
            <p className="card-text" style={{ whiteSpace: 'pre-wrap' }}>
              {idea.description}
            </p>
          </div>
          
          {/* Теги */}
          {idea.tags && idea.tags.length > 0 && (
            <div className="mb-4">
              <h5 className="text-muted mb-3">
                <Tag size={18} className="me-2" />
                Теги
              </h5>
              <div>
                {idea.tags.map(tag => (
                  <span
                    key={tag.id}
                    className="badge bg-info me-2 mb-2"
                    style={{ fontSize: '0.9rem' }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="card-footer">
          <button
            onClick={handleVote}
            disabled={voting}
            className="btn btn-danger w-100"
          >
            {voting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Голосую...
              </>
            ) : (
              <>
                <Heart size={18} className="me-2" />
                Голосовать за идею
              </>
            )}
          </button>
        </div>
      </div>

      {/* Раздел комментариев */}
      <div className="row">
        <div className="col-lg-8">
          {/* Форма добавления комментария */}
          {user ? (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Добавить комментарий</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmitComment}>
                  <div className="mb-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="form-control"
                      rows={3}
                      placeholder="Напишите ваш комментарий..."
                      maxLength={1000}
                      required
                    />
                    <div className="form-text text-end">
                      {newComment.length}/1000 символов
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="btn btn-primary"
                  >
                    {submittingComment ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Отправка...
                      </>
                    ) : (
                      <>
                        <Send size={18} className="me-2" />
                        Отправить комментарий
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="alert alert-info mb-4">
              <p className="mb-0">
                <a href="/login" className="alert-link">Войдите</a>, чтобы оставлять комментарии
              </p>
            </div>
          )}

          {/* Список комментариев */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <MessageCircle size={20} className="me-2" />
                Комментарии ({comments.length})
              </h5>
            </div>
            
            <div className="card-body">
              {comments.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <MessageCircle size={48} className="mb-3 opacity-25" />
                  <p>Пока нет комментариев. Будьте первым!</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {comments.map(comment => (
                    <div 
                      key={comment.id} 
                      className="list-group-item border-0 px-0 py-4"
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <strong className="d-block">
                            <User size={16} className="me-2" />
                            {comment.author.name}
                          </strong>
                          <small className="text-muted">
                            {formatDate(comment.createdAt)}
                          </small>
                        </div>
                        
                        {/* Кнопка удаления (для автора или админа) */}
                        {(user?.id === comment.author.id || user?.role === 'ADMIN') && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="btn btn-sm btn-outline-danger"
                            title="Удалить комментарий"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      
                      <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Боковая панель с информацией */}
        <div className="col-lg-4 mt-4 mt-lg-0">
          <div className="card sticky-top" style={{ top: '20px' }}>
            <div className="card-header">
              <h5 className="mb-0">Об идее</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <strong className="d-block mb-1">
                  <User size={16} className="me-2" />
                  Автор
                </strong>
                <p className="mb-0">{idea.author.name}</p>
              </div>
              
              <div className="mb-3">
                <strong className="d-block mb-1">
                  <Calendar size={16} className="me-2" />
                  Создана
                </strong>
                <p className="mb-0">{formatDate(idea.createdAt)}</p>
              </div>
              
              <div className="mb-3">
                <strong className="d-block mb-1">
                  <Heart size={16} className="me-2" />
                  Рейтинг
                </strong>
                <p className="mb-0">{idea.rating} голосов</p>
              </div>
              
              {idea.status !== 'APPROVED' && (
                <div className="alert alert-warning mb-0">
                  <small>
                    <strong>Статус:</strong> {
                      idea.status === 'PENDING' 
                        ? 'На модерации' 
                        : 'Отклонена модератором'
                    }
                  </small>
                </div>
              )}
            </div>
          </div>
          
          {/* Полезные ссылки */}
          <div className="card mt-3">
            <div className="card-body">
              <h6>Полезные ссылки</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <a href="/" className="text-decoration-none">
                    ← Все идеи
                  </a>
                </li>
                <li className="mb-2">
                  <a href="/ideas/new" className="text-decoration-none">
                    + Предложить свою идею
                  </a>
                </li>
                {user?.role === 'ADMIN' && (
                  <li>
                    <a href="/admin" className="text-decoration-none">
                      ⚙️ Панель модератора
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}