import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, role, adminOnly }) {
  const { user, loading, hasRole } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/connexion" replace />;
  if (adminOnly && !user.isAdmin) return <Navigate to="/" replace />;
  if (role && !hasRole(role)) return <Navigate to="/" replace />;

  return children;
}
