import { useState, useEffect } from "react";
import { getMyOrders } from "../services/order-api";

function OrdersPage({ user, navigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Tất cả");

  useEffect(() => {
    if (user) {
      const fetchOrders = async () => {
        try {
          const data = await getMyOrders();
          setOrders(data || []);
        } catch (error) {
          console.error("Lỗi tải đơn hàng:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="view-port">
        <div className="empty-card" style={{ backgroundColor: "var(--shopee-surface)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-sm)" }}>
          <svg viewBox="0 0 100 100" width="80" height="80" style={{ fill: "rgba(0,0,0,0.1)", marginBottom: "15px" }}>
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="5" />
            <path d="M40 30h20v20H40zm0 25h20v15H40z" fill="currentColor" />
          </svg>
          <h2 style={{ fontSize: "18px", color: "var(--text-main)", marginBottom: "10px" }}>Vui lòng đăng nhập</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>Bạn cần đăng nhập để xem đơn hàng của mình</p>
          <button className="primary-btn" onClick={() => navigate("/sign-in")}>Đăng nhập</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "20px" }} className="view-port">
      {/* Sidebar Mock */}
      <aside style={{ width: "190px", flexShrink: 0, display: "none" /* hidden on mobile, normally visible on desktop */ }} className="desktop-sidebar">
        {/* Simplified sidebar for FoodieHub */}
      </aside>

      <main style={{ flexGrow: 1 }}>
        {/* Order Tabs */}
        <div style={{ display: "flex", backgroundColor: "var(--shopee-surface)", marginBottom: "12px", boxShadow: "var(--shadow-sm)" }}>
          {["Tất cả", "Chờ thanh toán", "Vận chuyển", "Chờ giao hàng", "Hoàn thành", "Đã hủy", "Trả hàng/Hoàn tiền"].map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "15px 0",
                cursor: "pointer",
                color: activeTab === tab ? "var(--shopee-orange)" : "var(--text-main)",
                borderBottom: activeTab === tab ? "2px solid var(--shopee-orange)" : "2px solid transparent",
                fontSize: "14px",
                transition: "all 0.2s"
              }}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Order Search */}
        <div style={{ backgroundColor: "#eaeaea", padding: "12px", display: "flex", alignItems: "center", marginBottom: "12px", borderRadius: "var(--radius-sm)" }}>
          <svg viewBox="0 0 24 24" width="16" height="16" style={{ fill: "var(--text-muted)", marginLeft: "10px" }}>
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input type="text" placeholder="Bạn có thể tìm kiếm theo Tên Shop, ID Đơn hàng hoặc Tên Sản phẩm" style={{ flexGrow: 1, border: "none", background: "transparent", padding: "0 10px", outline: "none", fontSize: "14px" }} />
        </div>

        {/* Order List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Đang tải thông tin đơn hàng...</div>
        ) : orders.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {orders.map((order) => (
              <div key={order._id || order.id} style={{ backgroundColor: "var(--shopee-surface)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid var(--border-color)", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: "500" }}>{order.restaurant?.name || "Shop N/A"}</span>
                    <button style={{ backgroundColor: "var(--shopee-orange)", color: "white", padding: "2px 4px", fontSize: "10px", border: "none", borderRadius: "2px" }}>Chat</button>
                    <button style={{ border: "1px solid var(--border-color)", backgroundColor: "transparent", padding: "2px 8px", fontSize: "12px", borderRadius: "2px" }}>Xem Shop</button>
                  </div>
                  <div style={{ color: "var(--shopee-orange)", fontSize: "14px", textTransform: "uppercase" }}>
                    {order.status || "Hoàn thành"}
                  </div>
                </div>

                <div style={{ padding: "12px 24px", display: "flex", gap: "12px", borderBottom: "1px solid var(--border-color)" }}>
                  <img src={order.items?.[0]?.product?.image || "https://cf.shopee.vn/file/vn-11134201-7qukw-lkbscl2h9e3rc4"} alt="Product" style={{ width: "80px", height: "80px", backgroundColor: "#f0f0f0", flexShrink: 0, border: "1px solid var(--border-color)", objectFit: "cover" }} />
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontSize: "16px", color: "var(--text-main)" }}>{order.items?.[0]?.product?.name || "Sản phẩm"}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>Số lượng sản phẩm: {order.items?.length || 1}</div>
                    <div style={{ fontSize: "14px", marginTop: "4px" }}>x{order.items?.[0]?.quantity || 1}</div>
                  </div>
                  <div style={{ color: "var(--shopee-orange)", fontSize: "14px", alignSelf: "center" }}>
                    {order.totalAmount
                      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)
                      : "0 ₫"
                    }
                  </div>
                </div>

                <div style={{ padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fffafaf" }}>
                  <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>Đơn hàng đã được đặt</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "14px", color: "var(--text-main)" }}>Thành tiền:</span>
                    <span style={{ fontSize: "24px", color: "var(--shopee-orange)" }}>
                      {order.totalAmount
                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)
                        : "0 ₫"
                      }
                    </span>
                  </div>
                </div>

                <div style={{ padding: "12px 24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button className="primary-btn">Mua Lại</button>
                  <button className="ghost-btn">Liên Hệ Người Bán</button>
                  <button className="ghost-btn">Đánh Giá</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "60px 0", textAlign: "center", backgroundColor: "var(--shopee-surface)" }}>
            <div style={{ width: "100px", height: "100px", backgroundImage: "url('https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/5fafbb923393b712b96488590b8f781f.png')", backgroundSize: "contain", margin: "0 auto 20px", filter: "grayscale(1) opacity(0.5)" }}></div>
            <div style={{ color: "var(--text-muted)", fontSize: "16px" }}>Chưa có đơn hàng</div>
          </div>
        )}
      </main>
    </div>
  );
}

export default OrdersPage;
