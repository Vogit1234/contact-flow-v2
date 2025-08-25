import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useIPRestriction } from '../contexts/IPRestrictionContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, loading: authLoading } = useAuth();
  const { loading: ipLoading, isAccessRestricted } = useIPRestriction();

  const loading = authLoading || ipLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (isAccessRestricted) {
    return <Navigate to="/restricted" replace />;
  }

  return <>{children}</>;
}