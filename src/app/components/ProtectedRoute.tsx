import { Navigate } from 'react-router';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const userJson = localStorage.getItem('user');

  if (!userJson) {
    // User not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userJson);

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}