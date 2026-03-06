const readEnv = (key: string) => {
    const value = process.env[key];
    return typeof value === "string" && value.trim() ? value.trim() : "";
};

const isPlaceholder = (value: string) =>
    !value || value.includes("YOUR_GOOGLE_") || value.includes("YOUR_FACEBOOK_");

const fallbackGoogleWebClientId =
    "426947498833-ntdcblojnotrpqi91kuu03076samaav3.apps.googleusercontent.com";
const fallbackFacebookAppId = "1689158855839628";

export const GOOGLE_CONFIG = {
    webClientId:
        readEnv("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID") || fallbackGoogleWebClientId,
    iosClientId: readEnv("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID"),
    androidClientId: readEnv("EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID"),
    scopes: ["openid", "profile", "email"],
};

export const FACEBOOK_CONFIG = {
    appId: readEnv("EXPO_PUBLIC_FACEBOOK_APP_ID") || fallbackFacebookAppId,
};

export const getMissingGoogleEnvVars = () => {
    const missing = [];

    if (isPlaceholder(GOOGLE_CONFIG.webClientId)) {
        missing.push("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID");
    }
    if (isPlaceholder(GOOGLE_CONFIG.iosClientId)) {
        missing.push("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID");
    }
    if (isPlaceholder(GOOGLE_CONFIG.androidClientId)) {
        missing.push("EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID");
    }

    return missing;
};

export const getGoogleAuthSetupMessage = () => {
    const missing = getMissingGoogleEnvVars();
    if (!missing.length) return "";

    return `Missing Google OAuth config: ${missing.join(", ")}`;
};
