import { Menu, Avatar, Typography } from 'antd';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const { Text } = Typography;

const Header = () => {
    const { user, logout } = useAuth();

    const items = [
        { key: 'home', label: <Link to="/">Trang chủ</Link> },
        ...(user ? [
            ...(user.roles.includes('owner') || user.roles.includes('admin') ? [
                { key: 'owner', label: <Link to="/owner/dashboard">Trang dành cho chủ sân</Link> },
            ] : []),
            ...(user.roles.includes('admin') ? [
                { key: 'admin', label: <Link to="/admin/dashboard">Trang cho quản trị viên</Link> },
            ] : []),
            {
                key: 'user',
                label: (
                    <span>
                        {user.avatar ? (
                            <Avatar src={user.avatar} style={{ marginRight: 8 }} />
                        ) : (
                            <Avatar style={{ marginRight: 8 }}>{user.fullName[0]}</Avatar>
                        )}
                        <Text>{user.fullName}</Text>
                    </span>
                ),
                children: [
                    { key: 'profile', label: <Link to="/profile">Hồ sơ</Link> },
                    { key: 'logout', label: <a onClick={logout}>Đăng xuất</a> },
                ],
            },
        ] : [
            { key: 'login', label: <Link to="/login">Đăng nhập</Link> },
        ]),
    ];

    return (
        <Menu mode="horizontal" items={items} style={{ justifyContent: 'flex-end' }} />
    );
};

export default Header;