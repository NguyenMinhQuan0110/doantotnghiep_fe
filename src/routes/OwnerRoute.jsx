import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import useAuth from '../hooks/useAuth';

const OwnerRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;

  if (!user) return <Navigate to="/login" replace />;

  if (!user.roles.includes('owner') && !user.roles.includes('admin')) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default OwnerRoute;