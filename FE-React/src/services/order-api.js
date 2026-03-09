import { parseStoredAuth } from "./auth-storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const apiRequest = async (endpoint, options = {}) => {
    const auth = parseStoredAuth();
    const token = auth?.token;

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Yêu cầu thất bại");
    }

    return payload.data;
};

// Lấy danh sách đơn hàng của tôi
export const getMyOrders = async () => {
    return apiRequest('/orders/my');
};

// Tạo đơn hàng (nếu cần sau này)
export const createOrder = async (orderData) => {
    return apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
    });
};

// Hủy đơn hàng
export const cancelOrder = async (orderId, reason = "") => {
    return apiRequest(`/orders/${orderId}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason })
    });
};
