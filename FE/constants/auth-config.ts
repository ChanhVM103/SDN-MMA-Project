/**
 * Social Auth Configuration
 *
 * ⚠️ SETUP REQUIRED:
 * Replace placeholder values below with your real credentials.
 *
 * 🔵 GOOGLE:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a project → APIs & Services → Credentials
 * 3. Create OAuth 2.0 Client ID
 *    - For Web: Authorized redirect URI → https://auth.expo.io/@your-username/FE
 *    - For iOS: Bundle ID → your app bundle ID
 *    - For Android: Package name + SHA1 fingerprint
 * 4. Copy the Client IDs below
 *
 * 🔵 FACEBOOK:
 * 1. Go to https://developers.facebook.com/
 * 2. Create App → Consumer type
 * 3. Add Facebook Login product
 * 4. Settings → Basic → Copy App ID
 * 5. In Facebook Login → Settings:
 *    - Valid OAuth Redirect URIs → https://auth.expo.io/@your-username/FE
 */

export const GOOGLE_CONFIG = {
    // Replace with your Google OAuth Client IDs
    webClientId: "426947498833-ntdcblojnotrpqi91kuu03076samaav3.apps.googleusercontent.com",
    iosClientId: "YOUR_GOOGLE_IOS_CLIENT_ID.apps.googleusercontent.com",
    androidClientId: "YOUR_GOOGLE_ANDROID_CLIENT_ID.apps.googleusercontent.com",
};

export const FACEBOOK_CONFIG = {
    // Replace with your Facebook App ID
    appId: "1689158855839628",
};
