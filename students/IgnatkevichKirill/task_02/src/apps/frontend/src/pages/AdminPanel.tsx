import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Idea {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  author: { name: string };
  createdAt: string;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
}

export default function AdminPanel() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Получаем PENDING идеи для модерации
      const pendingRes = await api.get('/ideas?status=PENDING');
      setIdeas(pendingRes.data);
      
      // Получаем статистику по всем статусам
      const [allRes, approvedRes, rejectedRes] = await Promise.all([
        api.get('/ideas'),
        api.get('/ideas?status=APPROVED'),
        api.get('/ideas?status=REJECTED')
      ]);
      
      setStats({
        pending: pendingRes.data.length,
        approved: approvedRes.data.length,
        rejected: rejectedRes.data.length
      });
      
    } catch (err: any) {
      toast.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      // Изменяем статус
      await api.patch(`/ideas/${id}/status`, { status: newStatus });
      
      // Оптимистичное обновление - удаляем из списка
      setIdeas(prev => prev.filter(idea => idea.id !== id));
      
      // Обновляем статистику
      setStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        [newStatus.toLowerCase()]: prev[newStatus.toLowerCase() as keyof Stats] + 1
      }));
      
      toast.success(`Идея ${newStatus === 'APPROVED' ? 'одобрена' : 'отклонена'}`);
      
    } catch (err: any) {
      toast.error('Ошибка изменения статуса');
      // При ошибке обновляем данные с сервера
      fetchData();
    }
  };

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
        <p className="mt-2">Загрузка данных...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Заголовок и кнопка обновления */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">
          <i className="bi bi-shield-check me-2"></i>
          Панель модератора
        </h1>
        <button 
          onClick={fetchData}
          className="btn btn-outline-primary"
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Обновить
        </button>
      </div>

      {/* Статистика */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card border-warning">
            <div className="card-body text-center">
              <h3 className="text-warning mb-0">{stats.pending}</h3>
              <p className="text-muted mb-0">Ожидают модерации</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card border-success">
            <div className="card-body text-center">
              <h3 className="text-success mb-0">{stats.approved}</h3>
              <p className="text-muted mb-0">Одобрено</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card border-danger">
            <div className="card-body text-center">
              <h3 className="text-danger mb-0">{stats.rejected}</h3>
              <p className="text-muted mb-0">Отклонено</p>
            </div>
          </div>
        </div>
      </div>

      {/* Список идей на модерацию */}
      {ideas.length === 0 ? (
        <div className="alert alert-success text-center">
          <i className="bi bi-check-circle me-2"></i>
          Все идеи обработаны! Нет идей на модерации.
        </div>
      ) : (
        <>
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            Для просмотра всех деталей идеи нажмите на карточку
          </div>

          <div className="row">
            {ideas.map((idea) => (
              <div key={idea.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 border-warning shadow-sm">
                  <div className="card-header bg-warning bg-opacity-10">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="badge bg-warning">На модерации</span>
                      <small className="text-muted">
                        {formatDate(idea.createdAt)}
                      </small>
                    </div>
                    <h6 className="mt-2 mb-0">{idea.title}</h6>
                  </div>
                  
                  <div className="card-body">
                    <p className="card-text" style={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {idea.description}
                    </p>
                    
                    <div className="mt-3">
                      <p className="mb-1">
                        <i className="bi bi-person me-1 text-muted"></i>
                        <strong>Автор:</strong> {idea.author?.name || 'Не указан'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="card-footer bg-transparent">
                    <div className="d-grid gap-2">
                      <button
                        onClick={() => handleStatusChange(idea.id, 'APPROVED')}
                        className="btn btn-success"
                      >
                        <i className="bi bi-check-circle me-2"></i>
                        Одобрить
                      </button>
                      <button
                        onClick={() => handleStatusChange(idea.id, 'REJECTED')}
                        className="btn btn-outline-danger"
                      >
                        <i className="bi bi-x-circle me-2"></i>
                        Отклонить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}