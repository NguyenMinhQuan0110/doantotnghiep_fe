import { useEffect, useState } from 'react';
import { Table, Button, Select, message } from 'antd';
import { getComplexesByOwner, updateComplexStatus } from '../../../services/api';
import ComplexForm from './ComplexForm';
import ImageManager from './ImageManager';

const { Option } = Select;

const ComplexList = () => {
    const [complexes, setComplexes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [editingComplex, setEditingComplex] = useState(null);
    const [selectedComplexId, setSelectedComplexId] = useState(null);

    const fetchComplexes = async () => {
        setLoading(true);
        try {
            const response = await getComplexesByOwner();
            setComplexes(response.data);
        } catch (error) {
            message.error(error.response?.data?.message || 'Không thể tải danh sách cụm sân');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await updateComplexStatus(id, status);
            message.success('Cập nhật trạng thái thành công');
            setComplexes(
                complexes.map((complex) =>
                    complex.id === id ? { ...complex, status } : complex
                )
            );
        } catch (error) {
            message.error(error.response?.data?.message || 'Cập nhật trạng thái thất bại');
        }
    };

    const showModal = (complex = null) => {
        setEditingComplex(complex);
        setIsModalOpen(true);
    };

    const showImageModal = (complexId) => {
        setSelectedComplexId(complexId);
        setIsImageModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingComplex(null);
    };

    const handleImageCancel = () => {
        setIsImageModalOpen(false);
        setSelectedComplexId(null);
    };

    const handleSuccess = () => {
        fetchComplexes();
        handleCancel();
    };

    useEffect(() => {
        fetchComplexes();
    }, []);

    const columns = [
        {
            title: 'Tên cụm sân',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            key: 'address'
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
                    <Option value="closed">Không hoạt động</Option>
                    <Option value="maintenance">Đang bảo chì</Option>
                </Select>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <div>
                    <Button onClick={() => showModal(record)} style={{ marginRight: 8 }}>
                        Chỉnh sửa
                    </Button>
                    <Button onClick={() => showImageModal(record.id)}>
                        Quản lý ảnh
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <h1>Quản lý cụm sân</h1>
            <Button
                type="primary"
                onClick={() => showModal()}
                style={{ marginBottom: 16 }}
            >
                Tạo cụm sân mới
            </Button>
            <Table
                columns={columns}
                dataSource={complexes}
                rowKey="id"
                loading={loading}
            />
            <ComplexForm
                open={isModalOpen}
                onCancel={handleCancel}
                onSuccess={handleSuccess}
                editingComplex={editingComplex}
            />
            <ImageManager
                open={isImageModalOpen}
                onCancel={handleImageCancel}
                complexId={selectedComplexId}
            />
        </div>
    );
};

export default ComplexList;