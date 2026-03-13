import { useState, useEffect, useCallback } from "react";
import { getMyOrders, cancelOrder, confirmOrderReceived } from "../services/order-api";
import { submitBulkReviews, checkOrderReviewed, updateReview, deleteReview } from "../services/review-api";

const STATUS_CONFIG = {
  pending:           { label: "Chờ xác nhận",            emoji: "⏳", color: "#f59e0b", bg: "#fef3c7", desc: "Đơn hàng đang chờ nhà hàng xác nhận" },
  confirmed:         { label: "Đã xác nhận",              emoji: "✅", color: "#3b82f6", bg: "#dbeafe", desc: "Nhà hàng đã xác nhận, sắp chuẩn bị" },
  preparing:         { label: "Đang chuẩn bị",            emoji: "👨‍🍳", color: "#8b5cf6", bg: "#ede9fe", desc: "Nhà hàng đang chuẩn bị món của bạn" },
  ready_for_pickup:  { label: "Chờ shipper lấy hàng",     emoji: "📦", color: "#f97316", bg: "#ffedd5", desc: "Đơn đã sẵn sàng, shipper đang đến lấy" },
  shipper_accepted:  { label: "Shipper đã nhận đơn",      emoji: "🛵", color: "#06b6d4", bg: "#cffafe", desc: "Shipper đang trên đường đến lấy hàng" },
  delivering:        { label: "Đang giao hàng",           emoji: "🚀", color: "#0ea5e9", bg: "#e0f2fe", desc: "Shipper đang trên đường giao đến bạn" },
  shipper_delivered: { label: "Shipper đã giao",          emoji: "📬", color: "#84cc16", bg: "#ecfccb", desc: "Shipper báo đã giao, đang chờ xác nhận" },
  delivered:         { label: "Đã giao thành công",       emoji: "🎉", color: "#10b981", bg: "#d1fae5", desc: "Đơn hàng đã được giao thành công!" },
  cancelled:         { label: "Đã hủy",                   emoji: "❌", color: "#ef4444", bg: "#fee2e2", desc: "Đơn hàng đã bị hủy" },
};

const STATUS_STEPS = ["pending", "confirmed", "preparing", "ready_for_pickup", "delivering", "delivered"];

