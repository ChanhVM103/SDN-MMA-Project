import { useState } from "react";

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
    <section className="auth-screen signup">
      <article className="auth-banner green">
        <p>FoodieHub</p>
        <h1>Tạo tài khoản</h1>
        <span>Gia nhập cộng đồng ẩm thực và đặt món nhanh hơn.</span>
      </article>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Đăng ký tài khoản</h2>
        <p>Điền thông tin bên dưới để bắt đầu.</p>

        <label className="field-group">
          Họ và tên
          <input
            type="text"
            placeholder="Nguyễn Văn A"
            value={form.fullName}
            onChange={(event) => handleChange("fullName", event.target.value)}
            autoComplete="name"
          />
        </label>

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
          Số điện thoại
          <input
            type="tel"
            placeholder="+84..."
            value={form.phone}
            onChange={(event) => handleChange("phone", event.target.value)}
            autoComplete="tel"
          />
        </label>

        <div className="dual-input">
          <label className="field-group">
            Mật khẩu
            <input
              type="password"
              placeholder="Mật khẩu"
              value={form.password}
              onChange={(event) => handleChange("password", event.target.value)}
              autoComplete="new-password"
            />
          </label>

          <label className="field-group">
            Xác nhận
            <input
              type="password"
              placeholder="Nhập lại"
              value={form.confirmPassword}
              onChange={(event) => handleChange("confirmPassword", event.target.value)}
              autoComplete="new-password"
            />
          </label>
        </div>

        <label className="check-row">
          <input
            type="checkbox"
            checked={form.agree}
            onChange={(event) => handleChange("agree", event.target.checked)}
          />
          <span>Tôi đồng ý điều khoản và chính sách sử dụng.</span>
        </label>

        {message && <p className="error-text">{message}</p>}

        <button className="primary-btn wide" type="submit" disabled={loading}>
          {loading ? "Đang xử lý..." : "Tạo tài khoản"}
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
          Đã có tài khoản?{" "}
          <button type="button" onClick={() => navigate("/sign-in")}>
            Đăng nhập
          </button>
        </p>
      </form>
    </section>
  );
}

export default SignUpPage;
