import React from "react";

export default function Footer() {
    return (
        <footer style={{
            backgroundColor: "var(--shopee-orange)",
            color: "white",
            padding: "40px 20px",
            textAlign: "center",
            marginTop: "auto",
            width: "100%",
        }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                <h3 style={{ marginBottom: "15px", fontWeight: "600", fontSize: "20px" }}>FoodieHub</h3>
                <p style={{ marginBottom: "10px", fontSize: "14px", opacity: 0.9 }}>
                    Giao hàng nhanh chóng, tiện lợi. Hàng ngàn món ngon đang chờ bạn!
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "20px", flexWrap: "wrap" }}>
                    <span style={{ cursor: "pointer", fontSize: "14px", opacity: 0.9 }}>Về chúng tôi</span>
                    <span style={{ cursor: "pointer", fontSize: "14px", opacity: 0.9 }}>Chính sách bảo mật</span>
                    <span style={{ cursor: "pointer", fontSize: "14px", opacity: 0.9 }}>Điều khoản dịch vụ</span>
                    <span style={{ cursor: "pointer", fontSize: "14px", opacity: 0.9 }}>Liên hệ</span>
                </div>
                <div style={{ marginTop: "30px", fontSize: "13px", opacity: 0.7 }}>
                    © 2024 FoodieHub. Tất cả các quyền được bảo lưu.
                </div>
            </div>
        </footer>
    );
}
