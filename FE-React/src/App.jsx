import { useEffect, useMemo, useState } from "react";
import VietnamAddressPicker from "./components/VietnamAddressPicker";
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
import { createOrder, getActiveVouchers } from "./services/order-api";
import ChatBox from "./components/ChatBox";


// ─── Cart helpers ──────────────────────────────────
const EMPTY_CART = { restaurantId: null, restaurantName: null, deliveryAddress: "", deliveryFee: 0, items: [] };

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
    } else if (role === "brand" && path !== "/brand-dashboard") {
      // Brand phải luôn ở trang brand dashboard
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
    if (auth?.user?.role === "brand" || auth?.user?.role === "shipper") {
      showToast("Tài khoản này không thể đặt món!", "warning");
      return;
    }
    setCart(prev => {
      // If different restaurant, reset cart
      if (prev.restaurantId && prev.restaurantId !== (restaurant._id || restaurant.id)) {
        showConfirm(
          `Giỏ hàng đang có món từ "${prev.restaurantName}". Bạn có muốn xóa và chọn từ "${restaurant.name}" không?`,
          () => setCart({
            restaurantId: restaurant._id || restaurant.id,
            restaurantName: restaurant.name,
            deliveryAddress: "",
            deliveryFee: restaurant.deliveryFee || 15000,
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
        deliveryFee: prev.deliveryFee || restaurant.deliveryFee || 15000,
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

  const handlePlaceOrder = async (deliveryAddress, note, paymentMethod, voucherId = null, deliveryPhone = "") => {
    if (!auth?.user) { navigate("/sign-in"); return; }
    if (!cart.items.length) return;
    const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryFee = cart.deliveryFee || 0;
    const total = subtotal + deliveryFee;
    try {
      const orderPayload = {
        restaurantId: cart.restaurantId,
        items: cart.items.map(({ variantKey, ...rest }) => rest),
        deliveryAddress,
        deliveryPhone: deliveryPhone || auth.user.phone || "",
        note,
        subtotal,
        deliveryFee,
        total,
        paymentMethod,
      };
      if (voucherId) orderPayload.voucherId = voucherId;
      const res = await createOrder(orderPayload);
      setCart(EMPTY_CART);
      setCartOpen(false);

      if (paymentMethod === "vnpay") {
        if (res.paymentUrl) {
          window.location.href = res.paymentUrl;
        } else {
          // Fallback if paymentUrl not returned (shouldn't happen with new BE)
          const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
          const { token } = parseStoredAuth();
          const vnp = await fetch(`${API_BASE}/create-vnpay-url`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ orderId: res.order?._id || res._id, orderInfo: `Thanh toán đơn hàng FoodieHub` }),
          });
          const vnpData = await vnp.json();
          if (vnpData.url) window.location.href = vnpData.url;
          else throw new Error("Không lấy được URL thanh toán");
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
    if (path === "/sign-in") return <SignInPage onSubmit={handleSignIn} onGoogleSignIn={handleGoogleAuth} onFacebookSignIn={handleFacebookAuth} navigate={navigate} showToast={showToast} showConfirm={showConfirm} />;
    if (path === "/sign-up") return <SignUpPage onSubmit={handleSignUp} onGoogleSignIn={handleGoogleAuth} onFacebookSignIn={handleFacebookAuth} navigate={navigate} showToast={showToast} showConfirm={showConfirm} />;
    if (path === "/payment-result") return <PaymentResultPage navigate={navigate} showToast={showToast} showConfirm={showConfirm} />;
    if (path === "/orders") return <OrdersPage user={auth.user} navigate={navigate} showToast={showToast} showConfirm={showConfirm} />;
    if (path === "/favorites") return <FavoritesPage user={auth.user} navigate={navigate} showToast={showToast} showConfirm={showConfirm} />;
    if (path === "/notifications") return <NotificationsPage user={auth.user} navigate={navigate} showToast={showToast} showConfirm={showConfirm} />;
    if (path === "/profile") return <ProfilePage user={auth.user} onLogout={handleLogout} navigate={navigate} showToast={showToast} showConfirm={showConfirm} onUpdateUser={(newUser) => {
      console.log('[App] onUpdateUser called with:', newUser);
      setAuth(prev => {
        const updatedAuth = { ...prev, user: newUser };
        console.log('[App] persisting auth:', updatedAuth);
        persistAuth(updatedAuth.user, updatedAuth.token);
        return updatedAuth;
      });
    }} />;
    if (path === "/admin" && auth?.user?.role === "admin") return <AdminDashboardPage user={auth.user} onLogout={handleLogout} navigate={navigate} showToast={showToast} showConfirm={showConfirm} />;
    if (path === "/brand-dashboard" && auth?.user?.role === "brand") return <BrandDashboardPage user={auth.user} onLogout={handleLogout} navigate={navigate} showToast={showToast} showConfirm={showConfirm} />;
    if (path === "/shipper-dashboard" && auth?.user?.role === "shipper") return <ShipperDashboardPage user={auth.user} onLogout={handleLogout} navigate={navigate} showToast={showToast} showConfirm={showConfirm} />;
    if (isRestaurantDetail) return (
      <RestaurantDetailPage
        restaurantId={restaurantId}
        cart={cart}
        onAddToCart={handleAddToCart}
        onUpdateQty={handleUpdateQty}
        navigate={navigate}
        onOpenCart={() => setCartOpen(true)}
        showToast={showToast}
        showConfirm={showConfirm}
      />
    );
    return <HomePage user={auth.user} navigate={navigate} globalSearchTerm={globalSearchTerm} setGlobalSearchTerm={setGlobalSearchTerm} showToast={showToast} showConfirm={showConfirm} />;
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

      <main className={hideNav ? "" : (isRestaurantDetail ? "" : "view-port")} style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
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

      <ChatBox path={path} restaurantId={restaurantId} />
    </div>
  );
}


// ─── Cart Drawer Component ─────────────────────────
function CartDrawer({ cart, onClose, onUpdateQty, onPlaceOrder, user, navigate, showToast = () => { } }) {
  const [step, setStep] = useState("cart"); // "cart" | "checkout"
  const [address, setAddress] = useState(user?.address || "");
  const [pickerKey, setPickerKey] = useState(user?.address || "init");
  const [phone, setPhone] = useState(user?.phone || "");
  const [editingPhone, setEditingPhone] = useState(false);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [placing, setPlacing] = useState(false);

  // Kiểm tra quyền thanh toán COD
  const isCodBanned = user?.isVnpayMandatory || (user?.codBannedUntil && new Date(user.codBannedUntil) > new Date());
  
  useEffect(() => {
    if (isCodBanned && paymentMethod === "cash") {
      setPaymentMethod("vnpay");
    }
  }, [isCodBanned]);

  // Voucher state
  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucherId, setSelectedVoucherId] = useState(null);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = cart.deliveryFee || 0;
  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  // Voucher logic
  const selectedVoucher = vouchers.find(v => v._id === selectedVoucherId);
  const finalDeliveryFee = selectedVoucher ? Math.min(deliveryFee, selectedVoucher.maxDeliveryFee) : deliveryFee;
  const deliverySaving = deliveryFee - finalDeliveryFee;
  const total = subtotal + finalDeliveryFee;
  const eligibleVouchers = vouchers.filter(v => subtotal >= v.minOrderAmount);

  // Fetch vouchers when entering checkout step
  useEffect(() => {
    if (step === "checkout" && vouchers.length === 0) {
      setLoadingVouchers(true);
      getActiveVouchers().then(data => setVouchers(data || [])).catch(() => { }).finally(() => setLoadingVouchers(false));
    }
  }, [step]);

  const handleOrder = async () => {
    if (!user) { onClose(); navigate("/sign-in"); return; }
    if (!phone.trim()) { showToast("Vui lòng nhập số điện thoại nhận hàng!", "warning"); return; }
    if (!address.trim()) { showToast("Vui lòng nhập địa chỉ giao hàng!", "warning"); return; }
    setPlacing(true);
    await onPlaceOrder(address, note, paymentMethod, selectedVoucherId, phone);
    setPlacing(false);
  };

  const PAYMENT_METHODS = [
    { id: "cash", label: "Tiền mặt", desc: "Thanh toán khi nhận hàng", icon: "💵" },
    { id: "vnpay", label: "VNPay", desc: "Thanh toán online an toàn", icon: "🏦" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0,
        width: "min(440px, 100vw)", background: "#fff",
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
        animation: "slideInRight 0.28s cubic-bezier(.25,.46,.45,.94)",
      }}>

        {/* ── Header ── */}
        <div style={{ padding: "0 20px", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", paddingTop: 16, paddingBottom: 12, gap: 8 }}>
            {step === "checkout" && (
              <button onClick={() => setStep("cart")} style={{
                width: 32, height: 32, borderRadius: "50%", border: "none",
                background: "#f5f5f5", cursor: "pointer", fontSize: 16, color: "#555",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>←</button>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {/* Step pills */}
                  {["Giỏ hàng", "Đặt hàng"].map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: (i === 0 && step === "cart") || (i === 1 && step === "checkout") ? "#ee4d2d" : "#f0f0f0",
                        color: (i === 0 && step === "cart") || (i === 1 && step === "checkout") ? "#fff" : "#999",
                        transition: "all 0.2s",
                      }}>
                        <span>{i + 1}</span>
                        <span>{s}</span>
                      </div>
                      {i === 0 && <span style={{ color: "#d1d5db", fontSize: 12 }}>›</span>}
                    </div>
                  ))}
                </div>
                <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999" }}>✕</button>
              </div>
              {cart.restaurantName && (
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                  📍 {cart.restaurantName} · {itemCount} món
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Empty state ── */}
        {cart.items.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9ca3af", gap: 12 }}>
            <div style={{ fontSize: 56 }}>🛒</div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "#374151" }}>Giỏ hàng trống</div>
            <div style={{ fontSize: 13 }}>Thêm món để tiếp tục</div>
          </div>

        ) : step === "cart" ? (
          // ─── STEP 1: Cart ───
          <>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {cart.items.map((item, idx) => (
                <div key={item.variantKey || item.productId} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 20px",
                  borderBottom: idx < cart.items.length - 1 ? "1px solid #f5f5f5" : "none",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.emoji} {item.name}
                    </div>
                    <div style={{ fontSize: 13, color: "#ee4d2d", fontWeight: 700, marginTop: 2 }}>
                      {item.price.toLocaleString("vi-VN")}đ
                    </div>
                  </div>
                  {/* Qty stepper */}
                  <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #e5e7eb", borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                    <button onClick={() => onUpdateQty(item.variantKey || item.productId, item.quantity - 1)} style={{
                      width: 32, height: 32, border: "none", background: "#fff",
                      fontSize: 17, fontWeight: 700, color: "#ee4d2d", cursor: "pointer",
                    }}>−</button>
                    <span style={{ minWidth: 28, textAlign: "center", fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{item.quantity}</span>
                    <button onClick={() => onUpdateQty(item.variantKey || item.productId, item.quantity + 1)} style={{
                      width: 32, height: 32, border: "none", background: "#fff",
                      fontSize: 17, fontWeight: 700, color: "#ee4d2d", cursor: "pointer",
                    }}>+</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>
                      {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                    </div>
                    <button
                      onClick={() => onUpdateQty(item.variantKey || item.productId, 0)}
                      title="Xóa khỏi giỏ"
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#d1d5db", fontSize: 15, padding: 0, lineHeight: 1,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                      onMouseLeave={e => e.currentTarget.style.color = "#d1d5db"}
                    >🗑️</button>
                  </div>
                </div>
              ))}

              {/* Promo / note teaser */}
              <div style={{ margin: "12px 20px", padding: "12px 16px", background: "#fff8f5", borderRadius: 10, border: "1.5px dashed #fca5a5", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>📝</span>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>Thêm ghi chú cho nhà hàng ở bước sau</span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 20px 20px", borderTop: "1px solid #f0f0f0", flexShrink: 0 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
                  <span>Tạm tính ({itemCount} món)</span>
                  <span>{subtotal.toLocaleString("vi-VN")}đ</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
                  <span>🚚 Phí giao hàng</span>
                  <span>{deliveryFee.toLocaleString("vi-VN")}đ</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>Tổng thanh toán</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#ee4d2d" }}>{total.toLocaleString("vi-VN")}đ</div>
                </div>
              </div>
              <button onClick={() => setStep("checkout")} style={{
                width: "100%", padding: "13px 28px", borderRadius: 10, border: "none",
                background: "#ee4d2d", color: "#fff",
                fontWeight: 700, fontSize: 15, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 16px rgba(238,77,45,0.3)",
              }}>
                Đặt hàng <span style={{ fontSize: 16 }}>→</span>
              </button>
            </div>
          </>

        ) : (
          // ─── STEP 2: Checkout ───
          <>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {/* Order summary */}
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #f5f5f5", background: "#fafafa" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>
                  Đơn hàng · {cart.restaurantName}
                </div>
                {cart.items.map(item => (
                  <div key={item.variantKey || item.productId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0", color: "#374151" }}>
                    <span>{item.emoji} {item.name} <span style={{ color: "#9ca3af" }}>x{item.quantity}</span></span>
                    <span style={{ fontWeight: 600 }}>{(item.price * item.quantity).toLocaleString("vi-VN")}đ</span>
                  </div>
                ))}
              </div>

              {/* Phone */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f5" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  📞 Số điện thoại nhận hàng
                </div>
                {!editingPhone ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f9fafb", borderRadius: 8, border: "1.5px solid #e5e7eb" }}>
                    <span style={{ fontSize: 14, color: phone ? "#1a1a1a" : "#9ca3af", fontWeight: phone ? 500 : 400 }}>
                      {phone || "Chưa có số điện thoại"}
                    </span>
                    <button onClick={() => setEditingPhone(true)} style={{ fontSize: 12, color: "#ee4d2d", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}>
                      {phone ? "Đổi SĐT" : "Thêm SĐT"}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Nhập số điện thoại..."
                      autoFocus
                      style={{
                        flex: 1, border: "1.5px solid #ee4d2d", borderRadius: 8,
                        padding: "10px 14px", fontSize: 14, outline: "none",
                      }}
                    />
                    <button
                      onClick={() => {
                        if (!phone.trim()) { showToast("Vui lòng nhập số điện thoại!", "warning"); return; }
                        setEditingPhone(false);
                      }}
                      style={{ padding: "10px 16px", background: "#ee4d2d", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                    >
                      Xác nhận
                    </button>
                  </div>
                )}
              </div>

              {/* Address */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f5" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  📍 Địa chỉ giao hàng
                </div>
                <VietnamAddressPicker
                  key={pickerKey}
                  value={address}
                  onChange={setAddress}
                />
                <button
                  onClick={() => { setAddress(""); setPickerKey("reset-" + Date.now()); }}
                  style={{ marginTop: 6, fontSize: 12, color: "#ee4d2d", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}
                >
                  🔄 Đổi địa chỉ khác
                </button>
                {address && (
                  <div style={{ marginTop: 8, padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0", fontSize: 12, color: "#166534", display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <span>📍</span>
                    <span>{address}</span>
                  </div>
                )}
                <textarea
                  placeholder="Ghi chú cho nhà hàng (tuỳ chọn)"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={2}
                  style={{
                    width: "100%", border: "1.5px solid #e5e7eb",
                    borderRadius: 8, padding: "11px 14px", fontSize: 14,
                    boxSizing: "border-box", resize: "none", outline: "none",
                    fontFamily: "inherit", marginTop: 8,
                  }}
                />
              </div>

              {/* Payment */}
              <div style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>💳 Thanh toán</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {isCodBanned && (
                    <div style={{ padding: "10px 14px", background: "#fef2f2", borderRadius: 8, border: "1px solid #fee2e2", marginBottom: 4 }}>
                      <div style={{ fontSize: 13, color: "#991b1b", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                        ⚠️ {user.isVnpayMandatory ? "Bạn bắt buộc phải thanh toán online." : "Bạn đang bị cấm thanh toán tiền mặt."}
                      </div>
                      <div style={{ fontSize: 11, color: "#dc2626", marginTop: 2 }}>
                        Do lịch sử đơn hàng có đơn không liên lạc được khách. {user.codBannedUntil && `Cấm đến: ${new Date(user.codBannedUntil).toLocaleDateString("vi-VN")}`}
                      </div>
                    </div>
                  )}
                  {PAYMENT_METHODS.map(pm => {
                    const disabled = pm.id === "cash" && isCodBanned;
                    return (
                      <div key={pm.id} onClick={() => !disabled && setPaymentMethod(pm.id)} style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "13px 16px", borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer",
                        border: paymentMethod === pm.id ? "2px solid #ee4d2d" : "1.5px solid #e5e7eb",
                        background: paymentMethod === pm.id ? "#fff8f5" : (disabled ? "#f9fafb" : "#fff"),
                        opacity: disabled ? 0.6 : 1,
                        transition: "all 0.15s",
                      }}>
                        <span style={{ fontSize: 24 }}>{pm.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: disabled ? "#9ca3af" : "#1a1a1a" }}>{pm.label}</div>
                          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 1 }}>{pm.desc}</div>
                        </div>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                          border: paymentMethod === pm.id ? "6px solid #ee4d2d" : "2px solid #d1d5db",
                          transition: "all 0.15s",
                        }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Voucher section */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid #f5f5f5" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>🎟️ Voucher giảm phí ship</div>
              {loadingVouchers ? (
                <div style={{ textAlign: "center", padding: 12, color: "#9ca3af", fontSize: 13 }}>Đang tải voucher...</div>
              ) : eligibleVouchers.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: "#f9fafb", borderRadius: 8, border: "1.5px solid #e5e7eb" }}>
                  <span style={{ fontSize: 16 }}>🎫</span>
                  <span style={{ fontSize: 13, color: "#9ca3af" }}>
                    {vouchers.length === 0 ? "Chưa có voucher nào" : `Đơn chưa đủ điều kiện (tối thiểu ${vouchers[0]?.minOrderAmount?.toLocaleString("vi-VN")}đ)`}
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {eligibleVouchers.map(v => {
                    const isSelected = selectedVoucherId === v._id;
                    const saving = deliveryFee - Math.min(deliveryFee, v.maxDeliveryFee);
                    return (
                      <div key={v._id} onClick={() => setSelectedVoucherId(isSelected ? null : v._id)} style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                        border: isSelected ? "2px solid #ee4d2d" : "1.5px solid #e5e7eb",
                        background: isSelected ? "#fff8f5" : "#fff", transition: "all 0.15s",
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center",
                          background: isSelected ? "#ee4d2d" : "#fff3ed", transition: "all 0.15s",
                        }}>
                          <span style={{ fontSize: 16 }}>{isSelected ? "✓" : "🏷️"}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>{v.name}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                            {v.maxDeliveryFee === 0 ? `🚀 Free ship cho đơn từ ${v.minOrderAmount.toLocaleString("vi-VN")}đ` : `Ship chỉ ${v.maxDeliveryFee.toLocaleString("vi-VN")}đ cho đơn từ ${v.minOrderAmount.toLocaleString("vi-VN")}đ`}
                          </div>
                          {saving > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", marginTop: 2 }}>Tiết kiệm {saving.toLocaleString("vi-VN")}đ</div>}
                        </div>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%",
                          border: isSelected ? "6px solid #ee4d2d" : "2px solid #d1d5db",
                          transition: "all 0.15s", flexShrink: 0,
                        }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 20px 20px", borderTop: "1px solid #f0f0f0", flexShrink: 0 }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
                  <span>Tạm tính</span>
                  <span>{subtotal.toLocaleString("vi-VN")}đ</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
                  <span>🚚 Phí giao hàng</span>
                  {deliverySaving > 0 ? (
                    <span><span style={{ textDecoration: "line-through", color: "#9ca3af", marginRight: 6, fontSize: 12 }}>{deliveryFee.toLocaleString("vi-VN")}đ</span><span style={{ color: "#16a34a", fontWeight: 700 }}>{finalDeliveryFee === 0 ? "FREE" : `${finalDeliveryFee.toLocaleString("vi-VN")}đ`}</span></span>
                  ) : (
                    <span>{deliveryFee.toLocaleString("vi-VN")}đ</span>
                  )}
                </div>
                {deliverySaving > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", borderRadius: 8, padding: "6px 10px", marginBottom: 8 }}>
                    <span style={{ fontSize: 13 }}>🎉</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#16a34a" }}>Tiết kiệm {deliverySaving.toLocaleString("vi-VN")}đ phí ship!</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>Tổng thanh toán</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: "#ee4d2d" }}>{total.toLocaleString("vi-VN")}đ</span>
                </div>
              </div>
              <button onClick={handleOrder} disabled={placing} style={{
                width: "100%", border: "none", borderRadius: 10, padding: "14px",
                fontSize: 15, fontWeight: 700, cursor: placing ? "not-allowed" : "pointer",
                background: placing ? "#e5e7eb"
                  : paymentMethod === "vnpay" ? "linear-gradient(135deg,#0060af,#0078d4)"
                    : "#ee4d2d",
                color: placing ? "#9ca3af" : "#fff",
                transition: "all 0.2s",
                boxShadow: placing ? "none" : "0 4px 16px rgba(238,77,45,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                {placing ? (
                  <><span style={{ width: 16, height: 16, border: "2px solid #ccc", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> Đang xử lý...</>
                ) : paymentMethod === "vnpay" ? "🏦 Thanh toán VNPay →"
                  : "🛍️ Đặt hàng"}
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
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
      } catch (_) { }
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
    success: { 
      bg: "rgba(16, 185, 129, 0.9)", 
      icon: "✨", 
      color: "#fff", 
      shadow: "rgba(16, 185, 129, 0.4)",
      border: "rgba(5, 150, 105, 0.5)"
    },
    error: { 
      bg: "rgba(239, 68, 68, 0.9)",  
      icon: "🛑", 
      color: "#fff", 
      shadow: "rgba(239, 68, 68, 0.4)",
      border: "rgba(220, 38, 38, 0.5)"
    },
    warning: { 
      bg: "rgba(245, 158, 11, 0.9)", 
      icon: "⚠️", 
      color: "#fff", 
      shadow: "rgba(245, 158, 11, 0.4)",
      border: "rgba(217, 119, 6, 0.5)"
    },
  };
  const c = config[type] || config.success;

  return (
    <div style={{
      position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)",
      background: c.bg, color: c.color, padding: "14px 24px",
      borderRadius: "20px", fontWeight: 700, fontSize: "14px", zIndex: 100000,
      boxShadow: `0 20px 40px ${c.shadow}`,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", gap: "14px", maxWidth: "min(450px, 92vw)",
      animation: "toastSlideIn 0.5s cubic-bezier(0.19, 1, 0.22, 1)",
      border: `1px solid ${c.border}`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        flexShrink: 0, boxShadow: "inset 0 0 10px rgba(255,255,255,0.1)"
      }}>
        {c.icon}
      </div>
      <div style={{ flex: 1, lineHeight: "1.5" }}>{msg}</div>
      <button onClick={onClose} style={{
        background: "rgba(255,255,255,0.2)", border: "none", color: "#fff",
        width: 28, height: 28, borderRadius: "50%", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: "bold", transition: "all 0.2s"
      }} onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.3)"; e.currentTarget.style.transform="scale(1.1)"}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.2)"; e.currentTarget.style.transform="scale(1)"}}>
        ✕
      </button>

      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(-50%) translateY(40px) scale(0.9); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
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
