import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, message, DatePicker, Select, Form, Row, Col, Space } from 'antd';
import moment from 'moment';
import {
    getPitchesByComplexId,
    getPitchGroupsByComplexId,
    getAvailableTimeSlots,
    createBooking
} from '../services/api';
import useAuth from '../hooks/useAuth';

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
            form.setFieldsValue({ bookingDate: selectedDate });
            fetchTimeSlots(selectedDate).then(() => {
                if (timeSlotIdFromQuery) {
                    form.setFieldsValue({ timeSlotId: parseInt(timeSlotIdFromQuery) });
                }
            });
        }
    }, [dateFromQuery, timeSlotIdFromQuery, complexId, target]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const bookingData = {
                userId: user.id,
                timeSlotId: values.timeSlotId,
                targetType: target.type,
                targetId: parseInt(pitchId || groupId),
                bookingDate: values.bookingDate.format('YYYY-MM-DD'),
            };
            await createBooking(bookingData);
            // ✅ In dữ liệu gửi sang BE ra console
            console.log('Dữ liệu gửi sang BE:', bookingData);
            message.success('Đặt sân thành công');
            navigate(`/complexes/${complexIdFromQuery}`);
        } catch (error) {
            console.error(error);
            message.error('Lỗi khi đặt sân');
            console.log('Dữ liệu gửi sang BE:', bookingData);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate(`/complexes/${complexIdFromQuery}`);
    };

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
            {target ? (
                <Card
                    title={`Đặt ${target.type === 'pitch' ? 'Sân' : 'Nhóm sân'} ${target.name}`}
                    loading={loading || authLoading}
                >
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    label="Ngày đặt"
                                    name="bookingDate"
                                    rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                                >
                                    <DatePicker
                                        format="DD/MM/YYYY"
                                        disabledDate={(current) => current && current < moment().startOf('day')}
                                        onChange={fetchTimeSlots}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Khung giờ"
                                    name="timeSlotId"
                                    rules={[{ required: true, message: 'Vui lòng chọn khung giờ' }]}
                                >
                                    <Select
                                        placeholder="Chọn khung giờ"
                                        disabled={!timeSlots.length}
                                        loading={loading}
                                    >
                                        {timeSlots.map((slot) => (
                                            <Option key={slot.id} value={slot.id}>
                                                {slot.startTime} - {slot.endTime} ({slot.price.toLocaleString()} VND)
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item>
                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                <Button onClick={handleCancel}>Hủy</Button>
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    Xác nhận đặt sân
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            ) : (
                <Card loading={loading || authLoading}>Không tìm thấy sân/nhóm sân</Card>
            )}
        </div>
    );
};

export default Booking;
