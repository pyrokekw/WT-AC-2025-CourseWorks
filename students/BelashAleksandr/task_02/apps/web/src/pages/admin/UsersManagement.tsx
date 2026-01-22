import { useState, useEffect } from 'react';
import api from '../../api/client';
import { User } from '../../shared/types';

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;

    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter((user) => user.id !== id));
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Не удалось удалить пользователя');
    }
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="management-section">
      <h2>Управление пользователями</h2>

      <div className="items-list">
        {users.map((user) => (
          <div key={user.id} className="item-card">
            <div className="item-info">
              <h3>{user.username}</h3>
              <p>Роль: {user.role}</p>
              {user.createdAt && (
                <p className="text-muted">
                  Создан: {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                </p>
              )}
            </div>
            <div className="item-actions">
              <button
                onClick={() => handleDelete(user.id)}
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
