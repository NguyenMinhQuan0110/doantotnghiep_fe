import { useEffect, useState } from 'react';
import { Table, Button, message, Select } from 'antd';
import { getComplexesByOwner, getTimeSlotsByComplexId, updateTimeSlotStatus } from '../../../services/api';
import TimeSlotForm from './TimeSlotForm';

const { Option } = Select;

const TimeSlotList = () => {
    const [complexes, setComplexes] = useState([]);
    const [selectedComplexId, setSelectedComplexId] = useState(null);
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTimeSlot, setEditingTimeSlot] = useState(null);

    // Lấy danh sách cụm sân của owner
    const fetchComplexes = async () => {
        try {
            const response = await getComplexesByOwner();
            setComplexes(response.data);
            if (response.data.length > 0) {
                setSelectedComplexId(response.data[0].id); // Chọn cụm sân đầu tiên mặc định
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Không thể tải danh sách cụm sân');
        }
    };

    // Lấy danh sách khung giờ theo cụm sân
    const fetchTimeSlots = async (complexId) => {
        setLoading(true);
        try {
            const response = await getTimeSlotsByComplexId(complexId);
            setTimeSlots(response.data);
        } catch (error) {
            message.error(error.response?.data?.message || 'Không thể tải danh sách khung giờ');
        } finally {
            setLoading(false);
        }
    };

    // Cập nhật trạng thái khung giờ
    const updateStatus = async (id, status) => {
        try {
            const response = await updateTimeSlotStatus(id, status);
            message.success('Cập nhật trạng thái thành công');
            setTimeSlots(
                timeSlots.map((slot) => (slot.id === id ? response.data : slot))
            );
        } catch (error) {
            message.error(error.response?.data?.message || 'Cập nhật trạng thái thất bại');
        }
    };

    // Mở modal để tạo hoặc chỉnh sửa
    const showModal = (timeSlot = null) => {
        setEditingTimeSlot(timeSlot);
        setIsModalOpen(true);
    };

    // Đóng modal
    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingTimeSlot(null);
    };

    // Xử lý sau khi tạo/cập nhật thành công
    const handleSuccess = () => {
        fetchTimeSlots(selectedComplexId);
        handleCancel();
    };

    useEffect(() => {
        fetchComplexes();
    }, []);

    useEffect(() => {
        if (selectedComplexId) {
            fetchTimeSlots(selectedComplexId);
        }
    }, [selectedComplexId]);

    const columns = [
        {
            title: 'Giờ bắt đầu',
            dataIndex: 'startTime',
            key: 'startTime',
            render: (time) => time.slice(0, 5), // Hiển thị HH:mm
        },
        {
            title: 'Giờ kết thúc',
            dataIndex: 'endTime',
            key: 'endTime',
            render: (time) => time.slice(0, 5), // Hiển thị HH:mm
        },
        {
            title: 'Giá (VNĐ)',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `${price.toLocaleString()} VNĐ`,
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
                    <Option value="active">Hoạt động</Option>
                    <Option value="inactive">Không hoạt động</Option>
                </Select>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Button onClick={() => showModal(record)}>Chỉnh sửa</Button>
            ),
        },
    ];

    return (
        <div>
            <h1>Quản lý khung giờ</h1>
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
            <Button
                type="primary"
                onClick={() => showModal()}
                style={{ marginBottom: 16, marginLeft: 8 }}
                disabled={!selectedComplexId}
            >
                Tạo khung giờ mới
            </Button>
            <Table
                columns={columns}
                dataSource={timeSlots}
                rowKey="id"
                loading={loading}
            />
            <TimeSlotForm
                open={isModalOpen}
                onCancel={handleCancel}
                onSuccess={handleSuccess}
                editingTimeSlot={editingTimeSlot}
                selectedComplexId={selectedComplexId}
            />
        </div>
    );
};

export default TimeSlotList;