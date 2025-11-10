import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, message, Button } from 'antd';
import { createPitchGroup, updatePitchGroup, getPitchesByComplexId } from '../../../services/api';

const { Option } = Select;

const PitchGroupForm = ({ open, onCancel, onSuccess, editingPitchGroup, selectedComplexId }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [pitches, setPitches] = useState([]);

    // Lấy danh sách sân theo cụm sân
    const fetchPitches = async () => {
        try {
            const response = await getPitchesByComplexId(selectedComplexId);
            setPitches(response.data);
        } catch (error) {
            message.error(error.response?.data?.message || 'Không thể tải danh sách sân');
        }
    };

    useEffect(() => {
        if (selectedComplexId) {
            fetchPitches();
        }
    }, [selectedComplexId]);

    useEffect(() => {
        if (editingPitchGroup) {
            form.setFieldsValue({
                name: editingPitchGroup.name,
                type: editingPitchGroup.type,
                pricePerHour: editingPitchGroup.pricePerHour,
                status: editingPitchGroup.status,
                pitchIds: editingPitchGroup.pitchIds,
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ status: 'active' });
        }
    }, [editingPitchGroup, form]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const payload = {
                ...values,
                complexId: selectedComplexId,
            };
            if (editingPitchGroup) {
                await updatePitchGroup(editingPitchGroup.id, payload);
                message.success('Cập nhật nhóm sân thành công');
            } else {
                await createPitchGroup(payload);
                message.success('Tạo nhóm sân mới thành công');
            }
            onSuccess();
        } catch (error) {
            message.error(
                error.response?.data?.message ||
                (editingPitchGroup ? 'Cập nhật nhóm sân thất bại' : 'Tạo nhóm sân thất bại')
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={editingPitchGroup ? 'Chỉnh sửa nhóm sân' : 'Tạo nhóm sân mới'}
            open={open}
            onCancel={onCancel}
            footer={null}
        >
            <Form form={form} onFinish={onFinish} layout="vertical">
                <Form.Item
                    name="name"
                    label="Tên nhóm sân"
                    rules={[{ required: true, message: 'Vui lòng nhập tên nhóm sân' }]}
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
                    name="pitchIds"
                    label="Danh sách sân"
                    rules={[{ required: true, message: 'Vui lòng chọn ít nhất một sân' }]}
                >
                    <Select mode="multiple" placeholder="Chọn các sân">
                        {pitches.map((pitch) => (
                            <Option key={pitch.id} value={pitch.id}>
                                {pitch.name}
                            </Option>
                        ))}
                    </Select>
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
                        {editingPitchGroup ? 'Cập nhật' : 'Tạo mới'}
                    </Button>
                    <Button onClick={onCancel} style={{ marginLeft: 8 }}>
                        Hủy
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default PitchGroupForm;