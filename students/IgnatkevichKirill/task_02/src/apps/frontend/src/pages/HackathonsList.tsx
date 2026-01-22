import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Trophy, Calendar, Users, Clock, Award, Plus } from 'lucide-react';

interface Hackathon {
  id: string;
  name: string;
  description: string;
  theme: string;
  status: 'UPCOMING' | 'SUBMISSION' | 'VOTING' | 'ENDED';
  startDate: string;
  endDate: string;
  maxIdeasPerUser: number;
  _count: {
    participants: number;
    ideas: number;
  };
}

export default function HackathonsList() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'past'>('active');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchHackathons();
  }, []);

  const fetchHackathons = async () => {
    try {
      const res = await api.get('/hackathons');
      setHackathons(res.data);
    } catch (err) {
      console.error('Ошибка загрузки хакатонов:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      UPCOMING: 'bg-warning',
      SUBMISSION: 'bg-success',
      VOTING: 'bg-primary',
      ENDED: 'bg-secondary'
    };
    
    const texts = {
      UPCOMING: 'Предстоящий',
      SUBMISSION: 'Приём идей',
      VOTING: 'Голосование',
      ENDED: 'Завершён'
    };
    
    return (
      <span className={`badge ${styles[status as keyof typeof styles]} text-white`}>
        {texts[status as keyof typeof texts]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Завершён';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}д ${hours}ч`;
  };

  const filteredHackathons = hackathons.filter(hackathon => {
    if (activeTab === 'active') {
      return hackathon.status === 'SUBMISSION' || hackathon.status === 'VOTING';
    }
    if (activeTab === 'upcoming') {
      return hackathon.status === 'UPCOMING';
    }
    return hackathon.status === 'ENDED';
  });

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
        <p className="mt-2">Загрузка хакатонов...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      {/* Заголовок */}
      <div className="text-center mb-5 position-relative">
        <div className="mb-4">
          <Trophy size={60} className="text-warning" />
        </div>
        <h1 className="h1 mb-3">Хакатон идей</h1>
        <p className="lead text-muted">
          Участвуйте в соревнованиях, предлагайте идеи и голосуйте за лучшие!
        </p>
        
        {/* Кнопка создания хакатона (только для админов) - ОДНА КНОПКА */}
        {user?.role === 'ADMIN' && (
          <div className="position-absolute top-0 end-0 mt-3">
            <button
              onClick={() => navigate('/hackathons/new')}
              className="btn btn-success d-flex align-items-center"
            >
              <Plus size={20} className="me-2" />
              Создать хакатон
            </button>
          </div>
        )}
      </div>

      {/* Табы */}
      <div className="row mb-4">
        <div className="col-12">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                <Trophy size={18} className="me-2" />
                Активные
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => setActiveTab('upcoming')}
              >
                <Calendar size={18} className="me-2" />
                Предстоящие
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'past' ? 'active' : ''}`}
                onClick={() => setActiveTab('past')}
              >
                <Award size={18} className="me-2" />
                Завершённые
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Список хакатонов */}
      {filteredHackathons.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-4">
            <Trophy size={48} className="text-muted opacity-25" />
          </div>
          <h3 className="text-muted">
            {activeTab === 'active' && 'Нет активных хакатонов'}
            {activeTab === 'upcoming' && 'Нет предстоящих хакатонов'}
            {activeTab === 'past' && 'Нет завершённых хакатонов'}
          </h3>
          <p className="text-muted">
            {activeTab === 'active' && 'Следите за анонсами новых соревнований!'}
            {activeTab === 'upcoming' && 'Новые хакатоны появятся здесь.'}
            {activeTab === 'past' && 'Здесь будут показаны прошедшие хакатоны.'}
          </p>
        </div>
      ) : (
        <div className="row">
          {filteredHackathons.map(hackathon => (
            <div key={hackathon.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-header bg-gradient-primary text-white">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      {getStatusBadge(hackathon.status)}
                    </div>
                    <div className="text-end">
                      <small>
                        <Clock size={14} className="me-1" />
                        {getTimeRemaining(hackathon.endDate)}
                      </small>
                    </div>
                  </div>
                  <h5 className="mt-2 mb-0">{hackathon.name}</h5>
                </div>
                
                <div className="card-body">
                  {hackathon.theme && (
                    <div className="mb-3">
                      <small className="text-muted">Тема:</small>
                      <div className="fw-bold">{hackathon.theme}</div>
                    </div>
                  )}
                  
                  <p className="card-text text-muted" style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {hackathon.description || 'Описание пока не добавлено.'}
                  </p>
                  
                  <div className="row mt-3">
                    <div className="col-6">
                      <div className="text-center">
                        <Users size={20} className="text-primary mb-1" />
                        <div className="small text-muted">Участники</div>
                        <div className="fw-bold">{hackathon._count?.participants || 0}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center">
                        <Award size={20} className="text-warning mb-1" />
                        <div className="small text-muted">Идеи</div>
                        <div className="fw-bold">{hackathon._count?.ideas || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card-footer bg-transparent">
                  <div className="row">
                    <div className="col-12 mb-2">
                      <small className="text-muted d-block">
                        <Calendar size={12} className="me-1" />
                        Начало: {formatDate(hackathon.startDate)}
                      </small>
                      <small className="text-muted d-block">
                        <Calendar size={12} className="me-1" />
                        Конец: {formatDate(hackathon.endDate)}
                      </small>
                    </div>
                    <div className="col-12">
                      <button
                        onClick={() => navigate(`/hackathons/${hackathon.id}`)}
                        className="btn btn-outline-primary w-100"
                      >
                        {hackathon.status === 'ENDED' ? 'Результаты' : 'Участвовать'}
                      </button>
                    </div>
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