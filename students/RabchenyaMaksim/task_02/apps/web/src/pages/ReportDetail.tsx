import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function ReportDetail() {
  const { id } = useParams()
  const [report, setReport] = useState<any>(null)
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadReport()
  }, [id])

  const loadReport = async () => {
    try {
      const res = await axios.get(`/api/reports/${id}`)
      setReport(res.data)
      setLoading(false)
    } catch (err) {
      setError('Ошибка загрузки заявки')
      setLoading(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    const token = localStorage.getItem('token')
    if (!token) {
      alert('Сначала войдите')
      return
    }

    try {
      await axios.post('/api/comments', {
        text: commentText,
        reportId: id,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCommentText('')
      loadReport() // перезагружаем комментарии
      alert('Комментарий добавлен!')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка отправки')
    }
  }

  if (loading) return <p>Загрузка...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>
  if (!report) return <p>Заявка не найдена</p>

  return (
    <div>
      <h2>{report.title}</h2>
      <p><strong>Статус:</strong> {report.status}</p>
      <p><strong>Описание:</strong> {report.description}</p>
      {report.lat && report.lng && (
        <p><strong>Координаты:</strong> {report.lat.toFixed(6)}, {report.lng.toFixed(6)}</p>
      )}
      {report.address && <p><strong>Адрес:</strong> {report.address}</p>}
      <p><strong>Категория:</strong> {report.category?.name || 'Не указана'}</p>
      <p><strong>Автор:</strong> {report.author?.name || 'Аноним'}</p>

      <h3>Комментарии ({report.comments?.length || 0})</h3>

      {report.comments?.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {report.comments.map((c: any) => (
            <li key={c.id} style={{ marginBottom: '12px', padding: '8px', border: '1px solid #eee', borderRadius: '4px' }}>
              <strong>{c.author.name || 'Аноним'}:</strong> {c.text}
              <small style={{ display: 'block', color: '#666', marginTop: '4px' }}>
                {new Date(c.createdAt).toLocaleString('ru-RU')}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p>Комментариев пока нет</p>
      )}

      <form onSubmit={handleAddComment} style={{ marginTop: '24px' }}>
        <textarea
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          placeholder="Напишите комментарий..."
          rows={3}
          style={{ width: '100%', padding: '10px', borderRadius: '4px' }}
        />
        <button
          type="submit"
          style={{ marginTop: '12px', padding: '10px 20px', background: '#007bff', color: 'white', border: 'none' }}
        >
          Отправить комментарий
        </button>
      </form>
    </div>
  )
}