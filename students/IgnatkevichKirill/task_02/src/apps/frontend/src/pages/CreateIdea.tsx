// src/pages/CreateIdea.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function CreateIdea() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
      await api.post('/ideas', { title, description, tags });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при создании идеи');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-lg border-0">
            <div className="card-header bg-primary text-white py-4 text-center">
              <h1 className="h3 mb-0">Добавить идею 💡</h1>
            </div>
            
            <div className="card-body p-4 p-md-5">
              <form onSubmit={handleSubmit}>
                {/* Название идеи */}
                <div className="mb-4">
                  <label htmlFor="title" className="form-label fw-bold">
                    Название идеи
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="form-control form-control-lg"
                    placeholder="Введите название вашей идеи"
                    required
                  />
                </div>

                {/* Описание */}
                <div className="mb-4">
                  <label htmlFor="description" className="form-label fw-bold">
                    Описание
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="form-control"
                    rows={6}
                    placeholder="Опишите вашу идею подробно..."
                    required
                  />
                </div>

                {/* Теги */}
                <div className="mb-4">
                  <label htmlFor="tags" className="form-label fw-bold">
                    Теги
                  </label>
                  <input
                    type="text"
                    id="tags"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    className="form-control"
                    placeholder="Теги через запятую (например: идеи, голосование, улучшения)"
                  />
                  <div className="form-text">
                    Введите ключевые слова через запятую для облегчения поиска
                  </div>
                </div>

                {/* Сообщение об ошибке */}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {/* Кнопки */}
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button
                    type="button"
                    className="btn btn-outline-secondary me-md-2"
                    onClick={() => navigate('/')}
                    disabled={loading}
                  >
                    Отмена
                  </button>
                  
                  <button
                    type="submit"
                    className="btn btn-primary px-5"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Создаётся...
                      </>
                    ) : (
                      'Добавить идею'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}