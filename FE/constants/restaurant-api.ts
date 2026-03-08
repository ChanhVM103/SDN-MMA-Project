import { apiRequest } from "./api";

// Lấy tất cả nhà hàng
export const getAllRestaurants = async (params: any = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.search) queryParams.append("search", params.search);
    if (params.type) queryParams.append("type", params.type);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const queryString = queryParams.toString();
    const data = await apiRequest(`/restaurants${queryString ? `?${queryString}` : ""}`);
    return data.data;
};

// Lấy nhà hàng theo tags
export const getRestaurantsByTags = async (tags: string) => {
    const data = await apiRequest(`/restaurants/special/tags/${encodeURIComponent(tags)}`);
    return data.data;
};

// Lấy nhà hàng nổi bật
export const getTopRatedRestaurants = async () => {
    const data = await apiRequest("/restaurants/special/top-rated");
    return data.data;
};

// Lấy nhà hàng flash sale
export const getFlashSaleRestaurants = async () => {
    const data = await apiRequest("/restaurants/special/flash-sale");
    return data.data;
};

// Lấy nhà hàng được đặt nhiều nhất
export const getMostOrderedRestaurants = async () => {
    const data = await apiRequest("/restaurants/special/most-ordered");
    return data.data;
};
