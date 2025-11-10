import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Descriptions, Spin, message } from 'antd';
import { getComplexById } from '../../services/api';

const ComplexDetail = () => {
    const { id } = useParams();
    const [complex, setComplex] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchComplex = async () => {
        setLoading(true);
        try {
            const response = await getComplexById(id);
            setComplex(response.data);
        } catch (error) {
            message.error(error.response?.data?.message || 'Không thể tải thông tin cụm sân');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplex();
    }, [id]);

    if (loading) return <Spin size="large" />;
    if (!complex) return <div>Không tìm thấy cụm sân</div>;

    return (
        <Card title={`Chi tiết cụm sân: ${complex.name}`}>
            <Descriptions bordered>
                <Descriptions.Item label="Tên cụm sân">{complex.name}</Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">{complex.address}</Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">{complex.phone}</Descriptions.Item>
                <Descriptions.Item label="Vĩ độ">{complex.latitude}</Descriptions.Item>
                <Descriptions.Item label="Kinh độ">{complex.longitude}</Descriptions.Item>
                <Descriptions.Item label="Trạng thái">{complex.status}</Descriptions.Item>
                <Descriptions.Item label="Chủ sở hữu">{complex.ownerName}</Descriptions.Item>
                <Descriptions.Item label="Quận/Huyện">{complex.districtName}</Descriptions.Item>
                <Descriptions.Item label="Tỉnh/Thành phố">{complex.provinceName}</Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">{complex.createdAt}</Descriptions.Item>
            </Descriptions>
        </Card>
    );
};

export default ComplexDetail;