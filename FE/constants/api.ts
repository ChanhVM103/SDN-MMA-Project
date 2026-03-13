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
 * Product API endpoints
 */
export const productAPI = {
    getAllProducts: (params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: number }) => {
        let query = `?page=${params?.page || 1}&limit=${params?.limit || 10}`;
        if (params?.search) query += `&search=${params.search}`;
        if (params?.sortBy) query += `&sortBy=${params.sortBy}`;
        if (params?.sortOrder) query += `&sortOrder=${params.sortOrder}`;
        return apiRequest(`/products${query}`, { method: 'GET' });
    },
    getProductsByRestaurant: (restaurantId: string, params?: { limit?: number }) => {
        let query = params?.limit ? `?limit=${params.limit}` : '';
        return apiRequest(`/products/restaurant/${restaurantId}${query}`, { method: 'GET' });
    },

    getProductById: (productId: string) =>
        apiRequest(`/products/${productId}`, { method: 'GET' }),

    createProduct: (token: string, restaurantId: string, data: any) =>
        apiRequest(`/products/restaurant/${restaurantId}/products`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(data),
        }),

    updateProduct: (token: string, restaurantId: string, productId: string, data: any) =>
        apiRequest(`/products/${productId}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(data),
        }),

    deleteProduct: (token: string, restaurantId: string, productId: string) =>
        apiRequest(`/products/${productId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        }),
};

/**
 * Restaurant API endpoints
 */
export const restaurantAPI = {
    getAllRestaurants: (params?: { page?: number; limit?: number; type?: string }) => {
        let query = `?page=${params?.page || 1}&limit=${params?.limit || 20}`;
        if (params?.type) query += `&type=${params.type}`;
        return apiRequest(`/restaurants${query}`, { method: "GET" });
    },

    getRestaurantById: (id: string) =>
        apiRequest(`/restaurants/${id}`, { method: 'GET' }),

    getMyRestaurant: (token: string) =>
        apiRequest('/restaurants/my-restaurant', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        }),

    updateRestaurant: (token: string, id: string, data: any) =>
        apiRequest(`/restaurants/${id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(data),
        }),
};

/**
 * Order API endpoints
 */
export const orderAPI = {
    createOrder: (token: string, data: any) =>
        apiRequest('/orders', {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(data),
        }),

    getMyOrders: (token: string, params?: { status?: string; limit?: number; page?: number }) => {
        let query = `?page=${params?.page || 1}&limit=${params?.limit || 20}`;
        if (params?.status) query += `&status=${params.status}`;
        return apiRequest(`/orders/my${query}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    getRestaurantOrders: (token: string, restaurantId: string, params?: { status?: string; limit?: number; page?: number }) => {
        let query = `?page=${params?.page || 1}&limit=${params?.limit || 20}`;
        if (params?.status) query += `&status=${params.status}`;
        return apiRequest(`/orders/restaurant/${restaurantId}${query}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    getRestaurantOrderStats: (token: string, restaurantId: string) =>
        apiRequest(`/orders/restaurant/${restaurantId}/stats`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        }), confirmOrderReceived: (token: string, orderId: string) =>
            apiRequest(`/orders/${orderId}/confirm-received`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            }), updateRestaurantOrderStatus: (token: string, restaurantId: string, orderId: string, status: string, note?: string) =>
                apiRequest(`/orders/${orderId}/brand-status`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ status, note })
                }),

    cancelRestaurantOrder: (token: string, restaurantId: string, orderId: string, reason: string) =>
        apiRequest(`/orders/${orderId}/brand-status`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: 'cancelled', note: reason })
        })
};

/**
 * User API endpoints (Profile, Favorites, etc.)
 */
export const userAPI = {
    getFavorites: (token: string) =>
        apiRequest('/users/favorites', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        }),

    toggleFavorite: (token: string, restaurantId: string) =>
        apiRequest(`/users/favorites/toggle/${restaurantId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        }),
};

export const promotionAPI = {
    createPromotion: async (token: string, data: any) =>
        apiRequest('/promotions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(data)
        }),
    getPromotions: async (restaurantId: string, isActive?: boolean) =>
        apiRequest(`/promotions/restaurant/${restaurantId}${isActive !== undefined ? `?isActive=${isActive}` : ''}`, {
            method: 'GET'
        }),
    deletePromotion: async (token: string, id: string) =>
        apiRequest(`/promotions/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        }),
    toggleStatus: async (token: string, id: string, isActive: boolean) =>
        apiRequest(`/promotions/${id}/status`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ isActive })
        }),
    updatePromotion: async (token: string, id: string, data: any) =>
        apiRequest(`/promotions/${id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(data)
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
