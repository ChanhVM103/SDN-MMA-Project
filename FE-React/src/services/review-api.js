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

  // DELETE/UPDATE responses may not have a data field — return payload itself as fallback
  return payload.data !== undefined ? payload.data : payload;
};

/**
 * Gửi nhiều đánh giá cùng lúc cho 1 đơn hàng
 * @param {string} orderId
 * @param {string} restaurantId
 * @param {Array<{ rating, comment, productId?, productName? }>} reviews
 */
export const submitBulkReviews = (orderId, restaurantId, reviews) =>
  apiRequest("/reviews/bulk", {
    method: "POST",
    body: JSON.stringify({ orderId, restaurantId, reviews }),
  });

/**
 * Gửi 1 đánh giá đơn lẻ
 */
export const submitReview = (data) =>
  apiRequest("/reviews", {
    method: "POST",
    body: JSON.stringify(data),
  });

/**
 * Sửa đánh giá
 */
export const updateReview = (reviewId, data) =>
  apiRequest(`/reviews/${reviewId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

/**
 * Xóa đánh giá
 */
export const deleteReview = (reviewId) =>
  apiRequest(`/reviews/${reviewId}`, { method: "DELETE" });

/**
 * Kiểm tra đơn hàng đã được đánh giá chưa
 */
export const checkOrderReviewed = (orderId) =>
  apiRequest(`/reviews/check/${orderId}`);

/**
 * Lấy danh sách đánh giá của nhà hàng
 */
export const getRestaurantReviews = (restaurantId, page = 1, limit = 10) =>
  apiRequest(`/reviews/restaurant/${restaurantId}?page=${page}&limit=${limit}`);

/**
 * Lấy danh sách đánh giá của 1 sản phẩm
 */
export const getProductReviews = (productId, page = 1, limit = 10) =>
  apiRequest(`/reviews/product/${productId}?page=${page}&limit=${limit}`);
