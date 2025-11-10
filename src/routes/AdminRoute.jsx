import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return <p>Loading...</p>;

    if (!user) return <Navigate to="/login" replace />;

    if (!user.roles.includes("admin")) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminRoute;
