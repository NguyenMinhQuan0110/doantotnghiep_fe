import { useEffect, useState } from 'react';
import { Modal, Form, TimePicker, InputNumber, Select, message, Button } from 'antd';
import { createTimeSlot, updateTimeSlot } from '../../../services/api';
import moment from 'moment';

const { Option } = Select;

const TimeSlotForm = ({ open, onCancel, onSuccess, editingTimeSlot, selectedComplexId }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editingTimeSlot) {
            form.setFieldsValue({
                startTime: moment(editingTimeSlot.startTime, 'HH:mm:ss'),
                endTime: moment(editingTimeSlot.endTime, 'HH:mm:ss'),
                price: editingTimeSlot.price,
                status: editingTimeSlot.status,
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ status: 'active' });
        }
    }, [editingTimeSlot, form]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const payload = {
                startTime: values.startTime.format('HH:mm:ss'),
                endTime: values.endTime.format('HH:mm:ss'),
                price: values.price,
                complexId: selectedComplexId,
            };
            if (editingTimeSlot) {
                await updateTimeSlot(editingTimeSlot.id, payload);
                message.success('Cập nhật khung giờ thành công');
            } else {
                await createTimeSlot(payload);
                message.success('Tạo khung giờ mới thành công');
            }
            onSuccess();
        } catch (error) {
            message.error(
                error.response?.data?.message ||
                (editingTimeSlot ? 'Cập nhật khung giờ thất bại' : 'Tạo khung giờ thất bại')
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={editingTimeSlot ? 'Chỉnh sửa khung giờ' : 'Tạo khung giờ mới'}
            open={open}
            onCancel={onCancel}
            footer={null}
        >
            <Form form={form} onFinish={onFinish} layout="vertical">
                <Form.Item
                    name="startTime"
                    label="Giờ bắt đầu"
                    rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu' }]}
                >
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                    name="endTime"
                    label="Giờ kết thúc"
                    rules={[{ required: true, message: 'Vui lòng chọn giờ kết thúc' }]}
                >
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                    name="price"
                    label="Giá (VNĐ)"
                    rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
                >
                    <InputNumber min={0} step={10000} style={{ width: '100%' }} />
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
                        {editingTimeSlot ? 'Cập nhật' : 'Tạo mới'}
                    </Button>
                    <Button onClick={onCancel} style={{ marginLeft: 8 }}>
                        Hủy
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default TimeSlotForm;