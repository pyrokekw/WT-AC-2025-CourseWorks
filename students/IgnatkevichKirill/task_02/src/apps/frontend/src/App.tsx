import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import IdeasList from './pages/IdeasList';
import CreateIdea from './pages/CreateIdea';
import AdminPanel from './pages/AdminPanel';
import Header from './components/Header';
import IdeaDetail from './pages/IdeaDetail';
import HackathonsList from './pages/HackathonsList';
import HackathonDetail from './pages/HackathonDetail';
import CreateHackathon from './pages/CreateHackathon'; // ← Добавляем импорт

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-8 max-w-md w-full">
          <h2 className="text-xl font-bold mb-2">Доступ запрещён</h2>
          <p>Эта страница только для администраторов.</p>
        </div>
      </div>
    );
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <Header />
          <main className="px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <IdeasList />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/ideas/new" 
                element={
                  <ProtectedRoute>
                    <CreateIdea />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
              <Route path="/ideas/:id" element={<ProtectedRoute><IdeaDetail /></ProtectedRoute>} />
              
              {/* ВАЖНО: /hackathons/new ДОЛЖЕН БЫТЬ ДО /hackathons/:id */}
              <Route 
                path="/hackathons/new" 
                element={
                  <AdminRoute>
                    <CreateHackathon />
                  </AdminRoute>
                } 
              />
              <Route path="/hackathons" element={<ProtectedRoute><HackathonsList /></ProtectedRoute>} />
              <Route path="/hackathons/:id" element={<ProtectedRoute><HackathonDetail /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;