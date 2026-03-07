function TopBar({ user, navigate }) {
  return (
    <header className="topbar">
      <div className="topbar-content">
        <button className="brand" type="button" onClick={() => navigate("/home")}>
          <svg viewBox="0 0 100 100" width="40" height="40" style={{ fill: "white" }}>
            <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="5"/>
            <path d="M35 40 L50 65 L65 40 Z" fill="white"/>
          </svg>
          <span className="brand-name">Shopee Clone</span>
        </button>

        <div className="search-bar">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Shopee bao ship 0Đ - Đăng ký ngay!" 
          />
          <button className="search-btn" type="button">
            <svg viewBox="0 0 24 24" width="16" height="16" style={{ fill: "white" }}>
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
        </div>

        <div className="topbar-actions">
          <button className="topbar-action" type="button" onClick={() => navigate("/orders")}>
            <svg viewBox="0 0 24 24" width="24" height="24" style={{ fill: "white" }}>
               <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>

          {user ? (
            <button
              className="topbar-action user-pill"
              type="button"
              onClick={() => navigate("/profile")}
            >
              <span>{user.fullName || "Bạn"}</span>
            </button>
          ) : (
            <>
              <button className="topbar-action" type="button" onClick={() => navigate("/sign-up")}>
                Đăng ký
              </button>
              <div style={{ height: "16px", width: "1px", backgroundColor: "rgba(255,255,255,0.4)", margin: "0 8px" }}></div>
              <button className="topbar-action" type="button" onClick={() => navigate("/sign-in")}>
                Đăng nhập
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopBar;
