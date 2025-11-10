import { useState, useEffect } from 'react';
import {
    Select,
    Button,
    Card,
    Row,
    Col,
    message,
    Empty,
    InputNumber,
    Modal,
    AutoComplete,
    Pagination
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    getProvinces,
    getDistrictsByProvince,
    searchComplexes,
    getAllComplexes,
    getNearbyComplexes
} from '../services/api';
import { searchHomeAddressSuggestions } from "../services/mapApi";

const { Option } = Select;

const Home = () => {
    const navigate = useNavigate();
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [complexes, setComplexes] = useState([]);
    const [filters, setFilters] = useState({
        provinceId: null,
        districtId: null,
        pitchType: null,
    });

    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // 🧭 Dữ liệu tìm kiếm theo khoảng cách
    const [selectedProvince, setSelectedProvince] = useState(null);
    const [addressQuery, setAddressQuery] = useState('');
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [radius, setRadius] = useState(null);

    // 📄 Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 9;

    // 🚀 Lấy danh sách tỉnh
    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const res = await getProvinces();
                setProvinces(res.data);
            } catch {
                message.error('Không thể tải danh sách tỉnh/thành phố');
            }
        };
        fetchProvinces();
    }, []);

    // 🚀 Khôi phục state từ sessionStorage (nếu có)
    useEffect(() => {
        const savedState = sessionStorage.getItem('homeState');
        if (savedState) {
            const {
                filters,
                complexes,
                currentPage,
                districts,
            } = JSON.parse(savedState);

            setFilters(filters || {});
            setComplexes(complexes || []);
            setCurrentPage(currentPage || 1);

            // Nếu có province đã chọn → tải lại danh sách quận
            if (filters?.provinceId) {
                getDistrictsByProvince(filters.provinceId)
                    .then(res => setDistricts(res.data))
                    .catch(() => message.error('Không thể tải danh sách quận/huyện'));
            }

            // Không cần gọi getAllComplexes nữa
            return;
        }

        // Nếu không có state lưu → gọi danh sách ban đầu
        const fetchComplexes = async () => {
            setLoading(true);
            try {
                const res = await getAllComplexes();
                setComplexes(res.data);
            } catch {
                message.error('Không thể tải danh sách sân bóng');
            } finally {
                setLoading(false);
            }
        };
        fetchComplexes();
    }, []);

    // 🚀 Khi chọn tỉnh ngoài form chính
    const handleProvinceChange = async (provinceId) => {
        setFilters({ ...filters, provinceId, districtId: null });
        setDistricts([]);
        if (provinceId) {
            try {
                const res = await getDistrictsByProvince(provinceId);
                setDistricts(res.data);
            } catch {
                message.error('Không thể tải danh sách quận/huyện');
            }
        }
    };

    // 🔍 Tìm theo bộ lọc
    const handleSearch = async () => {
        setLoading(true);
        try {
            const params = {
                provinceId: filters.provinceId || undefined,
                districtId: filters.districtId || undefined,
                pitchType: filters.pitchType || undefined,
            };
            const res = await searchComplexes(params);
            setComplexes(res.data);
            setCurrentPage(1);
            if (res.data.length === 0) message.info('Không tìm thấy sân bóng phù hợp');

            // 💾 Lưu lại state sau tìm kiếm
            saveHomeState(res.data, filters, 1);
        } catch {
            message.error('Không thể tìm kiếm sân bóng');
        } finally {
            setLoading(false);
        }
    };

    // 🌏 Gợi ý địa chỉ theo Nominatim
    const handleAddressSearch = async (value) => {
        setAddressQuery(value);
        if (value.length > 2) {
            const suggestions = await searchHomeAddressSuggestions(value, selectedProvince);
            setAddressSuggestions(
                suggestions.map((item) => ({
                    value: item.display_name,
                    label: item.display_name,
                    lat: item.lat,
                    lon: item.lon,
                }))
            );
        } else {
            setAddressSuggestions([]);
        }
    };

    const handleAddressSelect = (value, option) => {
        setSelectedLocation({
            latitude: parseFloat(option.lat),
            longitude: parseFloat(option.lon),
            address: value,
        });
        setAddressQuery(value);
    };

    // 🔍 Tìm cụm sân gần địa chỉ được chọn
    const handleNearbySearch = async () => {
        if (!selectedLocation || !radius) {
            message.error('Vui lòng nhập địa điểm và bán kính');
            return;
        }
        setLoading(true);
        try {
            const res = await getNearbyComplexes(
                selectedLocation.latitude,
                selectedLocation.longitude,
                radius
            );
            setComplexes(res.data);
            setCurrentPage(1);
            if (res.data.length === 0) message.info('Không tìm thấy sân bóng trong bán kính yêu cầu');

            // reset modal
            setIsModalVisible(false);
            setAddressQuery('');
            setRadius(null);
            setSelectedLocation(null);
            setAddressSuggestions([]);
            setSelectedProvince(null);

            // 💾 Lưu lại state
            saveHomeState(res.data, filters, 1);
        } catch {
            message.error('Không thể tìm kiếm sân bóng theo khoảng cách');
        } finally {
            setLoading(false);
        }
    };

    const showModal = () => setIsModalVisible(true);
    const handleModalCancel = () => {
        setIsModalVisible(false);
        setAddressQuery('');
        setRadius(null);
        setSelectedLocation(null);
        setAddressSuggestions([]);
        setSelectedProvince(null);
    };

    // 📄 Cắt dữ liệu hiển thị theo trang
    const startIndex = (currentPage - 1) * pageSize;
    const currentComplexes = complexes.slice(startIndex, startIndex + pageSize);

    // 💾 Hàm lưu trạng thái Home vào sessionStorage
    const saveHomeState = (complexes, filters, currentPage) => {
        sessionStorage.setItem('homeState', JSON.stringify({
            complexes,
            filters,
            currentPage,
            districts,
        }));
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        saveHomeState(complexes, filters, page);
    };

    // Khi click vào 1 complex
    const handleNavigateDetail = (complexId) => {
        saveHomeState(complexes, filters, currentPage);
        navigate(`/complexes/${complexId}`);
    };

    return (
        <div>
            <h2>Tìm kiếm sân bóng</h2>
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                    <Select
                        placeholder="Chọn tỉnh/thành phố"
                        onChange={handleProvinceChange}
                        value={filters.provinceId}
                        style={{ width: '100%' }}
                        allowClear
                    >
                        {provinces.map((p) => (
                            <Option key={p.provinceId} value={p.provinceId}>
                                {p.provinceName}
                            </Option>
                        ))}
                    </Select>
                </Col>
                <Col span={6}>
                    <Select
                        placeholder="Chọn quận/huyện"
                        value={filters.districtId}
                        onChange={(districtId) => setFilters({ ...filters, districtId })}
                        style={{ width: '100%' }}
                        allowClear
                        disabled={!filters.provinceId}
                    >
                        {districts.map((d) => (
                            <Option key={d.districtId} value={d.districtId}>
                                {d.districtName}
                            </Option>
                        ))}
                    </Select>
                </Col>
                <Col span={6}>
                    <Select
                        placeholder="Chọn loại sân"
                        value={filters.pitchType}
                        onChange={(pitchType) => setFilters({ ...filters, pitchType })}
                        style={{ width: '100%' }}
                        allowClear
                    >
                        <Option value="FIVE">Sân 5 người</Option>
                        <Option value="SEVEN">Sân 7 người</Option>
                        <Option value="ELEVEN">Sân 11 người</Option>
                    </Select>
                </Col>
                <Col span={3}>
                    <Button type="primary" onClick={handleSearch} loading={loading}>
                        Tìm kiếm
                    </Button>
                </Col>
                <Col span={3}>
                    <Button onClick={showModal}>Tìm theo khoảng cách</Button>
                </Col>
            </Row>

            {/* 🔍 Modal tìm kiếm theo khoảng cách */}
            <Modal
                title="Tìm sân bóng theo khoảng cách"
                open={isModalVisible}
                onOk={handleNearbySearch}
                onCancel={handleModalCancel}
                okText="Xác nhận"
                cancelText="Hủy"
            >
                <Row gutter={16}>
                    <Col span={24} style={{ marginBottom: 12 }}>
                        <Select
                            placeholder="Chọn tỉnh/thành phố"
                            value={selectedProvince}
                            onChange={(value) => setSelectedProvince(value)}
                            allowClear
                            style={{ width: '100%' }}
                        >
                            {provinces.map((p) => (
                                <Option key={p.provinceName} value={p.provinceName}>
                                    {p.provinceName}
                                </Option>
                            ))}
                        </Select>
                    </Col>

                    <Col span={24} style={{ marginBottom: 12 }}>
                        <AutoComplete
                            style={{ width: '100%' }}
                            options={addressSuggestions}
                            onSearch={handleAddressSearch}
                            onSelect={handleAddressSelect}
                            value={addressQuery}
                            placeholder="Nhập địa điểm (VD: 123 Nguyễn Huệ, Quận 1)"
                        />
                    </Col>

                    <Col span={24}>
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder="Bán kính (km)"
                            value={radius}
                            onChange={(value) => setRadius(value)}
                            min={0.1}
                            step={0.1}
                        />
                    </Col>
                </Row>
            </Modal>

            {complexes.length === 0 ? (
                <Empty description="Không có sân bóng nào" />
            ) : (
                <>
                    <Row gutter={[16, 16]}>
                        {currentComplexes.map((complex) => (
                            <Col span={8} key={complex.id}>
                                <Card
                                    title={complex.name}
                                    hoverable
                                    onClick={() => handleNavigateDetail(complex.id)}
                                >
                                    <p><strong>Địa chỉ:</strong> {complex.address}</p>
                                    <p><strong>Quận:</strong> {complex.districtName}</p>
                                    <p><strong>Tỉnh:</strong> {complex.provinceName}</p>
                                    <p><strong>Trạng thái:</strong> {complex.status}</p>
                                    {complex.distance && (
                                        <p><strong>Khoảng cách:</strong> {complex.distance.toFixed(2)} km</p>
                                    )}
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* 🔢 Phân trang */}
                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={complexes.length}
                            onChange={handlePageChange}
                            showSizeChanger={false}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default Home;
