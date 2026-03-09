import { useState, useEffect } from "react";
import { getRestaurantProducts } from "../services/brand-api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export default function RestaurantDetailPage({ restaurantId, cart, onAddToCart, onUpdateQty, navigate, onOpenCart }) {
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addedId, setAddedId] = useState(null); // animation trigger

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

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const filtered = activeCategory ? products.filter(p => p.category === activeCategory) : products;

  const getQty = (id) => cart?.items?.find(i => i.productId === id)?.quantity || 0;
  const cartCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const cartTotal = cart?.items?.reduce((s, i) => s + i.price * i.quantity, 0) || 0;

  const handleAdd = (e, product) => {
    e.stopPropagation();
    onAddToCart(restaurant, product);
    setAddedId(product._id);
    setTimeout(() => setAddedId(null), 600);
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
      <div style={{ display: "flex", maxWidth: 1000, margin: "0 auto", position: "relative" }}>

        {/* Category sidebar */}
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
        <main style={{ flex: 1, minWidth: 0 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "#bbb" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🍽️</div>
              <p>Chưa có món nào</p>
            </div>
          ) : (
            <div style={{ padding: "8px 0" }}>
              {filtered.map((product, idx) => {
                const qty = getQty(product._id);
                const isAdded = addedId === product._id;
                return (
                  <div key={product._id}
                    onClick={() => setSelectedProduct(product)}
                    style={{
                      display: "flex", gap: 0,
                      background: "#fff",
                      borderBottom: "1px solid #f0f0f0",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                  >
                    {/* Image */}
                    <div style={{ width: 110, height: 110, flexShrink: 0, position: "relative", overflow: "hidden" }}>
                      <img src={product.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop"}
                        alt={product.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {product.isBestSeller && (
                        <div style={{ position: "absolute", top: 6, left: 6, background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 8 }}>
                          ⭐ Hot
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, padding: "14px 14px 14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
                      <div>
                        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {product.name}
                        </h3>
                        {product.description && (
                          <p style={{ margin: "0 0 8px", fontSize: 12.5, color: "#888", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {product.description}
                          </p>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: "#ee4d2d" }}>
                          {product.price?.toLocaleString("vi-VN")}đ
                        </span>

                        {/* Qty control */}
                        {qty === 0 ? (
                          <button onClick={e => handleAdd(e, product)} style={{
                            width: 34, height: 34, borderRadius: "50%",
                            background: isAdded ? "#10b981" : "#ee4d2d",
                            color: "#fff", border: "none", fontSize: 22, fontWeight: 700,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 3px 10px rgba(238,77,45,0.35)",
                            transform: isAdded ? "scale(1.2)" : "scale(1)",
                            transition: "all 0.2s ease",
                            flexShrink: 0,
                          }}>
                            {isAdded ? "✓" : "+"}
                          </button>
                        ) : (
                          <div onClick={e => e.stopPropagation()} style={{
                            display: "flex", alignItems: "center", gap: 6,
                            background: "#fff", border: "1.5px solid #ee4d2d",
                            borderRadius: 20, padding: "3px 6px",
                            flexShrink: 0,
                          }}>
                            <button onClick={() => onUpdateQty(product._id, qty - 1)} style={{
                              width: 26, height: 26, borderRadius: "50%", border: "none",
                              background: qty === 1 ? "#fee2e2" : "#fff3f2",
                              cursor: "pointer", fontSize: 16, fontWeight: 700,
                              color: "#ee4d2d", display: "flex", alignItems: "center", justifyContent: "center",
                            }}>−</button>
                            <span style={{ fontSize: 14, fontWeight: 700, minWidth: 18, textAlign: "center", color: "#1a1a1a" }}>{qty}</span>
                            <button onClick={() => onUpdateQty(product._id, qty + 1)} style={{
                              width: 26, height: 26, borderRadius: "50%", border: "none",
                              background: "#ee4d2d", cursor: "pointer", fontSize: 16, fontWeight: 700,
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
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "flex-end",
          animation: "fadeIn 0.2s ease",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: "24px 24px 0 0", width: "100%",
            maxWidth: 560, margin: "0 auto",
            padding: "0 0 32px", overflow: "hidden",
            animation: "slideUp 0.25s ease",
            maxHeight: "85vh", overflowY: "auto",
          }}>
            {/* Modal image */}
            <div style={{ position: "relative", height: 200 }}>
              <img src={selectedProduct.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=300&fit=crop"}
                alt={selectedProduct.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button onClick={() => setSelectedProduct(null)} style={{
                position: "absolute", top: 14, right: 14,
                width: 34, height: 34, borderRadius: "50%",
                background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
                border: "none", color: "#fff", fontSize: 18, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
              {selectedProduct.isBestSeller && (
                <div style={{ position: "absolute", bottom: 12, left: 16, background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 10 }}>
                  ⭐ Best Seller
                </div>
              )}
            </div>

            {/* Modal content */}
            <div style={{ padding: "20px 24px 0" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>
                {selectedProduct.name}
              </h2>
              {selectedProduct.description && (
                <p style={{ margin: "0 0 16px", fontSize: 14, color: "#666", lineHeight: 1.6 }}>{selectedProduct.description}</p>
              )}

              {/* Toppings */}
              {selectedProduct.allowToppings && selectedProduct.toppings?.length > 0 && (
                <div style={{ marginBottom: 16, padding: 14, background: "#fafafa", borderRadius: 12 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#555" }}>Topping có thể thêm:</p>
                  {selectedProduct.toppings.map((t, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: i < selectedProduct.toppings.length - 1 ? "1px solid #eee" : "none" }}>
                      <span style={{ color: "#333" }}>{t.name}</span>
                      <span style={{ color: "#ee4d2d", fontWeight: 600 }}>+{t.extraPrice?.toLocaleString("vi-VN")}đ</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#999", marginBottom: 2 }}>Giá</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#ee4d2d" }}>{selectedProduct.price?.toLocaleString("vi-VN")}đ</div>
                </div>

                {getQty(selectedProduct._id) === 0 ? (
                  <button onClick={e => { handleAdd(e, selectedProduct); setSelectedProduct(null); }} style={{
                    background: "linear-gradient(135deg, #ee4d2d, #ff6b35)",
                    color: "#fff", border: "none", borderRadius: 14,
                    padding: "13px 28px", fontWeight: 800, fontSize: 16, cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(238,77,45,0.4)",
                  }}>
                    + Thêm vào giỏ
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <button onClick={() => onUpdateQty(selectedProduct._id, getQty(selectedProduct._id) - 1)} style={{ width: 40, height: 40, borderRadius: "50%", border: "1.5px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 22, fontWeight: 700, color: "#ee4d2d", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                    <span style={{ fontSize: 20, fontWeight: 800, minWidth: 28, textAlign: "center" }}>{getQty(selectedProduct._id)}</span>
                    <button onClick={() => onUpdateQty(selectedProduct._id, getQty(selectedProduct._id) + 1)} style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: "#ee4d2d", cursor: "pointer", fontSize: 22, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
      `}</style>
    </div>
  );
}
