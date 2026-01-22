import MapView from '../components/MapView.tsx'

export default function Home() {
  return (
    <div>
      <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
        <a href="/create">Создать новую заявку →</a>
      </p>
      <MapView />
    </div>
  )
}