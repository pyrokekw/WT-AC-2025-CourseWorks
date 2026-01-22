import { useEffect, useState } from 'react'
import axios from 'axios'

interface Report {
  id: string
  title: string
  description: string
  status: string
  createdAt: string
  author: { name: string }
  category: { name: string }
}

export default function Admin() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Требуется авторизация')
      setLoading(false)
      return
    }

    loadReports(token)
  }, [])

  const loadReports = async (token: string) => {
    try {
      const res = await axios.get('/api/reports', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setReports(res.data)
      setLoading(false)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки заявок')
      setLoading(false)
    }
  }

  const changeStatus = async (id: string, newStatus: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      await axios.patch(`/api/reports/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Обновляем список локально
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
      alert(`Статус изменён на ${newStatus}`)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка изменения статуса')
    }
  }

  if (loading) return <p>Загрузка...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div>
      <h2>Админ-панель: Управление заявками</h2>

      {reports.length === 0 ? (
        <p>Заявок пока нет</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ background: '#f1f1f1' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Заголовок</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Категория</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Автор</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Статус</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => (
              <tr key={report.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{report.title}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{report.category?.name || '-'}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{report.author?.name || 'Аноним'}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{report.status}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <button onClick={() => changeStatus(report.id, 'IN_PROGRESS')} style={{ marginRight: '8px' }}>
                    В работе
                  </button>
                  <button onClick={() => changeStatus(report.id, 'RESOLVED')} style={{ marginRight: '8px' }}>
                    Решено
                  </button>
                  <button onClick={() => changeStatus(report.id, 'REJECTED')}>
                    Отклонено
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}