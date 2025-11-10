import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/api';

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Thêm trạng thái loading
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setUser(null);
                    setLoading(false);
                    return;
                }
                const res = await getCurrentUser();
                setUser(res.data);
            } catch (error) {
                console.error('Error fetching user:', error);
                localStorage.removeItem('token'); // Xóa token nếu không hợp lệ
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    };

    return { user, loading, logout };
};

export default useAuth;