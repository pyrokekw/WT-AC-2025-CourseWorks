import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Clock, 
  Award, 
  ArrowLeft,
  Heart,
  MessageCircle,
  Tag,
  User,
  Send,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Hackathon {
  id: string;
  name: string;
  description: string;
  theme: string;
  status: 'UPCOMING' | 'SUBMISSION' | 'VOTING' | 'ENDED';
  startDate: string;
  endDate: string;
  ideaSubmissionEnd: string;
  maxIdeasPerUser: number;
  rules: string;
  _count: {
    participants: number;
    ideas: number;
  };
  ideas: Array<{
    id: string;
    votes: number;
    idea: {
      id: string;
      title: string;
      description: string;
      rating: number;
      author: {
        id: string;
        name: string;
      };
      tags: Array<{
        id: string;
        name: string;
      }>;
    };
  }>;
}

interface UserIdea {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function HackathonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [userIdeas, setUserIdeas] = useState<UserIdea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);
  const [isParticipant, setIsParticipant] = useState(false);
  const [userSubmittedIdeas, setUserSubmittedIdeas] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Загружаем хакатон
      const hackathonRes = await api.get(`/hackathons/${id}`);
      setHackathon(hackathonRes.data);
      
      // Загружаем идеи пользователя для подачи
      const ideasRes = await api.get('/ideas?status=APPROVED');
      setUserIdeas(ideasRes.data);
      
      // Проверяем, является ли пользователь участником
      if (user) {
        try {
          const participantRes = await api.get(`/hackathons/${id}/participants/${user.id}`);
          setIsParticipant(true);
          
          // Получаем идеи, которые пользователь уже подал
          const submittedIdeas = hackathonRes.data.ideas
            .filter((hi: any) => hi.idea.author.id === user.id)
            .map((hi: any) => hi.idea.id);
          setUserSubmittedIdeas(new Set(submittedIdeas));
        } catch {
          setIsParticipant(false);
        }
      }
      
    } catch (err: any) {
      console.error('Ошибка загрузки:', err);
      toast.error('Не удалось загрузить хакатон');
      navigate('/hackathons');
    } finally {
      setLoading(false);
    }
  };

  const joinHackathon = async () => {
    if (!user) {
      toast.error('Войдите, чтобы присоединиться');
      navigate('/login');
      return;
    }
    
    try {
      setJoining(true);
      await api.post(`/hackathons/${id}/join`);
      setIsParticipant(true);
      toast.success('Вы присоединились к хакатону!');
    } catch (err: any) {
      console.error('Ошибка присоединения:', err);
      toast.error(err.response?.data?.message || 'Не удалось присоединиться');
    } finally {
      setJoining(false);
    }
  };

  const submitIdea = async () => {
    if (!selectedIdeaId) {
      toast.error('Выберите идею для подачи');
      return;
    }
    
    try {
      setSubmitting(true);
      await api.post(`/hackathons/${id}/ideas`, { ideaId: selectedIdeaId });
      
      // Обновляем состояние
      setUserSubmittedIdeas(prev => new Set([...prev, selectedIdeaId]));
      setSelectedIdeaId('');
      
      // Обновляем данные хакатона
      const hackathonRes = await api.get(`/hackathons/${id}`);
      setHackathon(hackathonRes.data);
      
      toast.success('Идея успешно подана на хакатон!');
    } catch (err: any) {
      console.error('Ошибка подачи:', err);
      toast.error(err.response?.data?.message || 'Не удалось подать идею');
    } finally {
      setSubmitting(false);
    }
  };

  const voteForIdea = async (hackathonIdeaId: string) => {
    try {
      setVoting(hackathonIdeaId);
      await api.post(`/hackathons/${id}/ideas/${hackathonIdeaId}/vote`);
      
      // Обновляем данные хакатона
      const hackathonRes = await api.get(`/hackathons/${id}`);
      setHackathon(hackathonRes.data);
      
      toast.success('Ваш голос учтен!');
    } catch (err: any) {
      console.error('Ошибка голосования:', err);
      toast.error(err.response?.data?.message || 'Не удалось проголосовать');
    } finally {
      setVoting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Завершено';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}д ${hours}ч`;
    return `${hours}ч ${minutes}м`;
  };

  const getStatusInfo = (status: string) => {
    const info = {
      UPCOMING: {
        title: 'Предстоящий',
        color: 'warning',
        message: 'Скоро начнется прием идей'
      },
      SUBMISSION: {
        title: 'Прием идей',
        color: 'success',
        message: 'Принимаются идеи'
      },
      VOTING: {
        title: 'Голосование',
        color: 'primary',
        message: 'Идет голосование за лучшие идеи'
      },
      ENDED: {
        title: 'Завершен',
        color: 'secondary',
        message: 'Хакатон завершен'
      }
    };
    
    return info[status as keyof typeof info];
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
        <p className="mt-2">Загрузка хакатона...</p>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <h4 className="alert-heading">Хакатон не найден</h4>
          <p>Возможно, он был удален или вы перешли по неверной ссылке.</p>
          <button 
            onClick={() => navigate('/hackathons')}
            className="btn btn-outline-danger"
          >
            Вернуться к списку хакатонов
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(hackathon.status);
  const canSubmitIdeas = hackathon.status === 'SUBMISSION' && isParticipant;
  const canVote = hackathon.status === 'VOTING' && isParticipant;
  const isEnded = hackathon.status === 'ENDED';

  return (
    <div className="container mt-4 mb-5">
      {/* Кнопка назад */}
      <button
        onClick={() => navigate('/hackathons')}
        className="btn btn-outline-secondary mb-4"
      >
        <ArrowLeft size={18} className="me-2" />
        Назад к хакатонам
      </button>

      {/* Заголовок хакатона */}
      <div className="card shadow-lg mb-4">
        <div className={`card-header bg-gradient bg-${statusInfo.color} text-white`}>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <span className={`badge bg-light text-${statusInfo.color} me-2`}>
                {statusInfo.title}
              </span>
              <h1 className="h2 mt-2 mb-1">{hackathon.name}</h1>
              {hackathon.theme && (
                <p className="mb-0 opacity-90">
                  <Trophy size={16} className="me-2" />
                  Тема: {hackathon.theme}
                </p>
              )}
            </div>
            <div className="text-end">
              <div className="d-flex align-items-center mb-2">
                <Clock size={20} className="me-2" />
                <h4 className="mb-0">{getTimeRemaining(hackathon.endDate)}</h4>
              </div>
              <small>до завершения</small>
            </div>
          </div>
        </div>
        
        <div className="card-body">
          {/* Описание */}
          <div className="mb-4">
            <h5 className="text-muted mb-3">Описание</h5>
            <p className="card-text" style={{ whiteSpace: 'pre-wrap' }}>
              {hackathon.description}
            </p>
          </div>

          {/* Статистика */}
          <div className="row mb-4">
            <div className="col-md-4 mb-3">
              <div className="card border-0 bg-light">
                <div className="card-body text-center">
                  <Users size={24} className="text-primary mb-2" />
                  <h3 className="mb-0">{hackathon._count.participants}</h3>
                  <small className="text-muted">Участников</small>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card border-0 bg-light">
                <div className="card-body text-center">
                  <Award size={24} className="text-warning mb-2" />
                  <h3 className="mb-0">{hackathon._count.ideas}</h3>
                  <small className="text-muted">Идей подано</small>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card border-0 bg-light">
                <div className="card-body text-center">
                  <Calendar size={24} className="text-success mb-2" />
                  <h5 className="mb-0">{hackathon.maxIdeasPerUser}</h5>
                  <small className="text-muted">Макс. идей на участника</small>
                </div>
              </div>
            </div>
          </div>

          {/* Даты */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="d-flex align-items-center mb-2">
                <Calendar size={18} className="text-muted me-3" />
                <div>
                  <small className="text-muted">Начало</small>
                  <div className="fw-bold">{formatDate(hackathon.startDate)}</div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex align-items-center mb-2">
                <Calendar size={18} className="text-muted me-3" />
                <div>
                  <small className="text-muted">Завершение</small>
                  <div className="fw-bold">{formatDate(hackathon.endDate)}</div>
                </div>
              </div>
            </div>
            {hackathon.ideaSubmissionEnd && (
              <div className="col-12">
                <div className="d-flex align-items-center">
                  <AlertCircle size={18} className="text-muted me-3" />
                  <div>
                    <small className="text-muted">Прием идей до</small>
                    <div className="fw-bold">{formatDate(hackathon.ideaSubmissionEnd)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Правила */}
          {hackathon.rules && (
            <div className="mb-4">
              <h5 className="text-muted mb-3">
                <AlertCircle size={18} className="me-2" />
                Правила
              </h5>
              <div className="card bg-light">
                <div className="card-body">
                  <p style={{ whiteSpace: 'pre-wrap' }}>{hackathon.rules}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Кнопка присоединения/статус */}
        <div className="card-footer">
          {!isEnded && (
            <>
              {!isParticipant ? (
                <button
                  onClick={joinHackathon}
                  disabled={joining || hackathon.status === 'VOTING'}
                  className="btn btn-primary w-100"
                >
                  {joining ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Присоединяемся...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} className="me-2" />
                      Присоединиться к хакатону
                    </>
                  )}
                </button>
              ) : (
                <div className="alert alert-success text-center mb-0">
                  <CheckCircle size={20} className="me-2" />
                  Вы участник этого хакатона!
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Подача идеи (только в фазе SUBMISSION для участников) */}
      {canSubmitIdeas && (
        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">
              <Send size={20} className="me-2" />
              Подать идею на хакатон
            </h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">
                Выберите вашу одобренную идею (можно подать максимум {hackathon.maxIdeasPerUser} идей)
              </label>
              <select
                className="form-select"
                value={selectedIdeaId}
                onChange={(e) => setSelectedIdeaId(e.target.value)}
                disabled={submitting}
              >
                <option value="">Выберите идею...</option>
                {userIdeas
                  .filter(idea => !userSubmittedIdeas.has(idea.id))
                  .map(idea => (
                    <option key={idea.id} value={idea.id}>
                      {idea.title} (создана {formatDate(idea.createdAt)})
                    </option>
                  ))}
              </select>
              {userSubmittedIdeas.size > 0 && (
                <div className="mt-2">
                  <small className="text-muted">
                    Уже подано: {userSubmittedIdeas.size} из {hackathon.maxIdeasPerUser} идей
                  </small>
                </div>
              )}
            </div>
            <button
              onClick={submitIdea}
              disabled={!selectedIdeaId || submitting || userSubmittedIdeas.size >= hackathon.maxIdeasPerUser}
              className="btn btn-success"
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Подаём...
                </>
              ) : (
                <>
                  <Send size={18} className="me-2" />
                  Подать идею
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Идеи хакатона */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <Award size={20} className="me-2" />
            {isEnded ? 'Результаты хакатона' : 'Идеи хакатона'} ({hackathon.ideas.length})
          </h5>
          {canVote && (
            <small className="text-muted">
              <Heart size={16} className="me-1" />
              Голосуйте за лучшие идеи!
            </small>
          )}
        </div>
        
        <div className="card-body">
          {hackathon.ideas.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <Award size={48} className="mb-3 opacity-25" />
              <p>Пока нет идей. Будьте первым!</p>
            </div>
          ) : (
            <div className="row">
              {hackathon.ideas.map((hackathonIdea, index) => (
                <div key={hackathonIdea.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100 shadow-sm">
                    <div className="card-header">
                      <div className="d-flex justify-content-between align-items-center">
                        {isEnded && index < 3 && (
                          <span className={`badge ${
                            index === 0 ? 'bg-warning' : 
                            index === 1 ? 'bg-secondary' : 
                            'bg-danger'
                          }`}>
                            {index === 0 ? '🥇 1 место' : 
                             index === 1 ? '🥈 2 место' : 
                             '🥉 3 место'}
                          </span>
                        )}
                        <div className="d-flex align-items-center">
                          <Heart size={16} className="text-danger me-1" />
                          <strong>{hackathonIdea.votes}</strong>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-body">
                      <h6 className="card-title">{hackathonIdea.idea.title}</h6>
                      <p className="card-text text-muted" style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {hackathonIdea.idea.description}
                      </p>
                      
                      {/* Теги */}
                      {hackathonIdea.idea.tags.length > 0 && (
                        <div className="mb-3">
                          {hackathonIdea.idea.tags.map(tag => (
                            <span
                              key={tag.id}
                              className="badge bg-info me-1 mb-1"
                              style={{ fontSize: '0.7rem' }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Автор */}
                      <div className="d-flex align-items-center text-muted">
                        <User size={14} className="me-2" />
                        <small>{hackathonIdea.idea.author.name}</small>
                      </div>
                    </div>
                    
                    <div className="card-footer bg-transparent">
                      <div className="d-flex justify-content-between">
                        <button
                          onClick={() => navigate(`/ideas/${hackathonIdea.idea.id}`)}
                          className="btn btn-outline-primary btn-sm"
                        >
                          Подробнее
                        </button>
                        
                        {canVote && (
                          <button
                            onClick={() => voteForIdea(hackathonIdea.id)}
                            disabled={voting === hackathonIdea.id || hackathonIdea.idea.author.id === user?.id}
                            className="btn btn-danger btn-sm"
                          >
                            {voting === hackathonIdea.id ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1"></span>
                                Голосую...
                              </>
                            ) : (
                              <>
                                <Heart size={14} className="me-1" />
                                Голосовать
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}