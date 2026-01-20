import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Card,
    Button,
    message,
    DatePicker,
    Select,
    Form,
    Row,
    Col,
    Space,
    Typography,
    Divider,
    Alert,
    Spin,
    Tag,
    Badge,
    Descriptions
} from 'antd';
import {
    CalendarOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    ArrowLeftOutlined,
    CheckCircleOutlined,
    InfoCircleOutlined,
    PlusOutlined,
    CalculatorOutlined
} from '@ant-design/icons';
import moment from 'moment';
import {
    getPitchesByComplexId,
    getPitchGroupsByComplexId,
    getAvailableTimeSlots,
    createBooking
} from '../services/api';
import useAuth from '../hooks/useAuth';
import { createPayment } from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const Booking = () => {
    const { pitchId, groupId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [form] = Form.useForm();
    const [target, setTarget] = useState(null);
    const [complexId, setComplexId] = useState(null);
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

    // ✅ Lấy dữ liệu từ query params
    const complexIdFromQuery = searchParams.get('complexId');
    const dateFromQuery = searchParams.get('date');
    const timeSlotIdFromQuery = searchParams.get('timeSlotId');

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            message.error('Vui lòng đăng nhập để đặt sân');
            navigate('/login');
            return;
        }

        if (!complexIdFromQuery) {
            message.error('Thiếu thông tin cụm sân');
            navigate('/');
            return;
        }

        const fetchTarget = async () => {
            setLoading(true);
            try {
                let res, foundItem;
                if (pitchId) {
                    res = await getPitchesByComplexId(complexIdFromQuery);
                    foundItem = res.data.find(p => p.id === parseInt(pitchId));
                    if (foundItem) {
                        setTarget({ ...foundItem, type: 'pitch' });
                        setComplexId(foundItem.complexId);
                    }
                } else if (groupId) {
                    res = await getPitchGroupsByComplexId(complexIdFromQuery);
                    foundItem = res.data.find(g => g.id === parseInt(groupId));
                    if (foundItem) {
                        setTarget({ ...foundItem, type: 'group' });
                        setComplexId(foundItem.complexId);
                    }
                }

                if (!foundItem) {
                    message.error('Không tìm thấy sân/nhóm sân');
                }
            } catch (error) {
                console.error(error);
                message.error('Không thể tải thông tin sân/nhóm sân');
            } finally {
                setLoading(false);
            }
        };

        fetchTarget();
    }, [pitchId, groupId, user, authLoading, complexIdFromQuery, navigate]);

    // ✅ Tải khung giờ trống theo ngày
    const fetchTimeSlots = async (date) => {
        if (!complexId || !target || !date) return;
        setLoading(true);
        try {
            const res = await getAvailableTimeSlots(
                complexId,
                target.type,
                parseInt(pitchId || groupId),
                date.format('YYYY-MM-DD')
            );
            setTimeSlots(res.data);
        } catch (error) {
            console.error(error);
            message.error('Không thể tải khung giờ trống');
            setTimeSlots([]);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Nếu có query param, tự động fill form
    useEffect(() => {
        if (dateFromQuery && moment(dateFromQuery, 'YYYY-MM-DD').isValid()) {
            const selectedDate = moment(dateFromQuery, 'YYYY-MM-DD');
            setSelectedDate(selectedDate);
            form.setFieldsValue({ bookingDate: selectedDate });
            fetchTimeSlots(selectedDate).then(() => {
                if (timeSlotIdFromQuery) {
                    const timeSlotId = parseInt(timeSlotIdFromQuery);
                    form.setFieldsValue({ timeSlotId });
                    // Cập nhật selectedTimeSlot khi có query param
                    const slot = timeSlots.find(s => s.id === timeSlotId);
                    if (slot) setSelectedTimeSlot(slot);
                }
            });
        }
    }, [dateFromQuery, timeSlotIdFromQuery, complexId, target]);

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setSelectedTimeSlot(null);
        form.setFieldsValue({ timeSlotId: null });
        fetchTimeSlots(date);
    };

    const handleTimeSlotChange = (value) => {
        const slot = timeSlots.find(s => s.id === value);
        setSelectedTimeSlot(slot);
    };

    // ✅ Tính số giờ giữa startTime và endTime (chỉ để hiển thị)
    const calculateHours = (startTime, endTime) => {
        const start = moment(startTime, 'HH:mm:ss');
        const end = moment(endTime, 'HH:mm:ss');
        const duration = moment.duration(end.diff(start));
        return duration.asHours();
    };

    // ✅ Tính tổng tiền - ĐÃ SỬA LỖI
    const calculateTotalPrice = () => {
        if (!target || !selectedTimeSlot) {
            return {
                pitchPrice: 0,
                timeSlotPrice: 0,
                total: 0,
                hours: 0
            };
        }

        // Lấy giá sân (đã là giá của cả ca)
        const pitchPrice = target.price || target.pricePerHour || 0;

        // Tổng = Giá sân (cả ca) + Phí timeslot
        const total = pitchPrice + selectedTimeSlot.price;

        const hours = calculateHours(selectedTimeSlot.startTime, selectedTimeSlot.endTime);

        return {
            pitchPrice,
            timeSlotPrice: selectedTimeSlot.price,
            total,
            hours
        };
    };

    const onFinish = async (values) => {
        setIsSubmitting(true);
        try {
            const bookingData = {
                userId: user.id,
                timeSlotId: values.timeSlotId,
                targetType: target.type,
                targetId: parseInt(pitchId || groupId),
                bookingDate: values.bookingDate.format('YYYY-MM-DD'),
            };

            console.log('📤 Dữ liệu booking gửi sang BE:', bookingData);
            const bookingRes = await createBooking(bookingData);

            // Tính tổng tiền
            const priceCalculation = calculateTotalPrice();

            // 3. Tạo payment với phương thức PAYPAL
            const paymentData = {
                bookingId: bookingRes.data.id,
                amount: priceCalculation.total, // Sử dụng tổng tiền đã tính
                method: 'paypal',
                status: 'unpaid'
            };

            console.log('💰 Dữ liệu payment gửi sang BE:', paymentData);
            const paymentRes = await createPayment(paymentData);

            // 4. Chuyển hướng đến trang thanh toán PayPal
            message.success({
                content: '✅ Đặt sân thành công! Chuyển hướng đến trang thanh toán...',
                duration: 2,
                icon: <CheckCircleOutlined />
            });

            setTimeout(() => {
                navigate(`/paypal-checkout/${paymentRes.data.id}`);
            }, 1500);
        } catch (error) {
            console.error('❌ Lỗi khi đặt sân:', error);

            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Lỗi khi đặt sân';

            message.error({
                content: `Đặt sân thất bại: ${errorMessage}`,
                duration: 4
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate(`/complexes/${complexIdFromQuery}`);
    };

    const getTargetTypeText = () => {
        return target?.type === 'pitch' ? 'Sân đơn' : 'Nhóm sân';
    };

    // ✅ ĐÃ SỬA: Loại bỏ hàm getSelectedTimeSlotInfo vì không cần thiết
    // const getSelectedTimeSlotInfo = () => {
    //     const timeSlotId = form.getFieldValue('timeSlotId');
    //     if (!timeSlotId) return null;
    //     return timeSlots.find(slot => slot.id === timeSlotId);
    // };

    // const selectedSlot = getSelectedTimeSlotInfo(); // Không cần dùng nữa
    const priceCalculation = calculateTotalPrice();

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={handleCancel}
                style={{ marginBottom: 16 }}
            >
                Quay lại
            </Button>

            <Title level={2} style={{ marginBottom: 8 }}>
                Đặt sân
            </Title>

            <Paragraph type="secondary" style={{ marginBottom: 32 }}>
                Hoàn tất thông tin đặt sân và tiến hành thanh toán
            </Paragraph>

            {target && (
                <div style={{ marginBottom: 32 }}>
                    <Card
                        size="small"
                        bordered={false}
                        style={{
                            backgroundColor: '#f6ffed',
                            border: '1px solid #b7eb8f'
                        }}
                    >
                        <Row align="middle" gutter={[16, 8]}>
                            <Col flex="none">
                                <Badge
                                    color={target.type === 'pitch' ? 'blue' : 'green'}
                                    text={getTargetTypeText()}
                                />
                            </Col>
                            <Col flex="auto">
                                <Title level={4} style={{ margin: 0 }}>
                                    {target.name}
                                </Title>
                                {target.description && (
                                    <Text type="secondary">{target.description}</Text>
                                )}
                            </Col>
                            {(target.price || target.pricePerHour) && (
                                <Col>
                                    <Tag
                                        color="gold"
                                        icon={<DollarOutlined />}
                                        style={{ fontSize: '14px', padding: '4px 12px' }}
                                    >
                                        Giá sân: {(target.price || target.pricePerHour).toLocaleString()} VND/ca
                                    </Tag>
                                </Col>
                            )}
                        </Row>
                    </Card>
                </div>
            )}

            <Spin spinning={loading || authLoading} tip="Đang tải thông tin...">
                {target ? (
                    <Card
                        title={
                            <Space>
                                <CalendarOutlined />
                                <span>Thông tin đặt sân</span>
                            </Space>
                        }
                        bordered={true}
                        style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            requiredMark="optional"
                        >
                            <Row gutter={32}>
                                <Col xs={24} lg={14}>
                                    <div style={{ marginBottom: 24 }}>
                                        <Title level={5} style={{ marginBottom: 16 }}>
                                            <ClockCircleOutlined /> Chọn thời gian
                                        </Title>
                                        <Row gutter={16}>
                                            <Col span={24}>
                                                <Form.Item
                                                    label={
                                                        <Space>
                                                            <CalendarOutlined />
                                                            <span>Ngày đặt sân</span>
                                                        </Space>
                                                    }
                                                    name="bookingDate"
                                                    rules={[{ required: true, message: 'Vui lòng chọn ngày đặt sân' }]}
                                                    tooltip="Chọn ngày bạn muốn đặt sân"
                                                >
                                                    <DatePicker
                                                        format="DD/MM/YYYY"
                                                        disabledDate={(current) => current && current < moment().startOf('day')}
                                                        onChange={handleDateChange}
                                                        style={{ width: '100%' }}
                                                        size="large"
                                                        placeholder="Chọn ngày"
                                                        suffixIcon={<CalendarOutlined />}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={24}>
                                                <Form.Item
                                                    label={
                                                        <Space>
                                                            <ClockCircleOutlined />
                                                            <span>Khung giờ có sẵn</span>
                                                        </Space>
                                                    }
                                                    name="timeSlotId"
                                                    rules={[{ required: true, message: 'Vui lòng chọn khung giờ' }]}
                                                    tooltip="Chọn khung giờ phù hợp với nhu cầu của bạn"
                                                >
                                                    <Select
                                                        placeholder="Chọn khung giờ"
                                                        disabled={!timeSlots.length || !selectedDate}
                                                        loading={loading}
                                                        size="large"
                                                        optionLabelProp="label"
                                                        dropdownStyle={{ maxHeight: 300 }}
                                                        onChange={handleTimeSlotChange}
                                                        notFoundContent={
                                                            selectedDate ? "Không có khung giờ trống" : "Vui lòng chọn ngày trước"
                                                        }
                                                    >
                                                        {timeSlots.map((slot) => {
                                                            const hours = calculateHours(slot.startTime, slot.endTime);
                                                            return (
                                                                <Option
                                                                    key={slot.id}
                                                                    value={slot.id}
                                                                    label={`${slot.startTime} - ${slot.endTime} (${hours}h)`}
                                                                >
                                                                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                                                        <div>
                                                                            <Text strong>{slot.startTime} - {slot.endTime}</Text>
                                                                        </div>
                                                                        <div>
                                                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                                                Thời lượng: {hours} giờ
                                                                            </Text>
                                                                        </div>
                                                                        <div>
                                                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                                                <DollarOutlined /> Phí timeslot: {slot.price.toLocaleString()} VND
                                                                            </Text>
                                                                        </div>
                                                                    </Space>
                                                                </Option>
                                                            );
                                                        })}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </div>

                                    <Alert
                                        message="Lưu ý"
                                        description="Sau khi xác nhận đặt sân, bạn sẽ được chuyển đến trang thanh toán PayPal để hoàn tất giao dịch."
                                        type="info"
                                        showIcon
                                        icon={<InfoCircleOutlined />}
                                        style={{ marginBottom: 24 }}
                                    />
                                </Col>

                                <Col xs={24} lg={10}>
                                    <Card
                                        title="Tóm tắt đơn đặt"
                                        size="small"
                                        bordered={true}
                                        style={{ position: 'sticky', top: 20 }}
                                    >
                                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                            <div>
                                                <Text type="secondary">Loại sân:</Text>
                                                <div style={{ marginTop: 4 }}>
                                                    <Tag color={target.type === 'pitch' ? 'blue' : 'green'}>
                                                        {getTargetTypeText()}
                                                    </Tag>
                                                    <Text strong> {target.name}</Text>
                                                </div>
                                            </div>

                                            <Divider style={{ margin: '8px 0' }} />

                                            <div>
                                                <Text type="secondary">Ngày đặt:</Text>
                                                <div style={{ marginTop: 4 }}>
                                                    <Text strong>
                                                        {selectedDate ? selectedDate.format('DD/MM/YYYY') : '--/--/----'}
                                                    </Text>
                                                </div>
                                            </div>

                                            <div>
                                                <Text type="secondary">Khung giờ:</Text>
                                                <div style={{ marginTop: 4 }}>
                                                    <Text strong>
                                                        {selectedTimeSlot ? `${selectedTimeSlot.startTime} - ${selectedTimeSlot.endTime}` : 'Chưa chọn'}
                                                    </Text>
                                                    {selectedTimeSlot && (
                                                        <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>
                                                            Thời lượng: {calculateHours(selectedTimeSlot.startTime, selectedTimeSlot.endTime)} giờ
                                                        </Text>
                                                    )}
                                                </div>
                                            </div>

                                            <Divider style={{ margin: '8px 0' }} />

                                            {/* Phần tính toán giá */}
                                            {selectedTimeSlot && (
                                                <>
                                                    <div style={{ background: '#f6f8fa', padding: 12, borderRadius: 6 }}>
                                                        <Title level={5} style={{ marginBottom: 12 }}>
                                                            <CalculatorOutlined /> Chi tiết giá
                                                        </Title>

                                                        <Descriptions column={1} size="small">
                                                            <Descriptions.Item label="Giá sân/ca">
                                                                <Text strong>
                                                                    {(target.price || target.pricePerHour || 0).toLocaleString()} VND
                                                                </Text>
                                                                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                                                                    (Đã bao gồm {priceCalculation.hours} giờ)
                                                                </Text>
                                                            </Descriptions.Item>
                                                            <Descriptions.Item label="Phí timeslot">
                                                                <Text strong>
                                                                    {selectedTimeSlot.price.toLocaleString()} VND
                                                                </Text>
                                                            </Descriptions.Item>
                                                            <Descriptions.Item>
                                                                <Divider style={{ margin: '8px 0' }} />
                                                            </Descriptions.Item>
                                                        </Descriptions>

                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            marginTop: 8,
                                                            padding: '8px',
                                                            background: 'linear-gradient(45deg, #fff7e6, #fff1f0)',
                                                            borderRadius: 4,
                                                            border: '1px dashed #ffa940'
                                                        }}>
                                                            <Text strong style={{ fontSize: 14 }}>Tổng cộng:</Text>
                                                            <Text strong style={{ fontSize: 18, color: '#ff4d4f' }}>
                                                                = {(target.price || target.pricePerHour || 0) + selectedTimeSlot.price} VND
                                                            </Text>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            <div>
                                                <Row justify="space-between" align="middle">
                                                    <Text strong style={{ fontSize: 16 }}>Tổng thanh toán:</Text>
                                                    <Title level={3} style={{ margin: 0, color: '#ff4d4f' }}>
                                                        {priceCalculation.total ? `${priceCalculation.total.toLocaleString()} VND` : '0 VND'}
                                                    </Title>
                                                </Row>
                                                {selectedTimeSlot && (
                                                    <Text type="secondary" style={{ fontSize: '12px', textAlign: 'right' }}>
                                                        (Giá sân/ca + Phí timeslot)
                                                    </Text>
                                                )}
                                            </div>

                                            <Divider style={{ margin: '16px 0' }} />

                                            <Form.Item style={{ marginBottom: 0 }}>
                                                <Space direction="vertical" style={{ width: '100%' }}>
                                                    <Button
                                                        type="primary"
                                                        htmlType="submit"
                                                        loading={isSubmitting}
                                                        size="large"
                                                        block
                                                        icon={<CheckCircleOutlined />}
                                                        disabled={!selectedTimeSlot}
                                                        style={{
                                                            background: 'linear-gradient(45deg, #ff6b6b, #ff8e53)',
                                                            border: 'none'
                                                        }}
                                                    >
                                                        {isSubmitting ? 'Đang xử lý...' : `Thanh toán ${priceCalculation.total ? priceCalculation.total.toLocaleString() : '0'} VND`}
                                                    </Button>
                                                    <Button
                                                        onClick={handleCancel}
                                                        size="large"
                                                        block
                                                        danger
                                                    >
                                                        Hủy bỏ
                                                    </Button>
                                                </Space>
                                            </Form.Item>
                                        </Space>
                                    </Card>
                                </Col>
                            </Row>
                        </Form>
                    </Card>
                ) : (
                    <Card style={{ textAlign: 'center', padding: 40 }}>
                        <InfoCircleOutlined style={{ fontSize: 48, color: '#999', marginBottom: 16 }} />
                        <Title level={4} type="secondary">
                            Không tìm thấy thông tin sân
                        </Title>
                        <Text type="secondary">
                            Sân hoặc nhóm sân bạn tìm kiếm không tồn tại hoặc đã bị xóa.
                        </Text>
                        <div style={{ marginTop: 24 }}>
                            <Button type="primary" onClick={handleCancel}>
                                Quay lại trang chủ
                            </Button>
                        </div>
                    </Card>
                )}
            </Spin>
        </div>
    );
};

export default Booking;