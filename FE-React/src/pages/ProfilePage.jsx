function ProfilePage({ user, onLogout, navigate }) {
  if (!user) {
    return (
      <div className="view-port">
        <div className="empty-card" style={{ backgroundColor: "var(--shopee-surface)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-sm)" }}>
          <h2 style={{ fontSize: "18px", color: "var(--text-main)", marginBottom: "10px" }}>Vui lòng đăng nhập</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>Đăng nhập để quản lý thông tin tài khoản.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button className="primary-btn" onClick={() => navigate("/sign-in")}>Đăng nhập</button>
            <button className="ghost-btn" onClick={() => navigate("/sign-up")}>Đăng ký</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view-port" style={{ display: "flex", gap: "20px" }}>
      {/* Sidebar Mock */}
      <aside style={{ width: "190px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px", padding: "15px 0" }}>
          <div style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#e0e0e0", border: "1px solid rgba(0,0,0,.09)" }}></div>
          <div>
            <div style={{ fontWeight: "600", color: "#333", marginBottom: "5px" }}>{user.fullName || "Người dùng"}</div>
            <div style={{ color: "#888", fontSize: "12px" }}>
              <svg viewBox="0 0 12 12" width="12" height="12" style={{ fill: "#888", marginRight: "5px", verticalAlign: "middle" }}>
                <path d="M8.54 0L6.987 1.56l3.46 3.48L12 3.48M0 8.52l.073 3.428L3.46 12l6.21-6.18-3.46-3.48"></path>
              </svg>
              Sửa Hồ Sơ
            </div>
          </div>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
           <div style={{ color: "var(--shopee-orange)", fontWeight: "500", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <span style={{ fontSize: "18px" }}>👤</span> Tài khoản của tôi
           </div>
           <div style={{ marginLeft: "28px", display: "flex", flexDirection: "column", gap: "10px", color: "rgba(0,0,0,.65)", fontSize: "14px" }}>
              <div style={{ color: "var(--shopee-orange)" }}>Hồ sơ</div>
              <div>Ngân hàng</div>
              <div>Địa chỉ</div>
              <div>Đổi mật khẩu</div>
           </div>
           
           <div style={{ color: "rgba(0,0,0,.87)", fontWeight: "500", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => navigate("/orders")}>
              <span style={{ fontSize: "18px", color: "blue" }}>📄</span> Đơn Mua
           </div>
           <div style={{ color: "rgba(0,0,0,.87)", fontWeight: "500", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <span style={{ fontSize: "18px", color: "orange" }}>🔔</span> Thông báo
           </div>
           <div style={{ color: "rgba(0,0,0,.87)", fontWeight: "500", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <span style={{ fontSize: "18px", color: "red" }}>🎟️</span> Kho Voucher
           </div>
        </div>
      </aside>

      <main style={{ flexGrow: 1, backgroundColor: "var(--shopee-surface)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-sm)", padding: "0" }}>
        <div style={{ padding: "0 30px" }}>
          <div style={{ padding: "18px 0", borderBottom: "1px solid #efefef" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "500", color: "#333", margin: "0 0 5px 0" }}>Hồ Sơ Của Tôi</h2>
            <div style={{ fontSize: "14px", color: "#555" }}>Quản lý thông tin hồ sơ để bảo mật tài khoản</div>
          </div>
          
          <div style={{ display: "flex", padding: "30px 0" }}>
            <div style={{ flex: "1 1 auto", paddingRight: "50px", borderRight: "1px solid #efefef" }}>
              <div style={{ display: "flex", marginBottom: "30px" }}>
                <div style={{ width: "20%", textAlign: "right", color: "rgba(85,85,85,.8)", paddingRight: "20px", marginTop: "5px" }}>Tên đăng nhập</div>
                <div style={{ flex: 1, color: "#333" }}>{user.email || "Không có"}</div>
              </div>
              <div style={{ display: "flex", marginBottom: "30px", alignItems: "center" }}>
                <div style={{ width: "20%", textAlign: "right", color: "rgba(85,85,85,.8)", paddingRight: "20px" }}>Tên</div>
                <div style={{ flex: 1 }}>
                  <input type="text" defaultValue={user.fullName || ""} style={{ width: "100%", padding: "10px", border: "1px solid rgba(0,0,0,.14)", borderRadius: "2px", outline: "none" }} />
                </div>
              </div>
              <div style={{ display: "flex", marginBottom: "30px", alignItems: "center" }}>
                <div style={{ width: "20%", textAlign: "right", color: "rgba(85,85,85,.8)", paddingRight: "20px" }}>Email</div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ color: "#333" }}>{user.email ? user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : "Chưa cập nhật"}</div>
                  <button style={{ background: "none", border: "none", color: "#05a", cursor: "pointer", textDecoration: "underline" }}>Thay đổi</button>
                </div>
              </div>
              <div style={{ display: "flex", marginBottom: "30px", alignItems: "center" }}>
                <div style={{ width: "20%", textAlign: "right", color: "rgba(85,85,85,.8)", paddingRight: "20px" }}>Số điện thoại</div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
                   <div style={{ color: "#333" }}>{user.phone ? user.phone.replace(/(.*)(.{4})/, '******$2') : "Chưa cập nhật"}</div>
                  <button style={{ background: "none", border: "none", color: "#05a", cursor: "pointer", textDecoration: "underline" }}>Thay đổi</button>
                </div>
              </div>
              <div style={{ display: "flex", marginBottom: "30px", alignItems: "center" }}>
                 <div style={{ width: "20%", textAlign: "right", color: "rgba(85,85,85,.8)", paddingRight: "20px" }}></div>
                 <div style={{ flex: 1 }}>
                     <button className="primary-btn" style={{ padding: "10px 30px" }}>Lưu</button>
                 </div>
              </div>
            </div>
            
            <div style={{ width: "280px", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "20px" }}>
              <div style={{ width: "100px", height: "100px", borderRadius: "50%", backgroundColor: "#efefef", marginBottom: "20px", border: "1px solid rgba(0,0,0,.09)" }}></div>
              <button style={{ border: "1px solid rgba(0,0,0,.09)", backgroundColor: "#fff", padding: "10px 20px", color: "#555", borderRadius: "2px", cursor: "pointer", marginBottom: "10px" }}>Chọn Ảnh</button>
              <div style={{ color: "#999", fontSize: "14px", textAlign: "center", lineHeight: "1.5" }}>Dụng lượng file tối đa 1 MB<br/>Định dạng: .JPEG, .PNG</div>
              
              <button className="ghost-btn" style={{ marginTop: "40px", width: "100%" }} onClick={onLogout}>Đăng Xuất</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
