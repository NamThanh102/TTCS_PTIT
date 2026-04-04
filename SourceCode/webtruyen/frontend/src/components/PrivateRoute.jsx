import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const PrivateRoute = () => {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const initialized = useAuthStore((state) => state.initialized);

  if (!initialized) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-gray-400">
        Dang kiem tra trang thai dang nhap...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
