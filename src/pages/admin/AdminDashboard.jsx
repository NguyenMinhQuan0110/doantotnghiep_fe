import { Layout, Menu } from 'antd';
import { useNavigate, Outlet } from 'react-router-dom';
import { EnvironmentOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';

const { Sider, Content } = Layout;

const AdminDashboard = () => {
    const navigate = useNavigate();

    const menuItems = [
        {
            key: '',
            icon: <UserOutlined />,
            label: 'Quản lý người dùng',
            onClick: () => navigate('users'),
        },
        {
            key: 'roles',
            icon: <TeamOutlined />,
            label: 'Quản lý vai trò',
            onClick: () => navigate('roles'),
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={200} theme="dark">
                <div style={{ padding: '16px', color: '#fff', textAlign: 'center', fontSize: '18px' }}>
                    Owner Dashboard
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={['']}
                    items={menuItems}
                />
            </Sider>
            <Layout>
                <Content style={{ margin: '24px', background: '#fff', padding: '24px', borderRadius: '8px' }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminDashboard;