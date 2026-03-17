import React from 'react';

function CustomerSupportPage({ navigate }) {
  // If we want to use the back button intelligently or fallback to history
  const handleBack = () => {
    if (window.history.length > 2) {
      window.history.back();
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="view-port">
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
        <button onClick={handleBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontWeight: 600, fontSize: 14, padding: 0, display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
          ← Quay lại
        </button>
        <div style={{ background: "#fff", borderRadius: 20, padding: "32px", boxShadow: "0 8px 30px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", textAlign: "center" }}>
          <div style={{ width: 80, height: 80, background: "linear-gradient(135deg, #ffedd5, #ffebd2)", borderRadius: "50%", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, border: "4px solid #fff", boxShadow: "0 4px 12px rgba(238,77,45,0.15)" }}>
            🎧
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a1a", marginBottom: 12 }}>Trung tâm Hỗ trợ Khách hàng</h2>
          <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.6, marginBottom: 32, padding: "0 10px" }}>
            Nếu bạn cần thay đổi thông tin đơn hàng, gặp vấn đề khi nhận món, hoặc cần giải đáp thắc mắc, vui lòng liên hệ ngay với <strong style={{color:"#ee4d2d"}}>FoodieHub</strong> qua các kênh sau để được hỗ trợ 24/7.
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Phone Hot-line */}
            <a href="tel:0901234567" style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "18px 20px", borderRadius: 16, border: "2px solid #ee4d2d", background: "#fffcfb", transition: "all 0.2s", cursor: "pointer", boxShadow: "0 2px 10px rgba(238,77,45,0.05)" }}>
                <div style={{ fontSize: 28, marginRight: 16 }}>📞</div>
                <div style={{ textAlign: "left", flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#ee4d2d", textTransform: "uppercase", letterSpacing: 0.5 }}>Hotline Hỗ Trợ Đơn Hàng</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", marginTop: 4 }}>1900 1000</div>
                </div>
                <div style={{ color: "#ee4d2d", fontSize: 24, fontWeight: 700 }}>→</div>
              </div>
            </a>
            
            {/* Fanpage */}
            <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "18px 20px", borderRadius: 16, border: "2px solid #3b82f6", background: "#eff6ff", transition: "all 0.2s", cursor: "pointer", boxShadow: "0 2px 10px rgba(59,130,246,0.05)" }}>
                <div style={{ fontSize: 28, marginRight: 16 }}>💬</div>
                <div style={{ textAlign: "left", flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: 0.5 }}>Nhắn tin Fanpage</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", marginTop: 4 }}>Hỗ trợ FoodieHub</div>
                </div>
                <div style={{ color: "#3b82f6", fontSize: 24, fontWeight: 700 }}>→</div>
              </div>
            </a>
          </div>
          
          <div style={{ marginTop: 32, fontSize: 13, color: "#9ca3af", background: "#f9fafb", padding: "12px", borderRadius: 10 }}>
            💡 <strong style={{color:"#6b7280"}}>Mẹo:</strong> Chuẩn bị sẵn <strong>Mã đơn hàng</strong> (bắt đầu bằng dấu #) của bạn để chúng tôi có thể xử lý yêu cầu nhanh nhất nhé!
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerSupportPage;
