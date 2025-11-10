import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message } from 'antd';
import { getAllRoles, createRole, updateRole, deleteRole, getRoleById } from '../../../services/api';

const RoleManagement = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [form] = Form.useForm();

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await getAllRoles();
            console.log('Roles data:', res.data); // Debug danh sách vai trò
            setRoles(res.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
            message.error('Lỗi khi lấy danh sách vai trò');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const showModal = async (roleId = null) => {
        if (roleId) {
            try {
                const res = await getRoleById(roleId);
                console.log('Role by ID:', res.data); // Debug dữ liệu vai trò
                form.setFieldsValue({
                    roleName: res.data.roleName,
                    description: res.data.description,
                });
                setEditingRole(res.data);
            } catch (error) {
                console.error('Error fetching role by ID:', error);
                message.error('Lỗi khi lấy thông tin vai trò');
            }
        } else {
            form.resetFields();
            setEditingRole(null);
        }
        setIsModalVisible(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            if (editingRole) {
                await updateRole(editingRole.roleId, values);
                message.success('Cập nhật vai trò thành công');
            } else {
                await createRole(values);
                message.success('Tạo vai trò thành công');
            }
            setIsModalVisible(false);
            form.resetFields();
            fetchRoles();
        } catch (error) {
            console.error('Error saving role:', error);
            message.error(error.response?.data?.message || 'Lỗi khi lưu vai trò');
        }
    };

    const handleDelete = async (roleId) => {
        try {
            await deleteRole(roleId);
            message.success('Xóa vai trò thành công');
            fetchRoles();
        } catch (error) {
            console.error('Error deleting role:', error);
            message.error(error.response?.data?.message || 'Lỗi khi xóa vai trò');
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'roleId',
            key: 'roleId',
        },
        {
            title: 'Tên vai trò',
            dataIndex: 'roleName',
            key: 'roleName',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            render: (text) => text || '—',
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <>
                    <Button onClick={() => showModal(record.roleId)} style={{ marginRight: 8 }}>
                        Sửa
                    </Button>
                    <Button danger onClick={() => handleDelete(record.roleId)}>
                        Xóa
                    </Button>
                </>
            ),
        },
    ];

    return (
        <div>
            <Button
                type="primary"
                onClick={() => showModal()}
                style={{ marginBottom: 16 }}
            >
                Thêm vai trò
            </Button>
            <Table
                columns={columns}
                dataSource={roles}
                loading={loading}
                rowKey="roleId"
            />
            <Modal
                title={editingRole ? 'Sửa vai trò' : 'Thêm vai trò'}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                }}
                okText="Lưu"
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="roleName"
                        label="Tên vai trò"
                        rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Mô tả"
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default RoleManagement;