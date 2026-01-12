import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Result, Button, Card, Tag, Space } from 'antd';
import { CheckCircleOutlined, HomeOutlined, ShoppingOutlined, CalendarOutlined } from '@ant-design/icons';

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // Có thể gọi API xác nhận thanh toán ở đây nếu cần
        const paymentId = searchParams.get('payment_id');
        const bookingId = searchParams.get('booking_id');

        if (paymentId) {
            console.log('Payment successful:', { paymentId, bookingId });
        }
    }, [searchParams]);

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
            <Card style={{ textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <CheckCircleOutlined style={{ fontSize: '80px', color: '#52c41a', marginBottom: '20px' }} />

                <h1 style={{ color: '#52c41a', marginBottom: '10px' }}>
                    Thanh toán thành công! 🎉
                </h1>

                <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
                    Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.
                    Đơn đặt sân của bạn đã được xác nhận và sẵn sàng.
                </p>

                {searchParams.get('payment_id') && (
                    <div style={{ marginBottom: '20px' }}>
                        <p>Mã thanh toán: <Tag color="blue">#{searchParams.get('payment_id')}</Tag></p>
                        {searchParams.get('booking_id') && (
                            <p>Mã booking: <Tag color="purple">#{searchParams.get('booking_id')}</Tag></p>
                        )}
                    </div>
                )}

                <div style={{
                    backgroundColor: '#f6ffed',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '30px',
                    textAlign: 'left'
                }}>
                    <h3>📋 Thông tin tiếp theo:</h3>
                    <ul>
                        <li>Bạn sẽ nhận được email xác nhận (nếu có email)</li>
                        <li>Vui lòng đến đúng giờ đã đặt</li>
                        <li>Mang theo mã booking khi đến sân</li>
                        <li>Liên hệ chủ sân nếu có thay đổi</li>
                    </ul>
                </div>

                <Space size="middle" style={{ marginTop: '30px' }}>
                    <Button
                        type="primary"
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
                        Xem đơn đặt
                    </Button>

                    <Button
                        size="large"
                        icon={<ShoppingOutlined />}
                        onClick={() => navigate('/')}
                    >
                        Đặt sân khác
                    </Button>
                </Space>
            </Card>
        </div>
    );
};

export default PaymentSuccess;