export const AUTH_STORAGE_KEY = "@foodiehub_auth_web";

export const VALID_PATHS = new Set([
  "/home",
  "/orders",
  "/favorites",
  "/notifications",
  "/profile",
  "/sign-in",
  "/sign-up",
  "/admin",
  "/brand-dashboard",
]);

export const tabs = [
  { path: "/home", label: "Trang chủ", icon: "home" },
  { path: "/orders", label: "Đơn hàng", icon: "receipt" },
  { path: "/favorites", label: "Đã thích", icon: "heart" },
  { path: "/notifications", label: "Thông báo", icon: "bell" },
  { path: "/profile", label: "Tôi", icon: "user" },
];

export const categories = [
  { id: "all", label: "Tất cả" },
  { id: "pizza", label: "Pizza" },
  { id: "burger", label: "Burger" },
  { id: "sushi", label: "Sushi" },
  { id: "drink", label: "Đồ uống" },
  { id: "dessert", label: "Tráng miệng" },
];

export const dishes = [
  {
    id: "1",
    name: "Wagyu Smash Burger",
    category: "burger",
    price: "$18.90",
    rating: 4.9,
    eta: "22 phút",
    tone: "sunset",
    badge: "Nổi bật",
  },
  {
    id: "2",
    name: "Midnight Marina Pizza",
    category: "pizza",
    price: "$21.50",
    rating: 4.8,
    eta: "26 phút",
    tone: "moss",
    badge: "Bán chạy",
  },
  {
    id: "3",
    name: "Dragon Roll Combo",
    category: "sushi",
    price: "$16.40",
    rating: 4.9,
    eta: "19 phút",
    tone: "ocean",
    badge: "Mới",
  },
  {
    id: "4",
    name: "Sparkling Peach Tea",
    category: "drink",
    price: "$6.20",
    rating: 4.7,
    eta: "10 phút",
    tone: "amber",
    badge: "Nhanh",
  },
  {
    id: "5",
    name: "Volcano Lava Cake",
    category: "dessert",
    price: "$9.60",
    rating: 4.8,
    eta: "12 phút",
    tone: "orchid",
    badge: "Ưu đãi",
  },
  {
    id: "6",
    name: "Truffle Smoke Burger",
    category: "burger",
    price: "$17.20",
    rating: 4.8,
    eta: "24 phút",
    tone: "sunset",
    badge: "Yêu thích",
  },
];

export const promoBlocks = [
  {
    id: "p1",
    title: "Miễn phí ship",
    body: "Áp dụng cho đơn từ $25 trở lên.",
    tone: "sunset",
  },
  {
    id: "p2",
    title: "Giảm 30% đơn đầu",
    body: "Nhập mã WELCOME30 khi checkout.",
    tone: "moss",
  },
  {
    id: "p3",
    title: "Combo đêm khuya",
    body: "Sau 22:00 tặng thêm món phụ.",
    tone: "ocean",
  },
];

export const demoOrders = [
  {
    id: "#OD1042",
    title: "Wagyu Smash Burger x2",
    status: "Đang giao",
    total: "$39.80",
    time: "12:30",
  },
  {
    id: "#OD1031",
    title: "Dragon Roll Combo",
    status: "Đã giao",
    total: "$16.40",
    time: "Hôm qua",
  },
];

export const demoFavorites = [
  { id: "fv1", title: "Midnight Marina Pizza", note: "Phổ biến tuần này" },
  { id: "fv2", title: "Volcano Lava Cake", note: "Mới nhất từ bếp ngọt" },
  { id: "fv3", title: "Sparkling Peach Tea", note: "Gọi kèm burger rất hợp" },
];

export const demoNotifications = [
  {
    id: "n1",
    title: "Đơn #OD1042 đang đến gần bạn",
    note: "Tài xế sẽ đến trong 6 phút.",
  },
  {
    id: "n2",
    title: "Voucher mới đã sẵn sàng",
    note: "Giảm 20% cho combo sushi.",
  },
  {
    id: "n3",
    title: "Giờ vàng bắt đầu lúc 20:00",
    note: "Tất cả burger giảm 15%.",
  },
];
