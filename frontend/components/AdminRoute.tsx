import React from 'react';
import { Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  return (
    <PrivateRoute requiredRole="admin">
      {children}
    </PrivateRoute>
  );
};

export default AdminRoute;
