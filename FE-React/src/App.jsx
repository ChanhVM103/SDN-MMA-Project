import { useEffect, useMemo, useState } from "react";
import TopBar from "./components/layout/TopBar";
import TabBar from "./components/layout/TabBar";
import Footer from "./components/layout/Footer";
import FavoritesPage from "./pages/FavoritesPage";
import HomePage from "./pages/HomePage";
import NotificationsPage from "./pages/NotificationsPage";
import OrdersPage from "./pages/OrdersPage";
import ProfilePage from "./pages/ProfilePage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import BrandDashboardPage from "./pages/BrandDashboardPage";
import RestaurantDetailPage from "./pages/RestaurantDetailPage";
import { signInApi, signUpApi, socialLoginApi } from "./services/auth-api";
import { clearStoredAuth, parseStoredAuth, persistAuth } from "./services/auth-storage";
import { requestFacebookAccessToken, requestGoogleAccessToken } from "./services/social-auth";
import { normalizePath } from "./utils/navigation";
import { createOrder } from "./services/order-api";

// ─── Cart helpers ──────────────────────────────────
const EMPTY_CART = { restaurantId: null, restaurantName: null, deliveryAddress: "", items: [] };

function App() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));
  const [auth, setAuth] = useState(() => parseStoredAuth());
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [cart, setCart] = useState(EMPTY_CART);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderMsg, setOrderMsg] = useState(null); // toast

  useEffect(() => {
    const current = normalizePath(window.location.pathname);
    if (current !== window.location.pathname) window.history.replaceState({}, "", current);
    const onPopState = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!auth?.user) return;
    if (auth.user.role === "admin" && path !== "/admin") navigate("/admin");
    else if (auth.user.role === "brand" && (path === "/sign-in" || path === "/sign-up")) navigate("/brand-dashboard");
    else if (auth.user.role !== "admin" && auth.user.role !== "brand" && (path === "/admin" || path === "/brand-dashboard" || path === "/sign-in" || path === "/sign-up")) navigate("/home");
  }, [auth, path]);

  const navigate = (to) => {
    const next = normalizePath(to);
    setPath(prev => {
      if (next === prev) return prev;
      window.history.pushState({}, "", next);
      return next;
    });
  };

  // ─── Cart actions ──────────────────────────────
  const handleAddToCart = (restaurant, product) => {
    setCart(prev => {
      // If different restaurant, reset cart
      if (prev.restaurantId && prev.restaurantId !== (restaurant._id || restaurant.id)) {
        const confirmed = window.confirm(`Giỏ hàng đang có món từ "${prev.restaurantName}". Bạn có muốn xóa và chọn từ "${restaurant.name}" không?`);
        if (!confirmed) return prev;
        return {
          restaurantId: restaurant._id || restaurant.id,
          restaurantName: restaurant.name,
          deliveryAddress: "",
          items: [{ productId: product._id, name: product.name, price: product.price, quantity: 1, emoji: product.emoji || "🍽️" }],
        };
      }
      const existing = prev.items.find(i => i.productId === product._id);
      return {
        ...prev,
        restaurantId: restaurant._id || restaurant.id,
        restaurantName: restaurant.name,
        items: existing
          ? prev.items.map(i => i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i)
          : [...prev.items, { productId: product._id, name: product.name, price: product.price, quantity: 1, emoji: product.emoji || "🍽️" }],
      };
    });
  };

  const handleUpdateQty = (productId, newQty) => {
    setCart(prev => {
      const items = newQty <= 0
        ? prev.items.filter(i => i.productId !== productId)
        : prev.items.map(i => i.productId === productId ? { ...i, quantity: newQty } : i);
      return { ...prev, items };
    });
  };

  const handlePlaceOrder = async (deliveryAddress, note) => {
    if (!auth?.user) { navigate("/sign-in"); return; }
    if (!cart.items.length) return;
    try {
      await createOrder({
        restaurantId: cart.restaurantId,
        items: cart.items,
        deliveryAddress,
        note,
        subtotal: cart.items.reduce((s, i) => s + i.price * i.quantity, 0),
        total: cart.items.reduce((s, i) => s + i.price * i.quantity, 0),
        paymentMethod: "cash",
      });
      setCart(EMPTY_CART);
      setCartOpen(false);
      setOrderMsg("🎉 Đặt hàng thành công! Nhà hàng sẽ xác nhận sớm.");
      setTimeout(() => setOrderMsg(null), 4000);
      navigate("/orders");
    } catch (err) {
      alert("Lỗi đặt hàng: " + err.message);
    }
  };

  // ─── Auth handlers ─────────────────────────────
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
  const isBrandScreen = path === "/brand-dashboard" && auth?.user?.role === "brand";
  const isRestaurantDetail = path.startsWith("/restaurant/");
  const hideNav = isAuthScreen || isAdminScreen || isBrandScreen;

  const restaurantId = isRestaurantDetail ? path.split("/restaurant/")[1] : null;
  const cartCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  const screen = useMemo(() => {
    if (path === "/sign-in") return <SignInPage onSubmit={handleSignIn} onGoogleSignIn={handleGoogleAuth} onFacebookSignIn={handleFacebookAuth} navigate={navigate} />;
    if (path === "/sign-up") return <SignUpPage onSubmit={handleSignUp} onGoogleSignIn={handleGoogleAuth} onFacebookSignIn={handleFacebookAuth} navigate={navigate} />;
    if (path === "/orders") return <OrdersPage user={auth.user} navigate={navigate} />;
    if (path === "/favorites") return <FavoritesPage user={auth.user} navigate={navigate} />;
    if (path === "/notifications") return <NotificationsPage user={auth.user} navigate={navigate} />;
    if (path === "/profile") return <ProfilePage user={auth.user} onLogout={handleLogout} navigate={navigate} />;
    if (path === "/admin" && auth?.user?.role === "admin") return <AdminDashboardPage user={auth.user} onLogout={handleLogout} navigate={navigate} />;
    if (path === "/brand-dashboard" && auth?.user?.role === "brand") return <BrandDashboardPage user={auth.user} onLogout={handleLogout} navigate={navigate} />;
    if (isRestaurantDetail) return (
      <RestaurantDetailPage
        restaurantId={restaurantId}
        cart={cart}
        onAddToCart={handleAddToCart}
        onUpdateQty={handleUpdateQty}
        navigate={navigate}
        onOpenCart={() => setCartOpen(true)}
      />
    );
    return <HomePage user={auth.user} navigate={navigate} globalSearchTerm={globalSearchTerm} setGlobalSearchTerm={setGlobalSearchTerm} />;
  }, [auth.user, path, globalSearchTerm, cart]);

  return (
    <div className={`app-shell ${hideNav ? "auth-mode" : ""}`}>
      <div className="ambient a1" />
      <div className="ambient a2" />
      <div className="ambient-grid" />

      {!hideNav && (
        <TopBar
          user={auth.user}
          navigate={navigate}
          onLogout={handleLogout}
          searchTerm={globalSearchTerm}
          cartCount={cartCount}
          onCartClick={() => setCartOpen(true)}
          onSearch={(term) => { setGlobalSearchTerm(term); navigate("/home"); }}
        />
      )}

      <main className={hideNav ? "" : (isRestaurantDetail ? "" : "view-port")} style={{ flexGrow: 1 }}>
        {screen}
      </main>

      {!hideNav && !isRestaurantDetail && <Footer />}
      {!hideNav && <TabBar path={path} navigate={navigate} />}

      {/* Cart Drawer */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onUpdateQty={handleUpdateQty}
          onPlaceOrder={handlePlaceOrder}
          user={auth.user}
          navigate={navigate}
        />
      )}

      {/* Toast */}
      {orderMsg && (
        <div style={{
          position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
          background: "#10b981", color: "#fff", padding: "12px 24px", borderRadius: 12,
          fontWeight: 600, fontSize: 14, zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          whiteSpace: "nowrap",
        }}>{orderMsg}</div>
      )}
    </div>
  );
}

