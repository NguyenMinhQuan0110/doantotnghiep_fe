import { useEffect, useState, useMemo } from "react";
import { Modal, Form, Input, Button, message, Select, AutoComplete } from "antd";
import {
    getCurrentUser,
    getProvinces,
    getDistrictsByProvince,
    createComplex,
    updateComplex,
} from "../../../services/api";
import { searchAddressSuggestions } from "../../../services/mapApi";
import debounce from "lodash/debounce";

const { Option } = Select;

const ComplexForm = ({ open, onCancel, onSuccess, editingComplex }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState(null);
    const [addressOptions, setAddressOptions] = useState([]);

    // 🚀 Lấy user hiện tại
    const fetchCurrentUser = async () => {
        try {
            const response = await getCurrentUser();
            setCurrentUser(response.data);
        } catch (error) {
            message.error("Không thể lấy thông tin người dùng");
        }
    };

    // 🚀 Lấy danh sách tỉnh
    const fetchProvinces = async () => {
        try {
            const response = await getProvinces();
            setProvinces(response.data);
        } catch (error) {
            message.error("Không thể tải danh sách tỉnh/thành phố");
        }
    };

    // 🚀 Lấy danh sách quận theo tỉnh
    const fetchDistricts = async (provinceId) => {
        try {
            const response = await getDistrictsByProvince(provinceId);
            setDistricts(response.data);
        } catch (error) {
            message.error("Không thể tải danh sách quận/huyện");
        }
    };

    const handleProvinceChange = (provinceId) => {
        setSelectedProvince(provinceId);
        form.setFieldsValue({ districtId: undefined });
        if (provinceId) {
            fetchDistricts(provinceId);
        } else {
            setDistricts([]);
        }
    };

    // 🧠 Hàm tìm kiếm địa chỉ theo tỉnh & quận
    const fetchAddress = async (query) => {
        if (!query) return;
        try {
            const province = provinces.find(
                (p) => p.provinceId === form.getFieldValue("provinceId")
            );
            const district = districts.find(
                (d) => d.districtId === form.getFieldValue("districtId")
            );

            const results = await searchAddressSuggestions(
                query,
                province?.provinceName,
                district?.districtName
            );

            setAddressOptions(
                results.map((r) => ({
                    value: r.display_name,
                    label: r.display_name,
                    lat: r.lat,
                    lon: r.lon,
                }))
            );
        } catch (err) {
            console.error("Lỗi tìm kiếm địa chỉ:", err);
        }
    };

    // Dùng debounce để giảm số lần gọi API
    const handleAddressSearch = useMemo(
        () => debounce(fetchAddress, 500),
        [provinces, districts]
    );

    // Khi chọn địa chỉ -> lưu lat/lon
    const handleAddressSelect = (value, option) => {
        form.setFieldsValue({
            address: value,
            latitude: option.lat,
            longitude: option.lon,
        });
    };

    // Load dữ liệu khi mở form
    useEffect(() => {
        fetchCurrentUser();
        fetchProvinces();

        if (editingComplex) {
            form.setFieldsValue({
                name: editingComplex.name,
                address: editingComplex.address,
                latitude: editingComplex.latitude,
                longitude: editingComplex.longitude,
                phone: editingComplex.phone,
                provinceId: editingComplex.provinceId,
                districtId: editingComplex.districtId,
            });
            setSelectedProvince(editingComplex.provinceId);
            if (editingComplex.provinceId) {
                fetchDistricts(editingComplex.provinceId);
            }
        } else {
            form.resetFields();
            setSelectedProvince(null);
            setDistricts([]);
        }
    }, [editingComplex, form]);

    // 🧾 Submit form
    const onFinish = async (values) => {
        setLoading(true);
        try {
            const payload = {
                ...values,
                ownerId: currentUser?.id,
            };
            if (editingComplex) {
                await updateComplex(editingComplex.id, payload);
                message.success("Cập nhật cụm sân thành công");
            } else {
                await createComplex(payload);
                message.success("Tạo cụm sân mới thành công");
            }
            onSuccess();
        } catch (error) {
            message.error(
                error.response?.data?.message ||
                    (editingComplex
                        ? "Cập nhật cụm sân thất bại"
                        : "Tạo cụm sân thất bại")
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={editingComplex ? "Chỉnh sửa cụm sân" : "Tạo cụm sân mới"}
            open={open}
            onCancel={onCancel}
            footer={null}
            width={600}
        >
            <Form form={form} onFinish={onFinish} layout="vertical">
                <Form.Item
                    name="name"
                    label="Tên cụm sân"
                    rules={[{ required: true, message: "Vui lòng nhập tên cụm sân" }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="phone"
                    label="Số điện thoại"
                    rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="provinceId"
                    label="Tỉnh/Thành phố"
                    rules={[{ required: true, message: "Vui lòng chọn tỉnh/thành phố" }]}
                >
                    <Select
                        placeholder="Chọn tỉnh/thành phố"
                        onChange={handleProvinceChange}
                        allowClear
                    >
                        {provinces.map((province) => (
                            <Option key={province.provinceId} value={province.provinceId}>
                                {province.provinceName}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="districtId"
                    label="Quận/Huyện"
                    rules={[{ required: true, message: "Vui lòng chọn quận/huyện" }]}
                >
                    <Select
                        placeholder="Chọn quận/huyện"
                        disabled={!selectedProvince}
                        allowClear
                    >
                        {districts.map((district) => (
                            <Option key={district.districtId} value={district.districtId}>
                                {district.districtName}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="address"
                    label="Địa chỉ (có gợi ý tự động)"
                    rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
                >
                    <AutoComplete
                        options={addressOptions}
                        onSearch={handleAddressSearch}
                        onSelect={handleAddressSelect}
                        placeholder="Nhập địa chỉ..."
                        allowClear
                    />
                </Form.Item>

                <Form.Item
                    name="latitude"
                    label="Vĩ độ"
                    rules={[{ required: true, message: "Vui lòng nhập vĩ độ" }]}
                >
                    <Input readOnly />
                </Form.Item>

                <Form.Item
                    name="longitude"
                    label="Kinh độ"
                    rules={[{ required: true, message: "Vui lòng nhập kinh độ" }]}
                >
                    <Input readOnly />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        {editingComplex ? "Cập nhật" : "Tạo mới"}
                    </Button>
                    <Button onClick={onCancel} style={{ marginLeft: 8 }}>
                        Hủy
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ComplexForm;
