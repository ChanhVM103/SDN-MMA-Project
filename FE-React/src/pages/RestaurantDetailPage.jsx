import { useState, useEffect, useRef } from "react";
import { getRestaurantProducts } from "../services/brand-api";
import { getRestaurantReviews, submitReview } from "../services/review-api";
import { getMyOrders } from "../services/order-api";
import { parseStoredAuth } from "../services/auth-storage";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export default function RestaurantDetailPage({ restaurantId, cart, onAddToCart, onUpdateQty, navigate, onOpenCart }) {
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addedId, setAddedId] = useState(null);
  const [toppingModal, setToppingModal] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [deliveredOrder, setDeliveredOrder] = useState(null); // đơn đã giao của nhà hàng này
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      setLoading(true);
      try {
        const [resRes, prodData] = await Promise.all([
          fetch(`${API_BASE}/restaurants/${restaurantId}`).then(r => r.json()),
          getRestaurantProducts(restaurantId),
        ]);
        if (resRes.success) setRestaurant(resRes.data);
        const list = Array.isArray(prodData) ? prodData : prodData?.products || [];
        setProducts(list);
        if (list.length > 0) setActiveCategory(list[0].category);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    setReviewsLoading(true);
    getRestaurantReviews(restaurantId, 1, 20)
      .then(data => setReviews(data?.data || data || []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));

    // Lấy đơn hàng đã giao của nhà hàng này (để user có thể review)
    const auth = parseStoredAuth();
    if (auth?.user) {
      getMyOrders().then(orders => {
        const arr = Array.isArray(orders) ? orders : orders?.orders || [];
        const found = arr.find(o =>
          (o.restaurant?._id || o.restaurant) === restaurantId &&
          o.status === "delivered" &&
          !o.isReviewed
        );
        setDeliveredOrder(found || null);
      }).catch(() => {});
    }
  }, [restaurantId]);

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const filtered = activeCategory ? products.filter(p => p.category === activeCategory) : products;
  const bestSellers = products.filter(p => p.isBestSeller).slice(0, 6);

  const getQty = (id) => cart?.items?.filter(i => i.productId === id).reduce((s, i) => s + i.quantity, 0) || 0;
  const cartCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const cartTotal = cart?.items?.reduce((s, i) => s + i.price * i.quantity, 0) || 0;

  const handleAdd = (e, product) => {
    e.stopPropagation();
    if (product.allowToppings && product.toppings?.length > 0) {
      setSelectedToppings([]);
      setToppingModal({ product });
      return;
    }
    onAddToCart(restaurant, product);
    setAddedId(product._id);
    setTimeout(() => setAddedId(null), 600);
  };

  const handleConfirmTopping = () => {
    const { product } = toppingModal;
    const extraPrice = selectedToppings.reduce((s, t) => s + (t.extraPrice || 0), 0);
    const toppingNames = selectedToppings.map(t => t.name).join(", ");
    const enriched = {
      ...product,
      price: product.price + extraPrice,
      name: toppingNames ? `${product.name} (${toppingNames})` : product.name,
      _toppingKey: toppingNames,
    };
    onAddToCart(restaurant, enriched);
    setAddedId(product._id);
    setTimeout(() => setAddedId(null), 600);
    setToppingModal(null);
    setSelectedToppings([]);
  };

  const toggleTopping = (topping) => {
    setSelectedToppings(prev => {
      const exists = prev.find(t => t.name === topping.name);
      return exists ? prev.filter(t => t.name !== topping.name) : [...prev, topping];
    });
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fafafa", gap: 16 }}>
      <div style={{ width: 48, height: 48, border: "4px solid #f0f0f0", borderTop: "4px solid #ee4d2d", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "#999", fontSize: 14 }}>Đang tải nhà hàng...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!restaurant) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#999" }}>Không tìm thấy nhà hàng</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* ── BANNER ── */}
      <div style={{ position: "relative", height: 280, overflow: "hidden" }}>
        {/* Hero image */}
        <img
          src={restaurant.image}
          alt={restaurant.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* Gradient overlay — đậm ở dưới để chữ dễ đọc */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)" }} />

        {/* Back btn */}
        <button onClick={() => navigate("/home")} style={{
          position: "absolute", top: 16, left: 16, zIndex: 20,
          width: 38, height: 38, borderRadius: "50%",
          background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.35)", color: "#fff",
          fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>←</button>

        {/* Info overlay — nằm TRONG ảnh, căn dưới */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 24px" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
            {restaurant.name}
          </h1>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ color: "#fde68a", fontSize: 13, fontWeight: 700 }}>
              ⭐ {restaurant.rating?.toFixed(1)}
              <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 400 }}> ({restaurant.reviews}+)</span>
            </span>
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>🕐 {restaurant.deliveryTime} phút</span>
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>🗺️ {restaurant.distance}</span>
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>🚚 {restaurant.deliveryFee?.toLocaleString("vi-VN")}đ</span>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
              background: restaurant.isOpen ? "rgba(22,163,74,0.85)" : "rgba(239,68,68,0.85)",
              color: "#fff", backdropFilter: "blur(4px)",
            }}>
              {restaurant.isOpen ? "● Đang mở cửa" : "● Đóng cửa"}
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 0 120px" }}>

        {/* ── MENU SECTION ── */}
        <div style={{ display: "flex", background: "#fff", marginBottom: 12 }}>

          {/* Sidebar categories */}
          {categories.length > 0 && (
            <aside ref={sidebarRef} style={{
              width: 140, flexShrink: 0,
              position: "sticky", top: 0, alignSelf: "flex-start",
              maxHeight: "calc(100vh - 80px)", overflowY: "auto",
              borderRight: "1px solid #f0f0f0",
            }}>
              {/* Tab label */}
              <div style={{
                padding: "14px 16px 8px",
                fontSize: 12, fontWeight: 700, color: "#9ca3af",
                textTransform: "uppercase", letterSpacing: "0.5px",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                🍽️ Thực đơn
              </div>
              <div style={{ borderBottom: "2px solid #ee4d2d", margin: "0 16px 8px" }} />
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                  width: "100%", padding: "11px 16px", textAlign: "left",
                  background: activeCategory === cat ? "#fff5f4" : "none",
                  border: "none", cursor: "pointer",
                  borderLeft: activeCategory === cat ? "3px solid #ee4d2d" : "3px solid transparent",
                  color: activeCategory === cat ? "#ee4d2d" : "#555",
                  fontWeight: activeCategory === cat ? 700 : 400,
                  fontSize: 13, lineHeight: 1.4, transition: "all 0.15s",
                  fontFamily: "inherit",
                }}>{cat}</button>
              ))}
            </aside>
          )}

          {/* Products grid */}
          <main style={{ flex: 1, minWidth: 0, padding: "16px 20px 24px" }}>
            {/* Category heading */}
            {activeCategory && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "linear-gradient(135deg, #ee4d2d, #ff7337)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>
                  {activeCategory.toLowerCase().includes("uống") ? "🥤" :
                   activeCategory.toLowerCase().includes("trà") ? "🍵" :
                   activeCategory.toLowerCase().includes("milo") ? "🍫" :
                   activeCategory.toLowerCase().includes("vặt") ? "🍢" : "🍽️"}
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a" }}>{activeCategory}</span>
              </div>
            )}

            {filtered.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", color: "#bbb" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🍽️</div>
                <p>Chưa có món nào</p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 14,
              }}>
                {filtered.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    qty={getQty(product._id)}
                    isAdded={addedId === product._id}
                    onView={() => setSelectedProduct(product)}
                    onAdd={(e) => handleAdd(e, product)}
                    onUpdateQty={onUpdateQty}
                  />
                ))}
              </div>
            )}
          </main>
        </div>

        {/* ── BOTTOM 2-COL: Best Sellers + Reviews ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 0" }}>

          {/* Best Sellers */}
          <div style={{ background: "#fff", borderRadius: 0, padding: "20px 20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1a1a1a" }}>
                🏆 Bán chạy nhất
              </h2>
              {bestSellers.length > 3 && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, color: "#555", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                  <button style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, color: "#555", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
                </div>
              )}
            </div>

            {bestSellers.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#bbb" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🍽️</div>
                <p style={{ fontSize: 13 }}>Chưa có món bán chạy</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {bestSellers.slice(0, 3).map(product => (
                  <div
                    key={product._id}
                    onClick={() => setSelectedProduct(product)}
                    style={{ cursor: "pointer", borderRadius: 12, overflow: "hidden", background: "#fafafa", border: "1px solid #f0f0f0" }}
                  >
                    <div style={{ position: "relative" }}>
                      <img
                        src={product.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop"}
                        alt={product.name}
                        style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }}
                      />
                      <div style={{
                        position: "absolute", top: 8, left: 8,
                        background: "linear-gradient(135deg,#ee4d2d,#ff7337)",
                        color: "#fff", fontSize: 10, fontWeight: 800,
                        padding: "2px 8px", borderRadius: 6,
                      }}>Bán chạy</div>
                    </div>
                    <div style={{ padding: "10px 10px 12px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {product.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#ee4d2d" }}>
                          {product.price?.toLocaleString("vi-VN")}đ
                        </div>
                        {(() => {
                          const qty = getQty(product._id);
                          return qty === 0 ? (
                            <button
                              onClick={e => { e.stopPropagation(); handleAdd(e, product); }}
                              style={{
                                width: 28, height: 28, borderRadius: "50%",
                                background: "#ee4d2d", color: "#fff",
                                border: "none", fontSize: 18, fontWeight: 700,
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 3px 8px rgba(238,77,45,0.35)",
                                flexShrink: 0,
                              }}
                            >+</button>
                          ) : (
                            <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 3, background: "#fff5f4", border: "1.5px solid #ee4d2d", borderRadius: 20, padding: "2px 4px", flexShrink: 0 }}>
                              <button onClick={() => onUpdateQty(product._id, qty - 1)} style={{ width: 20, height: 20, borderRadius: "50%", border: "none", background: "#fff3f2", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#ee4d2d", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                              <span style={{ fontSize: 12, fontWeight: 700, minWidth: 14, textAlign: "center", color: "#1a1a1a" }}>{qty}</span>
                              <button onClick={() => onUpdateQty(product._id, qty + 1)} style={{ width: 20, height: 20, borderRadius: "50%", border: "none", background: "#ee4d2d", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div style={{ background: "#fff", padding: "20px 20px 24px" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 800, color: "#1a1a1a" }}>
              ⭐ Đánh giá của khách
            </h2>

            {/* Form gửi đánh giá */}
            <ReviewForm
              deliveredOrder={deliveredOrder}
              restaurantId={restaurantId}
              submitLoading={submitLoading}
              submitSuccess={submitSuccess}
              onSubmit={async ({ rating, comment }) => {
                if (!deliveredOrder) return;
                setSubmitLoading(true);
                try {
                  await submitReview({ rating, comment, restaurantId, orderId: deliveredOrder._id });
                  setSubmitSuccess(true);
                  setDeliveredOrder(null);
                  const data = await getRestaurantReviews(restaurantId, 1, 20);
                  setReviews(data?.data || data || []);
                } catch (err) {
                  alert("Lỗi: " + err.message);
                } finally {
                  setSubmitLoading(false);
                }
              }}
            />

            {reviewsLoading ? (
              <div style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}>⏳ Đang tải...</div>
            ) : reviews.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
                <div style={{ fontSize: 13 }}>Chưa có đánh giá nào. Hãy là người đầu tiên!</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {/* Rating summary */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 14px", background: "#fff8f5", borderRadius: 12, marginBottom: 12 }}>
                  <div style={{ textAlign: "center", minWidth: 60 }}>
                    <div style={{ fontSize: 38, fontWeight: 900, color: "#ee4d2d", lineHeight: 1 }}>
                      {restaurant.rating?.toFixed(1) || "–"}
                    </div>
                    <div style={{ display: "flex", gap: 1, justifyContent: "center", margin: "4px 0 2px" }}>
                      {[1,2,3,4,5].map(s => (
                        <span key={s} style={{ fontSize: 13, color: s <= Math.round(restaurant.rating || 0) ? "#f59e0b" : "#e5e7eb" }}>★</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{restaurant.reviews || 0} đánh giá</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {[5,4,3,2,1].map(star => {
                      const count = reviews.filter(r => Math.round(r.rating) === star).length;
                      const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={star} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 11, color: "#6b7280", width: 8 }}>{star}</span>
                          <span style={{ fontSize: 11, color: "#f59e0b" }}>★</span>
                          <div style={{ flex: 1, height: 5, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "#f59e0b", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 10, color: "#9ca3af", width: 14 }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Review list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto", paddingRight: 2 }}>
                  {reviews.map((review, idx) => (
                    <div key={review._id || idx} style={{
                      display: "flex", gap: 10, alignItems: "flex-start",
                      padding: "12px 14px", background: "#fafafa", borderRadius: 12,
                      border: "1px solid #f0f0f0",
                    }}>
                      {review.user?.avatar ? (
                        <img src={review.user.avatar} alt={review.user.fullName}
                          style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #fee2e2" }} />
                      ) : (
                        <div style={{
                          width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                          background: `hsl(${((review.user?.fullName || "?").charCodeAt(0) * 17) % 360}, 60%, 52%)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 800, fontSize: 15,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                        }}>
                          {(review.user?.fullName || "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a" }}>
                            {review.user?.fullName || "Người dùng"}
                          </span>
                          <div style={{ display: "flex", gap: 1 }}>
                            {[1,2,3,4,5].map(s => (
                              <span key={s} style={{ fontSize: 12, color: s <= review.rating ? "#f59e0b" : "#e5e7eb" }}>★</span>
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p style={{ margin: "0 0 4px", fontSize: 13, color: "#4b5563", lineHeight: 1.55 }}>
                            {review.comment}
                          </p>
                        )}
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>
                          {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── STICKY CART BAR ── */}
      {cartCount > 0 && (
        <div style={{
          position: "fixed", bottom: 66, left: 0, right: 0, zIndex: 200,
          display: "flex", justifyContent: "center", padding: "0 16px",
          animation: "slideUp 0.3s ease",
        }}>
          <div onClick={onOpenCart} style={{
            maxWidth: 600, width: "100%",
            background: "linear-gradient(135deg, #ee4d2d, #ff6b35)",
            borderRadius: 16, padding: "14px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", boxShadow: "0 8px 24px rgba(238,77,45,0.45)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 10, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 14 }}>
                {cartCount}
              </div>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Xem giỏ hàng</span>
            </div>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{cartTotal.toLocaleString("vi-VN")}đ →</span>
          </div>
        </div>
      )}

      {/* ── PRODUCT MODAL ── */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          qty={getQty(selectedProduct._id)}
          onClose={() => setSelectedProduct(null)}
          onAdd={(e) => handleAdd(e, selectedProduct)}
          onUpdateQty={onUpdateQty}
        />
      )}

      {/* ── TOPPING MODAL ── */}
      {toppingModal && (() => {
        const { product } = toppingModal;
        const extraTotal = selectedToppings.reduce((s, t) => s + (t.extraPrice || 0), 0);
        const finalPrice = product.price + extraTotal;
        return (
          <div onClick={() => setToppingModal(null)} style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(15,15,15,0.65)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px 16px", animation: "fadeIn 0.2s ease",
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: "#fff", borderRadius: 24,
              width: "100%", maxWidth: 780, overflow: "hidden",
              boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
              animation: "modalPop 0.3s cubic-bezier(.175,.885,.32,1.2)",
              display: "flex", maxHeight: "90vh",
            }}>
              <div style={{ width: 340, flexShrink: 0, position: "relative", overflow: "hidden" }}>
                <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />
                {product.isBestSeller && (
                  <div style={{ position: "absolute", top: 16, left: 16, background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#fff", fontSize: 12, fontWeight: 800, padding: "5px 12px", borderRadius: 20 }}>⭐ Best Seller</div>
                )}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 20px 22px" }}>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 20, marginBottom: 4, textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>{product.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>Giá gốc:</span>
                    <span style={{ color: "#ffd580", fontWeight: 800, fontSize: 15 }}>{product.price.toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "24px 28px 18px", borderBottom: "1px solid #f5f5f5", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a", marginBottom: 4 }}>Chọn topping</div>
                    <div style={{ fontSize: 13, color: "#aaa" }}>Tuỳ chọn • Có thể chọn nhiều</div>
                  </div>
                  <button onClick={() => setToppingModal(null)} style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: "#f5f5f5", border: "none", cursor: "pointer", fontSize: 16, color: "#999", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "16px 28px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {product.toppings.map((topping, i) => {
                      const isSelected = selectedToppings.some(t => t.name === topping.name);
                      return (
                        <div key={i} onClick={() => toggleTopping(topping)} style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "14px 18px", borderRadius: 14, cursor: "pointer",
                          border: isSelected ? "2px solid #ee4d2d" : "1.5px solid #eee",
                          background: isSelected ? "#fff5f4" : "#fafafa",
                          transition: "all 0.15s", userSelect: "none",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, border: isSelected ? "none" : "2px solid #d1d5db", background: isSelected ? "#ee4d2d" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                              {isSelected && <span style={{ color: "#fff", fontSize: 13, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                            </div>
                            <span style={{ fontSize: 14, fontWeight: isSelected ? 700 : 500, color: "#1a1a1a" }}>{topping.name}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: topping.extraPrice > 0 ? "#ee4d2d" : "#10b981", background: topping.extraPrice > 0 ? "#fff0eb" : "#f0fdf4", padding: "3px 10px", borderRadius: 20 }}>
                            {topping.extraPrice > 0 ? `+${topping.extraPrice.toLocaleString("vi-VN")}đ` : "Miễn phí"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ padding: "18px 28px", borderTop: "1px solid #f5f5f5", background: "#fafafa" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#aaa", marginBottom: 2 }}>Tổng tiền</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: 26, fontWeight: 900, color: "#ee4d2d" }}>{finalPrice.toLocaleString("vi-VN")}đ</span>
                        {extraTotal > 0 && <span style={{ fontSize: 12, color: "#aaa" }}>({product.price.toLocaleString("vi-VN")} + {extraTotal.toLocaleString("vi-VN")}đ topping)</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={handleConfirmTopping} style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #ee4d2d, #ff6b35)", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: "0 6px 20px rgba(238,77,45,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>
                    🛒 Thêm vào giỏ hàng
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes modalPop { from { opacity: 0; transform: scale(0.92) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
        @media (max-width: 900px) {
          .product-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .bottom-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .product-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

// ── Product Card ──
function ProductCard({ product, qty, isAdded, onView, onAdd, onUpdateQty }) {
  return (
    <div
      onClick={onView}
      style={{
        background: "#fff", borderRadius: 14, overflow: "hidden", cursor: "pointer",
        boxShadow: "0 2px 10px rgba(0,0,0,0.07)", border: "1px solid #f0f0f0",
        transition: "transform 0.18s, box-shadow 0.18s", display: "flex", flexDirection: "column",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.13)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.07)"; }}
    >
      <div style={{ position: "relative", paddingBottom: "75%", overflow: "hidden" }}>
        <img
          src={product.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop"}
          alt={product.name}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        />
        {product.isBestSeller && (
          <div style={{ position: "absolute", top: 8, left: 8, background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 8 }}>
            Hot
          </div>
        )}
      </div>

      <div style={{ padding: "10px 10px 10px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 700, color: "#1a1a1a", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4 }}>
            {product.name}
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#ee4d2d" }}>
            {product.price?.toLocaleString("vi-VN")}đ
          </span>

          {qty === 0 ? (
            <button onClick={onAdd} style={{
              width: 30, height: 30, borderRadius: "50%",
              background: isAdded ? "#10b981" : "#ee4d2d",
              color: "#fff", border: "none", fontSize: 20, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: isAdded ? "0 3px 10px rgba(16,185,129,0.4)" : "0 3px 10px rgba(238,77,45,0.35)",
              transform: isAdded ? "scale(1.2) rotate(20deg)" : "scale(1)",
              transition: "all 0.2s ease", flexShrink: 0,
            }}>
              {isAdded ? "✓" : "+"}
            </button>
          ) : (
            <div onClick={e => e.stopPropagation()} style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "#fff5f4", border: "1.5px solid #ee4d2d",
              borderRadius: 20, padding: "2px 5px", flexShrink: 0,
            }}>
              <button onClick={() => onUpdateQty(product._id, qty - 1)} style={{ width: 22, height: 22, borderRadius: "50%", border: "none", background: "#fff3f2", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#ee4d2d", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
              <span style={{ fontSize: 12, fontWeight: 700, minWidth: 14, textAlign: "center", color: "#1a1a1a" }}>{qty}</span>
              <button onClick={() => onUpdateQty(product._id, qty + 1)} style={{ width: 22, height: 22, borderRadius: "50%", border: "none", background: "#ee4d2d", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Product Modal ──
function ProductModal({ product, qty, onClose, onAdd, onUpdateQty }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(15,15,15,0.65)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px 16px", animation: "fadeIn 0.2s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 24, width: "100%", maxWidth: 780,
        overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
        animation: "modalPop 0.3s cubic-bezier(.175,.885,.32,1.2)",
        display: "flex", maxHeight: "90vh",
      }}>
        <div style={{ width: 340, flexShrink: 0, position: "relative", overflow: "hidden" }}>
          <img src={product.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop"} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }} />
          {product.isBestSeller && <div style={{ position: "absolute", top: 16, left: 16, background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#fff", fontSize: 12, fontWeight: 800, padding: "5px 12px", borderRadius: 20 }}>⭐ Best Seller</div>}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #f5f5f5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ flex: 1, paddingRight: 12 }}>
                <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: "#1a1a1a", lineHeight: 1.3 }}>{product.name}</h2>
                {product.description && <p style={{ margin: 0, fontSize: 14, color: "#888", lineHeight: 1.6 }}>{product.description}</p>}
              </div>
              <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: "#f5f5f5", border: "none", cursor: "pointer", fontSize: 16, color: "#999", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: "#ee4d2d" }}>{product.price?.toLocaleString("vi-VN")}đ</span>
              {!product.isAvailable && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#fee2e2", color: "#ef4444" }}>Hết hàng</span>}
            </div>
          </div>

          {product.allowToppings && product.toppings?.length > 0 && (
            <div style={{ padding: "16px 28px", borderBottom: "1px solid #f5f5f5" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 10 }}>
                <span style={{ background: "#fff0eb", color: "#ee4d2d", padding: "2px 8px", borderRadius: 6, fontSize: 11, marginRight: 6 }}>Tuỳ chọn</span>
                Topping có thể thêm
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {product.toppings.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "#fafafa", border: "1px solid #eee", fontSize: 13 }}>
                    <span style={{ color: "#333", fontWeight: 500 }}>{t.name}</span>
                    <span style={{ color: "#ee4d2d", fontWeight: 700, fontSize: 12 }}>{t.extraPrice > 0 ? `+${t.extraPrice.toLocaleString("vi-VN")}đ` : "free"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ flex: 1 }} />

          <div style={{ padding: "20px 28px", borderTop: "1px solid #f5f5f5", background: "#fafafa" }}>
            {qty === 0 ? (
              <button
                onClick={e => { onAdd(e); onClose(); }}
                disabled={!product.isAvailable}
                style={{
                  width: "100%", padding: "15px", borderRadius: 14, border: "none",
                  background: product.isAvailable ? "linear-gradient(135deg, #ee4d2d, #ff6b35)" : "#e5e7eb",
                  color: product.isAvailable ? "#fff" : "#9ca3af",
                  fontWeight: 800, fontSize: 16, cursor: product.isAvailable ? "pointer" : "not-allowed",
                  boxShadow: product.isAvailable ? "0 6px 20px rgba(238,77,45,0.35)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontFamily: "inherit",
                }}
              >
                {product.isAvailable ? (product.allowToppings && product.toppings?.length > 0 ? "🧋 Chọn topping & Thêm vào giỏ" : "🛒 Thêm vào giỏ hàng") : "Tạm hết hàng"}
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, color: "#888", fontWeight: 500 }}>Đã thêm vào giỏ</span>
                <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "2px solid #ee4d2d", borderRadius: 50, padding: "4px 8px" }}>
                  <button onClick={() => onUpdateQty(product._id, qty - 1)} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: qty === 1 ? "#fee2e2" : "#fff3f2", cursor: "pointer", fontSize: 20, fontWeight: 700, color: "#ee4d2d", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                  <span style={{ fontSize: 18, fontWeight: 800, minWidth: 24, textAlign: "center", color: "#1a1a1a" }}>{qty}</span>
                  <button onClick={() => onUpdateQty(product._id, qty + 1)} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "#ee4d2d", cursor: "pointer", fontSize: 20, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ReviewForm Component ──
function ReviewForm({ deliveredOrder, submitLoading, submitSuccess, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  if (submitSuccess) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 16px", background: "#f0fdf4",
        borderRadius: 12, border: "1.5px solid #bbf7d0", marginBottom: 16,
      }}>
        <span style={{ fontSize: 22 }}>✅</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#16a34a" }}>Cảm ơn bạn đã đánh giá!</div>
          <div style={{ fontSize: 12, color: "#4ade80" }}>Đánh giá của bạn đã được ghi nhận.</div>
        </div>
      </div>
    );
  }

  if (!deliveredOrder) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 14px", background: "#f9fafb",
        borderRadius: 12, border: "1.5px dashed #e5e7eb", marginBottom: 14,
      }}>
        <span style={{ fontSize: 18 }}>🔒</span>
        <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>
          Chỉ khách hàng đã nhận đơn hàng mới có thể đánh giá.
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (rating === 0) { alert("Vui lòng chọn số sao!"); return; }
    onSubmit({ rating, comment });
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #fff8f5, #fff)",
      border: "1.5px solid #fde8e0",
      borderRadius: 14, padding: "16px", marginBottom: 16,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 10 }}>
        ✍️ Viết đánh giá của bạn
      </div>

      {/* Star picker */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {[1,2,3,4,5].map(s => (
          <span
            key={s}
            onClick={() => setRating(s)}
            onMouseEnter={() => setHoverRating(s)}
            onMouseLeave={() => setHoverRating(0)}
            style={{
              fontSize: 28, cursor: "pointer",
              color: s <= (hoverRating || rating) ? "#f59e0b" : "#e5e7eb",
              transition: "color 0.1s, transform 0.1s",
              transform: s <= (hoverRating || rating) ? "scale(1.2)" : "scale(1)",
              display: "inline-block",
            }}
          >★</span>
        ))}
        {rating > 0 && (
          <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 6, alignSelf: "center" }}>
            {["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"][rating]}
          </span>
        )}
      </div>

      {/* Comment textarea */}
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Chia sẻ trải nghiệm của bạn về nhà hàng này..."
        rows={3}
        style={{
          width: "100%", boxSizing: "border-box",
          border: "1.5px solid #e5e7eb", borderRadius: 10,
          padding: "10px 12px", fontSize: 13,
          fontFamily: "inherit", resize: "none", outline: "none",
          lineHeight: 1.6, color: "#374151",
          transition: "border-color 0.15s",
        }}
        onFocus={e => e.target.style.borderColor = "#ee4d2d"}
        onBlur={e => e.target.style.borderColor = "#e5e7eb"}
      />

      <button
        onClick={handleSubmit}
        disabled={submitLoading || rating === 0}
        style={{
          marginTop: 10, padding: "10px 20px",
          borderRadius: 10, border: "none",
          background: rating === 0 ? "#e5e7eb" : "linear-gradient(135deg, #ee4d2d, #ff6b35)",
          color: rating === 0 ? "#9ca3af" : "#fff",
          fontWeight: 700, fontSize: 13, cursor: rating === 0 ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: 6,
          boxShadow: rating > 0 ? "0 4px 12px rgba(238,77,45,0.3)" : "none",
          fontFamily: "inherit", transition: "all 0.2s",
        }}
      >
        {submitLoading ? "⏳ Đang gửi..." : "📨 Gửi đánh giá"}
      </button>
    </div>
  );
}
