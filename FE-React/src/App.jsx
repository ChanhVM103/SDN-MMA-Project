import { useEffect, useMemo, useState } from "react";

const AUTH_STORAGE_KEY = "@foodiehub_auth_web";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
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

const VALID_PATHS = new Set([
  "/home",
  "/orders",
  "/favorites",
  "/notifications",
  "/profile",
  "/sign-in",
  "/sign-up",
]);

const tabs = [
  { path: "/home", label: "Trang chủ", icon: "home" },
  { path: "/orders", label: "Đơn hàng", icon: "receipt" },
  { path: "/favorites", label: "Đã thích", icon: "heart" },
  { path: "/notifications", label: "Thông báo", icon: "bell" },
  { path: "/profile", label: "Tôi", icon: "user" },
];

const categories = [
  { id: "all", label: "Tất cả" },
  { id: "pizza", label: "Pizza" },
  { id: "burger", label: "Burger" },
  { id: "sushi", label: "Sushi" },
  { id: "drink", label: "Đồ uống" },
  { id: "dessert", label: "Tráng miệng" },
];

const dishes = [
  { id: "1", name: "Wagyu Smash Burger", category: "burger", price: "$18.90", rating: 4.9, eta: "22 phút", tone: "sunset", badge: "Nổi bật" },
  { id: "2", name: "Midnight Marina Pizza", category: "pizza", price: "$21.50", rating: 4.8, eta: "26 phút", tone: "moss", badge: "Bán chạy" },
  { id: "3", name: "Dragon Roll Combo", category: "sushi", price: "$16.40", rating: 4.9, eta: "19 phút", tone: "ocean", badge: "Mới" },
  { id: "4", name: "Sparkling Peach Tea", category: "drink", price: "$6.20", rating: 4.7, eta: "10 phút", tone: "amber", badge: "Nhanh" },
  { id: "5", name: "Volcano Lava Cake", category: "dessert", price: "$9.60", rating: 4.8, eta: "12 phút", tone: "orchid", badge: "Ưu đãi" },
  { id: "6", name: "Truffle Smoke Burger", category: "burger", price: "$17.20", rating: 4.8, eta: "24 phút", tone: "sunset", badge: "Yêu thích" },
];

const promoBlocks = [
  { id: "p1", title: "Miễn phí ship", body: "Áp dụng cho đơn từ $25 trở lên.", tone: "sunset" },
  { id: "p2", title: "Giảm 30% đơn đầu", body: "Nhập mã WELCOME30 khi checkout.", tone: "moss" },
  { id: "p3", title: "Combo đêm khuya", body: "Sau 22:00 tặng thêm món phụ.", tone: "ocean" },
];

const demoOrders = [
  { id: "#OD1042", title: "Wagyu Smash Burger x2", status: "Đang giao", total: "$39.80", time: "12:30" },
  { id: "#OD1031", title: "Dragon Roll Combo", status: "Đã giao", total: "$16.40", time: "Hôm qua" },
];

const demoFavorites = [
  { id: "fv1", title: "Midnight Marina Pizza", note: "Phổ biến tuần này" },
  { id: "fv2", title: "Volcano Lava Cake", note: "Mới nhất từ bếp ngọt" },
  { id: "fv3", title: "Sparkling Peach Tea", note: "Gọi kèm burger rất hợp" },
];

const demoNotifications = [
  { id: "n1", title: "Đơn #OD1042 đang đến gần bạn", note: "Tài xế sẽ đến trong 6 phút." },
  { id: "n2", title: "Voucher mới đã sẵn sàng", note: "Giảm 20% cho combo sushi." },
  { id: "n3", title: "Giờ vàng bắt đầu lúc 20:00", note: "Tất cả burger giảm 15%." },
];

