import { useState, useEffect, FormEvent } from 'react';
import api from '../../api/client';
import { Source } from '../../shared/types';

export default function SourcesManagement() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', url: '', description: '' });

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const res = await api.get('/sources');
      setSources(res.data.data.sources || []);
    } catch (error) {
      console.error('Failed to fetch sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await api.post('/sources', formData);
      setFormData({ name: '', url: '', description: '' });
      setShowForm(false);
      fetchSources();
      alert('Источник добавлен!');
    } catch (error) {
      console.error('Failed to create source:', error);
      alert('Не удалось добавить источник');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот источник?')) return;

    try {
      await api.delete(`/sources/${id}`);
      setSources(sources.filter((source) => source.id !== id));
    } catch (error) {
      console.error('Failed to delete source:', error);
      alert('Не удалось удалить источник');
    }
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="management-section">
      <h2>Управление источниками</h2>

      <button onClick={() => setShowForm(!showForm)} className="btn btn-primary mb-2">
        {showForm ? 'Скрыть форму' : 'Добавить источник'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="add-form">
          <h3>Новый источник</h3>
          <div className="form-group">
            <label htmlFor="name">Название:</label>
            <input
              id="name"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="url">URL:</label>
            <input
              id="url"
              type="url"
              className="form-input"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Описание:</label>
            <textarea
              id="description"
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Добавить
          </button>
        </form>
      )}

      <div className="items-list">
        {sources.map((source) => (
          <div key={source.id} className="item-card">
            <div className="item-info">
              <h3>{source.name}</h3>
              <p><a href={source.url} target="_blank" rel="noopener noreferrer">{source.url}</a></p>
              {source.description && <p>{source.description}</p>}
            </div>
            <div className="item-actions">
              <button
                onClick={() => handleDelete(source.id)}
                className="btn btn-danger"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
