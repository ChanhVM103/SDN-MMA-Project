import { useState } from "react";
import TopBar from "../components/layout/TopBar";

function SignInPage({ onSubmit, onGoogleSignIn, onFacebookSignIn, navigate }) {
  const [form, setForm] = useState({ email: "", password: "" });
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

    if (!form.email.trim() || !form.password.trim()) {
      setMessage("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
    } catch (error) {
      setMessage(error.message || "Đăng nhập thất bại.");
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
      setMessage(error.message || "Đăng nhập Google thất bại.");
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
      setMessage(error.message || "Đăng nhập Facebook thất bại.");
    } finally {
      setFacebookLoading(false);
    }
  };

  return (
    <>
      <div style={{ backgroundColor: "var(--shopee-surface)", padding: "20px 0", borderBottom: "1px solid var(--border-color)" }}>
        <div className="topbar-content" style={{ justifyContent: "flex-start", gap: "20px", color: "var(--shopee-orange)" }}>
          <button className="brand" type="button" onClick={() => navigate("/home")} style={{ color: "var(--shopee-orange)" }}>
             <svg viewBox="0 0 100 100" width="40" height="40" style={{ fill: "var(--shopee-orange)" }}>
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--shopee-orange)" strokeWidth="5"/>
              <path d="M35 40 L50 65 L65 40 Z" fill="var(--shopee-orange)"/>
            </svg>
            <span className="brand-name" style={{ fontSize: "24px", color: "var(--shopee-orange)" }}>Shopee Clone</span>
          </button>
          <span style={{ fontSize: "24px", color: "var(--text-main)", marginLeft: "10px" }}>Đăng nhập</span>
        </div>
      </div>

      <section className="auth-page">
        <div className="auth-container">
          <div className="auth-branding">
            <svg viewBox="0 0 100 100" width="100" height="100" style={{ fill: "white", marginBottom: "20px" }}>
              <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="5"/>
              <path d="M35 40 L50 65 L65 40 Z" fill="white"/>
            </svg>
            <h1>Shopee Clone</h1>
            <p style={{ fontSize: "16px", lineHeight: "1.5" }}>Nền tảng thương mại điện tử<br/>yêu thích ở Đông Nam Á & Đài Loan</p>
          </div>

          <form className="auth-card" onSubmit={handleSubmit}>
            <h2>Đăng nhập</h2>

            <div className="field-group">
              <input
                type="email"
                placeholder="Email/Số điện thoại/Tên đăng nhập"
                value={form.email}
                onChange={(event) => handleChange("email", event.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="field-group">
              <input
                type="password"
                placeholder="Mật khẩu"
                value={form.password}
                onChange={(event) => handleChange("password", event.target.value)}
                autoComplete="current-password"
              />
            </div>

            {message && <p className="error-text">{message}</p>}

            <button className="primary-btn wide" type="submit" disabled={loading} style={{ marginTop: "10px" }}>
              {loading ? "ĐANG TẢI..." : "ĐĂNG NHẬP"}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "15px 0" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
              <span style={{ padding: "0 10px", color: "var(--text-muted)", fontSize: "12px" }}>HOẶC</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
            </div>

            <div className="social-row" style={{ marginTop: "0" }}>
              <button className="social-btn fb" type="button" onClick={handleFacebookClick} disabled={facebookLoading}>
                {facebookLoading ? "Đang tải..." : "Facebook"}
              </button>
              <button className="social-btn" type="button" onClick={handleGoogleClick} disabled={googleLoading}>
                {googleLoading ? "Đang tải..." : "Google"}
              </button>
            </div>

            <p className="auth-switch">
              Bạn mới biết đến Shopee Clone?{" "}
              <button type="button" onClick={() => navigate("/sign-up")}>
                Đăng ký
              </button>
            </p>
          </form>
        </div>
      </section>
    </>
  );
}

export default SignInPage;
