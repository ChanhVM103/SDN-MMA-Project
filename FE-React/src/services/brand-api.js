import { parseStoredAuth } from "./auth-storage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const brandApiRequest = async (endpoint, options = {}) => {
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
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || "Yêu cầu thất bại");
  }

  return payload.data;
};

// Get my restaurant (for brand user)
export const getMyRestaurant = () =>
  brandApiRequest("/restaurants/my-restaurant", {
    method: "GET",
  });

// Get products of a restaurant
export const getRestaurantProducts = (restaurantId) =>
  brandApiRequest(`/products/restaurant/${restaurantId}`);

// Create product for restaurant
export const createProductForRestaurant = (restaurantId, productData) =>
  brandApiRequest(`/products/restaurant/${restaurantId}/products`, {
    method: "POST",
    body: JSON.stringify(productData),
  });

// Update product for restaurant
export const updateProductForRestaurant = (
  restaurantId,
  productId,
  productData,
) =>
  brandApiRequest(
    `/products/restaurant/${restaurantId}/products/${productId}`,
    {
      method: "PUT",
      body: JSON.stringify(productData),
    },
  );

// Delete product for restaurant
export const deleteProductForRestaurant = (restaurantId, productId) =>
  brandApiRequest(
    `/products/restaurant/${restaurantId}/products/${productId}`,
    {
      method: "DELETE",
    },
  );

// Update restaurant info
export const updateMyRestaurant = (restaurantId, restaurantData) =>
  brandApiRequest(`/restaurants/${restaurantId}`, {
    method: "PUT",
    body: JSON.stringify(restaurantData),
  });

// Lấy danh sách đơn hàng của nhà hàng
export const getRestaurantOrders = (restaurantId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return brandApiRequest(`/orders/restaurant/${restaurantId}${query ? `?${query}` : ""}`);
};

// Brand cập nhật trạng thái đơn hàng
export const updateOrderStatusByBrand = (orderId, status, note = "") =>
  brandApiRequest(`/orders/${orderId}/brand-status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });
