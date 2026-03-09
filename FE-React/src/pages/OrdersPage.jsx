import { useState, useEffect, useCallback } from "react";
import { getMyOrders, cancelOrder } from "../services/order-api";

const STATUS_CONFIG = {
  pending:    { label: "Chờ xác nhận",   emoji: "⏳", color: "#f59e0b", bg: "#fef3c7", desc: "Đơn hàng đang chờ nhà hàng xác nhận" },
  confirmed:  { label: "Đã xác nhận",    emoji: "✅", color: "#3b82f6", bg: "#dbeafe", desc: "Nhà hàng đã xác nhận, sắp chuẩn bị" },
  preparing:  { label: "Đang chuẩn bị",  emoji: "👨‍🍳", color: "#8b5cf6", bg: "#ede9fe", desc: "Nhà hàng đang chuẩn bị món của bạn" },
  delivering: { label: "Đang giao hàng", emoji: "🚀", color: "#0ea5e9", bg: "#e0f2fe", desc: "Shipper đang trên đường giao đến bạn" },
  delivered:  { label: "Thành công",     emoji: "🎉", color: "#10b981", bg: "#d1fae5", desc: "Đơn hàng đã được giao thành công!" },
  cancelled:  { label: "Đã hủy",         emoji: "❌", color: "#ef4444", bg: "#fee2e2", desc: "Đơn hàng đã bị hủy" },
};

const STATUS_STEPS = ["pending", "confirmed", "preparing", "delivering", "delivered"];

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
  { label: "Đang xử lý", status: ["pending", "confirmed", "preparing", "delivering"] },
  { label: "Hoàn thành", status: ["delivered"] },
  { label: "Đã hủy", status: ["cancelled"] },
];

function OrdersPage({ user, navigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const handleCancel = async (orderId) => {
    if (!window.confirm("Bạn có chắc muốn hủy đơn hàng này không?")) return;
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId, "Khách hàng hủy đơn");
      await fetchOrders(false);
    } catch (err) {
      alert("Lỗi hủy đơn: " + err.message);
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

  const activeCount = orders.filter(o => ["pending","confirmed","preparing","delivering"].includes(o.status)).length;

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
                <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fafafa" }}>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    {new Date(order.createdAt).toLocaleString("vi-VN")}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
