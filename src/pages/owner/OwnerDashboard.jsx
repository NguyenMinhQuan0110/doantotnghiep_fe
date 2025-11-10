import { Layout, Menu } from 'antd';
import { useNavigate, Outlet } from 'react-router-dom';
import { HomeOutlined, FieldTimeOutlined, TeamOutlined, ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons';

const { Sider, Content } = Layout;

const OwnerDashboard = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      key: 'complexes',
      icon: <HomeOutlined />,
      label: 'Quản lý cụm sân',
      onClick: () => navigate('/owner/dashboard/complexes'),
    },
    {
      key: 'pitches',
      icon: <FieldTimeOutlined />,
      label: 'Quản lý sân',
      onClick: () => navigate('/owner/dashboard/pitches'),
    },
    {
      key: 'pitch-groups',
      icon: <TeamOutlined />,
      label: 'Quản lý nhóm sân',
      onClick: () => navigate('/owner/dashboard/pitch-groups'),
    },
    {
      key: 'timeslots',
      icon: <ClockCircleOutlined />,
      label: 'Quản lý khung giờ',
      onClick: () => navigate('/owner/dashboard/timeslots'),
    },
    {
      key: 'bookings',
      icon: <CalendarOutlined />,
      label: 'Quản lý booking',
      onClick: () => navigate('/owner/dashboard/bookings'),
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

export default OwnerDashboard;