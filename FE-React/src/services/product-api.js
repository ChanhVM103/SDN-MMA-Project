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

// Lấy tất cả sản phẩm
export const getAllProducts = async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.category) queryParams.append('category', params.category);

    const queryString = queryParams.toString();
    return apiRequest(`/products${queryString ? `?${queryString}` : ''}`);
};

// Sản phẩm bán chạy
export const getBestSellerProducts = async () => {
    return apiRequest('/products/special/best-seller');
};

// Lấy sản phẩm theo danh mục
export const getProductsByCategory = async (category) => {
    return apiRequest(`/products/category/${encodeURIComponent(category)}`);
};
