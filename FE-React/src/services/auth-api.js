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
