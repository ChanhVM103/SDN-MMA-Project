import { Platform } from "react-native";

// ⚠️ Đổi IP này thành IP máy tính của bạn khi test trên điện thoại thật
// Xem IP: ipconfig (Windows) hoặc ifconfig (Mac/Linux)
const LOCAL_IP = "192.168.1.225"; // ← ĐỔI IP NÀY

const getBaseUrl = () => {
    if (Platform.OS === "android") {
        // Android emulator → dùng 10.0.2.2
        // Điện thoại thật → dùng IP máy tính
        return `http://${LOCAL_IP}:3000/api`;
    }
    // iOS simulator
    return "http://localhost:3000/api";
};

export const API_BASE_URL = getBaseUrl();

/**
 * Generic API request helper
 */
export const apiRequest = async (
    endpoint: string,
    options: RequestInit = {}
) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const { headers: optionHeaders, ...restOptions } = options;
    const config: RequestInit = {
        ...restOptions,
        headers: {
            "Content-Type": "application/json",
            ...optionHeaders,
        },
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw {
                status: response.status,
                message: data.message || "Something went wrong",
                data,
            };
        }

        return data;
    } catch (error: any) {
        if (error.status) {
            throw error;
        }
        throw {
            status: 0,
            message: "Network error. Please check your connection.",
        };
    }
};

/**
 * Auth API endpoints
 */
export const authAPI = {
    register: (body: {
        fullName: string;
        email: string;
        phone?: string;
        password: string;
        confirmPassword?: string;
    }) =>
        apiRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify(body),
        }),

    login: (body: { email: string; password: string }) =>
        apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify(body),
        }),

    googleLogin: (accessToken: string) =>
        apiRequest("/auth/google", {
            method: "POST",
            body: JSON.stringify({ accessToken }),
        }),

    facebookLogin: (accessToken: string) =>
        apiRequest("/auth/facebook", {
            method: "POST",
            body: JSON.stringify({ accessToken }),
        }),

    getProfile: (token: string) =>
        apiRequest("/auth/profile", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }),

    updateProfile: (token: string, body: { fullName?: string; phone?: string; address?: string }) =>
        apiRequest("/auth/profile", {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        }),

    changePassword: (token: string, body: { currentPassword: string; newPassword: string }) =>
        apiRequest("/auth/change-password", {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        }),

    forgotPassword: (email: string) =>
        apiRequest("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email }),
        }),

    updateAvatar: (token: string, avatar: string) =>
        apiRequest("/auth/avatar", {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ avatar }),
        }),
};
