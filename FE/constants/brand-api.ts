import { apiRequest } from "./api";

// Lấy danh sách public brands
export const getPublicBrands = async () => {
    const data = await apiRequest("/users/brands/public");
    return data.data;
};
