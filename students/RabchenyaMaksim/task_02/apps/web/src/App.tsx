import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.tsx'
import CreateReport from './pages/CreateReport.tsx'
import ReportDetail from './pages/ReportDetail.tsx'
import Login from './pages/Login.tsx'
import Admin from './pages/Admin.tsx'

import './index.css'
import { useState, useEffect } from 'react'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')  // ← очищаем роль при выходе
    setIsLoggedIn(false)
    window.location.href = '/login'
  }

  return (
    <BrowserRouter>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>Чиним город 🏙️</h1>

        <nav style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#007bff' }}>
            Главная (карта)
          </Link>

          {isLoggedIn ? (
            <>
              <Link to="/create" style={{ textDecoration: 'none', color: '#007bff' }}>
                Создать заявку
              </Link>

              {/* Только для админа — проверка роли */}
              {localStorage.getItem('role') === 'ADMIN' && (
                <Link to="/admin" style={{ textDecoration: 'none', color: '#dc3545' }}>
                  Админ-панель
                </Link>
              )}

              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc3545',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: 0
                }}
              >
                Выйти
              </button>
            </>
          ) : (
            <Link to="/login" style={{ textDecoration: 'none', color: '#007bff' }}>
              Войти / Регистрация
            </Link>
          )}
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateReport />} />
          <Route path="/report/:id" element={<ReportDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App