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
import ShipperDashboardPage from "./pages/ShipperDashboardPage";
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
  const [toast, setToast] = useState(null); // { msg, type: 'success'|'error'|'warning' }
  const [confirmModal, setConfirmModal] = useState(null); // { msg, onConfirm }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const showConfirm = (msg, onConfirm) => {
    setConfirmModal({ msg, onConfirm });
  };

  useEffect(() => {
    const current = normalizePath(window.location.pathname);
    if (current !== window.location.pathname) window.history.replaceState({}, "", current);
    const onPopState = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!auth?.user) return;
    const role = auth.user.role;
    if (role === "admin" && path !== "/admin") {
      navigate("/admin");
    } else if (role === "brand" && path !== "/brand-dashboard" && (path === "/sign-in" || path === "/sign-up")) {
      navigate("/brand-dashboard");
    } else if (role === "shipper" && path !== "/shipper-dashboard") {
      // Shipper phải luôn ở trang shipper dashboard
      navigate("/shipper-dashboard");
    } else if (role !== "admin" && role !== "brand" && role !== "shipper") {
      // User thường bị chặn khỏi các trang admin/brand/shipper
      if (path === "/admin" || path === "/brand-dashboard" || path === "/shipper-dashboard" || path === "/sign-in" || path === "/sign-up") {
        navigate("/home");
      }
    }
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
        showConfirm(
          `Giỏ hàng đang có món từ "${prev.restaurantName}". Bạn có muốn xóa và chọn từ "${restaurant.name}" không?`,
          () => setCart({
            restaurantId: restaurant._id || restaurant.id,
            restaurantName: restaurant.name,
            deliveryAddress: "",
            items: [{ productId: product._id, name: product.name, price: product.price, quantity: 1, emoji: product.emoji || "🍽️" }],
          })
        );
        return prev;
      }
      // Dùng toppingKey để phân biệt cùng sản phẩm nhưng khác topping
      const variantKey = product._toppingKey != null
        ? `${product._id}__${product._toppingKey}`
        : product._id;
      const existing = prev.items.find(i => i.variantKey === variantKey);
      return {
        ...prev,
        restaurantId: restaurant._id || restaurant.id,
        restaurantName: restaurant.name,
        items: existing
          ? prev.items.map(i => i.variantKey === variantKey ? { ...i, quantity: i.quantity + 1 } : i)
          : [...prev.items, { productId: product._id, variantKey, name: product.name, price: product.price, quantity: 1, emoji: product.emoji || "🍽️" }],
      };
    });
  };

  const handleUpdateQty = (productId, newQty) => {
    setCart(prev => {
      const items = newQty <= 0
        ? prev.items.filter(i => i.variantKey !== productId && i.productId !== productId)
        : prev.items.map(i => (i.variantKey === productId || i.productId === productId) ? { ...i, quantity: newQty } : i);
      return { ...prev, items };
    });
  };

  const handlePlaceOrder = async (deliveryAddress, note, paymentMethod) => {
    if (!auth?.user) { navigate("/sign-in"); return; }
    if (!cart.items.length) return;
    const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    try {
      const order = await createOrder({
        restaurantId: cart.restaurantId,
        items: cart.items.map(({ variantKey, ...rest }) => rest),
        deliveryAddress,
        note,
        subtotal,
        total: subtotal,
        paymentMethod,
      });
      setCart(EMPTY_CART);
      setCartOpen(false);

      if (paymentMethod === "vnpay") {
        // Lấy VNPay URL rồi redirect
        const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
        const { token } = parseStoredAuth();
        const res = await fetch(`${API_BASE}/create-vnpay-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ orderId: order._id, orderInfo: `Thanh toan don hang FoodieHub` }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("Không lấy được URL thanh toán");
        }
      } else {
        setOrderMsg("🎉 Đặt hàng thành công! Nhà hàng sẽ xác nhận sớm.");
        setTimeout(() => setOrderMsg(null), 4000);
        navigate("/orders");
      }
    } catch (err) {
      showToast("Lỗi đặt hàng: " + err.message, "error");
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
  const isShipperScreen = path === "/shipper-dashboard" && auth?.user?.role === "shipper";
  const isRestaurantDetail = path.startsWith("/restaurant/");
  const isPaymentResult = path === "/payment-result";
  const hideNav = isAuthScreen || isAdminScreen || isBrandScreen || isShipperScreen;

  const restaurantId = isRestaurantDetail ? path.split("/restaurant/")[1] : null;
  const cartCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  const screen = useMemo(() => {
    if (path === "/sign-in") return <SignInPage onSubmit={handleSignIn} onGoogleSignIn={handleGoogleAuth} onFacebookSignIn={handleFacebookAuth} navigate={navigate} />;
    if (path === "/sign-up") return <SignUpPage onSubmit={handleSignUp} onGoogleSignIn={handleGoogleAuth} onFacebookSignIn={handleFacebookAuth} navigate={navigate} />;
    if (path === "/payment-result") return <PaymentResultPage navigate={navigate} />;
    if (path === "/orders") return <OrdersPage user={auth.user} navigate={navigate} />;
    if (path === "/favorites") return <FavoritesPage user={auth.user} navigate={navigate} />;
    if (path === "/notifications") return <NotificationsPage user={auth.user} navigate={navigate} />;
    if (path === "/profile") return <ProfilePage user={auth.user} onLogout={handleLogout} navigate={navigate} onUpdateUser={(newUser) => {
      setAuth(prev => {
        const updatedAuth = { ...prev, user: newUser };
        persistAuth(updatedAuth.user, updatedAuth.token);
        return updatedAuth;
      });
    }} />;
    if (path === "/admin" && auth?.user?.role === "admin") return <AdminDashboardPage user={auth.user} onLogout={handleLogout} navigate={navigate} />;
    if (path === "/brand-dashboard" && auth?.user?.role === "brand") return <BrandDashboardPage user={auth.user} onLogout={handleLogout} navigate={navigate} />;
    if (path === "/shipper-dashboard" && auth?.user?.role === "shipper") return <ShipperDashboardPage user={auth.user} onLogout={handleLogout} navigate={navigate} />;
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
          showToast={showToast}
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
      {/* ─── Custom Toast ─── */}
      {toast && <AppToast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ─── Confirm Modal ─── */}
      {confirmModal && (
        <AppConfirm
          msg={confirmModal.msg}
          onConfirm={() => { confirmModal.onConfirm(); setConfirmModal(null); }}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}


// ─── Cart Drawer Component ─────────────────────────
function CartDrawer({ cart, onClose, onUpdateQty, onPlaceOrder, user, navigate, showToast = () => {} }) {
  const [step, setStep] = useState("cart"); // "cart" | "checkout"
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [placing, setPlacing] = useState(false);

  const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleOrder = async () => {
    if (!user) { onClose(); navigate("/sign-in"); return; }
    if (!address.trim()) { showToast("Vui lòng nhập địa chỉ giao hàng!", "warning"); return; }
    setPlacing(true);
    await onPlaceOrder(address, note, paymentMethod);
    setPlacing(false);
  };

  const PAYMENT_METHODS = [
    { id: "cash", label: "Tiền mặt", desc: "Thanh toán khi nhận hàng", icon: "💵" },
    { id: "vnpay", label: "VNPay", desc: "Thanh toán online an toàn", icon: "🏦" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(420px, 100vw)", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "-4px 0 20px rgba(0,0,0,0.15)" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {step === "checkout" && (
              <button onClick={() => setStep("cart")} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#666", padding: 0 }}>←</button>
            )}
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              {step === "cart" ? "🛒 Giỏ hàng" : "📋 Xác nhận đơn hàng"}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
        </div>

        {cart.items.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
            <p>Giỏ hàng trống</p>
          </div>
        ) : step === "cart" ? (
          <>
            <div style={{ padding: "10px 20px", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Từ nhà hàng: </span>
              <span style={{ fontWeight: 600 }}>{cart.restaurantName}</span>
            </div>
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
            <div style={{ padding: "16px 20px", borderTop: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ color: "var(--text-muted)" }}>Tạm tính</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{subtotal.toLocaleString("vi-VN")}đ</span>
              </div>
              <button onClick={() => setStep("checkout")} style={{ width: "100%", background: "var(--shopee-orange)", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                Tiếp tục → Đặt hàng
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {/* Summary */}
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tóm tắt đơn hàng</p>
                {cart.items.map(item => (
                  <div key={item.productId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0", color: "#555" }}>
                    <span>{item.emoji} {item.name} x{item.quantity}</span>
                    <span style={{ fontWeight: 600 }}>{(item.price * item.quantity).toLocaleString("vi-VN")}đ</span>
                  </div>
                ))}
              </div>

              {/* Address */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
                <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#333" }}>📍 Địa chỉ giao hàng</p>
                <input
                  placeholder="Nhập địa chỉ giao hàng..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #ddd", borderRadius: 8, padding: "10px 12px", fontSize: 14, marginBottom: 8, boxSizing: "border-box", outline: "none" }}
                />
                <textarea
                  placeholder="📝 Ghi chú cho nhà hàng (tuỳ chọn)"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={2}
                  style={{ width: "100%", border: "1.5px solid #ddd", borderRadius: 8, padding: "10px 12px", fontSize: 14, boxSizing: "border-box", resize: "none", outline: "none", fontFamily: "inherit" }}
                />
              </div>

              {/* Payment method */}
              <div style={{ padding: "16px 20px" }}>
                <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#333" }}>💳 Phương thức thanh toán</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {PAYMENT_METHODS.map(pm => (
                    <div key={pm.id} onClick={() => setPaymentMethod(pm.id)} style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 16px", borderRadius: 10, cursor: "pointer",
                      border: paymentMethod === pm.id ? "2px solid #ee4d2d" : "1.5px solid #eee",
                      background: paymentMethod === pm.id ? "#fff5f4" : "#fff",
                      transition: "all 0.15s",
                    }}>
                      <span style={{ fontSize: 26 }}>{pm.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{pm.label}</div>
                        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{pm.desc}</div>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", border: paymentMethod === pm.id ? "6px solid #ee4d2d" : "2px solid #ccc", transition: "all 0.15s", flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Tổng cộng</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: "var(--shopee-orange)" }}>{subtotal.toLocaleString("vi-VN")}đ</span>
              </div>
              <button onClick={handleOrder} disabled={placing} style={{
                width: "100%", border: "none", borderRadius: 10, padding: "14px",
                fontSize: 16, fontWeight: 700, cursor: placing ? "not-allowed" : "pointer",
                background: placing ? "#ccc" : paymentMethod === "vnpay" ? "linear-gradient(135deg,#0060af,#0078d4)" : "linear-gradient(135deg,#ee4d2d,#ff6b35)",
                color: "#fff", transition: "all 0.2s",
              }}>
                {placing ? "Đang xử lý..." : paymentMethod === "vnpay" ? "🏦 Thanh toán qua VNPay →" : "🛍️ Đặt hàng (Tiền mặt)"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Payment Result Page ────────────────────────────
function PaymentResultPage({ navigate }) {
  const [status, setStatus] = useState("loading"); // loading | success | fail
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
    const query = params.toString();
    // Lấy orderId từ vnp_TxnRef trong query params
    const orderId = params.get("vnp_TxnRef");

    // Kiểm tra trực tiếp vnp_ResponseCode trước — "00" = thành công, "24" = user hủy
    const responseCode = params.get("vnp_ResponseCode");

    const cancelOrder = async () => {
      if (!orderId) return;
      try {
        const raw = localStorage.getItem("@foodiehub_auth_web") || "{}";
        const auth = JSON.parse(raw);
        const token = auth?.token || "";
        await fetch(`${API_BASE}/payments/cancel-vnpay-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ orderId }),
        });
      } catch (_) {}
    };

    fetch(`${API_BASE}/check-payment-vnpay?${query}`)
      .then(r => r.json())
      .then(async data => {
        // Phải có responseCode = "00" MỚI là thành công
        if (data.success && responseCode === "00") {
          setStatus("success");
          setMessage("Thanh toán VNPay thành công! 🎉");
        } else {
          await cancelOrder();
          const reason = responseCode === "24"
            ? "Bạn đã hủy giao dịch."
            : responseCode
              ? `Thanh toán thất bại (mã lỗi: ${responseCode}).`
              : "Thanh toán thất bại hoặc bị hủy.";
          setStatus("fail");
          setMessage(`${reason} Đơn hàng đã được hủy tự động.`);
        }
      })
      .catch(async () => {
        await cancelOrder();
        setStatus("fail");
        setMessage("Không thể xác minh kết quả thanh toán. Đơn hàng đã được hủy.");
      });
  }, []);

  return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
      {status === "loading" && (
        <>
          <div style={{ width: 48, height: 48, border: "4px solid #f0f0f0", borderTop: "4px solid #ee4d2d", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: 20 }} />
          <p style={{ color: "#888" }}>Đang xác minh thanh toán...</p>
        </>
      )}
      {status === "success" && (
        <>
          <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
          <h2 style={{ color: "#10b981", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Thanh toán thành công!</h2>
          <p style={{ color: "#666", marginBottom: 28 }}>{message}</p>
          <button onClick={() => navigate("/orders")} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: "12px 32px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
            Xem đơn hàng →
          </button>
        </>
      )}
      {status === "fail" && (
        <>
          <div style={{ fontSize: 72, marginBottom: 16 }}>😞</div>
          <h2 style={{ color: "#ef4444", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Thanh toán thất bại</h2>
          <p style={{ color: "#666", marginBottom: 28 }}>{message}</p>
          <button onClick={() => navigate("/orders")} style={{ background: "#ee4d2d", color: "#fff", border: "none", borderRadius: 10, padding: "12px 32px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
            Xem đơn hàng
          </button>
        </>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── AppToast Component ──────────────────────────────
function AppToast({ msg, type = "success", onClose }) {
  const config = {
    success: { bg: "#10b981", icon: "✅", border: "#059669" },
    error:   { bg: "#ef4444", icon: "❌", border: "#dc2626" },
    warning: { bg: "#f59e0b", icon: "⚠️", border: "#d97706" },
  };
  const c = config[type] || config.success;
  return (
    <div style={{
      position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
      background: c.bg, color: "#fff", padding: "14px 22px",
      borderRadius: 14, fontWeight: 600, fontSize: 14, zIndex: 99999,
      boxShadow: `0 8px 32px rgba(0,0,0,0.22), 0 0 0 1px ${c.border}`,
      display: "flex", alignItems: "center", gap: 10, maxWidth: "90vw",
      animation: "toastIn 0.35s cubic-bezier(.175,.885,.32,1.275)",
      whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: 18 }}>{c.icon}</span>
      <span>{msg}</span>
      <button onClick={onClose} style={{ marginLeft: 8, background: "rgba(255,255,255,0.25)", border: "none", color: "#fff", borderRadius: 8, width: 22, height: 22, cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(20px) scale(0.9)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}`}</style>
    </div>
  );
}

// ─── AppConfirm Component ─────────────────────────────
function AppConfirm({ msg, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99998, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
      <div style={{
        position: "relative", background: "#fff", borderRadius: 18, padding: "28px 28px 22px",
        maxWidth: 380, width: "90vw", boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        animation: "confirmIn 0.3s cubic-bezier(.175,.885,.32,1.275)",
      }}>
        <div style={{ fontSize: 40, textAlign: "center", marginBottom: 14 }}>🛒</div>
        <p style={{ margin: "0 0 22px", fontSize: 15, color: "#333", textAlign: "center", lineHeight: 1.6 }}>{msg}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid #e5e7eb",
            background: "#fff", color: "#555", fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}>Giữ giỏ hàng</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "11px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg,#ee4d2d,#ff6b35)", color: "#fff",
            fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}>Đổi nhà hàng</button>
        </div>
        <style>{`@keyframes confirmIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}`}</style>
      </div>
    </div>
  );
}

export default App;
