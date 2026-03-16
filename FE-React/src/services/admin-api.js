import { parseStoredAuth } from "./auth-storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const adminApiRequest = async (endpoint, options = {}) => {
  const { token } = parseStoredAuth();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);
  console.log("adminApiRequest Endpoint:", endpoint, "Response Status:", response.status, "Payload:", payload);
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || "Yêu cầu thất bại");
  }

  return payload.data;
};

export const getAllUsersApi = () =>
  adminApiRequest("/users", {
    method: "GET",
  });

export const adminCreateUserApi = (userData) =>
  adminApiRequest("/users", {
    method: "POST",
    body: JSON.stringify(userData),
  });

export const updateUserApi = (userId, updateData) =>
  adminApiRequest(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(updateData),
  });

export const deleteUserApi = (userId) =>
  adminApiRequest(`/users/${userId}`, {
    method: "DELETE",
  });

export const adminCreateRestaurantApi = (restaurantData) =>
  adminApiRequest("/restaurants/admin-create", {
    method: "POST",
    body: JSON.stringify(restaurantData),
  });

// --- RESTAURANT MANAGEMENT ---

export const getAllRestaurantsApi = (page = 1, limit = 50, search = "") =>
  adminApiRequest(`/restaurants?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);

export const updateRestaurantApi = (id, restaurantData) =>
  adminApiRequest(`/restaurants/${id}`, {
    method: "PUT",
    body: JSON.stringify(restaurantData),
  });

export const deleteRestaurantApi = (id) =>
  adminApiRequest(`/restaurants/${id}`, {
    method: "DELETE",
  });

// --- STATS / REVENUE ---

export const getOrderStatsApi = () =>
  adminApiRequest("/orders/stats", { method: "GET" });

export const getUserStatsApi = () =>
  adminApiRequest("/users/stats", { method: "GET" });

export const getRestaurantStatsApi = (restaurantId) =>
  adminApiRequest(`/orders/restaurant/${restaurantId}/stats`, { method: "GET" });

// --- VOUCHER MANAGEMENT ---

export const getAllVouchersApi = () =>
  adminApiRequest("/vouchers", { method: "GET" });

export const createVoucherApi = (voucherData) =>
  adminApiRequest("/vouchers", {
    method: "POST",
    body: JSON.stringify(voucherData),
  });

export const updateVoucherApi = (id, voucherData) =>
  adminApiRequest(`/vouchers/${id}`, {
    method: "PUT",
    body: JSON.stringify(voucherData),
  });

export const deleteVoucherApi = (id) =>
  adminApiRequest(`/vouchers/${id}`, { method: "DELETE" });

export const toggleVoucherApi = (id) =>
  adminApiRequest(`/vouchers/${id}/toggle`, { method: "PATCH" });

export const getAllOrdersApi = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return adminApiRequest(`/orders${query ? `?${query}` : ""}`);
};
