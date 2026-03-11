import { useState, useRef } from "react";
import { updateAvatarApi, updateProfileApi, changePasswordApi } from "../services/auth-api";
import { parseStoredAuth } from "../services/auth-storage";

function ProfilePage({ user, onLogout, navigate, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "password"
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // States for Change Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Dung lượng file tối đa là 5MB");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { token } = parseStoredAuth();
      if (!token) throw new Error("Vui lòng đăng nhập lại");

      let updatedUser = { ...user };

      if (avatarFile && avatarPreview !== user.avatar) {
        const result = await updateAvatarApi(token, avatarPreview);
        if (result.user) updatedUser = result.user;
      }

      if (fullName !== user.fullName || phone !== user.phone || address !== user.address) {
        const result = await updateProfileApi(token, { fullName, phone, address });
        if (result.user) updatedUser = result.user;
      }

      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      alert("Cập nhật hồ sơ thành công!");
    } catch (err) {
      alert("Cập nhật thất bại: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (newPassword.length < 6) {
      alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    try {
      setLoading(true);
      const { token } = parseStoredAuth();
      await changePasswordApi(token, { currentPassword, newPassword });
      alert("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      alert("Lỗi đổi mật khẩu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-port" style={{ display: "flex", gap: "20px" }}>
      {/* Sidebar Mock */}
      <aside style={{ width: "190px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px", padding: "15px 0" }}>
          <div style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#e0e0e0", border: "1px solid rgba(0,0,0,.09)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {user.avatar ? <img src={user.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "👤"}
          </div>
          <div>
            <div style={{ fontWeight: "600", color: "#333", marginBottom: "5px" }}>{user.fullName || "Người dùng"}</div>
            <div style={{ color: "#888", fontSize: "12px", cursor: "pointer" }} onClick={() => setActiveTab("profile")}>
              <svg viewBox="0 0 12 12" width="12" height="12" style={{ fill: "#888", marginRight: "5px", verticalAlign: "middle" }}>
                <path d="M8.54 0L6.987 1.56l3.46 3.48L12 3.48M0 8.52l.073 3.428L3.46 12l6.21-6.18-3.46-3.48"></path>
              </svg>
              Sửa Hồ Sơ
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div style={{ color: "var(--shopee-orange)", fontWeight: "500", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => setActiveTab("profile")}>
            <span style={{ fontSize: "18px" }}>👤</span> Tài khoản của tôi
          </div>
          <div style={{ marginLeft: "28px", display: "flex", flexDirection: "column", gap: "10px", color: "rgba(0,0,0,.65)", fontSize: "14px" }}>
            <div style={{ color: activeTab === "profile" ? "var(--shopee-orange)" : "inherit", cursor: "pointer" }} onClick={() => setActiveTab("profile")}>Hồ sơ</div>
            <div style={{ cursor: "not-allowed", opacity: 0.5 }}>Ngân hàng</div>
            <div style={{ color: activeTab === "password" ? "var(--shopee-orange)" : "inherit", cursor: "pointer" }} onClick={() => setActiveTab("password")}>Đổi mật khẩu</div>
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
        {activeTab === "profile" ? (
          <div style={{ padding: "0 30px" }}>
            <div style={{ padding: "18px 0", borderBottom: "1px solid #efefef" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "500", color: "#333", margin: "0 0 5px 0" }}>Hồ Sơ Của Tôi</h2>
              <div style={{ fontSize: "14px", color: "#555" }}>Quản lý thông tin hồ sơ để bảo mật tài khoản</div>
            </div>

            <div style={{ display: "flex", padding: "30px 0" }}>
              <div style={{ flex: "1 1 auto", paddingRight: "50px", borderRight: "1px solid #efefef" }}>
                <div style={{ display: "flex", marginBottom: "30px" }}>
                  <div style={{ width: "20%", textAlign: "right", color: "rgba(85,85,85,.8)", paddingRight: "20px", marginTop: "5px" }}>Email</div>
                  <div style={{ flex: 1, color: "#333", display: "flex", alignItems: "center" }}>
                    {user.email ? user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : "Không có"}
                  </div>
                </div>
                <div style={{ display: "flex", marginBottom: "30px", alignItems: "center" }}>
                  <div style={{ width: "20%", textAlign: "right", color: "rgba(85,85,85,.8)", paddingRight: "20px" }}>Tên</div>
                  <div style={{ flex: 1 }}>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid rgba(0,0,0,.14)", borderRadius: "2px", outline: "none" }} />
                  </div>
                </div>
                <div style={{ display: "flex", marginBottom: "30px", alignItems: "center" }}>
                  <div style={{ width: "20%", textAlign: "right", color: "rgba(85,85,85,.8)", paddingRight: "20px" }}>Số điện thoại</div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Nhập số điện thoại" style={{ width: "100%", padding: "10px", border: "1px solid rgba(0,0,0,.14)", borderRadius: "2px", outline: "none" }} />
                  </div>
                </div>
                <div style={{ display: "flex", marginBottom: "30px", alignItems: "center" }}>
                  <div style={{ width: "20%", textAlign: "right", color: "rgba(85,85,85,.8)", paddingRight: "20px" }}>Địa chỉ</div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Nhập địa chỉ" style={{ width: "100%", padding: "10px", border: "1px solid rgba(0,0,0,.14)", borderRadius: "2px", outline: "none" }} />
                  </div>
                </div>
                <div style={{ display: "flex", marginBottom: "30px", alignItems: "center" }}>
                  <div style={{ width: "20%", textAlign: "right", color: "rgba(85,85,85,.8)", paddingRight: "20px" }}></div>
                  <div style={{ flex: 1 }}>
                    <button className="primary-btn" style={{ padding: "10px 30px" }} onClick={handleSave} disabled={loading}>{loading ? "Đang lưu..." : "Lưu"}</button>
                  </div>
                </div>
              </div>

              <div style={{ width: "280px", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "20px" }}>
                <div style={{ width: "100px", height: "100px", borderRadius: "50%", backgroundColor: "#efefef", marginBottom: "20px", border: "1px solid rgba(0,0,0,.09)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "40px" }}>👤</span>
                  )}
                </div>
                <input type="file" accept="image/jpeg, image/png" onChange={handleFileChange} style={{ display: "none" }} ref={fileInputRef} />
                <button onClick={() => fileInputRef.current?.click()} style={{ border: "1px solid rgba(0,0,0,.09)", backgroundColor: "#fff", padding: "10px 20px", color: "#555", borderRadius: "2px", cursor: "pointer", marginBottom: "10px" }}>Chọn Ảnh</button>
                <div style={{ color: "#999", fontSize: "14px", textAlign: "center", lineHeight: "1.5" }}>Dụng lượng file tối đa 5.0 MB<br />Định dạng: .JPEG, .PNG</div>

                <button className="ghost-btn" style={{ marginTop: "40px", width: "100%" }} onClick={onLogout}>Đăng Xuất</button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: "0 30px" }}>
            <div style={{ padding: "18px 0", borderBottom: "1px solid #efefef" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "500", color: "#333", margin: "0 0 5px 0" }}>Đổi Mật Khẩu</h2>
              <div style={{ fontSize: "14px", color: "#555" }}>Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</div>
            </div>

            <div style={{ padding: "30px 0", maxWidth: "600px" }}>
              <div style={{ display: "flex", marginBottom: "20px", alignItems: "center" }}>
                <div style={{ width: "30%", textAlign: "right", color: "rgba(85,85,85,.8)", paddingRight: "20px" }}>Mật khẩu hiện tại</div>
                <div style={{ flex: 1 }}>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid rgba(0,0,0,.14)", borderRadius: "2px", outline: "none" }} />
                </div>
              </div>
              <div style={{ display: "flex", marginBottom: "20px", alignItems: "center" }}>
                <div style={{ width: "30%", textAlign: "right", color: "rgba(85,85,85,.8)", paddingRight: "20px" }}>Mật khẩu mới</div>
                <div style={{ flex: 1 }}>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid rgba(0,0,0,.14)", borderRadius: "2px", outline: "none" }} />
                </div>
              </div>
              <div style={{ display: "flex", marginBottom: "30px", alignItems: "center" }}>
                <div style={{ width: "30%", textAlign: "right", color: "rgba(85,85,85,.8)", paddingRight: "20px" }}>Xác nhận mật khẩu</div>
                <div style={{ flex: 1 }}>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid rgba(0,0,0,.14)", borderRadius: "2px", outline: "none" }} />
                </div>
              </div>
              <div style={{ display: "flex", marginBottom: "30px", alignItems: "center" }}>
                <div style={{ width: "30%", textAlign: "right", color: "rgba(85,85,85,.8)", paddingRight: "20px" }}></div>
                <div style={{ flex: 1 }}>
                  <button className="primary-btn" style={{ padding: "10px 30px" }} onClick={handleChangePassword} disabled={loading}>{loading ? "Đang xử lý..." : "Xác nhận"}</button>
                  <div style={{ marginTop: "15px", fontSize: "14px" }}>
                    <a href="#" style={{ color: "#0055aa" }}>Quên mật khẩu?</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ProfilePage;
