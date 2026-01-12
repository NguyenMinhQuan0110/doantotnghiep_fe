import { useNavigate } from 'react-router-dom';
import { Result, Button, Card, Space } from 'antd';
import { CloseCircleOutlined, HomeOutlined, RedoOutlined, CalendarOutlined } from '@ant-design/icons';

const PaymentCancel = () => {
    const navigate = useNavigate();

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
            <Card style={{ textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <CloseCircleOutlined style={{ fontSize: '80px', color: '#fa8c16', marginBottom: '20px' }} />

                <h1 style={{ color: '#fa8c16', marginBottom: '10px' }}>
                    Đã hủy thanh toán
                </h1>

                <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
                    Bạn đã hủy quá trình thanh toán.
                    Đơn đặt sân vẫn được giữ nhưng chưa được xác nhận.
                </p>

                <div style={{
                    backgroundColor: '#fff7e6',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '30px'
                }}>
                    <h3>Bạn có thể:</h3>
                    <ul style={{ textAlign: 'left' }}>
                        <li>Thử thanh toán lại với PayPal</li>
                        <li>Chọn phương thức thanh toán khác</li>
                        <li>Liên hệ với chủ sân để thanh toán trực tiếp</li>
                        <li>Hủy đơn đặt nếu không muốn tiếp tục</li>
                    </ul>
                </div>

                <Space size="middle" style={{ marginTop: '30px' }}>
                    <Button
                        type="primary"
                        size="large"
                        icon={<RedoOutlined />}
                        onClick={() => navigate(-1)}
                    >
                        Thử thanh toán lại
                    </Button>

                    <Button
                        size="large"
                        icon={<HomeOutlined />}
                        onClick={() => navigate('/')}
                    >
                        Về trang chủ
                    </Button>

                    <Button
                        size="large"
                        icon={<CalendarOutlined />}
                        onClick={() => navigate('/profile')}
                    >
                        Quản lý đơn đặt
                    </Button>
                </Space>
            </Card>
        </div>
    );
};

export default PaymentCancel;