import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, message, Empty, Tabs, Carousel, Spin } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import {
    getComplexById,
    getPitchesByComplexId,
    getPitchGroupsByComplexId,
    getImagesByComplexId,
    getAvailableTimeSlots
} from '../services/api';

const { TabPane } = Tabs;

const ComplexDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [complex, setComplex] = useState(null);
    const [pitches, setPitches] = useState([]);
    const [pitchGroups, setPitchGroups] = useState([]);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [timeslotLoading, setTimeslotLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [dates, setDates] = useState([]);
    const [timeslots, setTimeslots] = useState({}); // { 'PITCH_1': [...], 'PITCH_GROUP_2': [...] }

    useEffect(() => {
        // Tạo danh sách 7 ngày từ hôm nay
        const next7Days = Array.from({ length: 7 }, (_, i) => dayjs().add(i, 'day').format('YYYY-MM-DD'));
        setDates(next7Days);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [complexRes, pitchesRes, pitchGroupsRes, imagesRes] = await Promise.all([
                    getComplexById(id),
                    getPitchesByComplexId(id),
                    getPitchGroupsByComplexId(id),
                    getImagesByComplexId(id)
                ]);
                setComplex(complexRes.data);
                setPitches(pitchesRes.data);
                setPitchGroups(pitchGroupsRes.data);
                setImages(imagesRes.data);
            } catch (error) {
                message.error('Không thể tải thông tin cụm sân');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        if (complex) {
            loadTimeSlots();
        }
    }, [selectedDate, pitches, pitchGroups]);

    const loadTimeSlots = async () => {
        setTimeslotLoading(true);
        const newSlots = {};
        try {
            const allTargets = [
                ...pitches.map(p => ({ id: p.id, type: 'pitch' })),
                ...pitchGroups.map(g => ({ id: g.id, type: 'group' }))
            ];

            await Promise.all(
                allTargets.map(async (t) => {
                    try {
                        const res = await getAvailableTimeSlots(id, t.type, t.id, selectedDate);
                        newSlots[`${t.type}_${t.id}`] = res.data;
                    } catch {
                        newSlots[`${t.type}_${t.id}`] = [];
                    }
                })
            );

            setTimeslots(newSlots);
        } catch (error) {
            message.error('Lỗi khi tải khung giờ trống');
        } finally {
            setTimeslotLoading(false);
        }
    };

    const handleChipClick = (targetType, targetId, timeSlotId) => {
        navigate(
            `/booking/${targetType === 'pitch' ? 'pitch' : 'pitch-group'}/${targetId}?complexId=${id}&date=${selectedDate}&timeSlotId=${timeSlotId}`
        );
    };

    return (
        <div>
            {complex ? (
                <>
                    <h2>{complex.name}</h2>
                    {images.length > 0 ? (
                        <Carousel autoplay style={{ marginBottom: 24 }}>
                            {images.map((image) => (
                                <div key={image.imageId}>
                                    <img
                                        src={image.imageUrl}
                                        alt="Complex"
                                        style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                                    />
                                </div>
                            ))}
                        </Carousel>
                    ) : (
                        <Empty description="Không có hình ảnh" style={{ marginBottom: 24 }} />
                    )}

                    <Card style={{ marginBottom: 24 }}>
                        <p><strong>Địa chỉ:</strong> {complex.address}</p>
                        <p><strong>Quận:</strong> {complex.districtName}</p>
                        <p><strong>Tỉnh:</strong> {complex.provinceName}</p>
                        <p><strong>Số điện thoại:</strong> {complex.phone}</p>
                        <p><strong>Trạng thái:</strong> {complex.status}</p>
                    </Card>

                    {/* Thanh chọn ngày */}
                    <div style={{ display: 'flex', overflowX: 'auto', gap: 8, marginBottom: 20, paddingBottom: 4 }}>
                        {dates.map((date) => {
                            const isActive = date === selectedDate;
                            return (
                                <Button
                                    key={date}
                                    type={isActive ? 'primary' : 'default'}
                                    onClick={() => setSelectedDate(date)}
                                    style={{ borderRadius: 20, flexShrink: 0 }}
                                >
                                    {dayjs(date).format('ddd - DD/MM')}
                                </Button>
                            );
                        })}
                    </div>
                </>
            ) : (
                <Empty description="Không tìm thấy cụm sân" />
            )}

            <Tabs
                defaultActiveKey="pitches"
                items={[
                    {
                        key: 'pitches',
                        label: 'Sân lẻ',
                        children: (
                            pitches.length === 0 ? (
                                <Empty description="Không có sân lẻ" />
                            ) : (
                                <Row gutter={[16, 16]}>
                                    {pitches.map((pitch) => {
                                        const key = `pitch_${pitch.id}`;
                                        const slots = timeslots[key] || [];
                                        return (
                                            <Col span={8} key={pitch.id}>
                                                <Card
                                                    title={pitch.name}
                                                    hoverable
                                                    extra={<Button onClick={() => navigate(`/booking/pitch/${pitch.id}?complexId=${id}`)}>Đặt sân</Button>}
                                                >
                                                    <p><strong>Loại sân:</strong> {pitch.type === 'FIVE' ? 'Sân 5 người' : pitch.type === 'SEVEN' ? 'Sân 7 người' : 'Sân 11 người'}</p>
                                                    <p><strong>Giá mỗi giờ:</strong> {pitch.pricePerHour.toLocaleString()} VND</p>
                                                    <p><strong>Trạng thái:</strong> {pitch.status}</p>
                                                    {timeslotLoading ? (
                                                        <Spin size="small" />
                                                    ) : slots.length > 0 ? (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                                            {slots.map(slot => (
                                                                <Button
                                                                    key={slot.id}
                                                                    size="small"
                                                                    shape="round"
                                                                    onClick={() => handleChipClick('pitch', pitch.id, slot.id)}
                                                                >
                                                                    {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p style={{ color: '#999' }}>Không còn khung giờ trống</p>
                                                    )}
                                                </Card>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            )
                        )
                    },
                    {
                        key: 'pitchGroups',
                        label: 'Nhóm sân',
                        children: (
                            pitchGroups.length === 0 ? (
                                <Empty description="Không có nhóm sân" />
                            ) : (
                                <Row gutter={[16, 16]}>
                                    {pitchGroups.map((group) => {
                                        const key = `group_${group.id}`;
                                        const slots = timeslots[key] || [];
                                        return (
                                            <Col span={8} key={group.id}>
                                                <Card
                                                    title={group.name}
                                                    hoverable
                                                    extra={<Button onClick={() => navigate(`/booking/pitch-group/${group.id}?complexId=${id}`)}>Đặt nhóm sân</Button>}
                                                >
                                                    <p><strong>Sân thuộc nhóm:</strong> {group.pitchIds.length} sân</p>
                                                    <p><strong>Mô tả:</strong> Nhóm sân thuộc {group.complexName}</p>
                                                    {timeslotLoading ? (
                                                        <Spin size="small" />
                                                    ) : slots.length > 0 ? (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                                            {slots.map(slot => (
                                                                <Button
                                                                    key={slot.id}
                                                                    size="small"
                                                                    shape="round"
                                                                    onClick={() => handleChipClick('group', group.id, slot.id)}
                                                                >
                                                                    {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p style={{ color: '#999' }}>Không còn khung giờ trống</p>
                                                    )}
                                                </Card>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            )
                        )
                    }
                ]}
            />

        </div>
    );
};

export default ComplexDetail;
