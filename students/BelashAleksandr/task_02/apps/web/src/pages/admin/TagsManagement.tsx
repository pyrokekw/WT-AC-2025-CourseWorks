import { useState, useEffect, FormEvent } from 'react';
import api from '../../api/client';
import { Tag } from '../../shared/types';

export default function TagsManagement() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tagName, setTagName] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const res = await api.get('/tags');
      setTags(res.data.data.tags || []);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await api.post('/tags', { name: tagName });
      setTagName('');
      setShowForm(false);
      fetchTags();
      alert('Тег добавлен!');
    } catch (error) {
      console.error('Failed to create tag:', error);
      alert('Не удалось добавить тег');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот тег?')) return;

    try {
      await api.delete(`/tags/${id}`);
      setTags(tags.filter((tag) => tag.id !== id));
    } catch (error) {
      console.error('Failed to delete tag:', error);
      alert('Не удалось удалить тег');
    }
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="management-section">
      <h2>Управление тегами</h2>

      <button onClick={() => setShowForm(!showForm)} className="btn btn-primary mb-2">
        {showForm ? 'Скрыть форму' : 'Добавить тег'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="add-form">
          <h3>Новый тег</h3>
          <div className="form-group">
            <label htmlFor="tagName">Название:</label>
            <input
              id="tagName"
              type="text"
              className="form-input"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Добавить
          </button>
        </form>
      )}

      <div className="items-list">
        {tags.map((tag) => (
          <div key={tag.id} className="item-card">
            <div className="item-info">
              <h3>{tag.name}</h3>
            </div>
            <div className="item-actions">
              <button
                onClick={() => handleDelete(tag.id)}
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
