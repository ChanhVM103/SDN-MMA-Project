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

// ── USER ─────────────────────────────────────────
export const getMyOrders = async () => apiRequest('/orders/my');

export const createOrder = async (orderData) => apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
});

export const getActiveVouchers = async () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
    const response = await fetch(`${API_BASE_URL}/vouchers/active`);
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) return [];
    return payload.data || [];
};

export const cancelOrder = async (orderId, reason = "") => apiRequest(`/orders/${orderId}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason })
});

export const confirmOrderReceived = async (orderId) => apiRequest(`/orders/${orderId}/confirm-received`, {
    method: 'PATCH',
});

// ── BRAND HANDOVER ───────────────────────────────
export const brandHandoverToShipper = async (orderId) => apiRequest(`/orders/${orderId}/brand-handover`, {
    method: 'PATCH',
});

export const brandConfirmDelivered = async (orderId) => apiRequest(`/orders/${orderId}/brand-confirm-delivered`, {
    method: 'PATCH',
});

// ── SHIPPER ──────────────────────────────────────
export const getAvailableOrders = async () => apiRequest('/orders/shipper/available');

export const getShipperOrders = async () => apiRequest('/orders/shipper/my');

export const shipperAcceptOrder = async (orderId) => apiRequest(`/orders/${orderId}/shipper-accept`, {
    method: 'PATCH',
});

export const shipperPickedUp = async (orderId) => apiRequest(`/orders/${orderId}/shipper-pickup`, {
    method: 'PATCH',
});

export const shipperCompleteDelivery = async (orderId) => apiRequest(`/orders/${orderId}/shipper-delivered`, {
    method: 'PATCH',
});

