import { useEffect, useState } from 'react';
import { Modal, Upload, Button, message, List, Image, Popconfirm } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { getImagesByComplexId, uploadComplexImage, deleteComplexImage } from '../../../services/api';

const ImageManager = ({ open, onCancel, complexId }) => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState([]);

    // Lấy danh sách ảnh
    const fetchImages = async () => {
        if (!complexId) return;
        setLoading(true);
        try {
            const response = await getImagesByComplexId(complexId);
            setImages(response.data);
        } catch (error) {
            message.error(error.response?.data?.message || 'Không thể tải danh sách ảnh');
        } finally {
            setLoading(false);
        }
    };

    // Xử lý upload ảnh
    const handleUpload = async () => {
        if (!fileList.length) {
            message.error('Vui lòng chọn ít nhất một ảnh để upload');
            return;
        }

        setLoading(true);
        try {
            const file = fileList[0].originFileObj;
            const response = await uploadComplexImage(complexId, file);
            message.success('Upload ảnh thành công');
            setFileList([]);
            setImages([...images, response.data]);
        } catch (error) {
            message.error(error.response?.data?.message || 'Upload ảnh thất bại');
        } finally {
            setLoading(false);
        }
    };

    // Xử lý xóa ảnh
    const handleDelete = async (imageId) => {
        setLoading(true);
        try {
            await deleteComplexImage(imageId);
            message.success('Xóa ảnh thành công');
            setImages(images.filter((image) => image.imageId !== imageId));
        } catch (error) {
            message.error(error.response?.data?.message || 'Xóa ảnh thất bại');
        } finally {
            setLoading(false);
        }
    };

    // Xử lý thay đổi file
    const handleChange = ({ fileList: newFileList }) => {
        setFileList(newFileList.slice(-1)); // Chỉ giữ file cuối cùng
    };

    useEffect(() => {
        if (open && complexId) {
            fetchImages();
        }
    }, [open, complexId]);

    return (
        <Modal
            title="Quản lý ảnh cụm sân"
            open={open}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Đóng
                </Button>,
            ]}
        >
            <Upload
                fileList={fileList}
                onChange={handleChange}
                beforeUpload={() => false} // Ngăn upload tự động
                accept="image/*"
            >
                <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
            <Button
                type="primary"
                onClick={handleUpload}
                loading={loading}
                style={{ marginTop: 16 }}
                disabled={!fileList.length}
            >
                Upload
            </Button>
            <div style={{ marginTop: 24 }}>
                <h3>Danh sách ảnh</h3>
                <List
                    grid={{ gutter: 16, column: 3 }}
                    dataSource={images}
                    loading={loading}
                    renderItem={(item) => (
                        <List.Item
                            actions={[
                                <Popconfirm
                                    title="Bạn có chắc chắn muốn xóa ảnh này?"
                                    onConfirm={() => handleDelete(item.imageId)}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                >
                                    <Button danger>Xóa</Button>
                                </Popconfirm>,
                            ]}
                        >
                            <Image
                                src={item.imageUrl}
                                alt="Complex image"
                                style={{ width: '100%', height: 100, objectFit: 'cover' }}
                            />
                        </List.Item>
                    )}
                />
            </div>
        </Modal>
    );
};

export default ImageManager;