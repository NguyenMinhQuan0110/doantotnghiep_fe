import { Menu, Avatar, Typography, Layout, Space, Dropdown } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import {
    HomeOutlined,
    UserOutlined,
    LogoutOutlined,
    DashboardOutlined,
    TeamOutlined
} from '@ant-design/icons';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Menu dropdown cho user
    const userMenuItems = user ? [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: <Link to="/profile">Hồ sơ</Link>,
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: <span onClick={handleLogout}>Đăng xuất</span>,
            danger: true,
        },
    ] : [];

    // Menu chính
    const mainMenuItems = [
        {
            key: 'home',
            icon: <HomeOutlined />,
            label: <Link to="/">Trang chủ</Link>,
        },
    ];

    // Menu cho admin/owner
    if (user) {
        if (user.roles.includes('owner') || user.roles.includes('admin')) {
            mainMenuItems.push({
                key: 'owner-dashboard',
                icon: <DashboardOutlined />,
                label: <Link to="/owner/dashboard">Chủ sân</Link>,
            });
        }

        if (user.roles.includes('admin')) {
            mainMenuItems.push({
                key: 'admin-dashboard',
                icon: <TeamOutlined />,
                label: <Link to="/admin/dashboard">Quản trị</Link>,
            });
        }
    }

    return (
        <AntHeader
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            }}
        >
            {/* Logo/Brand */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                }}
                onClick={() => navigate('/')}
            >
                <div style={{
                    width: 32,
                    height: 32,
                    background: 'linear-gradient(135deg, #1890ff 0%, #52c41a 100%)',
                    borderRadius: 6,
                    marginRight: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                }}>
                    S
                </div>
                <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                    SportBooking
                </Text>
            </div>

            {/* Main Navigation */}
            <Menu
                mode="horizontal"
                items={mainMenuItems}
                selectedKeys={[]}
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '15px',
                }}
            />

            {/* User Section */}
            <Space size="middle" align="center">
                {user ? (
                    <Dropdown
                        menu={{ items: userMenuItems }}
                        placement="bottomRight"
                        trigger={['click']}
                    >
                        <Space style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', transition: 'all 0.3s' }} className="user-avatar-hover">
                            <Avatar
                                size="default"
                                src={user.avatar}
                                icon={!user.avatar && <UserOutlined />}
                                style={{
                                    backgroundColor: user.avatar ? 'transparent' : '#1890ff',
                                }}
                            >
                                {!user.avatar && user.fullName?.[0]?.toUpperCase()}
                            </Avatar>
                            <Text style={{ fontWeight: 500, fontSize: '14px' }}>
                                {user.fullName?.split(' ')[0]}
                            </Text>
                        </Space>
                    </Dropdown>
                ) : (
                    <Link to="/login">
                        <Space style={{ padding: '8px 16px' }}>
                            <UserOutlined />
                            <Text>Đăng nhập</Text>
                        </Space>
                    </Link>
                )}
            </Space>
        </AntHeader>
    );
};

export default Header;