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

export const getProfileApi = (token) =>
  apiRequest("/auth/profile", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

export const signInApi = ({ email, password }) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const signUpApi = ({ fullName, email, phone, password, confirmPassword }) =>
  apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ fullName, email, phone, password, confirmPassword }),
  });

export const socialLoginApi = ({ provider, accessToken }) =>
  apiRequest(`/auth/${provider}`, {
    method: "POST",
    body: JSON.stringify({ accessToken }),
  });

export const updateAvatarApi = (token, avatarBase64) =>
  apiRequest("/auth/avatar", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ avatar: avatarBase64 }),
  });

export const updateProfileApi = (token, data) =>
  apiRequest("/auth/profile", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

export const changePasswordApi = (token, data) =>
  apiRequest("/auth/change-password", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });