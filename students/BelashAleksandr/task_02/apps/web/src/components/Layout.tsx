import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import './Layout.css';

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <nav className="nav">
            <div className="nav-brand">
              <Link to="/">Новости «Без фейков»</Link>
            </div>
            <ul className="nav-menu">
              <li><Link to="/feed">Лента</Link></li>
              {isAuthenticated && (
                <>
                  <li><Link to="/favorites">Избранное</Link></li>
                  {(user?.role === 'admin' || user?.role === 'moderator') && (
                    <li><Link to="/moderation">Модерация</Link></li>
                  )}
                  {user?.role === 'admin' && (
                    <li><Link to="/admin">Админ-панель</Link></li>
                  )}
                </>
              )}
            </ul>
            <div className="nav-user">
              {isAuthenticated ? (
                <>
                  <span className="user-name">{user?.username} ({user?.role})</span>
                  <button onClick={logout} className="btn btn-secondary">Выход</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-primary">Вход</Link>
                  <Link to="/register" className="btn btn-secondary">Регистрация</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
      <main className="main">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
