const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const apiRequest = async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Yêu cầu thất bại");
    }

    return payload.data;
};

// Lấy tất cả nhà hàng
export const getAllRestaurants = async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const queryString = queryParams.toString();
    return apiRequest(`/restaurants${queryString ? `?${queryString}` : ''}`);
};

// Lấy nhà hàng nổi bật (có thể dùng top-rated)
export const getTopRatedRestaurants = async () => {
    return apiRequest('/restaurants/special/top-rated');
};
