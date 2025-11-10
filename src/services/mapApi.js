import axios from "axios";

/**
 * Gợi ý địa chỉ từ Nominatim, giới hạn Việt Nam 🇻🇳
 * và có thể lọc theo tỉnh + quận đã chọn.
 */
export const searchAddressSuggestions = async (query, provinceName, districtName) => {
    if (!query) return [];

    try {
        let searchQuery = query;
        if (districtName) searchQuery += `, ${districtName}`;
        if (provinceName) searchQuery += `, ${provinceName}, Việt Nam`;

        const response = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: {
                q: searchQuery,
                format: "json",
                addressdetails: 1,
                limit: 5,
                countrycodes: "VN",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi tìm kiếm địa chỉ:", error);
        return [];
    }
};

// api.js
/**
 * Gợi ý địa chỉ từ Nominatim cho trang Home, giới hạn trong Việt Nam 🇻🇳
 * @param {string} query - Từ khóa địa chỉ người dùng nhập
 * @returns {Promise<Array>} Danh sách gợi ý địa chỉ
 */
export const searchHomeAddressSuggestions = async (query, provinceName) => {
    if (!query) return [];

    try {
        let searchQuery = `${query}`;
        if (provinceName) searchQuery += `, ${provinceName}, Việt Nam`;
        else searchQuery += `, Việt Nam`;

        const response = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: {
                q: searchQuery,
                format: "json",
                addressdetails: 1,
                limit: 5,
                countrycodes: "VN",
            },
        });

        return response.data;
    } catch (error) {
        console.error("Lỗi khi tìm kiếm địa chỉ:", error);
        return [];
    }
};