// ─── Cart Drawer Component ─────────────────────────
function CartDrawer({ cart, onClose, onUpdateQty, onPlaceOrder, user, navigate }) {
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);

  const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleOrder = async () => {
    if (!user) { onClose(); navigate("/sign-in"); return; }
    if (!address.trim()) { alert("Vui lòng nhập địa chỉ giao hàng!"); return; }
    setPlacing(true);
    await onPlaceOrder(address, note);
    setPlacing(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: "min(420px, 100vw)",
        background: "#fff", display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 20px rgba(0,0,0,0.15)",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🛒 Giỏ hàng</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
        </div>

        {cart.items.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
            <p>Giỏ hàng trống</p>
          </div>
        ) : (
          <>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Từ nhà hàng: </span>
              <span style={{ fontWeight: 600 }}>{cart.restaurantName}</span>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {cart.items.map(item => (
                <div key={item.productId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid #f9f9f9" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.emoji} {item.name}</div>
                    <div style={{ color: "var(--shopee-orange)", fontWeight: 700, fontSize: 14, marginTop: 2 }}>{item.price.toLocaleString("vi-VN")}đ</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => onUpdateQty(item.productId, item.quantity - 1)} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "var(--shopee-orange)" }}>−</button>
                    <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
                    <button onClick={() => onUpdateQty(item.productId, item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "var(--shopee-orange)", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#fff" }}>+</button>
                  </div>
                  <div style={{ fontWeight: 700, minWidth: 70, textAlign: "right", fontSize: 14 }}>{(item.price * item.quantity).toLocaleString("vi-VN")}đ</div>
                </div>
              ))}
            </div>

            {/* Address + Note */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid #f0f0f0" }}>
              <input
                placeholder="📍 Địa chỉ giao hàng *"
                value={address}
                onChange={e => setAddress(e.target.value)}
                style={{ width: "100%", border: "1px solid #ddd", borderRadius: 8, padding: "10px 12px", fontSize: 14, marginBottom: 8, boxSizing: "border-box" }}
              />
              <input
                placeholder="📝 Ghi chú cho nhà hàng (tuỳ chọn)"
                value={note}
                onChange={e => setNote(e.target.value)}
                style={{ width: "100%", border: "1px solid #ddd", borderRadius: 8, padding: "10px 12px", fontSize: 14, boxSizing: "border-box" }}
              />
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "var(--text-muted)" }}>Tổng cộng</span>
                <span style={{ fontWeight: 700, fontSize: 18, color: "var(--shopee-orange)" }}>{subtotal.toLocaleString("vi-VN")}đ</span>
              </div>
              <button
                onClick={handleOrder}
                disabled={placing}
                style={{ width: "100%", background: "var(--shopee-orange)", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: 16, fontWeight: 700, cursor: "pointer", opacity: placing ? 0.7 : 1 }}
              >
                {placing ? "Đang đặt hàng..." : "🛍️ Đặt hàng"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
