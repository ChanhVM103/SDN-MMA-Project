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
import AdminDashboardPage from "./pages/AdminDashboardPage";
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

  useEffect(() => {
    const current = normalizePath(window.location.pathname);
    if (current !== window.location.pathname) {
      window.history.replaceState({}, "", current);
    }

    const onPopState = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Route redirection based on role
  useEffect(() => {
    if (!auth?.user) return;

    // Use current path from state to check
    if (auth.user.role === "admin" && path !== "/admin") {
      navigate("/admin");
    } else if (auth.user.role !== "admin" && (path === "/admin" || path === "/sign-in" || path === "/sign-up")) {
      navigate("/home");
    }
  }, [auth, path]);

  const navigate = (to) => {
    const next = normalizePath(to);
    setPath((prevPath) => {
      if (next === prevPath) return prevPath;
      window.history.pushState({}, "", next);
      return next;
    });
  };

  const handleSignIn = async ({ email, password }) => {
    const data = await signInApi({ email, password });
    persistAuth(data.user, data.token);
    setAuth({ user: data.user, token: data.token });
  };

  const handleSignUp = async (payload) => {
    const data = await signUpApi(payload);
    persistAuth(data.user, data.token);
    setAuth({ user: data.user, token: data.token });
  };

  const handleGoogleAuth = async () => {
    const accessToken = await requestGoogleAccessToken();
    const data = await socialLoginApi({ provider: "google", accessToken });
    persistAuth(data.user, data.token);
    setAuth({ user: data.user, token: data.token });
  };

  const handleFacebookAuth = async () => {
    const accessToken = await requestFacebookAccessToken();
    const data = await socialLoginApi({ provider: "facebook", accessToken });
    persistAuth(data.user, data.token);
    setAuth({ user: data.user, token: data.token });
  };

  const handleLogout = () => {
    clearStoredAuth();
    setAuth({ user: null, token: null });
    navigate("/home");
  };

  const isAuthScreen = path === "/sign-in" || path === "/sign-up";
  const isAdminScreen = path === "/admin" && auth?.user?.role === "admin";
  const hideNav = isAuthScreen || isAdminScreen;

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

    if (path === "/admin" && auth?.user?.role === "admin") {
      return <AdminDashboardPage user={auth.user} onLogout={handleLogout} navigate={navigate} />;
    }

    return <HomePage user={auth.user} navigate={navigate} />;
  }, [auth.user, path]);

  return (
    <div className={`app-shell ${hideNav ? "auth-mode" : ""}`}>
      <div className="ambient a1" />
      <div className="ambient a2" />
      <div className="ambient-grid" />

      {!hideNav && <TopBar user={auth.user} navigate={navigate} />}
      <main className="view-port">{screen}</main>
      {!hideNav && <TabBar path={path} navigate={navigate} />}
    </div>
  );
}

export default App;
