import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, message, Spin, Descriptions, Result } from 'antd';
import { createPayPalPayment, getPaymentById } from '../services/api';
import useAuth from '../hooks/useAuth';

const PayPalCheckout = () => {
    const { paymentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [payment, setPayment] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadPayment();
    }, []);
    useEffect(() => {
        // Kiểm tra nếu đang quay lại từ PayPal (có params trong URL)
        const params = new URLSearchParams(location.search);
        if (params.get('paymentId') && params.get('PayerID')) {
            // Đã thanh toán xong, PayPal redirect về đây
            // Có thể redirect đến trang success
            navigate(`/payment/success?payment_id=${paymentId}`);
        }
    }, [location]);

    const loadPayment = async () => {
        try {
            const res = await getPaymentById(paymentId);
            setPayment(res.data);

            // Kiểm tra xem payment đã paid chưa
            if (res.data.status === 'paid') {
                message.success('Thanh toán đã được xử lý trước đó!');
                setTimeout(() => navigate('/profile'), 2000);
            }
        } catch (err) {
            message.error('Không thể tải thông tin thanh toán');
            setError('Không tìm thấy thông tin thanh toán');
        } finally {
            setLoading(false);
        }
    };

    const handlePayWithPayPal = async () => {
        setProcessing(true);
        try {
            const res = await createPayPalPayment(paymentId);

            // Redirect đến PayPal
            window.location.href = res.data.approvalUrl;

        } catch (err) {
            console.error('PayPal error:', err);
            message.error(err.response?.data?.message || 'Lỗi khi kết nối với PayPal');
            setProcessing(false);
        }
    };

    const handleCancel = () => {
        navigate(-1); // Quay lại trang trước
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin size="large" />
                <p>Đang tải thông tin thanh toán...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '50px' }}>
                <Result
                    status="error"
                    title="Có lỗi xảy ra"
                    subTitle={error}
                    extra={[
                        <Button type="primary" key="home" onClick={() => navigate('/')}>
                            Về trang chủ
                        </Button>
                    ]}
                />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
            <Card
                title={<span style={{ fontSize: '20px' }}>💳 Thanh toán với PayPal</span>}
                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
                {payment && (
                    <>
                        <Descriptions bordered column={1} style={{ marginBottom: '30px' }}>
                            <Descriptions.Item label="Mã thanh toán">
                                <strong>{payment.id}</strong>
                            </Descriptions.Item>
                            <Descriptions.Item label="Số tiền">
                                <span style={{ color: '#1890ff', fontSize: '18px', fontWeight: 'bold' }}>
                                    {payment.amount?.toLocaleString()} VND
                                </span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Phương thức">
                                <span style={{ color: '#003087' }}>
                                    <img
                                        src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg"
                                        alt="PayPal"
                                        style={{ height: '20px', marginRight: '8px', verticalAlign: 'middle' }}
                                    />
                                    PayPal
                                </span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <span style={{
                                    color: payment.status === 'unpaid' ? '#fa8c16' :
                                        payment.status === 'paid' ? '#52c41a' : '#f5222d',
                                    fontWeight: 'bold'
                                }}>
                                    {payment.status === 'unpaid' ? '⏳ Chờ thanh toán' :
                                        payment.status === 'paid' ? '✅ Đã thanh toán' : '❌ Lỗi'}
                                </span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Thông tin booking">
                                {payment.bookingId ? `Booking #${payment.bookingId}` : 'Không có'}
                            </Descriptions.Item>
                        </Descriptions>

                        <div style={{
                            backgroundColor: '#f6ffed',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            border: '1px solid #b7eb8f'
                        }}>
                            <p style={{ margin: 0 }}>
                                <strong>📝 Lưu ý:</strong> Bạn sẽ được chuyển đến trang PayPal Sandbox để hoàn tất thanh toán.
                                Sử dụng tài khoản sandbox để test.
                            </p>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '30px' }}>
                            <Button
                                type="primary"
                                size="large"
                                onClick={handlePayWithPayPal}
                                loading={processing}
                                disabled={payment.status === 'paid'}
                                style={{
                                    backgroundColor: '#003087',
                                    borderColor: '#003087',
                                    height: '50px',
                                    padding: '0 40px',
                                    fontSize: '16px',
                                    marginRight: '15px'
                                }}
                            >
                                {processing ? 'Đang xử lý...' : 'Thanh toán với PayPal'}
                            </Button>

                            <Button
                                size="large"
                                onClick={handleCancel}
                                disabled={processing}
                                style={{ height: '50px', padding: '0 30px' }}
                            >
                                Hủy
                            </Button>
                        </div>

                        <div style={{ marginTop: '20px', textAlign: 'center', color: '#999' }}>
                            <p>
                                <small>
                                    Thanh toán được bảo mật bởi PayPal.
                                    Chúng tôi không lưu trữ thông tin thẻ của bạn.
                                </small>
                            </p>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

export default PayPalCheckout;