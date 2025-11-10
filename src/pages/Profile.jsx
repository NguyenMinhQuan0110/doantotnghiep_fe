import { useState, useEffect } from 'react';
import { Card, Button, message, Upload, Avatar, Tabs, Table, Tag } from 'antd';
import { UploadOutlined, UserOutlined } from '@ant-design/icons';
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
    const [bookingLoading, setBookingLoading] = useState(false);

    // 🔹 Lấy thông tin user và danh sách đặt sân
    useEffect(() => {
        const fetchUser = async () => {
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
        };
        fetchUser();
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

    // 🔹 Hủy đặt sân (chuyển sang trạng thái cancelled)
    const handleCancelBooking = async (bookingId) => {
        setBookingLoading(true);
        try {
            await cancelBooking(bookingId);
            const bookingsRes = await getUserBookings(user.userId);
            setBookings(bookingsRes.data);
            message.success('Hủy đặt sân thành công');
        } catch (error) {
            message.error('Lỗi khi hủy đặt sân');
        } finally {
            setBookingLoading(false);
        }
    };

    // 🔹 Cấu hình bảng lịch sử đặt sân
    const columns = [
        {
            title: 'Tên sân / Nhóm sân',
            key: 'targetName',
            render: (_, record) => (
                <span>
                    {record.targetType === 'pitch'
                        ? `Sân: ${record.targetName}`
                        : `Nhóm sân: ${record.targetName}`}
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
            render: (date) => dayjs(date).format('DD/MM/YYYY'),
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
            render: (status) => {
                const colorMap = {
                    pending: 'gold',
                    confirmed: 'blue',
                    cancelled: 'red',
                    completed: 'green',
                };
                const labelMap = {
                    pending: 'Đang chờ',
                    confirmed: 'Đã xác nhận',
                    cancelled: 'Đã hủy',
                    completed: 'Hoàn thành',
                };
                return <Tag color={colorMap[status]}>{labelMap[status] || status}</Tag>;
            },
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) =>
                record.status === 'pending' ? (
                    <Button
                        type="link"
                        danger
                        onClick={() => handleCancelBooking(record.id)}
                        loading={bookingLoading}
                    >
                        Hủy
                    </Button>
                ) : (
                    '-'
                ),
        },
    ];

    // 🔹 Tabs Hồ sơ / Lịch sử đặt sân
    const tabItems = [
        {
            key: 'profile',
            label: 'Hồ sơ',
            children: (
                <Card loading={loading}>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <Avatar
                            size={100}
                            src={user?.avatar}
                            icon={!user?.avatar && <UserOutlined />}
                        />
                        <h2 style={{ marginTop: 12 }}>{user?.fullName}</h2>
                    </div>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>Số điện thoại:</strong> {user?.phone}</p>

                    <Upload
                        beforeUpload={(file) => {
                            handleUpload(file);
                            return false;
                        }}
                        showUploadList={false}
                    >
                        <Button icon={<UploadOutlined />} loading={loading}>
                            Đổi avatar
                        </Button>
                    </Upload>
                </Card>
            ),
        },
        {
            key: 'bookings',
            label: 'Lịch sử đặt sân',
            children: (
                <Card>
                    <Button
                        type="primary"
                        onClick={async () => {
                            setBookingLoading(true);
                            try {
                                const bookingsRes = await getUserBookings(user.userId);
                                setBookings(bookingsRes.data);
                                message.success('Đã cập nhật danh sách đặt sân');
                            } catch (error) {
                                message.error('Lỗi khi cập nhật danh sách');
                            } finally {
                                setBookingLoading(false);
                            }
                        }}
                        style={{ marginBottom: 16 }}
                    >
                        Làm mới
                    </Button>

                    <Table
                        columns={columns}
                        dataSource={bookings}
                        rowKey="id"
                        loading={bookingLoading}
                        pagination={{ pageSize: 5 }}
                        locale={{ emptyText: 'Không có lịch sử đặt sân' }}
                    />
                </Card>
            ),
        },
    ];

    // 🔹 Render
    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {user ? (
                <Tabs defaultActiveKey="profile" items={tabItems} />
            ) : (
                <Card loading={loading}>Không tìm thấy thông tin người dùng</Card>
            )}
        </div>
    );
};

export default Profile;
