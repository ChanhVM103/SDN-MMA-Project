import { parseStoredAuth } from "./auth-storage";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const authFetch = async (endpoint, options = {}) => {
  const { token } = parseStoredAuth();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) throw new Error(data?.message || "Yêu cầu thất bại");
  return data;
};

export const getWalletBalance = () =>
  authFetch("/wallet/balance").then((d) => d.data);

export const getWalletTransactions = (page = 1, limit = 15) =>
  authFetch(`/wallet/transactions?page=${page}&limit=${limit}`);

// Shipper nạp tiền — trả về { url } để redirect sang VNPay
export const createTopupVnpayUrl = (amount) =>
  authFetch("/wallet/topup-vnpay", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });

// Xác minh kết quả sau khi VNPay redirect về (không cần auth)
export const verifyTopupResult = (queryString) =>
  fetch(`${API_BASE}/wallet/topup-vnpay-result?${queryString}`).then((r) => r.json());
