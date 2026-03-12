import { useState, useEffect } from "react";
import { getRestaurantProducts } from "../services/brand-api";
import { getRestaurantReviews } from "../services/review-api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export default function RestaurantDetailPage({ restaurantId, cart, onAddToCart, onUpdateQty, navigate, onOpenCart }) {
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addedId, setAddedId] = useState(null); // animation trigger
  const [toppingModal, setToppingModal] = useState(null); // { product }
  const [selectedToppings, setSelectedToppings] = useState([]); // [{name, extraPrice}]
  const [activeTab, setActiveTab] = useState("menu"); // "menu" | "reviews"
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

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

  // Fetch reviews khi chuyển sang tab đánh giá
  useEffect(() => {
    if (activeTab !== "reviews" || !restaurantId) return;
    setReviewsLoading(true);
    getRestaurantReviews(restaurantId, 1, 20)
      .then(data => setReviews(data?.data || data || []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [activeTab, restaurantId]);

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const filtered = activeCategory ? products.filter(p => p.category === activeCategory) : products;

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
      _toppingKey: toppingNames, // để phân biệt variant trong cart
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
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "'Inter', sans-serif" }}>
      {/* ── HERO ─────────────────────────────── */}
      <div style={{ position: "relative", height: 260, overflow: "hidden" }}>
        <img src={restaurant.image} alt={restaurant.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)" }} />

        {/* Back btn */}
        <button onClick={() => navigate("/home")} style={{
          position: "absolute", top: 16, left: 16,
          width: 38, height: 38, borderRadius: "50%",
          background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.3)", color: "#fff",
          fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>←</button>

        {/* Info overlay */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                {restaurant.name}
              </h1>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span style={{ color: "#ffd700", fontSize: 13, fontWeight: 600 }}>⭐ {restaurant.rating?.toFixed(1)} <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 400 }}>({restaurant.reviews}+)</span></span>
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>🕐 {restaurant.deliveryTime} phút</span>
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>📍 {restaurant.distance}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: restaurant.isOpen ? "#6ee7b7" : "#fca5a5" }}>
                  {restaurant.isOpen ? "● Đang mở cửa" : "● Đóng cửa"}
                </span>
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", borderRadius: 12, padding: "8px 14px", border: "1px solid rgba(255,255,255,0.2)", textAlign: "center", flexShrink: 0 }}>
              <div style={{ color: "#fff", fontSize: 11, opacity: 0.8 }}>Giao hàng</div>
              <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>{restaurant.deliveryFee?.toLocaleString("vi-VN")}đ</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────── */}
      <div style={{ display: "flex", maxWidth: 1000, margin: "0 auto", position: "relative", flexDirection: "column" }}>

        {/* ── TAB BAR ── */}
        <div style={{ display: "flex", background: "#fff", borderBottom: "1px solid #eee", position: "sticky", top: 0, zIndex: 10 }}>
          {[
            { key: "menu", label: "🍽️ Thực đơn" },
            { key: "reviews", label: `⭐ Đánh giá (${restaurant.reviews || 0})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              flex: 1, padding: "14px 0", border: "none", background: "none", cursor: "pointer",
              fontSize: 14, fontWeight: activeTab === tab.key ? 700 : 400,
              color: activeTab === tab.key ? "#ee4d2d" : "#555",
              borderBottom: activeTab === tab.key ? "2px solid #ee4d2d" : "2px solid transparent",
              transition: "all 0.2s",
            }}>{tab.label}</button>
          ))}
        </div>

        {/* ── REVIEWS TAB ── */}
        {activeTab === "reviews" && (
          <div style={{ padding: "16px", maxWidth: 700, margin: "0 auto", width: "100%" }}>
            {/* Rating summary */}
            <div style={{
              background: "#fff", borderRadius: 14, padding: "20px 24px", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: "#ee4d2d", lineHeight: 1 }}>
                  {restaurant.rating?.toFixed(1) || "–"}
                </div>
                <div style={{ display: "flex", gap: 2, justifyContent: "center", margin: "6px 0 4px" }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ fontSize: 18, color: s <= Math.round(restaurant.rating || 0) ? "#f59e0b" : "#e5e7eb" }}>★</span>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>{restaurant.reviews || 0} đánh giá</div>
              </div>
              <div style={{ flex: 1 }}>
                {[5,4,3,2,1].map(star => {
                  const count = reviews.filter(r => Math.round(r.rating) === star).length;
                  const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#6b7280", width: 10 }}>{star}</span>
                      <span style={{ fontSize: 12, color: "#f59e0b" }}>★</span>
                      <div style={{ flex: 1, height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "#f59e0b", borderRadius: 3, transition: "width 0.5s" }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#9ca3af", width: 16 }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review list */}
            {reviewsLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>⏳ Đang tải đánh giá...</div>
            ) : reviews.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 14, color: "#9ca3af" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
                <div>Chưa có đánh giá nào</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {reviews.map((review, idx) => (
                  <div key={review._id || idx} style={{
                    background: "#fff", borderRadius: 12, padding: "16px 18px",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      {/* Avatar */}
                      <div style={{
                        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg,#ee4d2d,#ff7337)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontWeight: 700, fontSize: 15,
                      }}>
                        {(review.user?.fullName || "?")[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>
                          {review.user?.fullName || "Người dùng"}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>
                          {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                      </div>
                      {/* Stars */}
                      <div style={{ display: "flex", gap: 1 }}>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} style={{ fontSize: 15, color: s <= review.rating ? "#f59e0b" : "#e5e7eb" }}>★</span>
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.6, paddingLeft: 48 }}>
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MENU TAB ── */}
        {activeTab === "menu" && (
        <div style={{ display: "flex" }}>
        {categories.length > 0 && (
          <aside style={{
            width: 130, flexShrink: 0, position: "sticky", top: 64,
            alignSelf: "flex-start", maxHeight: "calc(100vh - 80px)", overflowY: "auto",
            background: "#fff", borderRight: "1px solid #eee",
          }}>
            <div style={{ padding: "12px 0" }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                  width: "100%", padding: "12px 14px", textAlign: "left",
                  background: activeCategory === cat ? "#fff5f4" : "none",
                  border: "none", cursor: "pointer",
                  borderLeft: activeCategory === cat ? "3px solid #ee4d2d" : "3px solid transparent",
                  color: activeCategory === cat ? "#ee4d2d" : "#555",
                  fontWeight: activeCategory === cat ? 700 : 400,
                  fontSize: 13, lineHeight: 1.4,
                  transition: "all 0.15s",
                }}>{cat}</button>
              ))}
            </div>
          </aside>
        )}

        {/* Product list */}
        <main style={{ flex: 1, minWidth: 0, padding: "16px 16px 100px" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "#bbb" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🍽️</div>
              <p>Chưa có món nào</p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
              gap: 14,
            }}>
              {filtered.map((product) => {
                const qty = getQty(product._id);
                const isAdded = addedId === product._id;
                return (
                  <div key={product._id}
                    onClick={() => setSelectedProduct(product)}
                    style={{
                      background: "#fff",
                      borderRadius: 16,
                      overflow: "hidden",
                      cursor: "pointer",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                      border: "1px solid #f0f0f0",
                      transition: "transform 0.18s, box-shadow 0.18s",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.13)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"; }}
                  >
                    {/* Square image */}
                    <div style={{ position: "relative", paddingBottom: "75%", overflow: "hidden" }}>
                      <img
                        src={product.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop"}
                        alt={product.name}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                      />
                      {product.isBestSeller && (
                        <div style={{ position: "absolute", top: 8, left: 8, background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 8, boxShadow: "0 2px 8px rgba(245,158,11,0.4)" }}>
                          Hot
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: "12px 12px 10px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <h3 style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 700, color: "#1a1a1a", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4 }}>
                          {product.name}
                        </h3>
                        {product.description && (
                          <p style={{ margin: "0 0 8px", fontSize: 11.5, color: "#aaa", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: "#ee4d2d" }}>
                          {product.price?.toLocaleString("vi-VN")}đ
                        </span>

                        {qty === 0 ? (
                          <button onClick={e => handleAdd(e, product)} style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: isAdded ? "#10b981" : "#ee4d2d",
                            color: "#fff", border: "none", fontSize: 20, fontWeight: 700,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: isAdded ? "0 3px 10px rgba(16,185,129,0.4)" : "0 3px 10px rgba(238,77,45,0.35)",
                            transform: isAdded ? "scale(1.2) rotate(20deg)" : "scale(1)",
                            transition: "all 0.2s ease",
                            flexShrink: 0,
                          }}>
                            {isAdded ? "✓" : "+"}
                          </button>
                        ) : (
                          <div onClick={e => e.stopPropagation()} style={{
                            display: "flex", alignItems: "center", gap: 4,
                            background: "#fff5f4", border: "1.5px solid #ee4d2d",
                            borderRadius: 20, padding: "2px 5px", flexShrink: 0,
                          }}>
                            <button onClick={() => onUpdateQty(product._id, qty - 1)} style={{
                              width: 24, height: 24, borderRadius: "50%", border: "none",
                              background: "#fff3f2", cursor: "pointer", fontSize: 15, fontWeight: 700,
                              color: "#ee4d2d", display: "flex", alignItems: "center", justifyContent: "center",
                            }}>−</button>
                            <span style={{ fontSize: 13, fontWeight: 700, minWidth: 16, textAlign: "center", color: "#1a1a1a" }}>{qty}</span>
                            <button onClick={() => onUpdateQty(product._id, qty + 1)} style={{
                              width: 24, height: 24, borderRadius: "50%", border: "none",
                              background: "#ee4d2d", cursor: "pointer", fontSize: 15, fontWeight: 700,
                              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                            }}>+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
        </div>
        )}
      </div>

      {/* ── STICKY CART BAR ───────────────────── */}
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

      {/* ── PRODUCT MODAL ─────────────────────── */}
      {selectedProduct && (
        <div onClick={() => setSelectedProduct(null)} style={{
          position: "fixed", inset: 0, zIndex: 400,
          background: "rgba(15,15,15,0.65)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px 16px",
          animation: "fadeIn 0.2s ease",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff",
            borderRadius: 24,
            width: "100%", maxWidth: 780,
            overflow: "hidden",
            boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
            animation: "modalPop 0.3s cubic-bezier(.175,.885,.32,1.2)",
            display: "flex",
            maxHeight: "90vh",
          }}>
            {/* Left: Image */}
            <div style={{ width: 340, flexShrink: 0, position: "relative", overflow: "hidden" }}>
              <img
                src={selectedProduct.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop"}
                alt={selectedProduct.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              {/* Gradient overlay bottom */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }} />
              {selectedProduct.isBestSeller && (
                <div style={{
                  position: "absolute", top: 16, left: 16,
                  background: "linear-gradient(135deg,#f59e0b,#fbbf24)",
                  color: "#fff", fontSize: 12, fontWeight: 800,
                  padding: "5px 12px", borderRadius: 20,
                  boxShadow: "0 2px 10px rgba(245,158,11,0.5)",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  ⭐ Best Seller
                </div>
              )}
              {/* Category tag */}
              {selectedProduct.category && (
                <div style={{
                  position: "absolute", bottom: 14, left: 14,
                  background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
                  color: "#fff", fontSize: 11, fontWeight: 600,
                  padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.3)",
                }}>
                  {selectedProduct.category}
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Header */}
              <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #f5f5f5" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ flex: 1, paddingRight: 12 }}>
                    <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: "#1a1a1a", lineHeight: 1.3 }}>
                      {selectedProduct.name}
                    </h2>
                    {selectedProduct.description && (
                      <p style={{ margin: 0, fontSize: 14, color: "#888", lineHeight: 1.6 }}>
                        {selectedProduct.description}
                      </p>
                    )}
                  </div>
                  <button onClick={() => setSelectedProduct(null)} style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: "#f5f5f5", border: "none", cursor: "pointer",
                    fontSize: 16, color: "#999", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "#ffe8e4"}
                    onMouseLeave={e => e.currentTarget.style.background = "#f5f5f5"}
                  >✕</button>
                </div>

                {/* Price + type badges */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: "#ee4d2d" }}>
                    {selectedProduct.price?.toLocaleString("vi-VN")}đ
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                    background: selectedProduct.type === "drink" ? "#e0f2fe" : "#fef3c7",
                    color: selectedProduct.type === "drink" ? "#0369a1" : "#92400e",
                  }}>
                    {selectedProduct.type === "drink" ? "🧋 Đồ uống" : "🍽️ Đồ ăn"}
                  </span>
                  {!selectedProduct.isAvailable && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#fee2e2", color: "#ef4444" }}>
                      Hết hàng
                    </span>
                  )}
                </div>
              </div>

              {/* Toppings info */}
              {selectedProduct.allowToppings && selectedProduct.toppings?.length > 0 && (
                <div style={{ padding: "16px 28px", borderBottom: "1px solid #f5f5f5" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ background: "#fff0eb", color: "#ee4d2d", padding: "2px 8px", borderRadius: 6, fontSize: 11 }}>Tuỳ chọn</span>
                    Topping có thể thêm
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {selectedProduct.toppings.map((t, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 12px", borderRadius: 20,
                        background: "#fafafa", border: "1px solid #eee",
                        fontSize: 13,
                      }}>
                        <span style={{ color: "#333", fontWeight: 500 }}>{t.name}</span>
                        <span style={{ color: "#ee4d2d", fontWeight: 700, fontSize: 12 }}>
                          {t.extraPrice > 0 ? `+${t.extraPrice.toLocaleString("vi-VN")}đ` : "free"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Action footer */}
              <div style={{ padding: "20px 28px", borderTop: "1px solid #f5f5f5", background: "#fafafa" }}>
                {getQty(selectedProduct._id) === 0 ? (
                  <button
                    onClick={e => { handleAdd(e, selectedProduct); setSelectedProduct(null); }}
                    disabled={!selectedProduct.isAvailable}
                    style={{
                      width: "100%", padding: "15px", borderRadius: 14, border: "none",
                      background: selectedProduct.isAvailable
                        ? "linear-gradient(135deg, #ee4d2d, #ff6b35)"
                        : "#e5e7eb",
                      color: selectedProduct.isAvailable ? "#fff" : "#9ca3af",
                      fontWeight: 800, fontSize: 16, cursor: selectedProduct.isAvailable ? "pointer" : "not-allowed",
                      boxShadow: selectedProduct.isAvailable ? "0 6px 20px rgba(238,77,45,0.35)" : "none",
                      transition: "transform 0.1s, box-shadow 0.1s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                    onMouseEnter={e => { if (selectedProduct.isAvailable) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(238,77,45,0.45)"; }}}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = selectedProduct.isAvailable ? "0 6px 20px rgba(238,77,45,0.35)" : "none"; }}
                  >
                    {selectedProduct.isAvailable ? (
                      <>{selectedProduct.allowToppings && selectedProduct.toppings?.length > 0 ? "🧋 Chọn topping & Thêm vào giỏ" : "🛒 Thêm vào giỏ hàng"}</>
                    ) : "Tạm hết hàng"}
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, color: "#888", fontWeight: 500 }}>Đã thêm vào giỏ</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "2px solid #ee4d2d", borderRadius: 50, padding: "4px 8px" }}>
                      <button onClick={() => onUpdateQty(selectedProduct._id, getQty(selectedProduct._id) - 1)}
                        style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: getQty(selectedProduct._id) === 1 ? "#fee2e2" : "#fff3f2", cursor: "pointer", fontSize: 20, fontWeight: 700, color: "#ee4d2d", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <span style={{ fontSize: 18, fontWeight: 800, minWidth: 24, textAlign: "center", color: "#1a1a1a" }}>{getQty(selectedProduct._id)}</span>
                      <button onClick={() => onUpdateQty(selectedProduct._id, getQty(selectedProduct._id) + 1)}
                        style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "#ee4d2d", cursor: "pointer", fontSize: 20, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOPPING MODAL ──────────────────────── */}
      {toppingModal && (() => {
        const { product } = toppingModal;
        const extraTotal = selectedToppings.reduce((s, t) => s + (t.extraPrice || 0), 0);
        const finalPrice = product.price + extraTotal;
        return (
          <div onClick={() => setToppingModal(null)} style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(15,15,15,0.65)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px 16px",
            animation: "fadeIn 0.2s ease",
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: "#fff", borderRadius: 24,
              width: "100%", maxWidth: 780,
              overflow: "hidden",
              boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
              animation: "modalPop 0.3s cubic-bezier(.175,.885,.32,1.2)",
              display: "flex",
              maxHeight: "90vh",
            }}>
              {/* Left: Image */}
              <div style={{ width: 340, flexShrink: 0, position: "relative", overflow: "hidden" }}>
                <img src={product.image} alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />
                {product.isBestSeller && (
                  <div style={{
                    position: "absolute", top: 16, left: 16,
                    background: "linear-gradient(135deg,#f59e0b,#fbbf24)",
                    color: "#fff", fontSize: 12, fontWeight: 800,
                    padding: "5px 12px", borderRadius: 20,
                    boxShadow: "0 2px 10px rgba(245,158,11,0.5)",
                  }}>⭐ Best Seller</div>
                )}
                {/* Bottom info on image */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 20px 22px" }}>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 20, marginBottom: 4, textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
                    {product.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>Giá gốc:</span>
                    <span style={{ color: "#ffd580", fontWeight: 800, fontSize: 15 }}>{product.price.toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>
              </div>

              {/* Right: Topping selector */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "24px 28px 18px", borderBottom: "1px solid #f5f5f5", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a", marginBottom: 4 }}>
                      Chọn topping
                    </div>
                    <div style={{ fontSize: 13, color: "#aaa" }}>Tuỳ chọn • Có thể chọn nhiều</div>
                  </div>
                  <button onClick={() => setToppingModal(null)} style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: "#f5f5f5", border: "none", cursor: "pointer",
                    fontSize: 16, color: "#999", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "#ffe8e4"}
                    onMouseLeave={e => e.currentTarget.style.background = "#f5f5f5"}
                  >✕</button>
                </div>

                {/* Topping list */}
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
                          transition: "all 0.15s",
                          userSelect: "none",
                        }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f5f5f5"; }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "#fafafa"; }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {/* Custom checkbox */}
                            <div style={{
                              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                              border: isSelected ? "none" : "2px solid #d1d5db",
                              background: isSelected ? "#ee4d2d" : "#fff",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              transition: "all 0.15s",
                              boxShadow: isSelected ? "0 2px 8px rgba(238,77,45,0.35)" : "none",
                            }}>
                              {isSelected && <span style={{ color: "#fff", fontSize: 13, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                            </div>
                            <span style={{ fontSize: 14, fontWeight: isSelected ? 700 : 500, color: "#1a1a1a" }}>
                              {topping.name}
                            </span>
                          </div>
                          <span style={{
                            fontSize: 13, fontWeight: 700,
                            color: topping.extraPrice > 0 ? "#ee4d2d" : "#10b981",
                            background: topping.extraPrice > 0 ? "#fff0eb" : "#f0fdf4",
                            padding: "3px 10px", borderRadius: 20,
                          }}>
                            {topping.extraPrice > 0 ? `+${topping.extraPrice.toLocaleString("vi-VN")}đ` : "Miễn phí"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ padding: "18px 28px", borderTop: "1px solid #f5f5f5", background: "#fafafa" }}>
                  {/* Price summary */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#aaa", marginBottom: 2 }}>Tổng tiền</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: 26, fontWeight: 900, color: "#ee4d2d" }}>
                          {finalPrice.toLocaleString("vi-VN")}đ
                        </span>
                        {extraTotal > 0 && (
                          <span style={{ fontSize: 12, color: "#aaa", fontWeight: 500 }}>
                            ({product.price.toLocaleString("vi-VN")} + {extraTotal.toLocaleString("vi-VN")}đ topping)
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedToppings.length > 0 && (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 180 }}>
                        {selectedToppings.map((t, i) => (
                          <span key={i} style={{ fontSize: 11, background: "#ee4d2d", color: "#fff", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={handleConfirmTopping}
                    style={{
                      width: "100%", padding: "15px", borderRadius: 14, border: "none",
                      background: "linear-gradient(135deg, #ee4d2d, #ff6b35)",
                      color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer",
                      boxShadow: "0 6px 20px rgba(238,77,45,0.35)",
                      transition: "transform 0.1s, box-shadow 0.1s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(238,77,45,0.45)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(238,77,45,0.35)"; }}
                  >
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
      `}</style>
    </div>
  );
}
