import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, message, Button } from 'antd';
import { createPitch, updatePitch } from '../../../services/api';

const { Option } = Select;
const { TextArea } = Input;

const PitchForm = ({ open, onCancel, onSuccess, editingPitch, selectedComplexId }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editingPitch) {
            form.setFieldsValue({
                name: editingPitch.name,
                type: editingPitch.type,
                pricePerHour: editingPitch.pricePerHour,
                description: editingPitch.description,
                status: editingPitch.status,
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ status: 'active' });
        }
    }, [editingPitch, form]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const payload = {
                ...values,
                complexId: selectedComplexId,
            };
            if (editingPitch) {
                await updatePitch(editingPitch.id, payload);
                message.success('Cập nhật sân thành công');
            } else {
                await createPitch(payload);
                message.success('Tạo sân mới thành công');
            }
            onSuccess();
        } catch (error) {
            message.error(
                error.response?.data?.message ||
                (editingPitch ? 'Cập nhật sân thất bại' : 'Tạo sân thất bại')
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={editingPitch ? 'Chỉnh sửa sân' : 'Tạo sân mới'}
            open={open}
            onCancel={onCancel}
            footer={null}
        >
            <Form form={form} onFinish={onFinish} layout="vertical">
                <Form.Item
                    name="name"
                    label="Tên sân"
                    rules={[{ required: true, message: 'Vui lòng nhập tên sân' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="type"
                    label="Loại sân"
                    rules={[{ required: true, message: 'Vui lòng chọn loại sân' }]}
                >
                    <Select placeholder="Chọn loại sân">
                        <Option value="FIVE">5 người</Option>
                        <Option value="SEVEN">7 người</Option>
                        <Option value="ELEVENT">11 người</Option>
                    </Select>
                </Form.Item>
                <Form.Item
                    name="pricePerHour"
                    label="Giá mỗi giờ (VNĐ)"
                    rules={[{ required: true, message: 'Vui lòng nhập giá mỗi giờ' }]}
                >
                    <InputNumber min={0} step={10000} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                    name="description"
                    label="Mô tả"
                >
                    <TextArea rows={4} />
                </Form.Item>
                <Form.Item
                    name="status"
                    label="Trạng thái"
                    rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                >
                    <Select placeholder="Chọn trạng thái">
                        <Option value="active">Hoạt động</Option>
                        <Option value="inactive">Không hoạt động</Option>
                    </Select>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        {editingPitch ? 'Cập nhật' : 'Tạo mới'}
                    </Button>
                    <Button onClick={onCancel} style={{ marginLeft: 8 }}>
                        Hủy
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default PitchForm;