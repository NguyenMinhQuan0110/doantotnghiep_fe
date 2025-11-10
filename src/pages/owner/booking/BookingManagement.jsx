import React, { useState, useEffect } from 'react';
import { Table, Select, Button, message, Spin } from 'antd';
import { getComplexesByOwner, getBookingsByComplex, updateBookingStatus } from '../../../services/api';
import useAuth from '../../../hooks/useAuth';

const { Option } = Select;

const BookingManagement = () => {
    const { user, loading: authLoading } = useAuth();
    const [complexes, setComplexes] = useState([]);
    const [selectedComplexId, setSelectedComplexId] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);

    // Lấy danh sách cụm sân của owner
    const fetchComplexes = async () => {
        try {
            const response = await getComplexesByOwner();
            setComplexes(response.data);
            if (response.data.length > 0) {
                setSelectedComplexId(response.data[0].targetId); // Chọn cụm sân đầu tiên mặc định
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Không thể tải danh sách cụm sân');
        }
    };

    // Lấy danh sách booking theo cụm sân
    const fetchBookings = async (targetId) => {
        setLoading(true);
        try {
            const response = await getBookingsByComplex(targetId);
            setBookings(response.data);
        } catch (error) {
            message.error(error.response?.data?.message || 'Không thể tải danh sách booking');
        } finally {
            setLoading(false);
        }
    };

    // Cập nhật trạng thái booking
    const updateStatus = async (id, status) => {
        try {
            const response = await updateBookingStatus(id, status);
            message.success('Cập nhật trạng thái booking thành công');
            setBookings(
                bookings.map((booking) => (booking.id === id ? response.data : booking))
            );
        } catch (error) {
            message.error(error.response?.data?.message || 'Cập nhật trạng thái thất bại');
        }
    };

    useEffect(() => {
        if (user) {
            fetchComplexes();
        }
    }, [user]);

    useEffect(() => {
        if (selectedComplexId) {
            fetchBookings(selectedComplexId);
        }
    }, [selectedComplexId]);

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Người đặt',
            dataIndex: 'userName',
            key: 'userName',
        },
        {
            title: 'Loại sân',
            dataIndex: 'targetType',
            key: 'targetType',
            render: (targetType) => (targetType === 'pitch' ? 'Sân đơn' : 'Nhóm sân'),
        },
        {
            title: 'Tên sân/Nhóm sân',
            dataIndex: 'targetName',
            key: 'targetName',
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'bookingDate',
            key: 'bookingDate',
        },
        {
            title: 'Khung giờ',
            dataIndex: 'timeSlotRange',
            key: 'timeSlotRange',
            render: (timeSlotRange) => timeSlotRange.slice(0, 11), // Hiển thị HH:mm - HH:mm
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => (
                <Select
                    value={status}
                    onChange={(value) => updateStatus(record.id, value)}
                    style={{ width: 120 }}
                >
                    <Option value="pending">Đang chờ</Option>
                    <Option value="confirmed">Đã xác nhận</Option>
                    <Option value="cancelled">Đã hủy</Option>
                    <Option value="completed">Hoàn thành</Option>
                </Select>
            ),
        },
    ];

    if (authLoading) {
        return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
    }

    return (
        <div>
            <h1>Quản lý Booking</h1>
            <Select
                placeholder="Chọn cụm sân"
                value={selectedComplexId}
                onChange={setSelectedComplexId}
                style={{ width: 200, marginBottom: 16 }}
            >
                {complexes.map((complex) => (
                    <Option key={complex.id} value={complex.id}>
                        {complex.name}
                    </Option>
                ))}
            </Select>
            <Table
                columns={columns}
                dataSource={bookings}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
};

export default BookingManagement;