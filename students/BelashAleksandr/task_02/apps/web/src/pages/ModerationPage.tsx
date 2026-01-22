import { useState, useEffect } from 'react';
import api from '../api/client';
import { Report } from '../shared/types';
import './ModerationPage.css';

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'reviewed'>('new');

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await api.get(`/reports${params}`);
      setReports(res.data.data.reports || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId: string, status: 'reviewed' | 'closed') => {
    try {
      await api.put(`/reports/${reportId}`, { status });
      fetchReports();
      alert(`Статус жалобы изменен на "${status}"`);
    } catch (error) {
      console.error('Failed to update report:', error);
      alert('Не удалось обновить статус жалобы');
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="moderation-page">
      <h1>Модерация жалоб</h1>

      <div className="filters">
        <button
          className={`filter-btn ${filter === 'new' ? 'active' : ''}`}
          onClick={() => setFilter('new')}
        >
          Новые
        </button>
        <button
          className={`filter-btn ${filter === 'reviewed' ? 'active' : ''}`}
          onClick={() => setFilter('reviewed')}
        >
          Рассмотренные
        </button>
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Все
        </button>
      </div>

      {reports.length === 0 ? (
        <p className="empty-state">Жалоб не найдено</p>
      ) : (
        <div className="reports-list">
          {reports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-header">
                <h3>{report.article.title}</h3>
                <span className={`status-badge status-${report.status}`}>
                  {report.status}
                </span>
              </div>
              
              <div className="report-info">
                <p><strong>Пользователь:</strong> {report.user.username}</p>
                <p><strong>Дата:</strong> {new Date(report.createdAt).toLocaleString('ru-RU')}</p>
              </div>

              <div className="report-reason">
                <strong>Причина жалобы:</strong>
                <p>{report.reason}</p>
              </div>

              {report.article.url && (
                <p>
                  <a href={report.article.url} target="_blank" rel="noopener noreferrer">
                    Перейти к статье →
                  </a>
                </p>
              )}

              <div className="report-actions">
                {report.status === 'new' && (
                  <button
                    onClick={() => handleStatusUpdate(report.id, 'reviewed')}
                    className="btn btn-primary"
                  >
                    Рассмотреть
                  </button>
                )}
                {report.status !== 'closed' && (
                  <button
                    onClick={() => handleStatusUpdate(report.id, 'closed')}
                    className="btn btn-secondary"
                  >
                    Закрыть
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
