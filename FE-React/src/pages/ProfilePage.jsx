function ProfilePage({ user, onLogout, navigate }) {
  if (!user) {
    return (
      <section className="screen">
        <article className="panel profile-card">
          <h2>Tôi</h2>
          <p>Đăng nhập để quản lý thông tin tài khoản, địa chỉ và lịch sử đặt món.</p>
          <div className="hero-actions">
            <button className="primary-btn" type="button" onClick={() => navigate("/sign-in")}>
              Đăng nhập
            </button>
            <button className="ghost-btn alt" type="button" onClick={() => navigate("/sign-up")}>
              Đăng ký
            </button>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="screen">
      <article className="panel profile-card">
        <h2>Thông tin cá nhân</h2>
        <p>Dữ liệu lấy theo model user của backend FE hiện tại.</p>
        <div className="profile-grid">
          <div>
            <small>Họ tên</small>
            <strong>{user.fullName || "Không có"}</strong>
          </div>
          <div>
            <small>Email</small>
            <strong>{user.email || "Không có"}</strong>
          </div>
          <div>
            <small>Số điện thoại</small>
            <strong>{user.phone || "Chưa cập nhật"}</strong>
          </div>
          <div>
            <small>Nhà cung cấp đăng nhập</small>
            <strong>{user.authProvider || "local"}</strong>
          </div>
          <div>
            <small>Vai trò</small>
            <strong>{user.role || "user"}</strong>
          </div>
          <div>
            <small>Địa chỉ</small>
            <strong>{user.address || "Chưa cập nhật"}</strong>
          </div>
        </div>
        <div className="hero-actions">
          <button className="ghost-btn alt" type="button" onClick={() => navigate("/orders")}>
            Xem đơn hàng
          </button>
          <button className="danger-btn" type="button" onClick={onLogout}>
            Đăng xuất
          </button>
        </div>
      </article>
    </section>
  );
}

export default ProfilePage;
