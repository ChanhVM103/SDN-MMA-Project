function TopBar({ user, navigate }) {
  return (
    <header className="topbar">
      <button className="brand" type="button" onClick={() => navigate("/home")}>
        <span className="brand-mark">FH</span>
        <span className="brand-name">FoodieHub Web</span>
      </button>

      <nav className="topbar-nav">
        <button type="button" onClick={() => navigate("/home")}>
          Trang chủ
        </button>
        <button type="button" onClick={() => navigate("/orders")}>
          Đơn hàng
        </button>
        <button type="button" onClick={() => navigate("/favorites")}>
          Đã thích
        </button>
      </nav>

      {user ? (
        <button
          className="topbar-action user-pill"
          type="button"
          onClick={() => navigate("/profile")}
        >
          <span>{user.fullName?.split(" ")[0] || "Bạn"}</span>
        </button>
      ) : (
        <button className="topbar-action" type="button" onClick={() => navigate("/sign-in")}>
          Đăng nhập
        </button>
      )}
    </header>
  );
}

export default TopBar;
