import { Platform } from "react-native";

// Optional override for all platforms.
// Examples:
// - Android emulator: EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
// - iOS simulator: EXPO_PUBLIC_API_URL=http://localhost:3000/api
// - Real device: EXPO_PUBLIC_API_URL=http://<LAN_IP>:3000/api
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL?.trim();

const getBaseUrl = () => {
    if (ENV_API_URL) {
        return ENV_API_URL.replace(/\/+$/, "");
    }

    if (Platform.OS === "android") {
        // Android emulator (AVD) -> host machine loopback
        return "http://10.0.2.2:3000/api";
    }

    // iOS simulator -> host machine loopback
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

/**
 * Shipper API endpoints
 */
export const shipperAPI = {
    getAvailableOrders: (token: string) =>
        apiRequest("/orders/shipper/available", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        }),
    getMyOrders: (token: string) =>
        apiRequest("/orders/shipper/my", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        }),
    acceptOrder: (token: string, orderId: string) =>
        apiRequest(`/orders/${orderId}/shipper-accept`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
        }),
    pickupOrder: (token: string, orderId: string) =>
        apiRequest(`/orders/${orderId}/shipper-pickup`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
        }),
    completeDelivery: (token: string, orderId: string) =>
        apiRequest(`/orders/${orderId}/shipper-delivered`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
        }),
};
