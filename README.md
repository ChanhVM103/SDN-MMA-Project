# SDN-MMA-Project 🚀

[![Technologies](https://img.shields.io/badge/Stack-Fullstack-brightgreen)](#)
[![Roles](https://img.shields.io/badge/Roles-User%20%7C%20Brand%20%7C%20Shipper%20%7C%20Admin-blue)](#)
[![Status](https://img.shields.io/badge/Status-Development-orange)](#)

Hệ thống đặt món và giao hàng thông minh tích hợp AI, hỗ trợ đa nền tảng (Web & Mobile). Dự án được thiết kế chuyên biệt cho hệ sinh thái ẩm thực MMA, tối ưu hóa trải nghiệm từ người dùng cuối đến đơn vị vận chuyển và quản trị.

---

## 🏗️ Kiến trúc Hệ thống

Dự án bao gồm 3 thành phần chính:

1.  **Backend (BE)**: Node.js/Express Server xử lý logic nghiệp vụ, thanh toán VNPay và tích hợp AI.
2.  **Frontend Web (FE-React)**: Giao diện quản trị (Admin/Brand) và website đặt món cho người dùng.
3.  **Mobile App (FE)**: Ứng dụng dành cho Người dùng và Shipper xây dựng trên nền tảng Expo (React Native).

---

## 🛠️ Công nghệ Sử dụng

### **Backend**
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **AI Integration**: Google Generative AI (Gemini)
- **Payment Gateway**: VNPay integration
- **Security**: JWT & Bcryptjs

### **Frontend Web (React)**
- **Framework**: React 19 + Vite
- **UI Libraries**: Material UI (MUI), Shadcn UI, Framer Motion
- **Maps**: React Leaflet
- **Charts**: Recharts
- **Router**: React Router 7

### **Mobile App (Expo)**
- **Framework**: Expo (React Native)
- **Navigation**: Expo Router (React Navigation)
- **Maps**: React Native Maps
- **Others**: Reanimated, Haptics, Image Picker

---

## ✨ Tính năng Nổi bật

- 🤖 **AI Support**: Tìm kiếm món ăn và gợi ý thông minh thông qua Google Generative AI.
- 💳 **Thanh toán Đa dạng**: Hỗ trợ COD (Tiền mặt) và thanh toán điện tử qua ví VNPay.
- 🗺️ **Định vị & Bản đồ**: Theo dõi vị trí quán ăn và hỗ trợ chỉ đường cho shipper.
- 📸 **Shipper Evidence**: Chụp ảnh xác nhận giao hàng và báo cáo đơn hàng ảo (Bomb order).
- 📊 **Admin Dashboard**: Thống kê doanh thu, quản lý đơn hàng, người dùng và đối tác.

---

## 🚀 Hướng dẫn Cài đặt

### 1. Backend (BE)
```bash
cd BE
npm install
# Tạo file .env dựa trên cấu hình MongoDB và VNPay của bạn
npm start
```

### 2. Web App (FE-React)
```bash
cd FE-React
npm install
npm run dev
```

### 3. Mobile App (FE)
```bash
cd FE
npm install
npx expo start
```

---

## 🔐 Tài khoản Thử nghiệm

| Vai trò | Email | Mật khẩu |
| :--- | :--- | :--- |
| **User** | `khoa@gmail.com` | `123456` |
| **Shipper** | `Shipper@gmail.com` | `123456` |
| **Brand** | `brand1@gmail.com` | `brand123` |
| **Admin** | `abc@gmail.com` | `chanh123` |

---

## 👥 Đội ngũ Phát triển (SDN-MMA Team)
Dự án được thực hiện bởi team **ChanhVM103**.

---
*Last updated: 2026-03-17*