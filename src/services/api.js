import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getCurrentUser = () => api.get('/auth/me');
export const getProvinces = () => api.get('/provinces');
export const getDistrictsByProvince = (provinceId) => api.get(`/districts/province/${provinceId}`);
export const getAllComplexes = () => api.get('/complexes');
export const getComplexesByOwner = () => api.get('/complexes/owner');
export const searchComplexes = (params) => api.get('/complexes/search', { params });
export const getComplexById = (id) => api.get(`/complexes/${id}`);
export const createComplex = (data) => api.post('/complexes/create', data);
export const updateComplex = (id, data) => api.put(`/complexes/update/${id}`, data);
export const updateComplexStatus = (id, status) => api.put(`/complexes/${id}/status`, { status });
export const getPitchesByComplexId = (complexId) => api.get(`/pitches/complex/${complexId}`);
export const getNearbyComplexes = (latitude, longitude, radiusKm) => {
    return api.get('/complexes/nearby', {
        params: { lat: latitude, lng: longitude, radius: radiusKm }
    });
};
// Thêm vào phần export const (sau updateAvatar)
export const updateComplexAvatar = (complexId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/complexes/avatarCom/${complexId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const createPitch = (data) => api.post('/pitches/create', data);
export const updatePitch = (id, data) => api.put(`/pitches/update/${id}`, data);
export const updatePitchStatus = (id, status) =>
    api.put(`/pitches/${id}/status`, { status });
export const getPitchGroupsByComplexId = (complexId) => api.get(`/pitch-groups/complex/${complexId}`);
export const createPitchGroup = (data) => api.post('/pitch-groups/create', data);
export const updatePitchGroup = (id, data) => api.put(`/pitch-groups/update/${id}`, data);
export const updatePitchGroupStatus = (id, status) => api.put(`/pitch-groups/${id}/status`, { status });
export const getImagesByComplexId = (complexId) => api.get(`/images/complex/${complexId}`);
export const createTimeSlot = (data) => api.post('/timeslots/create', data);
export const updateTimeSlot = (id, data) => api.put(`/timeslots/update/${id}`, data);
export const updateTimeSlotStatus = (id, status) => api.put(`/timeslots/${id}/status`, { status });
export const getTimeSlotsByComplexId = (complexId) => api.get(`/timeslots/complex/${complexId}`);
export const uploadComplexImage = (complexId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/images/upload/complex/${complexId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const deleteComplexImage = (imageId) => api.delete(`/images/delete/${imageId}`);
export const updateAvatar = (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/users/avatar/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
// export const getAvailableTimeSlots = (complexId, targetType, targetId, bookingDate) =>
//     api.get('/bookings/available-timeslots', {
//         params: { complexId, targetType, targetId, bookingDate }
//     });
export const getAvailableTimeSlots = async (complexId, targetType, targetId, bookingDate) => {
    const token = localStorage.getItem('token');
    console.log("Token gửi kèm:", token); // 👈 Dòng này để debug token
    return api.get('/bookings/available-timeslots', {
        params: { complexId, targetType, targetId, bookingDate }
    });
};

export const createBooking = (data) => api.post('/bookings/create', data);
export const getUserBookings = (userId) => api.get(`/bookings/user/${userId}`);
export const cancelBooking = (id) => api.put(`/bookings/cancel/${id}`);
export const updateBookingStatus = (bookingId, status) =>
    api.put(`/bookings/update-status/${bookingId}`, null, { params: { status } });
export const getBookingsByComplex = (complexId) =>
    api.get(`/bookings/complex/${complexId}`);
// Thêm các API cho quản lý người dùng
export const getAllUsers = () => api.get('/users');
export const getUserById = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post('/users/create', data);
export const updateUser = (id, data) => api.put(`/users/update/${id}`, data);
export const assignRolesToUser = (data) => api.post('/user-roles/assign', data);
export const removeRoleFromUser = (userId, roleId) => api.delete(`/user-roles/${userId}/${roleId}`);
export const getRolesByUserId = (userId) => api.get(`/user-roles/${userId}`);
// Thêm API cho quản lý vai trò
export const getAllRoles = () => api.get('/roles');
export const getRoleById = (id) => api.get(`/roles/${id}`);
export const createRole = (data) => api.post('/roles/create', data);
export const updateRole = (id, data) => api.put(`/roles/update/${id}`, data);
export const deleteRole = (id) => api.delete(`/roles/delete/${id}`);

// ==================== PAYMENT & PAYPAL APIS ====================
export const createPayment = (data) => api.post('/payments/create', data);
export const getPaymentById = (id) => api.get(`/payments/${id}`);
export const createPayPalPayment = (paymentId) => api.post(`/paypal/create/${paymentId}`);

// ==================== TIME SLOT API ====================
export const getTimeSlotById = (id) => api.get(`/timeslots/${id}`); // Đảm bảo endpoint này tồn tại
// Thêm endpoint để lấy thông tin giá chi tiết
export const getPitchPriceInfo = (targetType, targetId) =>
    api.get(`/price/${targetType}/${targetId}`);

export const calculatePaymentAmount = (data) =>
    api.post('/payment/calculate', data);

export default api;
