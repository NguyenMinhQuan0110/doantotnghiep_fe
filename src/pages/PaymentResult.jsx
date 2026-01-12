import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Result, Button, Card, Typography, Row, Col, Space, Tag } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    HomeOutlined,
    ShoppingOutlined,
    CalendarOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const PaymentResult = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [resultType, setResultType] = useState('loading'); // success, cancel, error
    const [paymentData, setPaymentData] = useState(null);

    useEffect(() => {
        // Xác định loại kết quả từ URL
        const path = location.pathname;

        if (path.includes('/payment/success')) {
            setResultType('success');
            const data = {
                payment_id: searchParams.get('payment_id'),
                status: searchParams.get('status'),
                amount: searchParams.get('amount'),
                booking_id: searchParams.get('booking_id')
            };
            setPaymentData(data);

        } else if (path.includes('/payment/cancel')) {
            setResultType('cancel');
            setPaymentData({
                payment_id: searchParams.get('payment_id')
            });

        } else if (path.includes('/payment/error')) {
            setResultType('error');
            setPaymentData({
                message: searchParams.get('message'),
                detail: searchParams.get('detail')
            });
        }
    }, [location, searchParams]);

    const renderSuccessContent = () => (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <CheckCircleOutlined style={{ fontSize: '80px', color: '#52c41a', marginBottom: '20px' }} />

            <Title level={2} style={{ color: '#52c41a', marginBottom: '10px' }}>
                Thanh toán thành công! 🎉
            </Title>

            <Paragraph style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
                Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.
                Đơn đặt sân của bạn đã được xác nhận và sẵn sàng.
            </Paragraph>

            {paymentData && (
                <Card
                    style={{
                        maxWidth: 500,
                        margin: '0 auto 30px',
                        textAlign: 'left',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                >
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Text strong>Mã thanh toán:</Text>
                            <div style={{ marginTop: '5px' }}>
                                <Tag color="blue">#{paymentData.payment_id}</Tag>
                            </div>
                        </Col>
                        <Col span={12}>
                            <Text strong>Trạng thái:</Text>
                            <div style={{ marginTop: '5px' }}>
                                <Tag color="success">Đã thanh toán</Tag>
                            </div>
                        </Col>
                        {paymentData.amount && (
                            <Col span={12}>
                                <Text strong>Số tiền:</Text>
                                <div style={{ marginTop: '5px', fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                                    {parseInt(paymentData.amount).toLocaleString()} VND
                                </div>
                            </Col>
                        )}
                        {paymentData.booking_id && (
                            <Col span={12}>
                                <Text strong>Mã booking:</Text>
                                <div style={{ marginTop: '5px' }}>
                                    <Tag color="purple">#{paymentData.booking_id}</Tag>
                                </div>
                            </Col>
                        )}
                    </Row>
                </Card>
            )}

            <div style={{
                backgroundColor: '#f6ffed',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '30px',
                maxWidth: 600,
                margin: '0 auto 30px',
                textAlign: 'left'
            }}>
                <Title level={5}>📋 Thông tin tiếp theo:</Title>
                <ul style={{ margin: '10px 0 0 20px' }}>
                    <li>Bạn sẽ nhận được email xác nhận (nếu có email)</li>
                    <li>Vui lòng đến đúng giờ đã đặt</li>
                    <li>Mang theo mã booking khi đến sân</li>
                    <li>Liên hệ chủ sân nếu có thay đổi</li>
                </ul>
            </div>

            <Space size="large" style={{ marginTop: '20px' }}>
                <Button
                    type="primary"
                    size="large"
                    icon={<HomeOutlined />}
                    onClick={() => navigate('/')}
                    style={{ padding: '0 30px', height: '45px' }}
                >
                    Về trang chủ
                </Button>

                <Button
                    size="large"
                    icon={<CalendarOutlined />}
                    onClick={() => navigate('/profile')}
                    style={{ padding: '0 30px', height: '45px' }}
                >
                    Xem đơn đặt
                </Button>

                <Button
                    size="large"
                    icon={<ShoppingOutlined />}
                    onClick={() => navigate('/')} // Hoặc trang tìm sân
                    style={{ padding: '0 30px', height: '45px' }}
                >
                    Đặt sân khác
                </Button>
            </Space>
        </div>
    );

    const renderCancelContent = () => (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <CloseCircleOutlined style={{ fontSize: '80px', color: '#fa8c16', marginBottom: '20px' }} />

            <Title level={2} style={{ color: '#fa8c16', marginBottom: '10px' }}>
                Đã hủy thanh toán
            </Title>

            <Paragraph style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
                Bạn đã hủy quá trình thanh toán.
                Đơn đặt sân vẫn được giữ nhưng chưa được xác nhận.
            </Paragraph>

            {paymentData?.payment_id && (
                <div style={{ marginBottom: '30px' }}>
                    <Tag color="orange">Mã thanh toán: #{paymentData.payment_id}</Tag>
                </div>
            )}

            <div style={{
                backgroundColor: '#fff7e6',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '30px',
                maxWidth: 600,
                margin: '0 auto 30px'
            }}>
                <Title level={5}>Bạn có thể:</Title>
                <ul style={{ textAlign: 'left', margin: '10px 0 0 20px' }}>
                    <li>Thử thanh toán lại với PayPal</li>
                    <li>Chọn phương thức thanh toán khác</li>
                    <li>Liên hệ với chủ sân để thanh toán trực tiếp</li>
                    <li>Hủy đơn đặt nếu không muốn tiếp tục</li>
                </ul>
            </div>

            <Space size="large" style={{ marginTop: '20px' }}>
                <Button
                    type="primary"
                    size="large"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)} // Quay lại trang thanh toán
                    style={{ padding: '0 30px', height: '45px' }}
                >
                    Thử thanh toán lại
                </Button>

                <Button
                    size="large"
                    icon={<HomeOutlined />}
                    onClick={() => navigate('/')}
                    style={{ padding: '0 30px', height: '45px' }}
                >
                    Về trang chủ
                </Button>

                <Button
                    size="large"
                    icon={<CalendarOutlined />}
                    onClick={() => navigate('/profile')}
                    style={{ padding: '0 30px', height: '45px' }}
                >
                    Quản lý đơn đặt
                </Button>
            </Space>
        </div>
    );

    const renderErrorContent = () => (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <CloseCircleOutlined style={{ fontSize: '80px', color: '#ff4d4f', marginBottom: '20px' }} />

            <Title level={2} style={{ color: '#ff4d4f', marginBottom: '10px' }}>
                Có lỗi xảy ra
            </Title>

            <Paragraph style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
                {paymentData?.message === 'payment_failed'
                    ? 'Thanh toán không thành công. Vui lòng thử lại.'
                    : 'Đã xảy ra lỗi trong quá trình xử lý.'}
            </Paragraph>

            {paymentData?.detail && (
                <Card style={{ maxWidth: 600, margin: '0 auto 30px', textAlign: 'left' }}>
                    <Text type="secondary">Chi tiết lỗi: {paymentData.detail}</Text>
                </Card>
            )}

            <Space size="large" style={{ marginTop: '20px' }}>
                <Button
                    type="primary"
                    size="large"
                    onClick={() => navigate(-1)}
                    style={{ padding: '0 30px', height: '45px' }}
                >
                    Thử lại
                </Button>

                <Button
                    size="large"
                    onClick={() => navigate('/')}
                    style={{ padding: '0 30px', height: '45px' }}
                >
                    Về trang chủ
                </Button>
            </Space>
        </div>
    );

    const renderLoading = () => (
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <Title level={3}>Đang xử lý...</Title>
            <Text>Vui lòng chờ trong giây lát.</Text>
        </div>
    );

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', minHeight: '70vh' }}>
            {resultType === 'loading' && renderLoading()}
            {resultType === 'success' && renderSuccessContent()}
            {resultType === 'cancel' && renderCancelContent()}
            {resultType === 'error' && renderErrorContent()}
        </div>
    );
};

export default PaymentResult;