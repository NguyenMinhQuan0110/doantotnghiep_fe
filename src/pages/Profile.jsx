import { useState, useEffect, useCallback } from 'react';
import { Card, Button, message, Upload, Avatar, Tabs, Table, Tag, Spin } from 'antd';
import { UploadOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import {
    getCurrentUser,
    updateAvatar,
    getUserBookings,
    cancelBooking
} from '../services/api';
import dayjs from 'dayjs';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [bookingLoading, setBookingLoading] = useState({}); // Track loading cho từng booking
    const [refreshKey, setRefreshKey] = useState(0); // Thêm refreshKey để force refresh Table

    // 🔹 Lấy thông tin user và danh sách đặt sân
    useEffect(() => {
        fetchUserAndBookings();
    }, []);

    const fetchUserAndBookings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getCurrentUser();
            console.log("User info:", res.data);
            setUser(res.data);

            const bookingsRes = await getUserBookings(res.data.id);
            setBookings(bookingsRes.data);
        } catch (error) {
            message.error('Không thể tải thông tin người dùng');
        } finally {
            setLoading(false);
        }
    }, []);

    // 🔹 Upload avatar
    const handleUpload = async (file) => {
        setLoading(true);
        try {
            const res = await updateAvatar(user.userId, file);
            setUser(res.data);
            message.success('Đổi avatar thành công');
        } catch (error) {
            message.error('Lỗi khi đổi avatar');
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Hủy đặt sân - VERSION TỐI ƯU
    const handleCancelBooking = async (bookingId) => {
        setBookingLoading(prev => ({ ...prev, [bookingId]: true }));

        try {
            const res = await cancelBooking(bookingId);

            // Cập nhật state ngay lập tức
            setBookings(prevBookings =>
                prevBookings.map(booking =>
                    booking.id === bookingId
                        ? {
                            ...booking,
                            status: 'cancelled',
                            // Nếu API trả về đầy đủ data, có thể dùng:
                            // ...res.data
                        }
                        : booking
                )
            );

            // Force re-render Table
            setRefreshKey(prev => prev + 1);

            message.success('Hủy đặt sân thành công');
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Lỗi khi hủy đặt sân';
            message.error(errorMsg);
        } finally {
            setBookingLoading(prev => ({ ...prev, [bookingId]: false }));
        }
    };

    // 🔹 Cấu hình bảng lịch sử đặt sân
    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            render: (id) => <span style={{ fontWeight: 'bold' }}>#{id}</span>,
        },
        {
            title: 'Tên sân / Nhóm sân',
            key: 'targetName',
            render: (_, record) => (
                <span>
                    {record.targetType === 'pitch'
                        ? `🏸 Sân: ${record.targetName}`
                        : `👥 Nhóm sân: ${record.targetName}`}
                </span>
            ),
        },
        {
            title: 'Cụm sân',
            dataIndex: 'complexName',
            key: 'complexName',
            render: (text) => <span>{text || '—'}</span>,
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'bookingDate',
            key: 'bookingDate',
            render: (date) => (
                <span style={{ fontWeight: '500' }}>
                    {dayjs(date).format('DD/MM/YYYY')}
                </span>
            ),
        },
        {
            title: 'Khung giờ',
            dataIndex: 'timeSlotRange',
            key: 'timeSlotRange',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => {
                const colorMap = {
                    pending: 'gold',
                    confirmed: 'blue',
                    cancelled: 'red',
                    completed: 'green',
                };
                const labelMap = {
                    pending: '⏳ Chờ',
                    confirmed: '✅ Xác nhận',
                    cancelled: '❌ Đã hủy',
                    completed: '🏁 Hoàn thành',
                };
                return (
                    <Tag
                        color={colorMap[status]}
                        style={{ fontWeight: 'bold', minWidth: '90px', textAlign: 'center' }}
                    >
                        {labelMap[status] || status}
                    </Tag>
                );
            },
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 100,
            render: (_, record) => {
                const isLoading = bookingLoading[record.id];

                if (record.status === 'pending') {
                    return (
                        <Button
                            type="link"
                            danger
                            onClick={() => handleCancelBooking(record.id)}
                            loading={isLoading}
                            disabled={isLoading}
                            size="small"
                        >
                            {isLoading ? 'Đang hủy...' : 'Hủy'}
                        </Button>
                    );
                } else if (record.status === 'cancelled') {
                    return <Tag color="default">Đã hủy</Tag>;
                } else {
                    return '-';
                }
            },
        },
    ];

    // 🔹 Tabs Hồ sơ / Lịch sử đặt sân
    const tabItems = [
        {
            key: 'profile',
            label: '👤 Hồ sơ',
            children: (
                <Card loading={loading}>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <Avatar
                            size={100}
                            src={user?.avatar}
                            icon={!user?.avatar && <UserOutlined />}
                            style={{ border: '3px solid #1890ff' }}
                        />
                        <h2 style={{ marginTop: 12 }}>{user?.fullName}</h2>
                        <p style={{ color: '#666' }}>{user?.email}</p>
                    </div>

                    <div style={{ padding: '0 20px' }}>
                        <p><strong>📧 Email:</strong> {user?.email}</p>
                        <p><strong>📱 Số điện thoại:</strong> {user?.phone || 'Chưa cập nhật'}</p>
                        <p><strong>📅 Tham gia:</strong> {user?.createdAt ? dayjs(user.createdAt).format('DD/MM/YYYY') : '—'}</p>
                    </div>

                    <div style={{ marginTop: 24, textAlign: 'center' }}>
                        <Upload
                            beforeUpload={(file) => {
                                handleUpload(file);
                                return false;
                            }}
                            showUploadList={false}
                            accept="image/*"
                        >
                            <Button icon={<UploadOutlined />} loading={loading}>
                                Đổi avatar
                            </Button>
                        </Upload>
                    </div>
                </Card>
            ),
        },
        {
            key: 'bookings',
            label: '📋 Lịch sử đặt sân',
            children: (
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div>
                            <Button
                                type="primary"
                                icon={<ReloadOutlined />}
                                onClick={fetchUserAndBookings}
                                loading={loading}
                                style={{ marginRight: 10 }}
                            >
                                Làm mới
                            </Button>
                            <span style={{ color: '#666', fontSize: '14px' }}>
                                Tổng số: <strong>{bookings.length}</strong> đơn đặt
                            </span>
                        </div>

                        <div>
                            <Button
                                onClick={() => setBookings(bookings.filter(b => b.status === 'pending'))}
                                size="small"
                                style={{ marginRight: 8 }}
                            >
                                Chỉ hiện đang chờ
                            </Button>
                            <Button
                                onClick={fetchUserAndBookings}
                                size="small"
                            >
                                Hiện tất cả
                            </Button>
                        </div>
                    </div>

                    <Table
                        columns={columns}
                        dataSource={bookings}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total) => `Tổng ${total} đơn đặt`
                        }}
                        locale={{ emptyText: 'Không có lịch sử đặt sân' }}
                        key={`booking-table-${refreshKey}`} // Force re-render khi có thay đổi
                    />
                </Card>
            ),
        },
    ];

    // 🔹 Render
    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
            <h1 style={{ marginBottom: '24px' }}>Hồ sơ cá nhân</h1>

            {user ? (
                <Tabs
                    defaultActiveKey="profile"
                    items={tabItems}
                    tabPosition="top"
                    size="large"
                />
            ) : (
                <Card style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                    <p style={{ marginTop: '20px' }}>Đang tải thông tin người dùng...</p>
                </Card>
            )}
        </div>
    );
};

export default Profile;