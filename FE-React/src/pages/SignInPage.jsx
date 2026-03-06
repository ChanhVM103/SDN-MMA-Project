import { useState } from "react";

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
    <section className="auth-screen">
      <article className="auth-banner">
        <p>FoodieHub</p>
        <h1>Đăng nhập</h1>
        <span>Chào mừng trở lại với trải nghiệm đặt món nhanh.</span>
      </article>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Đăng nhập tài khoản</h2>
        <p>Nhập thông tin để tiếp tục.</p>

        <label className="field-group">
          Email
          <input
            type="email"
            placeholder="you@email.com"
            value={form.email}
            onChange={(event) => handleChange("email", event.target.value)}
            autoComplete="email"
          />
        </label>

        <label className="field-group">
          Mật khẩu
          <input
            type="password"
            placeholder="Nhập mật khẩu"
            value={form.password}
            onChange={(event) => handleChange("password", event.target.value)}
            autoComplete="current-password"
          />
        </label>

        {message && <p className="error-text">{message}</p>}

        <button className="primary-btn wide" type="submit" disabled={loading}>
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </button>

        <div className="social-row">
          <button className="social-btn" type="button" onClick={handleGoogleClick} disabled={googleLoading}>
            {googleLoading ? "Đang kết nối..." : "Google"}
          </button>
          <button className="social-btn fb" type="button" onClick={handleFacebookClick} disabled={facebookLoading}>
            {facebookLoading ? "Đang kết nối..." : "Facebook"}
          </button>
        </div>

        <p className="auth-switch">
          Chưa có tài khoản?{" "}
          <button type="button" onClick={() => navigate("/sign-up")}>
            Đăng ký
          </button>
        </p>
      </form>
    </section>
  );
}

export default SignInPage;
