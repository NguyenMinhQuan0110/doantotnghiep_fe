import { useEffect, useState } from 'react';
import { Table, Button, message, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getComplexesByOwner, getPitchesByComplexId, updatePitchStatus } from '../../../services/api';
import PitchForm from './PitchForm';

const { Option } = Select;

const PitchList = () => {
    const [complexes, setComplexes] = useState([]);
    const [selectedComplexId, setSelectedComplexId] = useState(null);
    const [pitches, setPitches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPitch, setEditingPitch] = useState(null);
    const navigate = useNavigate();

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

    // Lấy danh sách sân theo cụm sân
    const fetchPitches = async (complexId) => {
        setLoading(true);
        try {
            const response = await getPitchesByComplexId(complexId);
            setPitches(response.data);
        } catch (error) {
            message.error(error.response?.data?.message || 'Không thể tải danh sách sân');
        } finally {
            setLoading(false);
        }
    };

    // Cập nhật trạng thái sân
    const updateStatus = async (id, status) => {
        try {
            const response = await updatePitchStatus(id, status);
            message.success('Cập nhật trạng thái thành công');
            setPitches(pitches.map((p) => (p.id === id ? response.data : p)));
        } catch (error) {
            message.error(error.response?.data?.message || 'Cập nhật trạng thái thất bại');
        }
    };

    // Mở modal để tạo hoặc chỉnh sửa
    const showModal = (pitch = null) => {
        setEditingPitch(pitch);
        setIsModalOpen(true);
    };

    // Đóng modal
    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingPitch(null);
    };

    // Xử lý sau khi tạo/cập nhật thành công
    const handleSuccess = () => {
        fetchPitches(selectedComplexId);
        handleCancel();
    };

    useEffect(() => {
        fetchComplexes();
    }, []);

    useEffect(() => {
        if (selectedComplexId) {
            fetchPitches(selectedComplexId);
        }
    }, [selectedComplexId]);

    const columns = [
        {
            title: 'Tên sân',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Loại sân',
            dataIndex: 'type',
            key: 'type',
        },
        {
            title: 'Giá mỗi giờ',
            dataIndex: 'pricePerHour',
            key: 'pricePerHour',
            render: (price) => `${price.toLocaleString()} VNĐ`,
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
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
            <h1>Quản lý sân</h1>
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
                Tạo sân mới
            </Button>
            <Table
                columns={columns}
                dataSource={pitches}
                rowKey="id"
                loading={loading}
            />
            <PitchForm
                open={isModalOpen}
                onCancel={handleCancel}
                onSuccess={handleSuccess}
                editingPitch={editingPitch}
                selectedComplexId={selectedComplexId}
            />
        </div>
    );
};

export default PitchList;