const iconMap = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.75 10.5L12 3.75L20.25 10.5V19.5H14.25V13.5H9.75V19.5H3.75V10.5Z" strokeWidth="1.8" />
    </svg>
  ),
  receipt: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 3.75H16.5V20.25L14.25 18.75L12 20.25L9.75 18.75L7.5 20.25V3.75Z" strokeWidth="1.8" />
      <path d="M9.5 8.25H14.5M9.5 11.75H14.5" strokeWidth="1.8" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 20.25L4.7 13.55C2.37 11.4 2.26 7.75 4.45 5.57C6.64 3.38 10.29 3.5 12.45 5.83L12 6.31L11.55 5.83C9.39 3.5 5.75 3.38 3.56 5.57C1.37 7.75 1.48 11.4 3.81 13.55L11.1 20.25H12Z" strokeWidth="1.8" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.75C9.1 3.75 6.75 6.1 6.75 9V12.4L5.2 15.25H18.8L17.25 12.4V9C17.25 6.1 14.9 3.75 12 3.75Z" strokeWidth="1.8" />
      <path d="M9.75 18.25C10.2 19.2 11.05 19.75 12 19.75C12.95 19.75 13.8 19.2 14.25 18.25" strokeWidth="1.8" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12.25C14.35 12.25 16.25 10.35 16.25 8C16.25 5.65 14.35 3.75 12 3.75C9.65 3.75 7.75 5.65 7.75 8C7.75 10.35 9.65 12.25 12 12.25Z" strokeWidth="1.8" />
      <path d="M4.75 20.25C5.6 17.3 8.32 15.25 12 15.25C15.68 15.25 18.4 17.3 19.25 20.25" strokeWidth="1.8" />
    </svg>
  ),
};

const normalizePath = (path) => {
  if (!path || path === "/") return "/home";
  const cleanPath = path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
  return VALID_PATHS.has(cleanPath) ? cleanPath : "/home";
};

const parseStoredAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { user: null, token: null };
    const parsed = JSON.parse(raw);
    if (!parsed?.user || !parsed?.token) return { user: null, token: null };
    return { user: parsed.user, token: parsed.token };
  } catch {
    return { user: null, token: null };
  }
};

const persistAuth = (user, token) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
};

const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

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
        existing.addEventListener("error", () => reject(new Error("Không tải được Google SDK")), {
          once: true,
        });
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

const requestGoogleAccessToken = async () => {
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
          existing.addEventListener("error", () => reject(new Error("Không tải được Facebook SDK")), {
            once: true,
          });
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

const requestFacebookAccessToken = async () => {
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

const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || "Yêu cầu thất bại");
  }

  return payload.data;
};

const signInApi = ({ email, password }) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

const signUpApi = ({ fullName, email, phone, password, confirmPassword }) =>
  apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ fullName, email, phone, password, confirmPassword }),
  });

const socialLoginApi = ({ provider, accessToken }) =>
  apiRequest(`/auth/${provider}`, {
    method: "POST",
    body: JSON.stringify({ accessToken }),
  });

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
        <SignInScreen
          onSubmit={handleSignIn}
          onGoogleSignIn={handleGoogleAuth}
          onFacebookSignIn={handleFacebookAuth}
          navigate={navigate}
        />
      );
    }

    if (path === "/sign-up") {
      return (
        <SignUpScreen
          onSubmit={handleSignUp}
          onGoogleSignIn={handleGoogleAuth}
          onFacebookSignIn={handleFacebookAuth}
          navigate={navigate}
        />
      );
    }

    if (path === "/orders") {
      return <OrdersScreen user={auth.user} navigate={navigate} />;
    }

    if (path === "/favorites") {
      return <FavoritesScreen user={auth.user} navigate={navigate} />;
    }

    if (path === "/notifications") {
      return <NotificationsScreen user={auth.user} navigate={navigate} />;
    }

    if (path === "/profile") {
      return <ProfileScreen user={auth.user} onLogout={handleLogout} navigate={navigate} />;
    }

    return <HomeScreen user={auth.user} navigate={navigate} />;
  }, [auth.user, path]);

  return (
    <div className={`app-shell ${isAuthScreen ? "auth-mode" : ""}`}>
      <div className="ambient a1" />
      <div className="ambient a2" />
      <div className="ambient-grid" />

      {!isAuthScreen && <TopBar user={auth.user} navigate={navigate} />}

      <main className="view-port">{screen}</main>

      {!isAuthScreen && <TabBar path={path} navigate={navigate} />}
    </div>
  );
}

function TopBar({ user, navigate }) {
  return (
    <header className="topbar">
      <button className="brand" type="button" onClick={() => navigate("/home")}>
        <span className="brand-mark">FH</span>
        <span className="brand-name">FoodieHub Web</span>
      </button>

      <nav className="topbar-nav">
        <button type="button" onClick={() => navigate("/home")}>
          Trang chủ
        </button>
        <button type="button" onClick={() => navigate("/orders")}>
          Đơn hàng
        </button>
        <button type="button" onClick={() => navigate("/favorites")}>
          Đã thích
        </button>
      </nav>

      {user ? (
        <button className="topbar-action user-pill" type="button" onClick={() => navigate("/profile")}>
          <span>{user.fullName?.split(" ")[0] || "Bạn"}</span>
        </button>
      ) : (
        <button className="topbar-action" type="button" onClick={() => navigate("/sign-in")}>
          Đăng nhập
        </button>
      )}
    </header>
  );
}

