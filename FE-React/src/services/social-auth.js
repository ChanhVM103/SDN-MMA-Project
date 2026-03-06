const GOOGLE_WEB_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID ||
  import.meta.env.VITE_EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  "426947498833-ntdcblojnotrpqi91kuu03076samaav3.apps.googleusercontent.com";
const FACEBOOK_APP_ID =
  import.meta.env.VITE_FACEBOOK_APP_ID ||
  import.meta.env.VITE_EXPO_PUBLIC_FACEBOOK_APP_ID ||
  "1689158855839628";
const GOOGLE_OAUTH_SCOPE = "openid email profile";
const GOOGLE_GSI_SRC = "https://accounts.google.com/gsi/client";
const FACEBOOK_SDK_SRC = "https://connect.facebook.net/en_US/sdk.js";

let googleScriptPromise;
let facebookScriptPromise;

const loadGoogleIdentityScript = () => {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve(window.google);
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${GOOGLE_GSI_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(window.google), {
          once: true,
        });
        existing.addEventListener(
          "error",
          () => reject(new Error("Không tải được Google SDK")),
          { once: true }
        );
        return;
      }

      const script = document.createElement("script");
      script.src = GOOGLE_GSI_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google);
      script.onerror = () => reject(new Error("Không tải được Google SDK"));
      document.head.appendChild(script);
    });
  }

  return googleScriptPromise;
};

export const requestGoogleAccessToken = async () => {
  if (!GOOGLE_WEB_CLIENT_ID.includes(".apps.googleusercontent.com")) {
    throw new Error("Google Web Client ID không hợp lệ");
  }

  await loadGoogleIdentityScript();
  if (!window.google?.accounts?.oauth2) {
    throw new Error("Google OAuth SDK chưa sẵn sàng");
  }

  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_WEB_CLIENT_ID,
      scope: GOOGLE_OAUTH_SCOPE,
      callback: (response) => {
        if (response?.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }

        if (!response?.access_token) {
          reject(new Error("Google không trả về access token"));
          return;
        }

        resolve(response.access_token);
      },
    });

    tokenClient.requestAccessToken({ prompt: "select_account" });
  });
};

const loadFacebookSdk = () => {
  if (window.FB?.login) {
    return Promise.resolve(window.FB);
  }

  if (!facebookScriptPromise) {
    facebookScriptPromise = new Promise((resolve, reject) => {
      const initFb = () => {
        if (!window.FB) {
          reject(new Error("Không tải được Facebook SDK"));
          return;
        }

        window.FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: false,
          version: "v23.0",
        });
        resolve(window.FB);
      };

      const existing = document.querySelector(`script[src="${FACEBOOK_SDK_SRC}"]`);
      if (existing) {
        if (window.FB?.login) {
          initFb();
        } else {
          existing.addEventListener("load", initFb, { once: true });
          existing.addEventListener(
            "error",
            () => reject(new Error("Không tải được Facebook SDK")),
            { once: true }
          );
        }
        return;
      }

      const script = document.createElement("script");
      script.src = FACEBOOK_SDK_SRC;
      script.async = true;
      script.defer = true;
      script.onload = initFb;
      script.onerror = () => reject(new Error("Không tải được Facebook SDK"));
      document.head.appendChild(script);
    });
  }

  return facebookScriptPromise;
};

export const requestFacebookAccessToken = async () => {
  if (!FACEBOOK_APP_ID) {
    throw new Error("Facebook App ID chưa được cấu hình");
  }

  const FB = await loadFacebookSdk();

  return new Promise((resolve, reject) => {
    FB.login(
      (response) => {
        if (!response?.authResponse?.accessToken) {
          reject(new Error("Facebook không trả về access token"));
          return;
        }
        resolve(response.authResponse.accessToken);
      },
      {
        scope: "public_profile,email",
        return_scopes: true,
      }
    );
  });
};
