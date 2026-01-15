import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Calendar, Clock, Award, Users, FileText, Save, ArrowLeft } from 'lucide-react';

const CreateHackathon = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    theme: '',
    startDate: '',
    endDate: '',
    ideaSubmissionEnd: '',
    maxIdeasPerUser: 3,
    rules: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxIdeasPerUser' ? parseInt(value) || 1 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || user.role !== 'ADMIN') {
      toast.error('Только администраторы могут создавать хакатоны');
      return;
    }

    // Валидация дат
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const submissionEnd = formData.ideaSubmissionEnd ? new Date(formData.ideaSubmissionEnd) : null;

    if (startDate >= endDate) {
      toast.error('Дата начала должна быть раньше даты окончания');
      return;
    }

    if (submissionEnd && submissionEnd >= endDate) {
      toast.error('Дата окончания приёма идей должна быть раньше окончания хакатона');
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.post('/hackathons', formData);
      
      toast.success('Хакатон успешно создан!');
      navigate(`/hackathons/${response.data.id}`);
      
    } catch (err: any) {
      console.error('Ошибка создания хакатона:', err);
      toast.error(err.response?.data?.message || 'Не удалось создать хакатон');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4 mb-5">
      {/* Кнопка назад */}
      <button
        onClick={() => navigate('/hackathons')}
        className="btn btn-outline-secondary mb-4 d-flex align-items-center"
      >
        <ArrowLeft size={18} className="me-2" />
        Назад к хакатонам
      </button>

      {/* Заголовок */}
      <div className="text-center mb-5">
        <Award size={60} className="text-primary mb-3" />
        <h1 className="h1 mb-2">Создание нового хакатона</h1>
        <p className="lead text-muted">
          Заполните форму ниже, чтобы создать новый хакатон
        </p>
      </div>

      {/* Форма */}
      <div className="card shadow-lg">
        <div className="card-header bg-primary text-white">
          <h2 className="h4 mb-0">
            <Save className="me-2" />
            Основная информация
          </h2>
        </div>
        
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Название и тема */}
            <div className="row mb-4">
              <div className="col-md-8 mb-3">
                <label className="form-label fw-bold">Название хакатона *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-control form-control-lg"
                  placeholder="Введите название хакатона"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold">Тема</label>
                <input
                  type="text"
                  name="theme"
                  value={formData.theme}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Общая тема хакатона"
                />
              </div>
            </div>

            {/* Описание */}
            <div className="mb-4">
              <label className="form-label fw-bold">Описание *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="form-control"
                placeholder="Опишите цели, задачи и особенности хакатона..."
              />
            </div>

            {/* Даты */}
            <div className="row mb-4">
              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold d-flex align-items-center">
                  <Calendar className="me-2" size={18} />
                  Дата начала *
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
              
              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold d-flex align-items-center">
                  <Calendar className="me-2" size={18} />
                  Дата окончания *
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
              
              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold d-flex align-items-center">
                  <Clock className="me-2" size={18} />
                  Приём идей до
                </label>
                <input
                  type="datetime-local"
                  name="ideaSubmissionEnd"
                  value={formData.ideaSubmissionEnd}
                  onChange={handleChange}
                  className="form-control"
                />
                <small className="form-text text-muted">
                  Если не указано, приём идей будет открыт до конца хакатона
                </small>
              </div>
            </div>

            {/* Лимит идей */}
            <div className="row mb-4">
              <div className="col-md-4">
                <label className="form-label fw-bold d-flex align-items-center">
                  <Users className="me-2" size={18} />
                  Макс. идей на участника *
                </label>
                <input
                  type="number"
                  name="maxIdeasPerUser"
                  value={formData.maxIdeasPerUser}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  required
                  className="form-control"
                />
                <small className="form-text text-muted">
                  Сколько идей может подать один участник
                </small>
              </div>
            </div>

            {/* Правила */}
            <div className="mb-4">
              <label className="form-label fw-bold d-flex align-items-center">
                <FileText className="me-2" size={18} />
                Правила и условия
              </label>
              <textarea
                name="rules"
                value={formData.rules}
                onChange={handleChange}
                rows={6}
                className="form-control"
                placeholder="Опишите правила участия, критерии оценки, требования к идеям..."
              />
            </div>

            {/* Кнопки */}
            <div className="d-flex justify-content-end border-top pt-4">
              <button
                type="button"
                onClick={() => navigate('/hackathons')}
                className="btn btn-outline-secondary me-3"
                disabled={loading}
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Создание...
                  </>
                ) : (
                  <>
                    <Save className="me-2" />
                    Создать хакатон
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateHackathon;