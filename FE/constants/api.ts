import { Platform } from "react-native";

// For Android emulator, use 10.0.2.2 to access host machine's localhost
// For iOS simulator, use localhost
// For physical device, use your computer's IP address
const getBaseUrl = () => {
    if (Platform.OS === "android") {
        return "http://10.0.2.2:3000/api";
    }
    // iOS simulator and web
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

    const config: RequestInit = {
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        ...options,
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
};