function OrderStatusBar({ status }) {
  if (status === "cancelled") {
    return (
      <div style={{ textAlign: "center", padding: "12px 0", color: "#ef4444", fontWeight: 600, fontSize: 14 }}>
        ❌ Đơn hàng đã bị hủy
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(status);

  return (
    <div style={{ padding: "12px 0", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        {/* Connecting line */}
        <div style={{ position: "absolute", top: "18px", left: "5%", right: "5%", height: "3px", background: "#e5e7eb", zIndex: 0 }} />
        <div style={{
          position: "absolute", top: "18px", left: "5%",
          width: `${(currentIdx / (STATUS_STEPS.length - 1)) * 90}%`,
          height: "3px", background: "linear-gradient(90deg, #ee4d2d, #ff7337)", zIndex: 1,
          transition: "width 0.6s ease"
        }} />

        {STATUS_STEPS.map((step, idx) => {
          const cfg = STATUS_CONFIG[step];
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, flex: 1 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: isDone ? (isCurrent ? "#ee4d2d" : "#10b981") : "#e5e7eb",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: isCurrent ? 18 : 14,
                boxShadow: isCurrent ? "0 0 0 4px rgba(238,77,45,0.2)" : "none",
                transition: "all 0.4s ease",
                border: isDone ? "none" : "2px solid #d1d5db",
              }}>
                {isDone ? (isCurrent ? cfg.emoji : "✓") : <span style={{ color: "#9ca3af", fontSize: 12 }}>○</span>}
              </div>
              <span style={{ fontSize: 11, marginTop: 6, color: isDone ? (isCurrent ? "#ee4d2d" : "#374151") : "#9ca3af", fontWeight: isCurrent ? 700 : 400, textAlign: "center", maxWidth: 70 }}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
      <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280", marginTop: 16, marginBottom: 0 }}>
        {STATUS_CONFIG[status]?.desc}
      </p>
    </div>
  );
}

const TAB_FILTERS = [
  { label: "Tất cả", status: null },
  { label: "Đang xử lý", status: ["pending", "confirmed", "preparing", "ready_for_pickup", "shipper_accepted", "delivering", "shipper_delivered"] },
  { label: "Hoàn thành", status: ["delivered"] },
  { label: "Đã hủy", status: ["cancelled"] },
];

// ─── Star Rating Component ────────────────────────────────
function StarRating({ value, onChange, size = 28 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          style={{
            fontSize: size,
            cursor: onChange ? "pointer" : "default",
            color: star <= (hovered || value) ? "#f59e0b" : "#d1d5db",
            transition: "color 0.15s, transform 0.15s",
            transform: hovered === star ? "scale(1.2)" : "scale(1)",
            display: "inline-block",
          }}
        >★</span>
      ))}
    </div>
  );
}

const STAR_LABELS = ["", "Tệ", "Không hài lòng", "Bình thường", "Hài lòng", "Tuyệt vời"];

// ─── Review Modal ─────────────────────────────────────────
function ReviewModal({ order, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const STAR_LABELS = ["", "Tệ 😞", "Không hài lòng 😕", "Bình thường 😐", "Hài lòng 😊", "Tuyệt vời! 🤩"];

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMsg("");
    try {
      const restaurantId = order.restaurant?._id || order.restaurant;
      await submitBulkReviews(order._id, restaurantId, [
        { rating, comment, productId: null, productName: "" }
      ]);
      onSuccess();
    } catch (err) {
      setErrorMsg(err.message || "Gửi đánh giá thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99998, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} />
      <div style={{
        position: "relative", background: "#fff", borderRadius: 24,
        width: "100%", maxWidth: 460,
        boxShadow: "0 32px 80px rgba(0,0,0,0.22)",
        animation: "modalPop 0.3s cubic-bezier(.175,.885,.32,1.275)",
        overflow: "hidden",
      }}>
        {/* Decorative header */}
        <div style={{
          background: "linear-gradient(135deg, #ee4d2d 0%, #ff7337 100%)",
          padding: "28px 24px 24px", textAlign: "center", position: "relative",
        }}>
          <button onClick={onClose} style={{
            position: "absolute", top: 14, right: 14,
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)", border: "none",
            color: "#fff", fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⭐</div>
          <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#fff" }}>
            Đánh giá nhà hàng
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
            {order.restaurantName}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px" }}>
          {/* Stars */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8 }}>
              {[1,2,3,4,5].map(s => (
                <span key={s}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  style={{
                    fontSize: 40, cursor: "pointer",
                    color: s <= (hovered || rating) ? "#f59e0b" : "#e5e7eb",
                    transition: "color 0.1s, transform 0.15s",
                    transform: s === (hovered || rating) ? "scale(1.3)" : s < (hovered || rating) ? "scale(1.1)" : "scale(1)",
                    display: "inline-block", filter: s <= (hovered || rating) ? "drop-shadow(0 2px 6px rgba(245,158,11,0.5))" : "none",
                  }}
                >★</span>
              ))}
            </div>
            <div style={{
              fontSize: 14, fontWeight: 700, color: "#ee4d2d",
              minHeight: 20, transition: "all 0.2s",
            }}>
              {STAR_LABELS[hovered || rating]}
            </div>
          </div>

          {/* Comment */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
              💬 Nhận xét của bạn <span style={{ color: "#9ca3af", fontWeight: 400 }}>(tuỳ chọn)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value.slice(0, 500))}
              placeholder="Món ăn ngon không? Thời gian giao hàng có ổn không? Chia sẻ để giúp những người khác nhé!"
              rows={4}
              style={{
                width: "100%", boxSizing: "border-box",
                border: "1.5px solid #e5e7eb", borderRadius: 12,
                padding: "12px 14px", fontSize: 13,
                fontFamily: "inherit", resize: "none", outline: "none",
                lineHeight: 1.6, color: "#374151",
                transition: "border-color 0.15s, box-shadow 0.15s",
                background: "#fafafa",
              }}
              onFocus={e => { e.target.style.borderColor = "#ee4d2d"; e.target.style.boxShadow = "0 0 0 3px rgba(238,77,45,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
            />
            <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "right", marginTop: 4 }}>{comment.length}/500</div>
          </div>

          {errorMsg && (
            <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <button onClick={handleSubmit} disabled={submitting} style={{
            width: "100%", padding: "15px", borderRadius: 14, border: "none",
            background: submitting ? "#e5e7eb" : "linear-gradient(135deg, #ee4d2d, #ff6b35)",
            color: submitting ? "#9ca3af" : "#fff",
            fontWeight: 800, fontSize: 15,
            cursor: submitting ? "not-allowed" : "pointer",
            boxShadow: submitting ? "none" : "0 6px 20px rgba(238,77,45,0.35)",
            transition: "all 0.2s", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {submitting ? "⏳ Đang gửi..." : "🌟 Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Review Modal ────────────────────────────────────
function EditReviewModal({ reviews, order, onClose, onSuccess }) {
  const restaurantReview = reviews.find(r => !r.product);
  const [rating, setRatingVal] = useState(restaurantReview?.rating || 5);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState(restaurantReview?.comment || "");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const STAR_LABELS = ["", "Tệ 😞", "Không hài lòng 😕", "Bình thường 😐", "Hài lòng 😊", "Tuyệt vời! 🤩"];

  const handleSubmit = async () => {
    if (!restaurantReview?._id) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      await updateReview(restaurantReview._id, { rating, comment });
      onSuccess();
    } catch (err) {
      setErrorMsg(err.message || "Cập nhật thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99998, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} />
      <div style={{
        position: "relative", background: "#fff", borderRadius: 24,
        width: "100%", maxWidth: 460,
        boxShadow: "0 32px 80px rgba(0,0,0,0.22)",
        animation: "modalPop 0.3s cubic-bezier(.175,.885,.32,1.275)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
          padding: "28px 24px 24px", textAlign: "center", position: "relative",
        }}>
          <button onClick={onClose} style={{
            position: "absolute", top: 14, right: 14,
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)", border: "none",
            color: "#fff", fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
          <div style={{ fontSize: 48, marginBottom: 8 }}>✏️</div>
          <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#fff" }}>Sửa đánh giá</h3>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{order.restaurantName}</p>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px" }}>
          {/* Stars */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8 }}>
              {[1,2,3,4,5].map(s => (
                <span key={s}
                  onClick={() => setRatingVal(s)}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  style={{
                    fontSize: 40, cursor: "pointer",
                    color: s <= (hovered || rating) ? "#f59e0b" : "#e5e7eb",
                    transition: "color 0.1s, transform 0.15s",
                    transform: s === (hovered || rating) ? "scale(1.3)" : s < (hovered || rating) ? "scale(1.1)" : "scale(1)",
                    display: "inline-block", filter: s <= (hovered || rating) ? "drop-shadow(0 2px 6px rgba(245,158,11,0.5))" : "none",
                  }}
                >★</span>
              ))}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#3b82f6", minHeight: 20 }}>
              {STAR_LABELS[hovered || rating]}
            </div>
          </div>

          {/* Comment */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
              💬 Nhận xét <span style={{ color: "#9ca3af", fontWeight: 400 }}>(tuỳ chọn)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value.slice(0, 500))}
              placeholder="Cập nhật cảm nhận của bạn..."
              rows={4}
              style={{
                width: "100%", boxSizing: "border-box",
                border: "1.5px solid #e5e7eb", borderRadius: 12,
                padding: "12px 14px", fontSize: 13,
                fontFamily: "inherit", resize: "none", outline: "none",
                lineHeight: 1.6, color: "#374151",
                transition: "border-color 0.15s, box-shadow 0.15s",
                background: "#fafafa",
              }}
              onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
            />
            <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "right", marginTop: 4 }}>{comment.length}/500</div>
          </div>

          {errorMsg && (
            <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <button onClick={handleSubmit} disabled={submitting} style={{
            width: "100%", padding: "15px", borderRadius: 14, border: "none",
            background: submitting ? "#e5e7eb" : "linear-gradient(135deg, #3b82f6, #6366f1)",
            color: submitting ? "#9ca3af" : "#fff",
            fontWeight: 800, fontSize: 15,
            cursor: submitting ? "not-allowed" : "pointer",
            boxShadow: submitting ? "none" : "0 6px 20px rgba(59,130,246,0.35)",
            transition: "all 0.2s", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {submitting ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrdersPage({ user, navigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null); // orderId to cancel
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewedOrders, setReviewedOrders] = useState({}); // { orderId: [reviewObjects] }
  const [editReview, setEditReview] = useState(null); // { review, orderId }

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCancel = async (orderId) => {
    setConfirmCancel(orderId);
  };

  const doCancel = async (orderId) => {
    setConfirmCancel(null);
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId, "Khách hàng hủy đơn");
      showToast("Đã hủy đơn hàng thành công", "success");
      await fetchOrders(false);
    } catch (err) {
      showToast("Lỗi hủy đơn: " + err.message, "error");
    } finally {
      setCancellingId(null);
    }
  };

  const fetchOrders = useCallback(async (showLoader = true) => {
    if (!user) return;
    if (showLoader) setLoading(true);
    try {
      const data = await getMyOrders();
      setOrders(data || []);

      // Check which delivered orders have been reviewed
      const delivered = (data || []).filter((o) => o.status === "delivered");
      const reviewedMap = {};
      await Promise.all(
        delivered.map(async (o) => {
          try {
            const result = await checkOrderReviewed(o._id);
            if (result?.reviewed) reviewedMap[o._id] = result.reviews || [];
          } catch (_) {}
        })
      );
      setReviewedOrders(reviewedMap);
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto refresh every 10s to catch status updates from restaurant
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => fetchOrders(false), 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  if (!user) {
    return (
      <div className="view-port">
        <div className="empty-card" style={{ backgroundColor: "var(--shopee-surface)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-sm)" }}>
          <h2 style={{ fontSize: "18px", color: "var(--text-main)", marginBottom: "10px" }}>Vui lòng đăng nhập</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>Bạn cần đăng nhập để xem đơn hàng của mình</p>
          <button className="primary-btn" onClick={() => navigate("/sign-in")}>Đăng nhập</button>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter(order => {
    const filter = TAB_FILTERS[activeTab].status;
    if (!filter) return true;
    return filter.includes(order.status);
  });

  const activeCount = orders.filter(o => ["pending","confirmed","preparing","ready_for_pickup","shipper_accepted","delivering","shipper_delivered"].includes(o.status)).length;

  return (
    <div className="view-port">
      {/* Header */}
      <div style={{ backgroundColor: "var(--shopee-surface)", padding: "16px 20px", marginBottom: "12px", boxShadow: "var(--shadow-sm)", borderRadius: "var(--radius-sm)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 18, color: "var(--text-main)" }}>📦 Đơn hàng của tôi</h2>
          <button onClick={() => fetchOrders()} style={{ background: "none", border: "1px solid var(--border-color)", borderRadius: 6, padding: "4px 12px", fontSize: 13, cursor: "pointer", color: "var(--text-muted)" }}>
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", backgroundColor: "var(--shopee-surface)", marginBottom: "12px", boxShadow: "var(--shadow-sm)", overflowX: "auto" }}>
        {TAB_FILTERS.map((tab, idx) => (
          <div
            key={idx}
            onClick={() => setActiveTab(idx)}
            style={{
              flex: 1, minWidth: 100, textAlign: "center", padding: "14px 0", cursor: "pointer",
              color: activeTab === idx ? "var(--shopee-orange)" : "var(--text-main)",
              borderBottom: activeTab === idx ? "2px solid var(--shopee-orange)" : "2px solid transparent",
              fontSize: 14, fontWeight: activeTab === idx ? 600 : 400,
              whiteSpace: "nowrap", transition: "all 0.2s", position: "relative"
            }}
          >
            {tab.label}
            {tab.label === "Đang xử lý" && activeCount > 0 && (
              <span style={{ marginLeft: 6, background: "#ee4d2d", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{activeCount}</span>
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          Đang tải đơn hàng...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", backgroundColor: "var(--shopee-surface)", borderRadius: "var(--radius-sm)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
          <div style={{ color: "var(--text-muted)", fontSize: 16 }}>Chưa có đơn hàng nào</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredOrders.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const isExpanded = expandedId === order._id;

            return (
              <div key={order._id} style={{ backgroundColor: "var(--shopee-surface)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                {/* Order header */}
                <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{order.restaurantName}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>#{order._id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: cfg.bg, color: cfg.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: `1px solid ${cfg.color}40` }}>
                      {cfg.emoji} {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Status progress bar */}
                <div style={{ padding: "0 20px" }}>
                  <OrderStatusBar status={order.status} />
                </div>

                {/* Items preview */}
                <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border-color)" }}>
                  {order.items?.slice(0, isExpanded ? undefined : 2).map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 14 }}>
                      <span>{item.emoji} {item.name} x{item.quantity}</span>
                      <span style={{ color: "var(--text-muted)" }}>{(item.price * item.quantity).toLocaleString("vi-VN")}đ</span>
                    </div>
                  ))}
                  {!isExpanded && order.items?.length > 2 && (
                    <div style={{ fontSize: 13, color: "var(--shopee-orange)", cursor: "pointer", marginTop: 4 }} onClick={() => setExpandedId(order._id)}>
                      Xem thêm {order.items.length - 2} món ↓
                    </div>
                  )}
                  {isExpanded && (
                    <div style={{ fontSize: 13, color: "var(--shopee-orange)", cursor: "pointer", marginTop: 4 }} onClick={() => setExpandedId(null)}>
                      Thu gọn ↑
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border-color)", backgroundColor: "#fafafa" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                  {(order.deliveryFee > 0) && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-muted)", marginBottom: 2 }}>
                      <span>🚚 Phí giao hàng</span>
                      <span>{(order.deliveryFee || 0).toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 13, color: "var(--text-main)" }}>Tổng cộng:</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "var(--shopee-orange)" }}>
                      {order.total?.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                {["pending", "confirmed"].includes(order.status) && (
                  <div style={{ padding: "10px 20px 14px", display: "flex", justifyContent: "flex-end", backgroundColor: "#fafafa", borderTop: "1px solid #f0f0f0" }}>
                    <button
                      onClick={() => handleCancel(order._id)}
                      disabled={cancellingId === order._id}
                      style={{
                        padding: "8px 20px", borderRadius: 8, border: "1.5px solid #ef4444",
                        background: cancellingId === order._id ? "#fee2e2" : "#fff",
                        color: "#ef4444", fontWeight: 700, fontSize: 13, cursor: "pointer",
                        opacity: cancellingId === order._id ? 0.7 : 1,
                        transition: "all 0.2s",
                      }}
                    >
                      {cancellingId === order._id ? "Đang hủy..." : "❌ Hủy đơn"}
                    </button>
                  </div>
                )}

                {/* Confirm received button for shipper_delivered orders */}
                {order.status === "shipper_delivered" && (
                  <div style={{ padding: "10px 20px 14px", display: "flex", justifyContent: "flex-end", backgroundColor: "#fafafa", borderTop: "1px solid #f0f0f0" }}>
                    <button
                      onClick={async () => {
                        try {
                          await confirmOrderReceived(order._id);
                          showToast("Đã xác nhận nhận hàng thành công!", "success");
                          await fetchOrders(false);
                          setReviewOrder(order);
                        } catch (err) {
                          showToast("Lỗi xác nhận: " + err.message, "error");
                        }
                      }}
                      style={{
                        padding: "8px 20px", borderRadius: 8, border: "none",
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6,
                        boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
                      }}
                    >✅ Đã nhận được hàng</button>
                  </div>
                )}

                {/* Review button for delivered orders */}
                {order.status === "delivered" && (
                  <div style={{ padding: "10px 20px 14px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, backgroundColor: "#fafafa", borderTop: "1px solid #f0f0f0" }}>
                    {reviewedOrders[order._id] ? (
                      <>
                        <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginRight: 4 }}>✅ Đã đánh giá</span>
                        <button
                          onClick={() => setEditReview({ reviews: reviewedOrders[order._id], order })}
                          style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #3b82f6", background: "#fff", color: "#3b82f6", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                        >✏️ Sửa</button>
                        <button
                          onClick={() => setConfirmCancel("delete-review:" + order._id)}
                          style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #ef4444", background: "#fff", color: "#ef4444", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                        >🗑️ Xóa</button>
                      </>
                    ) : (
                      <button
                        onClick={() => setReviewOrder(order)}
                        style={{
                          padding: "8px 20px", borderRadius: 8, border: "none",
                          background: "linear-gradient(135deg,#f59e0b,#ee4d2d)",
                          color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 6,
                          boxShadow: "0 2px 8px rgba(238,77,45,0.3)",
                        }}
                      >⭐ Đánh giá món ăn</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Review Modal */}
      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
          onSuccess={async () => {
            setReviewOrder(null);
            // Reload reviews for this order
            try {
              const result = await checkOrderReviewed(reviewOrder._id);
              if (result?.reviewed) {
                setReviewedOrders((prev) => ({ ...prev, [reviewOrder._id]: result.reviews || [] }));
              }
            } catch (_) {}
            showToast("🌟 Cảm ơn bạn đã đánh giá!", "success");
          }}
        />
      )}

      {/* Edit Review Modal */}
      {editReview && (
        <EditReviewModal
          reviews={editReview.reviews}
          order={editReview.order}
          onClose={() => setEditReview(null)}
          onSuccess={async () => {
            setEditReview(null);
            try {
              const result = await checkOrderReviewed(editReview.order._id);
              setReviewedOrders((prev) => ({ ...prev, [editReview.order._id]: result?.reviews || [] }));
            } catch (_) {}
            showToast("✅ Đã cập nhật đánh giá!", "success");
          }}
          onDeleted={(orderId) => {
            setEditReview(null);
            setReviewedOrders((prev) => { const n = { ...prev }; delete n[orderId]; return n; });
            showToast("🗑️ Đã xóa đánh giá", "success");
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "error" ? "#ef4444" : toast.type === "warning" ? "#f59e0b" : "#10b981",
          color: "#fff", padding: "14px 22px", borderRadius: 14, fontWeight: 600,
          fontSize: 14, zIndex: 99999, boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
          display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap",
          animation: "toastIn 0.35s cubic-bezier(.175,.885,.32,1.275)",
        }}>
          <span style={{ fontSize: 18 }}>{toast.type === "error" ? "❌" : toast.type === "warning" ? "⚠️" : "✅"}</span>
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} style={{ marginLeft: 8, background: "rgba(255,255,255,0.25)", border: "none", color: "#fff", borderRadius: 8, width: 22, height: 22, cursor: "pointer", fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Confirm Modal – dùng cho cả hủy đơn lẫn xóa review */}
      {confirmCancel && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99998, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => setConfirmCancel(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
          <div style={{
            position: "relative", background: "#fff", borderRadius: 18, padding: "28px 28px 22px",
            maxWidth: 360, width: "90vw", boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
            animation: "confirmIn 0.3s cubic-bezier(.175,.885,.32,1.275)",
          }}>
            {confirmCancel.startsWith("delete-review:") ? (
              <>
                <div style={{ fontSize: 44, textAlign: "center", marginBottom: 12 }}>⭐</div>
                <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, textAlign: "center", color: "#1a1a1a" }}>Xóa đánh giá?</h3>
                <p style={{ margin: "0 0 22px", fontSize: 14, color: "#666", textAlign: "center", lineHeight: 1.6 }}>Tất cả đánh giá của đơn này sẽ bị xóa. Bạn có thể đánh giá lại sau.</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setConfirmCancel(null)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", color: "#555", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Giữ lại</button>
                  <button onClick={async () => {
                    const orderId = confirmCancel.replace("delete-review:", "");
                    const reviews = reviewedOrders[orderId] || [];
                    try {
                      await Promise.all(reviews.map(r => deleteReview(r._id)));
                      setReviewedOrders((prev) => { const n = { ...prev }; delete n[orderId]; return n; });
                      showToast("🗑️ Đã xóa đánh giá", "success");
                    } catch (err) { showToast("Lỗi xóa: " + err.message, "error"); }
                    setConfirmCancel(null);
                  }} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    Xóa
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 44, textAlign: "center", marginBottom: 12 }}>🗑️</div>
                <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, textAlign: "center", color: "#1a1a1a" }}>Hủy đơn hàng?</h3>
                <p style={{ margin: "0 0 22px", fontSize: 14, color: "#666", textAlign: "center", lineHeight: 1.6 }}>Bạn có chắc muốn hủy đơn này không? Hành động này không thể hoàn tác.</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setConfirmCancel(null)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", color: "#555", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Giữ đơn</button>
                  <button onClick={() => doCancel(confirmCancel)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Hủy đơn</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Global keyframe animations – rendered once, outside any conditional modal */}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.9); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1);   }
        }
        @keyframes confirmIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1);    }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(60px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default OrdersPage;
