import { useEffect, useState, useRef } from 'react';
import { Table, Button, Select, message, Upload, Modal, Image } from 'antd';
import { UploadOutlined, CameraOutlined } from '@ant-design/icons';
import { getComplexesByOwner, updateComplexStatus, updateComplexAvatar } from '../../../services/api';
import ComplexForm from './ComplexForm';
import ImageManager from './ImageManager';

const { Option } = Select;

const ComplexList = () => {
    const [complexes, setComplexes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [editingComplex, setEditingComplex] = useState(null);
    const [selectedComplexId, setSelectedComplexId] = useState(null);
    const [selectedComplexAvatar, setSelectedComplexAvatar] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const avatarUrlRef = useRef(null);

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

    const showAvatarModal = (complex) => {
        setSelectedComplexId(complex.id);
        setSelectedComplexAvatar(complex.avatarCom);
        setAvatarFile(null);
        setAvatarPreview(null);
        setIsAvatarModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingComplex(null);
    };

    const handleImageCancel = () => {
        setIsImageModalOpen(false);
        setSelectedComplexId(null);
    };

    const handleAvatarCancel = () => {
        setIsAvatarModalOpen(false);
        setSelectedComplexId(null);
        setSelectedComplexAvatar(null);
        setAvatarFile(null);
        setAvatarPreview(null);

        // Giải phóng URL object nếu có
        if (avatarUrlRef.current) {
            URL.revokeObjectURL(avatarUrlRef.current);
            avatarUrlRef.current = null;
        }
    };

    const handleSuccess = () => {
        fetchComplexes();
        handleCancel();
    };

    // Xử lý chọn file avatar
    const handleAvatarChange = (info) => {
        const { file } = info;

        // Giải phóng URL object cũ nếu có
        if (avatarUrlRef.current) {
            URL.revokeObjectURL(avatarUrlRef.current);
            avatarUrlRef.current = null;
        }

        // Lấy file thực tế
        const rawFile = file.originFileObj || file;

        if (rawFile) {
            // Kiểm tra file hợp lệ
            const isImage = rawFile.type?.startsWith('image/');
            if (!isImage) {
                message.error('Chỉ được upload file ảnh!');
                return;
            }

            const isLt5M = rawFile.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error('Ảnh phải nhỏ hơn 5MB!');
                return;
            }

            setAvatarFile(rawFile);

            // Tạo preview URL
            const previewUrl = URL.createObjectURL(rawFile);
            avatarUrlRef.current = previewUrl;
            setAvatarPreview(previewUrl);
        } else {
            setAvatarFile(null);
            setAvatarPreview(null);
        }
    };

    // Xử lý upload avatar
    const handleAvatarUpload = async () => {
        if (!avatarFile) {
            message.error('Vui lòng chọn ảnh đại diện');
            return;
        }

        setAvatarLoading(true);
        try {
            const response = await updateComplexAvatar(selectedComplexId, avatarFile);
            message.success('Cập nhật ảnh đại diện thành công');

            // Cập nhật lại danh sách complexes
            setComplexes(
                complexes.map((complex) =>
                    complex.id === selectedComplexId
                        ? { ...complex, avatarCom: response.data.avatarCom }
                        : complex
                )
            );

            // Giải phóng URL object preview
            if (avatarUrlRef.current) {
                URL.revokeObjectURL(avatarUrlRef.current);
                avatarUrlRef.current = null;
            }

            // Reset state
            setAvatarFile(null);
            setAvatarPreview(null);

            // Đóng modal sau 1 giây
            setTimeout(() => {
                handleAvatarCancel();
            }, 1000);

        } catch (error) {
            console.error('Upload error:', error);
            message.error(error.response?.data?.message || 'Cập nhật ảnh đại diện thất bại');
        } finally {
            setAvatarLoading(false);
        }
    };

    // Trước upload - chỉ kiểm tra
    const beforeAvatarUpload = (file) => {
        const isImage = file.type?.startsWith('image/');
        if (!isImage) {
            message.error('Chỉ được upload file ảnh!');
            return false;
        }

        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('Ảnh phải nhỏ hơn 5MB!');
            return false;
        }

        return false; // Trả về false để không tự động upload
    };

    // Cleanup URL objects khi component unmount
    useEffect(() => {
        return () => {
            if (avatarUrlRef.current) {
                URL.revokeObjectURL(avatarUrlRef.current);
            }
        };
    }, []);

    useEffect(() => {
        fetchComplexes();
    }, []);

    const columns = [
        {
            title: 'Ảnh đại diện',
            dataIndex: 'avatarCom',
            key: 'avatarCom',
            width: 100,
            render: (avatar, record) => (
                <div style={{ textAlign: 'center' }}>
                    {avatar ? (
                        <Image
                            src={avatar}
                            alt="Avatar"
                            width={60}
                            height={60}
                            style={{
                                objectFit: 'cover',
                                borderRadius: '4px',
                                border: '1px solid #f0f0f0'
                            }}
                            preview={false}
                        />
                    ) : (
                        <div style={{
                            width: 60,
                            height: 60,
                            backgroundColor: '#fafafa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            border: '1px dashed #d9d9d9'
                        }}>
                            <CameraOutlined style={{ fontSize: '24px', color: '#999' }} />
                        </div>
                    )}
                    <Button
                        type="link"
                        size="small"
                        onClick={() => showAvatarModal(record)}
                        style={{
                            fontSize: '12px',
                            padding: '4px 0',
                            height: 'auto'
                        }}
                    >
                        Đổi ảnh
                    </Button>
                </div>
            ),
        },
        {
            title: 'Tên cụm sân',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            key: 'address',
            width: 200,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status, record) => (
                <Select
                    value={status}
                    onChange={(value) => updateStatus(record.id, value)}
                    style={{ width: 140 }}
                    size="middle"
                >
                    <Option value="active">Hoạt động</Option>
                    <Option value="closed">Không hoạt động</Option>
                    <Option value="maintenance">Đang bảo trì</Option>
                </Select>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 200,
            render: (_, record) => (
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        onClick={() => showModal(record)}
                        style={{ flex: 1 }}
                        size="middle"
                    >
                        Chỉnh sửa
                    </Button>
                    <Button
                        onClick={() => showImageModal(record.id)}
                        style={{ flex: 1 }}
                        size="middle"
                    >
                        Quản lý ảnh
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24
            }}>
                <h1 style={{ margin: 0 }}>Quản lý cụm sân</h1>
                <Button
                    type="primary"
                    onClick={() => showModal()}
                    size="large"
                >
                    Tạo cụm sân mới
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={complexes}
                rowKey="id"
                loading={loading}
                bordered
                size="middle"
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `Tổng ${total} cụm sân`
                }}
                scroll={{ x: 800 }}
            />

            {/* Modal Form */}
            <ComplexForm
                open={isModalOpen}
                onCancel={handleCancel}
                onSuccess={handleSuccess}
                editingComplex={editingComplex}
            />

            {/* Modal Quản lý ảnh */}
            <ImageManager
                open={isImageModalOpen}
                onCancel={handleImageCancel}
                complexId={selectedComplexId}
            />

            {/* Modal Đổi ảnh đại diện */}
            <Modal
                title="Đổi ảnh đại diện cụm sân"
                open={isAvatarModalOpen}
                onCancel={handleAvatarCancel}
                onOk={handleAvatarUpload}
                confirmLoading={avatarLoading}
                width={500}
                footer={[
                    <Button key="cancel" onClick={handleAvatarCancel}>
                        Hủy
                    </Button>,
                    <Button
                        key="upload"
                        type="primary"
                        loading={avatarLoading}
                        onClick={handleAvatarUpload}
                        disabled={!avatarFile}
                    >
                        Lưu ảnh
                    </Button>,
                ]}
            >
                <div style={{ marginBottom: 24 }}>
                    {selectedComplexAvatar && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{
                                fontSize: 14,
                                fontWeight: 500,
                                marginBottom: 8,
                                color: '#666'
                            }}>
                                Ảnh hiện tại:
                            </div>
                            <Image
                                src={selectedComplexAvatar}
                                alt="Avatar hiện tại"
                                width={120}
                                height={120}
                                style={{
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                    border: '1px solid #f0f0f0'
                                }}
                                preview={false}
                            />
                        </div>
                    )}

                    <div style={{
                        fontSize: 14,
                        fontWeight: 500,
                        marginBottom: 8,
                        color: '#666'
                    }}>
                        Chọn ảnh mới:
                    </div>

                    <Upload
                        name="avatar"
                        listType="picture-card"
                        showUploadList={false}
                        beforeUpload={beforeAvatarUpload}
                        onChange={handleAvatarChange}
                        accept="image/*"
                        maxCount={1}
                    >
                        {avatarPreview ? (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                position: 'relative'
                            }}>
                                <img
                                    src={avatarPreview}
                                    alt="Preview"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: 4
                                    }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    background: 'rgba(0,0,0,0.5)',
                                    color: 'white',
                                    padding: '4px',
                                    fontSize: '12px',
                                    textAlign: 'center'
                                }}>
                                    Nhấn để chọn lại
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%'
                            }}>
                                <UploadOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                                <div style={{ fontSize: 14 }}>Chọn ảnh</div>
                            </div>
                        )}
                    </Upload>

                    <div style={{
                        marginTop: 16,
                        padding: 12,
                        backgroundColor: '#fafafa',
                        borderRadius: 4,
                        fontSize: 12,
                        color: '#666'
                    }}>
                        <div style={{ marginBottom: 4 }}>
                            <strong>Lưu ý:</strong>
                        </div>
                        <div>• Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)</div>
                        <div>• Kích thước tối đa: 5MB</div>
                        <div>• Ảnh sẽ được cắt tỉ để hiển thị vuông vức</div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ComplexList;