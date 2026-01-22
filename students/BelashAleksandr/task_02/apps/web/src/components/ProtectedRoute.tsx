import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { Role } from '../shared/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: Role[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
}
