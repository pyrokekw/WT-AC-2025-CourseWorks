import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('') // только для регистрации
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')

  const url = isRegister ? '/api/auth/register' : '/api/auth/login'
  const data = isRegister ? { email, password, name } : { email, password }

  try {
    const res = await axios.post(url, data)
    const { token, user } = res.data  // ← берём user из ответа

    localStorage.setItem('token', token)
    localStorage.setItem('role', user.role)  // ← сохраняем роль (USER или ADMIN)
    
    alert(isRegister ? 'Регистрация успешна!' : 'Вход выполнен!')
    navigate('/create') // или '/'
  } catch (err: any) {
    setError(err.response?.data?.error || 'Ошибка. Попробуйте снова.')
  }
}

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>{isRegister ? 'Регистрация' : 'Вход'}</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
        <label>
          Email *
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Пароль *
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </label>

        {isRegister && (
          <label>
            Имя
            <input
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </label>
        )}

        <button type="submit">
          {isRegister ? 'Зарегистрироваться' : 'Войти'}
        </button>
      </form>

      <p style={{ marginTop: '16px' }}>
        {isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}
        >
          {isRegister ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </p>
    </div>
  )
}