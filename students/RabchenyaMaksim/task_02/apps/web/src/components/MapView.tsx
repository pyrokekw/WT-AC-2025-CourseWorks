import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

interface Report {
  id: string
  title: string
  lat: number | null
  lng: number | null
  status: string
}

export default function MapView() {
  const [reports, setReports] = useState<Report[]>([])

  useEffect(() => {
    axios.get('/api/reports')
      .then(res => {
        const validReports = res.data.filter((r: Report) => r.lat !== null && r.lng !== null)
        setReports(validReports)
      })
      .catch(err => console.error('Ошибка загрузки заявок:', err))
  }, [])

  return (
    <div style={{ height: '600px', width: '100%', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer center={[55.7558, 37.6173]} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map(report => (
          <Marker key={report.id} position={[report.lat!, report.lng!]}>
            <Popup>
              <strong>{report.title}</strong><br />
              Статус: {report.status}<br />
              <Link to={`/report/${report.id}`}>Подробнее →</Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}