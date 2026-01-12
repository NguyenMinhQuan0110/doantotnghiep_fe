import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card,
    Row,
    Col,
    Button,
    message,
    Empty,
    Tabs,
    Spin,
    Modal,
    Image,
    Tag,
    Rate,
    Divider,
    Space,
    Typography,
    Skeleton,
    Tooltip,
    Affix,
    Collapse
} from 'antd';
import {
    EnvironmentOutlined,
    PhoneOutlined,
    ClockCircleOutlined,
    CalendarOutlined,
    EyeOutlined,
    LeftOutlined,
    RightOutlined,
    CloseOutlined,
    StarFilled,
    FireFilled,
    CheckCircleOutlined,
    WarningOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import {
    getComplexById,
    getPitchesByComplexId,
    getPitchGroupsByComplexId,
    getImagesByComplexId,
    getAvailableTimeSlots
} from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const ComplexDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [complex, setComplex] = useState(null);
    const [pitches, setPitches] = useState([]);
    const [pitchGroups, setPitchGroups] = useState([]);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeslotLoading, setTimeslotLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [dates, setDates] = useState([]);
    const [timeslots, setTimeslots] = useState({});
    const [expandedPitches, setExpandedPitches] = useState({});

    // State cho modal gallery
    const [modalVisible, setModalVisible] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Ref cho header cố định
    const headerRef = useRef(null);

    useEffect(() => {
        const next7Days = Array.from({ length: 7 }, (_, i) => {
            const date = dayjs().add(i, 'day');
            return {
                date: date.format('YYYY-MM-DD'),
                day: date.format('ddd'),
                dayNum: date.format('DD'),
                month: date.format('MM'),
                isToday: i === 0
            };
        });
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

    const openImageModal = (index) => {
        setCurrentImageIndex(index);
        setModalVisible(true);
    };

    const goToNextImage = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
    };

    const goToPrevImage = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    // Hàm format giá
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Hàm toggle mở rộng timeslots cho từng sân
    const toggleExpandPitch = (pitchId) => {
        setExpandedPitches(prev => ({
            ...prev,
            [pitchId]: !prev[pitchId]
        }));
    };

    // Component cho card sân
    const PitchCard = ({ pitch, isGroup = false }) => {
        const key = `${isGroup ? 'group' : 'pitch'}_${pitch.id}`;
        const slots = timeslots[key] || [];
        const isMaintenance = pitch.status === 'maintenance';
        const isActive = pitch.status === 'active';
        const isExpanded = expandedPitches[pitch.id];

        // Nếu sân đang bảo trì, disable tất cả
        if (isMaintenance) {
            return (
                <Card
                    style={{
                        height: '100%',
                        borderRadius: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        border: '1px solid #f0f0f0',
                        opacity: 0.5,
                        cursor: 'not-allowed',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    bodyStyle={{ padding: 16 }}
                >
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.02)',
                        zIndex: 1,
                        pointerEvents: 'none'
                    }} />

                    {/* Overlay bảo trì */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(255, 50, 50, 0.9)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        zIndex: 2,
                        textAlign: 'center',
                        minWidth: '200px'
                    }}>
                        <WarningOutlined style={{ marginRight: 8 }} />
                        ĐANG BẢO TRÌ
                    </div>

                    <div style={{ opacity: 0.7, pointerEvents: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <Title level={5} style={{ margin: 0, color: '#999' }}>{pitch.name}</Title>
                            <Tag color="red" style={{ opacity: 0.7 }}>Bảo trì</Tag>
                        </div>

                        {!isGroup && (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <Text style={{ color: '#999', fontSize: 16, textDecoration: 'line-through' }}>
                                        {formatPrice(pitch.pricePerHour)}
                                    </Text>
                                    <Text type="secondary">/giờ</Text>
                                </div>
                            </>
                        )}

                        {isGroup && (
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <CheckCircleOutlined style={{ color: '#999' }} />
                                    <Text style={{ color: '#999' }}>{pitch.pitchIds.length} sân trong nhóm</Text>
                                </div>
                            </div>
                        )}

                        <Divider style={{ margin: '12px 0', opacity: 0.3 }} />

                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <Text type="secondary" style={{ fontStyle: 'italic' }}>
                                Sân tạm thời không hoạt động
                            </Text>
                        </div>
                    </div>
                </Card>
            );
        }

        // Sân đang hoạt động bình thường
        return (
            <Card
                hoverable={isActive}
                style={{
                    height: '100%',
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    border: isActive ? '1px solid #f0f0f0' : '1px solid #ffccc7',
                    background: isActive ? 'white' : '#fff2f0'
                }}
                bodyStyle={{ padding: 16 }}
                cover={
                    !isGroup && isActive && (
                        <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                            <img
                                alt={pitch.name}
                                src="https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400&h=200&fit=crop"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderTopLeftRadius: 12,
                                    borderTopRightRadius: 12,
                                }}
                            />
                            <Tag
                                color={pitch.type === 'FIVE' ? '#1890ff' : pitch.type === 'SEVEN' ? '#52c41a' : '#fa8c16'}
                                style={{
                                    position: 'absolute',
                                    top: 12,
                                    left: 12,
                                    fontWeight: 'bold'
                                }}
                            >
                                {pitch.type === 'FIVE' ? '5 NGƯỜI' : pitch.type === 'SEVEN' ? '7 NGƯỜI' : '11 NGƯỜI'}
                            </Tag>
                        </div>
                    )
                }
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <Title level={5} style={{ margin: 0 }}>{pitch.name}</Title>
                    {!isActive && pitch.status !== 'maintenance' && (
                        <Tag color="warning">{pitch.status === 'inactive' ? 'Tạm đóng' : pitch.status}</Tag>
                    )}
                </div>

                {!isGroup && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>
                                {formatPrice(pitch.pricePerHour)}
                            </Text>
                            <Text type="secondary">/giờ</Text>
                        </div>
                    </>
                )}

                {isGroup && (
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            <Text strong>{pitch.pitchIds.length} sân trong nhóm</Text>
                        </div>
                    </div>
                )}

                <Divider style={{ margin: '12px 0' }} />

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text strong>
                            <ClockCircleOutlined /> Khung giờ trống ({slots.length})
                        </Text>
                        {slots.length > 6 && (
                            <Button
                                type="link"
                                size="small"
                                onClick={() => toggleExpandPitch(pitch.id)}
                                style={{ padding: 0 }}
                            >
                                {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                            </Button>
                        )}
                    </div>

                    {timeslotLoading ? (
                        <Spin size="small" />
                    ) : slots.length > 0 ? (
                        <>
                            <Space wrap size={[4, 8]} style={{ marginBottom: 8 }}>
                                {slots.slice(0, 6).map(slot => (
                                    <Tooltip key={slot.id} title="Click để đặt sân">
                                        <Button
                                            type="primary"
                                            size="small"
                                            shape="round"
                                            onClick={() => handleChipClick(isGroup ? 'group' : 'pitch', pitch.id, slot.id)}
                                            style={{
                                                background: 'linear-gradient(45deg, #1890ff, #36cfc9)',
                                                border: 'none',
                                                fontWeight: 'bold',
                                                padding: '0 12px'
                                            }}
                                        >
                                            {slot.startTime.slice(0, 5)}
                                        </Button>
                                    </Tooltip>
                                ))}
                            </Space>

                            {/* Hiển thị thêm timeslots nếu mở rộng */}
                            {isExpanded && slots.length > 6 && (
                                <div style={{ marginTop: 8 }}>
                                    <div style={{
                                        padding: '12px',
                                        backgroundColor: '#f6ffed',
                                        borderRadius: '6px',
                                        border: '1px solid #b7eb8f'
                                    }}>
                                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                            Các khung giờ khác:
                                        </Text>
                                        <Space wrap size={[4, 8]}>
                                            {slots.slice(6).map(slot => (
                                                <Tooltip key={slot.id} title="Click để đặt sân">
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        shape="round"
                                                        ghost
                                                        onClick={() => handleChipClick(isGroup ? 'group' : 'pitch', pitch.id, slot.id)}
                                                        style={{
                                                            fontWeight: 'bold',
                                                            padding: '0 12px'
                                                        }}
                                                    >
                                                        {slot.startTime.slice(0, 5)}
                                                    </Button>
                                                </Tooltip>
                                            ))}
                                        </Space>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '12px',
                            backgroundColor: '#fff2e8',
                            borderRadius: 6,
                            border: '1px dashed #ffa940'
                        }}>
                            <Text type="warning">
                                <ClockCircleOutlined /> Không còn khung giờ trống
                            </Text>
                        </div>
                    )}

                    <Button
                        type="primary"
                        block
                        size="large"
                        disabled={!isActive}
                        style={{
                            background: isActive ? 'linear-gradient(45deg, #ff6b6b, #ff8e53)' : '#d9d9d9',
                            border: 'none',
                            borderRadius: 8,
                            fontWeight: 'bold',
                            marginTop: 8,
                            cursor: isActive ? 'pointer' : 'not-allowed'
                        }}
                        onClick={() => isActive && navigate(`/booking/${isGroup ? 'pitch-group' : 'pitch'}/${pitch.id}?complexId=${id}&date=${selectedDate}`)}
                    >
                        {isActive ? 'ĐẶT NGAY' : 'KHÔNG KHẢ DỤNG'}
                    </Button>
                </div>
            </Card>
        );
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            {/* Header cố định */}
            <Affix offsetTop={0}>
                <div
                    ref={headerRef}
                    style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        padding: '16px 24px',
                        margin: '-24px -24px 24px',
                        borderRadius: '0 0 16px 16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                    }}
                >
                    <Row gutter={[24, 16]} align="middle">
                        <Col flex="auto">
                            <Skeleton loading={loading} active paragraph={false}>
                                <Title level={3} style={{ color: 'white', margin: 0 }}>
                                    {complex?.name}
                                </Title>
                                <Space style={{ marginTop: 4 }} wrap>
                                    <Tag icon={<EnvironmentOutlined />} color="white" style={{ color: '#667eea' }}>
                                        {complex?.districtName}, {complex?.provinceName}
                                    </Tag>
                                    <Tag icon={<PhoneOutlined />} color="white" style={{ color: '#667eea' }}>
                                        {complex?.phone}
                                    </Tag>
                                    <Rate
                                        disabled
                                        defaultValue={4.5}
                                        style={{ color: '#ffd700' }}
                                        character={<StarFilled />}
                                    />
                                    <Text style={{ color: 'white' }}>4.5 (128 đánh giá)</Text>
                                </Space>
                            </Skeleton>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                size="large"
                                style={{
                                    background: 'white',
                                    color: '#667eea',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                }}
                                onClick={() => window.open(`tel:${complex?.phone}`)}
                            >
                                <PhoneOutlined /> GỌI NGAY
                            </Button>
                        </Col>
                    </Row>
                </div>
            </Affix>

            {/* Main Content */}
            <Row gutter={[24, 24]}>
                {/* Left Column - Images and Info */}
                <Col xs={24} lg={16}>
                    {/* Image Gallery */}
                    {loading ? (
                        <Skeleton.Image active style={{ width: '100%', height: 300 }} />
                    ) : images.length > 0 ? (
                        <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gridTemplateRows: 'repeat(2, 150px)',
                                    gap: 4,
                                    borderRadius: 16,
                                    overflow: 'hidden'
                                }}
                            >
                                {images.slice(0, 5).map((image, index) => (
                                    <div
                                        key={image.imageId}
                                        style={{
                                            gridColumn: index === 0 ? 'span 2' : 'span 1',
                                            gridRow: index === 0 ? 'span 2' : 'span 1',
                                            position: 'relative',
                                            cursor: 'pointer',
                                            overflow: 'hidden'
                                        }}
                                        onClick={() => openImageModal(index)}
                                    >
                                        <img
                                            src={image.imageUrl}
                                            alt={`Complex ${index + 1}`}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.3s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        />
                                        {index === 0 && images.length > 5 && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background: 'rgba(0,0,0,0.5)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: 24,
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                +{images.length - 5} ảnh
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <Button
                                type="primary"
                                icon={<EyeOutlined />}
                                style={{
                                    position: 'absolute',
                                    bottom: 16,
                                    right: 16,
                                    background: 'rgba(255,255,255,0.9)',
                                    color: '#1890ff',
                                    border: 'none',
                                    fontWeight: 'bold'
                                }}
                                onClick={() => openImageModal(0)}
                            >
                                Xem tất cả ảnh
                            </Button>
                        </div>
                    ) : (
                        <Empty
                            description="Chưa có hình ảnh"
                            style={{
                                padding: 40,
                                background: '#fafafa',
                                borderRadius: 16
                            }}
                        />
                    )}

                    {/* Date Selection */}
                    <Card
                        style={{
                            marginTop: 24,
                            borderRadius: 16,
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
                        }}
                        bodyStyle={{ padding: '16px 8px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text strong style={{ fontSize: 16 }}>
                                <CalendarOutlined style={{ marginRight: 8 }} />
                                Chọn ngày đặt sân
                            </Text>
                            <Tag color="blue">
                                {dayjs(selectedDate).locale('vi').format('dddd, DD/MM/YYYY')}
                            </Tag>
                        </div>

                        <div style={{ display: 'flex', overflowX: 'auto', gap: 8, padding: '8px 0' }}>
                            {dates.map((dateObj) => {
                                const isActive = dateObj.date === selectedDate;
                                return (
                                    <div
                                        key={dateObj.date}
                                        onClick={() => setSelectedDate(dateObj.date)}
                                        style={{
                                            minWidth: 80,
                                            padding: '12px 8px',
                                            borderRadius: 12,
                                            background: isActive
                                                ? 'linear-gradient(45deg, #1890ff, #36cfc9)'
                                                : '#f5f5f5',
                                            color: isActive ? 'white' : '#666',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                            border: isActive ? 'none' : '1px solid #e8e8e8'
                                        }}
                                    >
                                        <div style={{ fontSize: 12, opacity: 0.8 }}>
                                            {dateObj.isToday ? 'HÔM NAY' : dateObj.day.toUpperCase()}
                                        </div>
                                        <div style={{
                                            fontSize: 24,
                                            fontWeight: 'bold',
                                            margin: '4px 0'
                                        }}>
                                            {dateObj.dayNum}
                                        </div>
                                        <div style={{ fontSize: 12 }}>
                                            Tháng {dateObj.month}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </Col>

                {/* Right Column - Complex Info */}
                <Col xs={24} lg={8}>
                    <Card
                        style={{
                            borderRadius: 16,
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            height: '100%'
                        }}
                    >
                        <Title level={5} style={{ marginBottom: 16 }}>
                            <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                            Thông tin cụm sân
                        </Title>

                        <Skeleton loading={loading} active>
                            {complex && (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Địa chỉ</Text>
                                        <Paragraph style={{ margin: 0, color: '#666' }}>
                                            {complex.address}
                                        </Paragraph>
                                    </div>

                                    <Divider />

                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Liên hệ</Text>
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                            <Button
                                                icon={<PhoneOutlined />}
                                                block
                                                style={{ textAlign: 'left' }}
                                                onClick={() => window.open(`tel:${complex.phone}`)}
                                            >
                                                {complex.phone}
                                            </Button>
                                            <Button
                                                icon={<EnvironmentOutlined />}
                                                block
                                                style={{ textAlign: 'left' }}
                                                onClick={() => window.open(`https://maps.google.com/?q=${complex.address}`)}
                                            >
                                                Xem trên bản đồ
                                            </Button>
                                        </Space>
                                    </div>

                                    <Divider />

                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Giờ hoạt động</Text>
                                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Text>Thứ 2 - Thứ 6</Text>
                                                <Text strong>6:00 - 22:00</Text>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Text>Thứ 7 - Chủ nhật</Text>
                                                <Text strong>6:00 - 23:00</Text>
                                            </div>
                                        </Space>
                                    </div>

                                    <Divider />

                                    <div>
                                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Tiện ích</Text>
                                        <Space wrap>
                                            <Tag color="green">WiFi miễn phí</Tag>
                                            <Tag color="blue">Chỗ đỗ xe</Tag>
                                            <Tag color="purple">Quán nước</Tag>
                                            <Tag color="orange">Phòng thay đồ</Tag>
                                            <Tag color="red">Vòi sen</Tag>
                                            <Tag color="cyan">Máy lạnh</Tag>
                                        </Space>
                                    </div>

                                    <Divider />

                                    <div>
                                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Trạng thái</Text>
                                        <Tag
                                            color={complex.status === 'active' ? 'success' : 'error'}
                                            icon={<CheckCircleOutlined />}
                                        >
                                            {complex.status === 'active' ? 'Đang hoạt động' : 'Đóng cửa'}
                                        </Tag>
                                    </div>
                                </>
                            )}
                        </Skeleton>
                    </Card>
                </Col>
            </Row>

            {/* Tabs Section */}
            <div style={{ marginTop: 32 }}>
                <Tabs
                    defaultActiveKey="pitches"
                    type="card"
                    size="large"
                    items={[
                        {
                            key: 'pitches',
                            label: (
                                <span>
                                    <FireFilled style={{ color: '#ff6b6b', marginRight: 8 }} />
                                    Sân lẻ ({pitches.filter(p => p.status === 'active').length}/{pitches.length})
                                </span>
                            ),
                            children: (
                                pitches.length === 0 ? (
                                    <Empty
                                        description="Chưa có sân lẻ"
                                        style={{ padding: 40 }}
                                    />
                                ) : (
                                    <Row gutter={[24, 24]}>
                                        {pitches.map((pitch) => (
                                            <Col xs={24} md={12} lg={8} key={pitch.id}>
                                                <PitchCard pitch={pitch} />
                                            </Col>
                                        ))}
                                    </Row>
                                )
                            )
                        },
                        {
                            key: 'pitchGroups',
                            label: (
                                <span>
                                    <FireFilled style={{ color: '#36cfc9', marginRight: 8 }} />
                                    Nhóm sân ({pitchGroups.filter(p => p.status === 'active').length}/{pitchGroups.length})
                                </span>
                            ),
                            children: (
                                pitchGroups.length === 0 ? (
                                    <Empty
                                        description="Chưa có nhóm sân"
                                        style={{ padding: 40 }}
                                    />
                                ) : (
                                    <Row gutter={[24, 24]}>
                                        {pitchGroups.map((group) => (
                                            <Col xs={24} md={12} lg={8} key={group.id}>
                                                <PitchCard pitch={group} isGroup />
                                            </Col>
                                        ))}
                                    </Row>
                                )
                            )
                        }
                    ]}
                    style={{
                        background: 'white',
                        padding: 24,
                        borderRadius: 16,
                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
                    }}
                />
            </div>

            {/* Image Modal - Đã sửa */}
            <Modal
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width="90vw"
                style={{ top: 20 }}
                bodyStyle={{
                    padding: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '80vh',
                    background: '#000'
                }}
                closeIcon={
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<CloseOutlined />}
                        style={{
                            position: 'fixed',
                            top: 30,
                            right: 30,
                            zIndex: 1001,
                            background: 'rgba(0,0,0,0.5)',
                            border: 'none'
                        }}
                    />
                }
            >
                {images.length > 0 && (
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '80vh',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <div style={{
                            maxWidth: '90%',
                            maxHeight: '90%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <img
                                src={images[currentImageIndex]?.imageUrl}
                                alt={`Complex ${currentImageIndex + 1}`}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: 'calc(80vh - 100px)',
                                    objectFit: 'contain',
                                    display: 'block'
                                }}
                            />
                        </div>

                        {images.length > 1 && (
                            <>
                                <Button
                                    shape="circle"
                                    icon={<LeftOutlined />}
                                    onClick={goToPrevImage}
                                    style={{
                                        position: 'absolute',
                                        left: 20,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        zIndex: 1000,
                                        background: 'rgba(255,255,255,0.2)',
                                        border: 'none',
                                        color: 'white',
                                        width: 50,
                                        height: 50,
                                        fontSize: 20
                                    }}
                                />
                                <Button
                                    shape="circle"
                                    icon={<RightOutlined />}
                                    onClick={goToNextImage}
                                    style={{
                                        position: 'absolute',
                                        right: 20,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        zIndex: 1000,
                                        background: 'rgba(255,255,255,0.2)',
                                        border: 'none',
                                        color: 'white',
                                        width: 50,
                                        height: 50,
                                        fontSize: 20
                                    }}
                                />

                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: 40,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'rgba(0,0,0,0.7)',
                                        color: 'white',
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        fontSize: 14
                                    }}
                                >
                                    {currentImageIndex + 1} / {images.length}
                                </div>

                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: 20,
                                        left: 0,
                                        right: 0,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: 8,
                                        padding: '0 20px',
                                        overflowX: 'auto'
                                    }}
                                >
                                    {images.map((image, index) => (
                                        <div
                                            key={image.imageId}
                                            style={{
                                                width: 60,
                                                height: 60,
                                                borderRadius: 4,
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                border: index === currentImageIndex
                                                    ? '3px solid #1890ff'
                                                    : '1px solid rgba(255,255,255,0.3)',
                                                opacity: index === currentImageIndex ? 1 : 0.7,
                                                flexShrink: 0
                                            }}
                                            onClick={() => setCurrentImageIndex(index)}
                                        >
                                            <img
                                                src={image.imageUrl}
                                                alt={`Thumb ${index + 1}`}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ComplexDetail;