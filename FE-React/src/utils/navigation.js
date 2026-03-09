import { VALID_PATHS } from "../constants/app-data";

export const normalizePath = (path) => {
  if (!path || path === "/") return "/home";

  const cleanPath = path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;

  // Allow dynamic routes
  if (cleanPath.startsWith("/restaurant/")) return cleanPath;

  return VALID_PATHS.has(cleanPath) ? cleanPath : "/home";
};
