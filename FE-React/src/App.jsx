import { useEffect, useMemo, useState } from "react";
import TopBar from "./components/layout/TopBar";
import TabBar from "./components/layout/TabBar";
import FavoritesPage from "./pages/FavoritesPage";
import HomePage from "./pages/HomePage";
import NotificationsPage from "./pages/NotificationsPage";
import OrdersPage from "./pages/OrdersPage";
import ProfilePage from "./pages/ProfilePage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import { signInApi, signUpApi, socialLoginApi } from "./services/auth-api";
import {
  clearStoredAuth,
  parseStoredAuth,
  persistAuth,
} from "./services/auth-storage";
import {
  requestFacebookAccessToken,
  requestGoogleAccessToken,
} from "./services/social-auth";
import { normalizePath } from "./utils/navigation";

function App() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));
  const [auth, setAuth] = useState(() => parseStoredAuth());
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");

  useEffect(() => {
    const current = normalizePath(window.location.pathname);
    if (current !== window.location.pathname) {
      window.history.replaceState({}, "", current);
    }

    const onPopState = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (to) => {
    const next = normalizePath(to);
    if (next === path) return;
    window.history.pushState({}, "", next);
    setPath(next);
  };

  const handleSignIn = async ({ email, password }) => {
    const data = await signInApi({ email, password });
    setAuth({ user: data.user, token: data.token });
    persistAuth(data.user, data.token);
    navigate("/home");
  };

  const handleSignUp = async (payload) => {
    const data = await signUpApi(payload);
    setAuth({ user: data.user, token: data.token });
    persistAuth(data.user, data.token);
    navigate("/home");
  };

  const handleGoogleAuth = async () => {
    const accessToken = await requestGoogleAccessToken();
    const data = await socialLoginApi({ provider: "google", accessToken });
    setAuth({ user: data.user, token: data.token });
    persistAuth(data.user, data.token);
    navigate("/home");
  };

  const handleFacebookAuth = async () => {
    const accessToken = await requestFacebookAccessToken();
    const data = await socialLoginApi({ provider: "facebook", accessToken });
    setAuth({ user: data.user, token: data.token });
    persistAuth(data.user, data.token);
    navigate("/home");
  };

  const handleLogout = () => {
    clearStoredAuth();
    setAuth({ user: null, token: null });
    navigate("/home");
  };

  const isAuthScreen = path === "/sign-in" || path === "/sign-up";

  const screen = useMemo(() => {
    if (path === "/sign-in") {
      return (
        <SignInPage
          onSubmit={handleSignIn}
          onGoogleSignIn={handleGoogleAuth}
          onFacebookSignIn={handleFacebookAuth}
          navigate={navigate}
        />
      );
    }

    if (path === "/sign-up") {
      return (
        <SignUpPage
          onSubmit={handleSignUp}
          onGoogleSignIn={handleGoogleAuth}
          onFacebookSignIn={handleFacebookAuth}
          navigate={navigate}
        />
      );
    }

    if (path === "/orders") {
      return <OrdersPage user={auth.user} navigate={navigate} />;
    }

    if (path === "/favorites") {
      return <FavoritesPage user={auth.user} navigate={navigate} />;
    }

    if (path === "/notifications") {
      return <NotificationsPage user={auth.user} navigate={navigate} />;
    }

    if (path === "/profile") {
      return <ProfilePage user={auth.user} onLogout={handleLogout} navigate={navigate} />;
    }

    return <HomePage user={auth.user} navigate={navigate} globalSearchTerm={globalSearchTerm} />;
  }, [auth.user, path, globalSearchTerm]);

  return (
    <div className={`app-shell ${isAuthScreen ? "auth-mode" : ""}`}>
      <div className="ambient a1" />
      <div className="ambient a2" />
      <div className="ambient-grid" />

      {!isAuthScreen && (
        <TopBar
          user={auth.user}
          navigate={navigate}
          onLogout={handleLogout}
          onSearch={(term) => {
            setGlobalSearchTerm(term);
            navigate("/home");
          }}
        />
      )}
      <main className={isAuthScreen ? "" : "view-port"} style={{ flexGrow: 1 }}>{screen}</main>
      {!isAuthScreen && <TabBar path={path} navigate={navigate} />}
    </div>
  );
}

export default App;
