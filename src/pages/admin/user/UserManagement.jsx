import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Upload, message, Avatar, Select, Tag } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { getAllUsers, createUser, updateUser, updateAvatar, getUserById, getRolesByUserId, assignRolesToUser, removeRoleFromUser, getAllRoles } from '../../../services/api';

const { Option } = Select;

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
    const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [roleLoading, setRoleLoading] = useState(false);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [form] = Form.useForm();
    const [roleForm] = Form.useForm();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await getAllUsers();
            console.log('Users data:', res.data); // Debug danh sách users
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            message.error('Lỗi khi lấy danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await getAllRoles();
            console.log('Available roles:', res.data); // Debug danh sách vai trò
            setAvailableRoles(res.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
            message.error('Lỗi khi lấy danh sách vai trò');
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const showModal = async (userId = null) => {
        if (userId) {
            try {
                const res = await getUserById(userId);
                console.log('User by ID:', res.data);
                form.setFieldsValue({
                    fullName: res.data.fullName,
                    email: res.data.email,
                    phone: res.data.phone,
                });
                setEditingUser(res.data);
            } catch (error) {
                console.error('Error fetching user by ID:', error);
                message.error('Lỗi khi lấy thông tin người dùng');
            }
        } else {
            form.resetFields();
            setEditingUser(null);
        }
        setIsModalVisible(true);
    };

    const showAvatarModal = async (userId) => {
        try {
            const res = await getUserById(userId);
            console.log('User for avatar:', res.data);
            setEditingUser(res.data);
            setIsAvatarModalVisible(true);
        } catch (error) {
            console.error('Error fetching user for avatar:', error);
            message.error('Lỗi khi lấy thông tin người dùng');
        }
    };

    const showRoleModal = async (userId) => {
        try {
            const res = await getUserById(userId);
            const rolesRes = await getRolesByUserId(userId);
            console.log('User for roles:', res.data, 'Roles:', rolesRes.data);
            setEditingUser(res.data);
            roleForm.setFieldsValue({
                roleIds: rolesRes.data.map((role) => role.roleId),
            });
            setIsRoleModalVisible(true);
        } catch (error) {
            console.error('Error fetching user or roles:', error);
            message.error('Lỗi khi lấy thông tin người dùng hoặc vai trò');
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            if (editingUser) {
                await updateUser(editingUser.id, values);
                message.success('Cập nhật người dùng thành công');
            } else {
                await createUser(values);
                message.success('Tạo người dùng thành công');
            }
            setIsModalVisible(false);
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            message.error(error.response?.data?.message || 'Lỗi khi lưu thông tin người dùng');
        }
    };

    const handleAvatarUpload = async (file) => {
        if (!editingUser?.id) {
            message.error('Không tìm thấy ID người dùng');
            return false;
        }
        setAvatarLoading(true);
        try {
            const res = await updateAvatar(editingUser.id, file);
            console.log('Avatar update response:', res.data);
            message.success('Cập nhật avatar thành công');
            setIsAvatarModalVisible(false);
            fetchUsers();
        } catch (error) {
            console.error('Error updating avatar:', error.response?.data || error);
            message.error(error.response?.data?.message || 'Lỗi khi cập nhật avatar');
        } finally {
            setAvatarLoading(false);
        }
        return false; // Ngăn Upload tự động gửi
    };

    const handleRoleOk = async () => {
        if (!editingUser?.id) {
            message.error('Không tìm thấy ID người dùng');
            return;
        }
        try {
            setRoleLoading(true);
            const values = await roleForm.validateFields();
            const data = {
                userId: editingUser.id,
                roleIds: values.roleIds || [],
            };
            const res = await assignRolesToUser(data);
            console.log('Assign roles response:', res.data);
            message.success('Phân quyền thành công');
            setIsRoleModalVisible(false);
            roleForm.resetFields();
            fetchUsers();
        } catch (error) {
            console.error('Error assigning roles:', error.response?.data || error);
            message.error(error.response?.data?.message || 'Lỗi khi phân quyền');
        } finally {
            setRoleLoading(false);
        }
    };

    const handleRemoveRole = async (userId, roleId) => {
        try {
            setLoading(true);
            await removeRoleFromUser(userId, roleId);
            message.success('Xóa vai trò thành công');
            fetchUsers();
        } catch (error) {
            console.error('Error removing role:', error.response?.data || error);
            message.error(error.response?.data?.message || 'Lỗi khi xóa vai trò');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Tên',
            dataIndex: 'fullName',
            key: 'fullName',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Avatar',
            dataIndex: 'avatar',
            key: 'avatar',
            render: (avatar) => avatar ? <Avatar src={avatar} /> : <Avatar>U</Avatar>,
        },
        {
            title: 'Vai trò',
            dataIndex: 'roles',
            key: 'roles',
            render: (roles, record) => roles?.map((role, index) => (
                <Tag
                    key={index}
                    closable
                    onClose={() => handleRemoveRole(record.id, availableRoles.find(r => r.roleName === role)?.roleId)}
                >
                    {role}
                </Tag>
            )) || '',
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <>
                    <Button onClick={() => showModal(record.id)} style={{ marginRight: 8 }}>
                        Sửa
                    </Button>
                    <Button onClick={() => showAvatarModal(record.id)} style={{ marginRight: 8 }}>
                        Đổi avatar
                    </Button>
                    <Button onClick={() => showRoleModal(record.id)}>
                        Phân quyền
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
                Thêm người dùng
            </Button>
            <Table
                columns={columns}
                dataSource={users}
                loading={loading}
                rowKey="id"
            />
            <Modal
                title={editingUser ? 'Sửa người dùng' : 'Thêm người dùng'}
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
                        name="fullName"
                        label="Tên đầy đủ"
                        rules={[{ required: true, message: 'Vui lòng nhập tên đầy đủ' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="Số điện thoại"
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="Mật khẩu"
                        rules={[{ required: !editingUser, message: 'Vui lòng nhập mật khẩu' }]}
                    >
                        <Input.Password />
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title="Đổi avatar"
                open={isAvatarModalVisible}
                onCancel={() => setIsAvatarModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsAvatarModalVisible(false)}>
                        Hủy
                    </Button>,
                ]}
                confirmLoading={avatarLoading}
            >
                {editingUser && (
                    <Form layout="vertical">
                        <Form.Item label="Tên người dùng">
                            <Input value={editingUser.fullName} disabled />
                        </Form.Item>
                        <Form.Item label="Email">
                            <Input value={editingUser.email} disabled />
                        </Form.Item>
                        <Form.Item label="Số điện thoại">
                            <Input value={editingUser.phone} disabled />
                        </Form.Item>
                        <Form.Item label="Avatar hiện tại">
                            <Avatar
                                src={editingUser.avatar}
                                size={64}
                                style={{ marginBottom: 12 }}
                            />
                        </Form.Item>
                    </Form>
                )}
                <Upload
                    beforeUpload={handleAvatarUpload}
                    showUploadList={false}
                    accept="image/*"
                >
                    <Button
                        icon={<UploadOutlined />}
                        loading={avatarLoading}
                        type="primary"
                    >
                        {avatarLoading ? 'Đang tải lên...' : 'Chọn ảnh mới'}
                    </Button>
                </Upload>
            </Modal>
            <Modal
                title="Phân quyền người dùng"
                open={isRoleModalVisible}
                onOk={handleRoleOk}
                onCancel={() => {
                    setIsRoleModalVisible(false);
                    roleForm.resetFields();
                }}
                okText="Lưu"
                cancelText="Hủy"
                confirmLoading={roleLoading}
            >
                <Form form={roleForm} layout="vertical">
                    <Form.Item
                        name="roleIds"
                        label="Vai trò"
                        rules={[{ required: true, message: 'Vui lòng chọn ít nhất một vai trò' }]}
                    >
                        <Select mode="multiple" placeholder="Chọn vai trò">
                            {availableRoles.map((role) => (
                                <Option key={role.roleId} value={role.roleId}>
                                    {role.roleName}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement;