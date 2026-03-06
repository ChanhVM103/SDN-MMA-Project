import { AuthSessionResult } from "expo-auth-session";

export const extractAccessToken = (response: AuthSessionResult) => {
    if ("authentication" in response && response.authentication?.accessToken) {
        return response.authentication.accessToken;
    }

    if ("params" in response && typeof response.params?.access_token === "string") {
        return response.params.access_token;
    }

    return null;
};

export const getAuthErrorMessage = (
    response: AuthSessionResult | null | undefined,
    fallbackMessage: string
) => {
    if (!response) return fallbackMessage;

    if ("error" in response && typeof response.error?.message === "string") {
        return response.error.message;
    }

    if ("params" in response && typeof response.params?.error_description === "string") {
        return response.params.error_description;
    }

    if ("params" in response && typeof response.params?.error === "string") {
        return response.params.error;
    }

    return fallbackMessage;
};
