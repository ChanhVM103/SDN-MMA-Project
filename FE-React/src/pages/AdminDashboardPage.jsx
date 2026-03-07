import React from "react";
import "./AdminDashboardPage.css";

const AdminDashboardPage = ({ user, onLogout, navigate }) => {
  return (
    <div className="admin-dashboard-container">
      {/* Sidebar / Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2>Admin Panel</h2>
        </div>
        <nav className="admin-nav">
          <button className="admin-nav-item active">
            <span className="icon">📊</span> Dashboard
          </button>
          <button className="admin-nav-item">
            <span className="icon">👥</span> Users
          </button>
          <button className="admin-nav-item">
            <span className="icon">📦</span> Products
          </button>
          <button className="admin-nav-item">
            <span className="icon">⚙️</span> Settings
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-content">
        {/* Top Header */}
        <header className="admin-header">
          <div className="admin-search-bar">
            <input type="text" placeholder="Search..." />
          </div>
          <div className="admin-user-info">
            <span className="welcome-text">Xin chào, <strong>{user?.fullName || "Admin"}</strong></span>
            {user?.avatar ? (
              <img src={user.avatar} alt="Admin avatar" className="admin-avatar" />
            ) : (
              <div className="admin-avatar-placeholder">A</div>
            )}
            <button className="admin-logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <section className="admin-content-body">
          <div className="admin-welcome-card">
            <h3>Tổng quan hệ thống</h3>
            <p>Chào mừng bạn đến với trang quản trị.</p>
          </div>
          
          <div className="admin-stats-grid">
            <div className="stat-card">
              <h4>Tổng doanh thu</h4>
              <p className="stat-value">₫0</p>
            </div>
            <div className="stat-card">
              <h4>Đơn hàng mới</h4>
              <p className="stat-value">0</p>
            </div>
            <div className="stat-card">
              <h4>Người dùng mới</h4>
              <p className="stat-value">0</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
