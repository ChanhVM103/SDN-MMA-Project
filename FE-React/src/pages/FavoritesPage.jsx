import { demoFavorites } from "../constants/app-data";
import ProductCard from "../components/ProductCard";

function FavoritesPage({ user, navigate }) {
  if (!user) {
    return (
      <div className="view-port">
        <div className="empty-card" style={{ backgroundColor: "var(--shopee-surface)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-sm)" }}>
          <svg viewBox="0 0 100 100" width="80" height="80" style={{ fill: "rgba(0,0,0,0.1)", marginBottom: "15px" }}>
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="5"/>
            <path d="M50 35c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm-15 0c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm30 0c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM20 60c0 16.57 30 25 30 25s30-8.43 30-25V40H20v20z" fill="currentColor"/>
          </svg>
          <h2 style={{ fontSize: "18px", color: "var(--text-main)", marginBottom: "10px" }}>Vui lòng đăng nhập</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>Bạn cần đăng nhập để xem danh sách sản phẩm yêu thích</p>
          <button className="primary-btn" onClick={() => navigate("/sign-in")}>Đăng nhập</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "20px" }} className="view-port">
      {/* Sidebar Mock */}
      <aside style={{ width: "190px", flexShrink: 0, display: "none" /* hidden on mobile, normally visible on desktop */ }} className="desktop-sidebar">
        <div style={{ padding: "15px 0" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "15px", color: "var(--text-main)" }}>Tài khoản của tôi</div>
          <div style={{ fontSize: "14px", color: "var(--text-muted)", cursor: "pointer", padding: "5px 0" }} onClick={() => navigate("/profile")}>Hồ sơ</div>
          <div style={{ fontSize: "14px", color: "var(--text-muted)", cursor: "pointer", padding: "5px 0" }}>Ngân hàng</div>
          <div style={{ fontSize: "14px", color: "var(--text-muted)", cursor: "pointer", padding: "5px 0" }}>Địa chỉ</div>
          <div style={{ fontSize: "14px", color: "var(--text-muted)", cursor: "pointer", padding: "5px 0" }}>Đổi mật khẩu</div>
          
          <div style={{ fontSize: "16px", fontWeight: "600", margin: "20px 0 15px", color: "var(--text-main)" }}>Đơn mua</div>
          <div style={{ fontSize: "14px", color: "var(--text-muted)", cursor: "pointer", padding: "5px 0" }} onClick={() => navigate("/orders")}>Danh sách đơn hàng</div>
          
          <div style={{ fontSize: "16px", fontWeight: "600", margin: "20px 0 15px", color: "var(--shopee-orange)" }}>Sản phẩm yêu thích</div>
        </div>
      </aside>

      <main style={{ flexGrow: 1, backgroundColor: "var(--shopee-surface)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-sm)", padding: "0" }}>
        <div style={{ padding: "18px 30px", borderBottom: "1px solid #efefef" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "500", color: "#333", margin: "0" }}>Sản Phẩm Yêu Thích Của Tôi</h2>
        </div>

        <div style={{ padding: "20px 30px" }}>
           <div className="product-grid" style={{ padding: "0" }}>
            {demoFavorites.map((item) => {
              // Mock product object for favorite item
              const product = {
                id: item.id,
                name: item.title,
                price: "150.000 ₫",
                soldCount: Math.floor(Math.random() * 500) + 10,
                badge: "Yêu thích"
              };
              return <ProductCard key={product.id} product={product} />;
            })}
             {/* Duplicate to fill the grid if there are few items */}
             {demoFavorites.map((item) => {
              const product = {
                id: `${item.id}-copy`,
                name: `[Copy] ${item.title}`,
                price: "89.000 ₫",
                soldCount: Math.floor(Math.random() * 500) + 10,
                badge: null
              };
              return <ProductCard key={product.id} product={product} />;
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default FavoritesPage;
