import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredRole }) => {
  const user = authService.getCurrentUser();
  const token = authService.getToken();

  // If there's no user or valid token, redirect to home/login
  if (!user || !token) {
    return <Navigate to="/" replace />;
  }

  // If a specific role is required and user does not have it, redirect
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // If authenticated and authorized, allow access
  return <>{children}</>;
};

export default PrivateRoute;
