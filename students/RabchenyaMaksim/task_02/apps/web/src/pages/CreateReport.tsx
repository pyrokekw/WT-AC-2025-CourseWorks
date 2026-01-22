import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function CreateReport() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [lat, setLat] = useState<number | ''>('')
  const [lng, setLng] = useState<number | ''>('')
  const [address, setAddress] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Геолокация
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLat(pos.coords.latitude)
          setLng(pos.coords.longitude)
        },
        () => alert('Геолокация недоступна. Введите координаты вручную.')
      )
    }

    // Загрузка категорий
    axios.get('/api/categories')
      .then(res => setCategories(res.data))
      .catch(err => console.error('Ошибка категорий:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const token = localStorage.getItem('token')
    if (!token) {
      alert('Сначала войдите в систему!')
      return
    }

    try {
      await axios.post('/api/reports', {
        title,
        description,
        categoryId,
        lat: lat || null,
        lng: lng || null,
        address: address || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      alert('Заявка успешно создана!')
      navigate('/')
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка при создании заявки')
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', display: 'grid', gap: '16px' }}>
      <h2>Новая заявка</h2>

      <label>
        Заголовок *
        <input 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          required 
          placeholder="Например: Яма на проезжей части"
        />
      </label>

      <label>
        Описание *
        <textarea 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          rows={5} 
          required 
          placeholder="Подробно опишите проблему..."
        />
      </label>

      <label>
        Категория *
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
          <option value="">Выберите категорию</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      <label>
        Широта (lat)
        <input 
          type="number" 
          step="any" 
          value={lat} 
          onChange={e => setLat(e.target.value ? Number(e.target.value) : '')} 
        />
      </label>

      <label>
        Долгота (lng)
        <input 
          type="number" 
          step="any" 
          value={lng} 
          onChange={e => setLng(e.target.value ? Number(e.target.value) : '')} 
        />
      </label>

      <label>
        Адрес (опционально)
        <input 
          value={address} 
          onChange={e => setAddress(e.target.value)} 
          placeholder="Например: ул. Ленина, 10"
        />
      </label>

      <button type="submit">Отправить</button>
    </form>
  )
}