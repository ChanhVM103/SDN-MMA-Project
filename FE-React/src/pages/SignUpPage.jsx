import { useState } from "react";
import { ShutterText } from "../components/ui/ShutterText";

function SignUpPage({ onSubmit, onGoogleSignIn, onFacebookSignIn, navigate }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
      setMessage("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }

    if (form.password.length < 6) {
      setMessage("Mật khẩu phải từ 6 ký tự trở lên.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage("Xác nhận mật khẩu không khớp.");
      return;
    }

    if (!form.agree) {
      setMessage("Bạn cần đồng ý điều khoản sử dụng.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
    } catch (error) {
      setMessage(error.message || "Đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setMessage("");
    setGoogleLoading(true);
    try {
      await onGoogleSignIn();
    } catch (error) {
      setMessage(error.message || "Đăng ký Google thất bại.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookClick = async () => {
    setMessage("");
    setFacebookLoading(true);
    try {
      await onFacebookSignIn();
    } catch (error) {
      setMessage(error.message || "Đăng ký Facebook thất bại.");
    } finally {
      setFacebookLoading(false);
    }
  };

  return (
    <>
      <div style={{ backgroundColor: "var(--shopee-surface)", padding: "20px 0", borderBottom: "1px solid var(--border-color)" }}>
        <div className="topbar-content" style={{ justifyContent: "flex-start", gap: "20px", color: "var(--shopee-orange)" }}>
          <button className="brand" type="button" onClick={() => navigate("/home")} style={{ color: "var(--shopee-orange)", display: "flex", alignItems: "center" }}>
            <img
              src="/logo.jpg"
              alt="FoodieHub Logo"
              style={{
                height: "42px",
                width: "auto",
                borderRadius: "6px",
                objectFit: "contain",
                marginRight: "10px"
              }}
            />
            <ShutterText
              text="FoodieHub"
              trigger="auto"
              sliceColor="#ffdd57"
              textColor="var(--shopee-orange)"
              className="brand-name"
            />
          </button>
          <span style={{ fontSize: "24px", color: "var(--text-main)", marginLeft: "10px" }}>Đăng ký</span>
        </div>
      </div>

      <section className="auth-page">
        <div className="auth-container">
          <div className="auth-branding">
            <img src="/logo.jpg" alt="FoodieHub" style={{ width: "100px", height: "auto", borderRadius: "12px", marginBottom: "20px" }} />
            <h1 style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
              <ShutterText
                text="FoodieHub"
                trigger="auto"
                sliceColor="#ffdd57"
                textColor="#ffffff"
              />
            </h1>
            <p style={{ fontSize: "16px", lineHeight: "1.5" }}>Nền tảng đặt đồ ăn trực tuyến<br />nhanh chóng & tiện lợi</p>
          </div>

          <form className="auth-card" onSubmit={handleSubmit}>
            <h2>Đăng ký</h2>

            <div className="field-group">
              <input
                type="text"
                placeholder="Họ và tên"
                value={form.fullName}
                onChange={(event) => handleChange("fullName", event.target.value)}
                autoComplete="name"
                style={{ padding: "14px", backgroundColor: "#fff", border: "1px solid #e0e0e0", outline: "none" }}
              />
            </div>

            <div className="field-group">
              <input
                type="email"
                placeholder="Email/Số điện thoại"
                value={form.email}
                onChange={(event) => handleChange("email", event.target.value)}
                autoComplete="email"
                style={{ padding: "14px", backgroundColor: "#fff", border: "1px solid #e0e0e0", outline: "none" }}
              />
            </div>

            <div className="field-group" style={{ display: "flex", gap: "10px" }}>
              <input
                type="password"
                placeholder="Mật khẩu"
                value={form.password}
                onChange={(event) => handleChange("password", event.target.value)}
                autoComplete="new-password"
                style={{ flex: 1, padding: "14px", backgroundColor: "#fff", border: "1px solid #e0e0e0", outline: "none" }}
              />
              <input
                type="password"
                placeholder="Xác nhận"
                value={form.confirmPassword}
                onChange={(event) => handleChange("confirmPassword", event.target.value)}
                autoComplete="new-password"
                style={{ flex: 1, padding: "14px", backgroundColor: "#fff", border: "1px solid #e0e0e0", outline: "none" }}
              />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "var(--text-main)", marginBottom: "15px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.agree}
                onChange={(event) => handleChange("agree", event.target.checked)}
                style={{ width: "auto" }}
              />
              <span>Tôi đồng ý với <span style={{ color: "var(--shopee-orange)" }}>Điều khoản FoodieHub</span></span>
            </label>

            {message && <p className="error-text">{message}</p>}

            <button className="primary-btn wide" type="submit" disabled={loading} style={{ marginTop: "10px", padding: "14px", fontSize: "14px", fontWeight: "bold" }}>
              {loading ? "ĐANG TẢI..." : "ĐĂNG KÝ"}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "15px 0" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
              <span style={{ padding: "0 10px", color: "var(--text-muted)", fontSize: "12px" }}>HOẶC</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
            </div>

            <div className="social-row" style={{ marginTop: "0" }}>
              <button className="social-btn fb" type="button" onClick={handleFacebookClick} disabled={facebookLoading} style={{ color: "white", backgroundColor: "#1877f2", padding: "12px", border: "none" }}>
                {facebookLoading ? "Đang tải..." : "Facebook"}
              </button>
              <button className="social-btn" type="button" onClick={handleGoogleClick} disabled={googleLoading} style={{ backgroundColor: "#fff", padding: "12px", border: "1px solid #e0e0e0", color: "#333" }}>
                {googleLoading ? "Đang tải..." : "Google"}
              </button>
            </div>

            <div style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", color: "var(--text-muted)", padding: "0 20px" }}>
              Bằng việc đăng kí, bạn đã đồng ý với FoodieHub về<br />
              <span style={{ color: "var(--shopee-orange)" }}>Điều khoản dịch vụ</span> & <span style={{ color: "var(--shopee-orange)" }}>Chính sách bảo mật</span>
            </div>

            <p className="auth-switch" style={{ marginTop: "15px" }}>
              Bạn đã có tài khoản?{" "}
              <button type="button" onClick={() => navigate("/sign-in")}>
                Đăng nhập
              </button>
            </p>
          </form>
        </div>
      </section>
    </>
  );
}

export default SignUpPage;