function TabBar({ path, navigate }) {
  return (
    <nav className="tabbar">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          type="button"
          onClick={() => navigate(tab.path)}
          className={`tab-btn ${path === tab.path ? "active" : ""}`}
        >
          <span className="tab-icon">{iconMap[tab.icon]}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

function HomeScreen({ user, navigate }) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredDishes =
    activeCategory === "all"
      ? dishes
      : dishes.filter((dish) => dish.category === activeCategory);

  return (
    <section className="screen">
      <article className="hero">
        <p className="eyebrow">Nền tảng giao đồ ăn</p>
        <h1>Xin chào {user ? user.fullName : "thực khách"}.</h1>
        <p>
          Bản web React đã được xây theo mẫu FE: gradient hero, card menu, tabbar dưới, auth flow và profile state.
        </p>
        <div className="hero-actions">
          <button className="primary-btn" type="button" onClick={() => navigate("/orders")}>
            Đặt món ngay
          </button>
          <button className="ghost-btn alt" type="button" onClick={() => navigate(user ? "/profile" : "/sign-in")}>
            {user ? "Xem hồ sơ" : "Đăng nhập để đặt nhanh"}
          </button>
        </div>
        <div className="hero-metrics">
          <article>
            <span>4.9</span>
            <p>Đánh giá trung bình</p>
          </article>
          <article>
            <span>18p</span>
            <p>Thời gian giao</p>
          </article>
          <article>
            <span>130+</span>
            <p>Nhà hàng đối tác</p>
          </article>
        </div>
      </article>

      <article className="panel">
        <header className="section-head">
          <h2>Món nổi bật</h2>
          <p>Lọc theo danh mục giống FE home.</p>
        </header>

        <div className="chips">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`chip ${activeCategory === category.id ? "active" : ""}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="dish-grid">
          {filteredDishes.map((dish) => (
            <article key={dish.id} className={`dish-card ${dish.tone}`}>
              <span className="badge">{dish.badge}</span>
              <h3>{dish.name}</h3>
              <div className="dish-meta">
                <span>{dish.rating} sao</span>
                <span>{dish.eta}</span>
              </div>
              <div className="dish-footer">
                <strong>{dish.price}</strong>
                <button type="button">Thêm</button>
              </div>
            </article>
          ))}
        </div>
      </article>

      <article className="panel">
        <header className="section-head">
          <h2>Ưu đãi nhanh</h2>
          <p>Khối ưu đãi theo concept FE.</p>
        </header>
        <div className="promo-grid">
          {promoBlocks.map((promo) => (
            <article key={promo.id} className={`promo-card ${promo.tone}`}>
              <h3>{promo.title}</h3>
              <p>{promo.body}</p>
              <button type="button">Nhận ưu đãi</button>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function OrdersScreen({ user, navigate }) {
  if (!user) {
    return (
      <section className="screen">
        <EmptyStateCard
          title="Đăng nhập để xem đơn hàng"
          description="Trang này giống tab Đơn hàng trong FE và cần tài khoản để đồng bộ."
          actionLabel="Đi đến Đăng nhập"
          onAction={() => navigate("/sign-in")}
        />
      </section>
    );
  }

  return (
    <section className="screen">
      <article className="panel">
        <header className="section-head">
          <h2>Đơn hàng của bạn</h2>
          <p>Theo dõi trạng thái giao hàng theo thời gian thực.</p>
        </header>
        <div className="compact-list">
          {demoOrders.map((order) => (
            <article key={order.id} className="list-card">
              <div>
                <h3>{order.id}</h3>
                <p>{order.title}</p>
              </div>
              <div className="meta-right">
                <span className={`status ${order.status === "Đang giao" ? "live" : ""}`}>{order.status}</span>
                <strong>{order.total}</strong>
                <small>{order.time}</small>
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function FavoritesScreen({ user, navigate }) {
  if (!user) {
    return (
      <section className="screen">
        <EmptyStateCard
          title="Bạn chưa đăng nhập"
          description="Tab Đã thích sẽ lưu món ăn ưa thích khi đăng nhập."
          actionLabel="Đăng nhập ngay"
          onAction={() => navigate("/sign-in")}
        />
      </section>
    );
  }

  return (
    <section className="screen">
      <article className="panel">
        <header className="section-head">
          <h2>Đã thích</h2>
          <p>Danh sách món bạn hay đặt.</p>
        </header>
        <div className="compact-list">
          {demoFavorites.map((item) => (
            <article key={item.id} className="list-card">
              <div>
                <h3>{item.title}</h3>
                <p>{item.note}</p>
              </div>
              <button type="button">Đặt lại</button>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function NotificationsScreen({ user, navigate }) {
  if (!user) {
    return (
      <section className="screen">
        <EmptyStateCard
          title="Thông báo cá nhân"
          description="Vui lòng đăng nhập để nhận thông báo về đơn hàng và ưu đãi."
          actionLabel="Đăng nhập"
          onAction={() => navigate("/sign-in")}
        />
      </section>
    );
  }

  return (
    <section className="screen">
      <article className="panel">
        <header className="section-head">
          <h2>Thông báo</h2>
          <p>Cập nhật tình trạng đơn và khuyến mãi mới.</p>
        </header>
        <div className="compact-list">
          {demoNotifications.map((item) => (
            <article key={item.id} className="list-card">
              <div>
                <h3>{item.title}</h3>
                <p>{item.note}</p>
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function ProfileScreen({ user, onLogout, navigate }) {
  if (!user) {
    return (
      <section className="screen">
        <article className="panel profile-card">
          <h2>Tôi</h2>
          <p>Đăng nhập để quản lý thông tin tài khoản, địa chỉ và lịch sử đặt món.</p>
          <div className="hero-actions">
            <button className="primary-btn" type="button" onClick={() => navigate("/sign-in")}>
              Đăng nhập
            </button>
            <button className="ghost-btn alt" type="button" onClick={() => navigate("/sign-up")}>
              Đăng ký
            </button>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="screen">
      <article className="panel profile-card">
        <h2>Thông tin cá nhân</h2>
        <p>Dữ liệu lấy theo model user của backend FE hiện tại.</p>
        <div className="profile-grid">
          <div>
            <small>Họ tên</small>
            <strong>{user.fullName || "Không có"}</strong>
          </div>
          <div>
            <small>Email</small>
            <strong>{user.email || "Không có"}</strong>
          </div>
          <div>
            <small>Số điện thoại</small>
            <strong>{user.phone || "Chưa cập nhật"}</strong>
          </div>
          <div>
            <small>Nhà cung cấp đăng nhập</small>
            <strong>{user.authProvider || "local"}</strong>
          </div>
          <div>
            <small>Vai trò</small>
            <strong>{user.role || "user"}</strong>
          </div>
          <div>
            <small>Địa chỉ</small>
            <strong>{user.address || "Chưa cập nhật"}</strong>
          </div>
        </div>
        <div className="hero-actions">
          <button className="ghost-btn alt" type="button" onClick={() => navigate("/orders")}>
            Xem đơn hàng
          </button>
          <button className="danger-btn" type="button" onClick={onLogout}>
            Đăng xuất
          </button>
        </div>
      </article>
    </section>
  );
}

function SignInScreen({ onSubmit, onGoogleSignIn, onFacebookSignIn, navigate }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.email.trim() || !form.password.trim()) {
      setMessage("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
    } catch (error) {
      setMessage(error.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setMessage("");
    setGoogleLoading(true);
    try {
      await onGoogleSignIn();
    } catch (error) {
      setMessage(error.message || "Đăng nhập Google thất bại.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookClick = async () => {
    setMessage("");
    setFacebookLoading(true);
    try {
      await onFacebookSignIn();
    } catch (error) {
      setMessage(error.message || "Đăng nhập Facebook thất bại.");
    } finally {
      setFacebookLoading(false);
    }
  };

  return (
    <section className="auth-screen">
      <article className="auth-banner">
        <p>FoodieHub</p>
        <h1>Đăng nhập</h1>
        <span>Chào mừng trở lại với trải nghiệm đặt món nhanh.</span>
      </article>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Đăng nhập tài khoản</h2>
        <p>Nhập thông tin để tiếp tục.</p>

        <label className="field-group">
          Email
          <input
            type="email"
            placeholder="you@email.com"
            value={form.email}
            onChange={(event) => handleChange("email", event.target.value)}
            autoComplete="email"
          />
        </label>

        <label className="field-group">
          Mật khẩu
          <input
            type="password"
            placeholder="Nhập mật khẩu"
            value={form.password}
            onChange={(event) => handleChange("password", event.target.value)}
            autoComplete="current-password"
          />
        </label>

        {message && <p className="error-text">{message}</p>}

        <button className="primary-btn wide" type="submit" disabled={loading}>
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </button>

        <div className="social-row">
          <button
            className="social-btn"
            type="button"
            onClick={handleGoogleClick}
            disabled={googleLoading}
          >
            {googleLoading ? "Đang kết nối..." : "Google"}
          </button>
          <button
            className="social-btn fb"
            type="button"
            onClick={handleFacebookClick}
            disabled={facebookLoading}
          >
            {facebookLoading ? "Đang kết nối..." : "Facebook"}
          </button>
        </div>

        <p className="auth-switch">
          Chưa có tài khoản?{" "}
          <button type="button" onClick={() => navigate("/sign-up")}>
            Đăng ký
          </button>
        </p>
      </form>
    </section>
  );
}

function SignUpScreen({ onSubmit, onGoogleSignIn, onFacebookSignIn, navigate }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
      setMessage("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }

    if (form.password.length < 6) {
      setMessage("Mật khẩu phải từ 6 ký tự trở lên.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage("Xác nhận mật khẩu không khớp.");
      return;
    }

    if (!form.agree) {
      setMessage("Bạn cần đồng ý điều khoản sử dụng.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
    } catch (error) {
      setMessage(error.message || "Đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setMessage("");
    setGoogleLoading(true);
    try {
      await onGoogleSignIn();
    } catch (error) {
      setMessage(error.message || "Đăng ký Google thất bại.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookClick = async () => {
    setMessage("");
    setFacebookLoading(true);
    try {
      await onFacebookSignIn();
    } catch (error) {
      setMessage(error.message || "Đăng ký Facebook thất bại.");
    } finally {
      setFacebookLoading(false);
    }
  };

  return (
    <section className="auth-screen signup">
      <article className="auth-banner green">
        <p>FoodieHub</p>
        <h1>Tạo tài khoản</h1>
        <span>Gia nhập cộng đồng ẩm thực và đặt món nhanh hơn.</span>
      </article>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Đăng ký tài khoản</h2>
        <p>Điền thông tin bên dưới để bắt đầu.</p>

        <label className="field-group">
          Họ và tên
          <input
            type="text"
            placeholder="Nguyễn Văn A"
            value={form.fullName}
            onChange={(event) => handleChange("fullName", event.target.value)}
            autoComplete="name"
          />
        </label>

        <label className="field-group">
          Email
          <input
            type="email"
            placeholder="you@email.com"
            value={form.email}
            onChange={(event) => handleChange("email", event.target.value)}
            autoComplete="email"
          />
        </label>

        <label className="field-group">
          Số điện thoại
          <input
            type="tel"
            placeholder="+84..."
            value={form.phone}
            onChange={(event) => handleChange("phone", event.target.value)}
            autoComplete="tel"
          />
        </label>

        <div className="dual-input">
          <label className="field-group">
            Mật khẩu
            <input
              type="password"
              placeholder="Mật khẩu"
              value={form.password}
              onChange={(event) => handleChange("password", event.target.value)}
              autoComplete="new-password"
            />
          </label>

          <label className="field-group">
            Xác nhận
            <input
              type="password"
              placeholder="Nhập lại"
              value={form.confirmPassword}
              onChange={(event) => handleChange("confirmPassword", event.target.value)}
              autoComplete="new-password"
            />
          </label>
        </div>

        <label className="check-row">
          <input
            type="checkbox"
            checked={form.agree}
            onChange={(event) => handleChange("agree", event.target.checked)}
          />
          <span>Tôi đồng ý điều khoản và chính sách sử dụng.</span>
        </label>

        {message && <p className="error-text">{message}</p>}

        <button className="primary-btn wide" type="submit" disabled={loading}>
          {loading ? "Đang xử lý..." : "Tạo tài khoản"}
        </button>

        <div className="social-row">
          <button
            className="social-btn"
            type="button"
            onClick={handleGoogleClick}
            disabled={googleLoading}
          >
            {googleLoading ? "Đang kết nối..." : "Google"}
          </button>
          <button
            className="social-btn fb"
            type="button"
            onClick={handleFacebookClick}
            disabled={facebookLoading}
          >
            {facebookLoading ? "Đang kết nối..." : "Facebook"}
          </button>
        </div>

        <p className="auth-switch">
          Đã có tài khoản?{" "}
          <button type="button" onClick={() => navigate("/sign-in")}>
            Đăng nhập
          </button>
        </p>
      </form>
    </section>
  );
}

function EmptyStateCard({ title, description, actionLabel, onAction }) {
  return (
    <article className="panel empty-card">
      <h2>{title}</h2>
      <p>{description}</p>
      <button className="primary-btn" type="button" onClick={onAction}>
        {actionLabel}
      </button>
    </article>
  );
}

export default App;
