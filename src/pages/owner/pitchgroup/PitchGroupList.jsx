import { useEffect, useState } from 'react';
import { Table, Button, message, Select } from 'antd';
import { getComplexesByOwner, getPitchGroupsByComplexId, updatePitchGroupStatus } from '../../../services/api';
import PitchGroupForm from './PitchGroupForm';

const { Option } = Select;

const PitchGroupList = () => {
    const [complexes, setComplexes] = useState([]);
    const [selectedComplexId, setSelectedComplexId] = useState(null);
    const [pitchGroups, setPitchGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPitchGroup, setEditingPitchGroup] = useState(null);

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

    // Lấy danh sách nhóm sân theo cụm sân
    const fetchPitchGroups = async (complexId) => {
        setLoading(true);
        try {
            const response = await getPitchGroupsByComplexId(complexId);
            setPitchGroups(response.data);
        } catch (error) {
            message.error(error.response?.data?.message || 'Không thể tải danh sách nhóm sân');
        } finally {
            setLoading(false);
        }
    };

    // Cập nhật trạng thái nhóm sân
    const updateStatus = async (id, status) => {
        try {
            const response = await updatePitchGroupStatus(id, status);
            message.success('Cập nhật trạng thái thành công');
            setPitchGroups(
                pitchGroups.map((group) => (group.id === id ? response.data : group))
            );
        } catch (error) {
            message.error(error.response?.data?.message || 'Cập nhật trạng thái thất bại');
        }
    };

    // Mở modal để tạo hoặc chỉnh sửa
    const showModal = (pitchGroup = null) => {
        setEditingPitchGroup(pitchGroup);
        setIsModalOpen(true);
    };

    // Đóng modal
    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingPitchGroup(null);
    };

    // Xử lý sau khi tạo/cập nhật thành công
    const handleSuccess = () => {
        fetchPitchGroups(selectedComplexId);
        handleCancel();
    };

    useEffect(() => {
        fetchComplexes();
    }, []);

    useEffect(() => {
        if (selectedComplexId) {
            fetchPitchGroups(selectedComplexId);
        }
    }, [selectedComplexId]);

    const columns = [
        {
            title: 'Tên nhóm sân',
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
            title: 'Danh sách sân',
            dataIndex: 'pitchNames',
            key: 'pitchNames',
            render: (pitchNames) => pitchNames.join(', '),
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
            <h1>Quản lý nhóm sân</h1>
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
                Tạo nhóm sân mới
            </Button>
            <Table
                columns={columns}
                dataSource={pitchGroups}
                rowKey="id"
                loading={loading}
            />
            <PitchGroupForm
                open={isModalOpen}
                onCancel={handleCancel}
                onSuccess={handleSuccess}
                editingPitchGroup={editingPitchGroup}
                selectedComplexId={selectedComplexId}
            />
        </div>
    );
};

export default PitchGroupList;