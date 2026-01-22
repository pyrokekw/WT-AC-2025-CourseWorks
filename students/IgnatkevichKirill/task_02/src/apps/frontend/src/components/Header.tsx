import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold fs-4" to="/">
          💡 Лайк за мысль
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            {user ? (
              <>
                <li className="nav-item">
                  <span className="nav-link text-white">
                    {user.name}
                    {user.role === 'ADMIN' && <span className="badge bg-danger ms-2">Admin</span>}
                  </span>
                </li>

                <li className="nav-item">
                  <Link className="nav-link" to="/">Идеи</Link>
                </li>

                {user.role === 'ADMIN' && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/admin">Админ-панель</Link>
                  </li>
                )}

                <li className="nav-item">
                  <button
                    className="btn btn-outline-light ms-3"
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                  >
                    Выйти
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Войти</Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-outline-light ms-3" to="/register">
                    Регистрация
                  </Link>
                </li>
              </>
            )}
            <li className="nav-item">
  <Link className="nav-link" to="/hackathons">
    <i className="bi bi-trophy me-1"></i>
    Хакатоны
  </Link>
</li>
          </ul>
        </div>
      </div>
    </nav>
  );
}