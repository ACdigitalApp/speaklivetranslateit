import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@/types/auth';

type Props = {
  children: React.ReactNode;
  requiredRole?: UserRole;
};

export function AuthGuard({ children, requiredRole }: Props) {
  const { isAuthenticated, currentUser, authReady } = useAuthStore();

  if (!authReady) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && currentUser?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
