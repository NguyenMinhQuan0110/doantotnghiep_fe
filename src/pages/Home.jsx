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
    Pagination,
    Typography,
    Space,
    Input,
    Tag,
    Spin,
    Divider,
    Tooltip,
    Image
} from 'antd';
import {
    SearchOutlined,
    EnvironmentOutlined,
    FilterOutlined,
    StarOutlined,
    ClockCircleOutlined,
    CloseOutlined,
    AimOutlined,
    RadiusSettingOutlined,
    UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
    getProvinces,
    getDistrictsByProvince,
    searchComplexes,
    getAllComplexes,
    getNearbyComplexes
} from '../services/api';
import { searchHomeAddressSuggestions } from "../services/mapApi";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

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
    const [searchMode, setSearchMode] = useState('filter'); // 'filter' hoặc 'nearby'

    // 🧭 Dữ liệu tìm kiếm theo khoảng cách
    const [selectedProvince, setSelectedProvince] = useState(null);
    const [addressQuery, setAddressQuery] = useState('');
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [radius, setRadius] = useState(5);

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
            setSearchMode('filter');

            if (res.data.length === 0) {
                message.info('Không tìm thấy sân bóng phù hợp');
            } else {
                message.success(`Tìm thấy ${res.data.length} sân bóng`);
            }

            // 💾 Lưu lại state sau tìm kiếm
            saveHomeState(res.data, filters, 1);
        } catch {
            message.error('Không thể tìm kiếm sân bóng');
        } finally {
            setLoading(false);
        }
    };

    // 🔄 Reset bộ lọc
    const handleResetFilters = () => {
        setFilters({
            provinceId: null,
            districtId: null,
            pitchType: null,
        });
        setDistricts([]);
    };

    // 🌏 Gợi ý địa chỉ theo Nominatim
    const handleAddressSearch = async (value) => {
        setAddressQuery(value);
        if (value.length > 2) {
            const suggestions = await searchHomeAddressSuggestions(value, selectedProvince);
            setAddressSuggestions(
                suggestions.map((item) => ({
                    value: item.display_name,
                    label: (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                            <span>{item.display_name}</span>
                        </div>
                    ),
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
        console.log('=== START handleNearbySearch ===');
        console.log('selectedLocation:', selectedLocation);
        console.log('radius:', radius);

        if (!selectedLocation || !radius) {
            message.error('Vui lòng nhập địa điểm và bán kính');
            return;
        }

        setLoading(true);
        try {
            console.log('Calling API with params:', {
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                radiusKm: radius
            });

            const res = await getNearbyComplexes(
                selectedLocation.latitude,
                selectedLocation.longitude,
                radius
            );

            console.log('API Response Full:', res);
            console.log('Response Data:', res.data);

            if (res && res.data) {
                setComplexes(Array.isArray(res.data) ? res.data : []);
                setCurrentPage(1);
                setSearchMode('nearby');

                if (res.data.length === 0) {
                    message.info('Không tìm thấy sân bóng trong bán kính yêu cầu');
                } else {
                    message.success(`Tìm thấy ${res.data.length} sân bóng trong bán kính ${radius}km`);
                }

                // Lưu state
                saveHomeState(res.data, filters, 1);

                // Reset modal
                setIsModalVisible(false);
                setAddressQuery('');
                setRadius(5);
                setSelectedLocation(null);
                setAddressSuggestions([]);
                setSelectedProvince(null);
            } else {
                message.warning('Dữ liệu trả về không đúng định dạng');
            }

        } catch (error) {
            console.error('Error details:', {
                message: error.message,
                response: error.response,
                status: error.response?.status,
                data: error.response?.data
            });

            // Hiển thị lỗi chi tiết hơn
            const errorMsg = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Không thể tìm kiếm sân bóng theo khoảng cách';
            message.error(errorMsg);
        } finally {
            setLoading(false);
            console.log('=== END handleNearbySearch ===');
        }
    };

    const showModal = () => {
        setIsModalVisible(true);
        setSearchMode('nearby');
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        setAddressQuery('');
        setRadius(5);
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

    // Hiển thị tag loại sân
    const renderPitchTypeTag = (type) => {
        const config = {
            FIVE: { color: 'blue', text: '5 người' },
            SEVEN: { color: 'green', text: '7 người' },
            ELEVEN: { color: 'red', text: '11 người' }
        };
        const { color, text } = config[type] || { color: 'default', text: type };
        return <Tag color={color}>{text}</Tag>;
    };

    // Hiển thị tag trạng thái
    const renderStatusTag = (status) => {
        const config = {
            ACTIVE: { color: 'success', text: 'Đang hoạt động' },
            INACTIVE: { color: 'default', text: 'Tạm đóng' },
            MAINTENANCE: { color: 'warning', text: 'Bảo trì' }
        };
        const { color, text } = config[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
    };

    // 🖼️ Hàm hiển thị ảnh đại diện - SỬA LỖI Ở ĐÂY
    const renderAvatar = (avatarCom, complexName) => {
        if (avatarCom) {
            return (
                <Image
                    src={avatarCom}
                    alt="Ảnh đại diện"
                    width="100%"
                    height={160}
                    style={{ objectFit: 'cover' }}
                    fallback={
                        <div style={{
                            height: 160,
                            background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: 20,
                            fontWeight: 'bold'
                        }}>
                            {complexName ? complexName.charAt(0).toUpperCase() : <UserOutlined />}
                        </div>
                    }
                />
            );
        }

        // Nếu không có ảnh, hiển thị gradient với chữ cái đầu
        return (
            <div style={{
                height: 160,
                background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 20,
                fontWeight: 'bold'
            }}>
                {complexName ? complexName.charAt(0).toUpperCase() : <UserOutlined />}
            </div>
        );
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ marginBottom: 8 }}>
                    <SearchOutlined style={{ marginRight: 12, color: '#1890ff' }} />
                    Tìm kiếm sân bóng
                </Title>
                <Text type="secondary">
                    Tìm kiếm và đặt sân bóng một cách nhanh chóng và tiện lợi
                </Text>
            </div>

            {/* Search Section */}
            <Card
                title={
                    <Space>
                        <FilterOutlined />
                        <span>Bộ lọc tìm kiếm</span>
                    </Space>
                }
                style={{ marginBottom: 32 }}
                extra={
                    <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={handleResetFilters}
                        disabled={!filters.provinceId && !filters.districtId && !filters.pitchType}
                    >
                        Xóa bộ lọc
                    </Button>
                }
            >
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Select
                            placeholder="Tỉnh/Thành phố"
                            onChange={handleProvinceChange}
                            value={filters.provinceId}
                            style={{ width: '100%' }}
                            allowClear
                            suffixIcon={<EnvironmentOutlined />}
                            size="large"
                        >
                            {provinces.map((p) => (
                                <Option key={p.provinceId} value={p.provinceId}>
                                    {p.provinceName}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Select
                            placeholder="Quận/Huyện"
                            value={filters.districtId}
                            onChange={(districtId) => setFilters({ ...filters, districtId })}
                            style={{ width: '100%' }}
                            allowClear
                            disabled={!filters.provinceId}
                            suffixIcon={<EnvironmentOutlined />}
                            size="large"
                        >
                            {districts.map((d) => (
                                <Option key={d.districtId} value={d.districtId}>
                                    {d.districtName}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Select
                            placeholder="Loại sân"
                            value={filters.pitchType}
                            onChange={(pitchType) => setFilters({ ...filters, pitchType })}
                            style={{ width: '100%' }}
                            allowClear
                            suffixIcon={<StarOutlined />}
                            size="large"
                        >
                            <Option value="FIVE">Sân 5 người</Option>
                            <Option value="SEVEN">Sân 7 người</Option>
                            <Option value="ELEVEN">Sân 11 người</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Space style={{ width: '100%' }}>
                            <Button
                                type="primary"
                                onClick={handleSearch}
                                loading={loading}
                                icon={<SearchOutlined />}
                                size="large"
                                block
                            >
                                Tìm kiếm
                            </Button>
                            <Tooltip title="Tìm theo khoảng cách">
                                <Button
                                    type="default"
                                    onClick={showModal}
                                    icon={<RadiusSettingOutlined />}
                                    size="large"
                                />
                            </Tooltip>
                        </Space>
                    </Col>
                </Row>

                {/* Active filters display */}
                {(filters.provinceId || filters.districtId || filters.pitchType) && (
                    <div style={{ marginTop: 16 }}>
                        <Text type="secondary" style={{ marginRight: 8 }}>Bộ lọc đang áp dụng:</Text>
                        {filters.provinceId && (
                            <Tag closable onClose={() => setFilters({ ...filters, provinceId: null })}>
                                Tỉnh: {provinces.find(p => p.provinceId === filters.provinceId)?.provinceName}
                            </Tag>
                        )}
                        {filters.districtId && (
                            <Tag closable onClose={() => setFilters({ ...filters, districtId: null })}>
                                Quận: {districts.find(d => d.districtId === filters.districtId)?.districtName}
                            </Tag>
                        )}
                        {filters.pitchType && (
                            <Tag closable onClose={() => setFilters({ ...filters, pitchType: null })}>
                                Loại sân: {filters.pitchType === 'FIVE' ? '5 người' : filters.pitchType === 'SEVEN' ? '7 người' : '11 người'}
                            </Tag>
                        )}
                    </div>
                )}
            </Card>

            {/* Search Mode Indicator */}
            {searchMode === 'nearby' && selectedLocation && (
                <Card size="small" style={{ marginBottom: 24, background: '#f6ffed' }}>
                    <Space>
                        <AimOutlined style={{ color: '#52c41a' }} />
                        <Text strong>Đang hiển thị sân bóng trong bán kính {radius}km từ:</Text>
                        <Text>{selectedLocation.address}</Text>
                    </Space>
                </Card>
            )}

            {/* 🔍 Modal tìm kiếm theo khoảng cách */}
            <Modal
                title={
                    <Space>
                        <RadiusSettingOutlined />
                        <span>Tìm sân bóng theo khoảng cách</span>
                    </Space>
                }
                open={isModalVisible}
                onOk={handleNearbySearch}
                onCancel={handleModalCancel}
                okText="Tìm kiếm"
                cancelText="Hủy"
                okButtonProps={{ icon: <SearchOutlined /> }}
                width={500}
            >
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div>
                        <Text strong style={{ marginBottom: 8, display: 'block' }}>
                            <EnvironmentOutlined style={{ marginRight: 8 }} />
                            Chọn tỉnh/thành phố (tùy chọn)
                        </Text>
                        <Select
                            placeholder="Chọn tỉnh/thành phố để tìm kiếm chính xác hơn"
                            value={selectedProvince}
                            onChange={(value) => setSelectedProvince(value)}
                            allowClear
                            style={{ width: '100%' }}
                            size="large"
                        >
                            {provinces.map((p) => (
                                <Option key={p.provinceName} value={p.provinceName}>
                                    {p.provinceName}
                                </Option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <Text strong style={{ marginBottom: 8, display: 'block' }}>
                            <AimOutlined style={{ marginRight: 8 }} />
                            Nhập địa điểm
                        </Text>
                        <AutoComplete
                            style={{ width: '100%' }}
                            options={addressSuggestions}
                            onSearch={handleAddressSearch}
                            onSelect={handleAddressSelect}
                            value={addressQuery}
                            placeholder="Nhập địa điểm (VD: 123 Nguyễn Huệ, Quận 1)"
                            size="large"
                        />
                    </div>

                    <div>
                        <Text strong style={{ marginBottom: 8, display: 'block' }}>
                            <RadiusSettingOutlined style={{ marginRight: 8 }} />
                            Bán kính tìm kiếm
                        </Text>
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder="Bán kính (km)"
                            value={radius}
                            onChange={(value) => setRadius(value)}
                            min={0.1}
                            step={0.5}
                            max={50}
                            size="large"
                            addonAfter="km"
                        />
                        <div style={{ marginTop: 8 }}>
                            <Slider
                                min={0.1}
                                max={20}
                                step={0.5}
                                value={radius}
                                onChange={setRadius}
                                tooltip={{ formatter: (value) => `${value}km` }}
                            />
                        </div>
                    </div>
                </Space>
            </Modal>

            {/* Results Section */}
            <div style={{ marginBottom: 24 }}>
                <Space>
                    <Title level={4} style={{ margin: 0 }}>
                        Danh sách sân bóng
                    </Title>
                    {complexes.length > 0 && (
                        <Tag color="blue" style={{ fontSize: '14px' }}>
                            {complexes.length} kết quả
                        </Tag>
                    )}
                </Space>
            </div>

            {/* Loading State */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <Spin size="large" tip="Đang tải dữ liệu..." />
                </div>
            ) : complexes.length === 0 ? (
                <Empty
                    description="Không tìm thấy sân bóng nào"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ padding: '80px 0' }}
                >
                    <Button type="primary" onClick={handleResetFilters}>
                        Thử tìm kiếm lại
                    </Button>
                </Empty>
            ) : (
                <>
                    <Row gutter={[16, 16]}>
                        {currentComplexes.map((complex) => (
                            <Col xs={24} sm={12} lg={8} key={complex.id}>
                                <Card
                                    hoverable
                                    onClick={() => handleNavigateDetail(complex.id)}
                                    style={{ height: '100%' }}
                                    // SỬA LỖI Ở ĐÂY: truyền đúng tham số
                                    cover={renderAvatar(complex.avatarCom, complex.name)}
                                    actions={[
                                        <Button type="link" onClick={(e) => {
                                            e.stopPropagation();
                                            handleNavigateDetail(complex.id);
                                        }}>
                                            Xem chi tiết
                                        </Button>
                                    ]}
                                >
                                    <Card.Meta
                                        title={
                                            <Space direction="vertical" size={0} style={{ width: '100%' }}>
                                                <Text strong style={{ fontSize: '16px' }}>{complex.name}</Text>
                                                <Space size={[4, 4]} wrap>
                                                    {renderPitchTypeTag(complex.pitchType)}
                                                    {renderStatusTag(complex.status)}
                                                    {complex.distance && (
                                                        <Tag icon={<AimOutlined />} color="purple">
                                                            {complex.distance.toFixed(1)}km
                                                        </Tag>
                                                    )}
                                                </Space>
                                            </Space>
                                        }
                                        description={
                                            <Space direction="vertical" size={2} style={{ width: '100%', marginTop: 8 }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                                    <EnvironmentOutlined style={{ marginRight: 8, color: '#666', flexShrink: 0, marginTop: 3 }} />
                                                    <Text type="secondary" ellipsis={{ tooltip: complex.address }}>
                                                        {complex.address}
                                                    </Text>
                                                </div>
                                                <div>
                                                    <Text type="secondary">
                                                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                                                        {complex.districtName}, {complex.provinceName}
                                                    </Text>
                                                </div>
                                                {complex.ownerName && (
                                                    <div>
                                                        <Text type="secondary">
                                                            <UserOutlined style={{ marginRight: 4 }} />
                                                            Chủ sân: {complex.ownerName}
                                                        </Text>
                                                    </div>
                                                )}
                                            </Space>
                                        }
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* 🔢 Phân trang */}
                    {complexes.length > pageSize && (
                        <div style={{ marginTop: 32, textAlign: 'center' }}>
                            <Pagination
                                current={currentPage}
                                pageSize={pageSize}
                                total={complexes.length}
                                onChange={handlePageChange}
                                showSizeChanger={false}
                                showTotal={(total, range) =>
                                    `Hiển thị ${range[0]}-${range[1]} trong tổng ${total} sân bóng`
                                }
                                size="default"
                            />
                        </div>
                    )}
                </>
            )}

            {/* Import Slider component */}
            {isModalVisible && (
                <style>
                    {`
                        .ant-slider-track {
                            background-color: #1890ff;
                        }
                        .ant-slider-handle {
                            border-color: #1890ff;
                        }
                    `}
                </style>
            )}
        </div>
    );
};

// Thêm Slider component nếu chưa import
const Slider = ({ min, max, step, value, onChange, tooltip }) => {
    return (
        <div style={{ padding: '0 6px' }}>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: '#d9d9d9',
                    outline: 'none',
                    WebkitAppearance: 'none',
                }}
            />
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '4px',
                fontSize: '12px',
                color: '#666'
            }}>
                <span>{min}km</span>
                <span>{value}km</span>
                <span>{max}km</span>
            </div>
        </div>
    );
};

export default Home;