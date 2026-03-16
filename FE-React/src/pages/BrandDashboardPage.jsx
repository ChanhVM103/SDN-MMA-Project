import React, { useState, useEffect } from "react";
import {
  getMyRestaurant,
  getRestaurantProducts,
  createProductForRestaurant,
  updateProductForRestaurant,
  deleteProductForRestaurant,
  updateMyRestaurant,
  getRestaurantOrders,
  getRestaurantStats,
  updateOrderStatusByBrand,
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  extendPromotion,
} from "../services/brand-api";
import LocationPicker from "../components/LocationPicker";
import {
  brandHandoverToShipper,
  brandConfirmDelivered,
} from "../services/order-api";

// MUI Components
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  InputAdornment,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
  alpha,
  Badge,
  Checkbox,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// MUI Icons
import StorefrontIcon from "@mui/icons-material/Storefront";
import InventoryIcon from "@mui/icons-material/Inventory";
import BarChartIcon from "@mui/icons-material/BarChart";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import StarIcon from "@mui/icons-material/Star";
import HomeIcon from "@mui/icons-material/Home";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CancelIcon from "@mui/icons-material/Cancel";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const DRAWER_WIDTH = 260;
const CUSTOM_CATEGORY_VALUE = "__custom_category__";
const PRODUCT_CATEGORY_OPTIONS = [
  "Trà sữa",
  "Đồ uống",
  "Cà phê",
  "Nước ép",
  "Trà trái cây",
  "Sinh tố",
  "Bánh ngọt",
  "Ăn vặt",
  "Cơm",
  "Bún/Phở",
  "Pizza",
  "Burger",
  "Món chính",
];

// Custom Shopee-inspired MUI theme
const brandTheme = createTheme({
  palette: {
    primary: {
      main: "#ee4d2d",
      light: "#ff7337",
      dark: "#d74528",
      contrastText: "#fff",
    },
    secondary: { main: "#222222" },
    success: { main: "#26aa99" },
    warning: { main: "#ffb700" },
    error: { main: "#ff424e" },
    background: { default: "#f5f5fa", paper: "#ffffff" },
  },
  typography: {
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 8,
          padding: "8px 20px",
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, fontSize: "0.75rem" } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          fontSize: "0.8rem",
          textTransform: "uppercase",
          color: "#757575",
          letterSpacing: "0.05em",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "none",
          boxShadow: "2px 0 12px rgba(0,0,0,0.04)",
        },
      },
    },
  },
});

const BrandDashboardPage = ({ user, onLogout, navigate, showToast, showConfirm }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [restaurant, setRestaurant] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [productFilter, setProductFilter] = useState("all");

  // Orders state
  const [ordersList, setOrdersList] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // dùng cho overview, không filter
  const [restaurantStats, setRestaurantStats] = useState(null); // stats từ DB aggregate
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Modals
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] =
    useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isDeleteProductModalOpen, setIsDeleteProductModalOpen] =
    useState(false);
  const [isEditRestaurantModalOpen, setIsEditRestaurantModalOpen] =
    useState(false);
  const [extendPromoDialog, setExtendPromoDialog] = useState({ open: false, id: null, days: "7" });
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Forms
  const defaultProductForm = {
    name: "",
    price: 0,
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80",
    category: "",
    type: "food",
    allowToppings: false,
    toppings: [],
    isBestSeller: false,
    description: "",
    isAvailable: true,
  };
  const [productForm, setProductForm] = useState(defaultProductForm);
  const [isToppingsModalOpen, setIsToppingsModalOpen] = useState(false);
  const [toppingDraft, setToppingDraft] = useState({ name: "", extraPrice: 0 });

  const defaultRestaurantForm = {
    name: "",
    image: "",
    thumbnail: "",
    distance: "",
    tags: "",
    type: "food",
    deliveryTime: 30,
    deliveryFee: 15000,
    address: "",
    phone: "",
    description: "",
    openingHours: "",
    isOpen: true,
    latitude: 0,
    longitude: 0,
  };
  const [restaurantForm, setRestaurantForm] = useState(defaultRestaurantForm);

  // Flash Sale (Promotion) state
  const [promotions, setPromotions] = useState([]);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [isDeletingPromotion, setIsDeletingPromotion] = useState(false);
  const [promotionForm, setPromotionForm] = useState({
    name: "",
    discountPercent: 10,
    isActive: true,
    productIds: [],
  });
  const [promoProductSearch, setPromoProductSearch] = useState("");

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const showSnack = (message, severity = "success") => {
    if (showToast) {
      showToast(message, severity === "success" ? "success" : (severity === "error" ? "error" : "warning"));
    } else {
      setSnackbar({ open: true, message, severity });
    }
  };

  useEffect(() => {
    fetchRestaurant();
  }, []);

  useEffect(() => {
    if (restaurant && activeTab === "products") {
      fetchProducts();
    }
    if (restaurant && activeTab === "orders") {
      fetchOrders();
    }
    if (restaurant && activeTab === "overview") {
      fetchAllOrders();
      fetchStats();
    }
    if (restaurant && activeTab === "flash-sale") {
      fetchPromotions();
      fetchProducts();
    }
  }, [restaurant, activeTab]);

  // Auto refresh orders every 15 seconds when on orders tab
  useEffect(() => {
    if (activeTab !== "orders" || !restaurant) return;
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [activeTab, restaurant, orderStatusFilter]);

  // Background refresh for "New Order" notification dot on sidebar
  useEffect(() => {
    if (!restaurant) return;

    // Luôn fetch stats và all orders để cập nhật chấm đỏ
    fetchStats();
    fetchAllOrders();

    const interval = setInterval(() => {
      fetchStats();
      fetchAllOrders();
    }, 30000); // Mỗi 30 giây kiểm tra đơn mới

    return () => clearInterval(interval);
  }, [restaurant]);

  const fetchRestaurant = async () => {
    setLoading(true);
    try {
      const data = await getMyRestaurant();
      setRestaurant(data);
    } catch (error) {
      showSnack("Lỗi tải thông tin cửa hàng: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (showLoader = true) => {
    if (!restaurant) return;
    if (showLoader) setOrdersLoading(true);
    try {
      const params =
        orderStatusFilter !== "all" ? { status: orderStatusFilter } : {};
      const data = await getRestaurantOrders(restaurant._id, params);
      setOrdersList(Array.isArray(data) ? data : []);
    } catch (error) {
      showSnack("Lỗi tải đơn hàng: " + error.message, "error");
    } finally {
      if (showLoader) setOrdersLoading(false);
    }
  };

  const fetchAllOrders = async () => {
    if (!restaurant) return;
    try {
      const data = await getRestaurantOrders(restaurant._id, {});
      setAllOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi tải tất cả đơn:", error.message);
    }
  };

  const fetchStats = async () => {
    if (!restaurant) return;
    try {
      const data = await getRestaurantStats(restaurant._id);
      setRestaurantStats(data);
    } catch (error) {
      console.error("Lỗi tải stats:", error.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatusByBrand(orderId, newStatus);
      const statusMessages = {
        confirmed: "✅ Đã xác nhận đơn hàng!",
        preparing: "👨‍🍳 Đang chuẩn bị hàng...",
        delivering: "🚀 Đã bàn giao cho shipper!",
        delivered: "🎉 Giao hàng thành công!",
        cancelled: "❌ Đã từ chối đơn hàng.",
      };
      showSnack(statusMessages[newStatus] || "Đã cập nhật trạng thái");
      fetchOrders(false);
    } catch (error) {
      showSnack("Lỗi: " + error.message, "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleBrandHandover = async (orderId) => {
    setUpdatingOrderId(orderId);
    try {
      await brandHandoverToShipper(orderId);
      showSnack("📦 Đã bàn giao cho shipper! Chờ shipper đến lấy.");
      fetchOrders(false);
    } catch (error) {
      showSnack("Lỗi: " + error.message, "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleBrandConfirmDelivered = async (orderId) => {
    setUpdatingOrderId(orderId);
    try {
      await brandConfirmDelivered(orderId);
      showSnack("🎉 Xác nhận giao hàng thành công! Đơn hàng đã hoàn tất.");
      fetchOrders(false);
    } catch (error) {
      showSnack("Lỗi: " + error.message, "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const fetchProducts = async () => {
    if (!restaurant) return;
    setLoading(true);
    try {
      const data = await getRestaurantProducts(restaurant._id);
      setProductsList(Array.isArray(data) ? data : data.products || []);
    } catch (error) {
      showSnack("Lỗi tải danh sách sản phẩm: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotions = async () => {
    if (!restaurant) return;
    setLoading(true);
    try {
      const data = await getPromotions(restaurant._id);
      setPromotions(Array.isArray(data) ? data : []);
    } catch (error) {
      showSnack("Lỗi tải danh sách Flash Sale: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Product Handlers ────────────────────
  const handleOpenCreateProduct = () => {
    setProductForm(defaultProductForm);
    setToppingDraft({ name: "", extraPrice: 0 });
    setIsCreateProductModalOpen(true);
  };

  const buildProductPayload = () => {
    const normalizedToppings = Array.isArray(productForm.toppings)
      ? productForm.toppings
        .map((item) => ({
          name: String(item?.name || "").trim(),
          extraPrice: Number(item?.extraPrice || 0),
        }))
        .filter((item) => item.name)
      : [];

    return {
      ...productForm,
      toppings:
        productForm.type === "drink" && productForm.allowToppings
          ? normalizedToppings
          : [],
    };
  };

  const openToppingsModal = () => {
    if (productForm.type !== "drink") {
      showSnack("Chỉ đồ uống mới có thể thêm topping", "warning");
      return;
    }
    if (!productForm.allowToppings) {
      showSnack("Hãy chọn 'Cho phép topping: Có' trước", "warning");
      return;
    }
    setIsToppingsModalOpen(true);
  };

  const handleAddTopping = () => {
    const name = toppingDraft.name.trim();
    if (!name) {
      showSnack("Tên topping không được để trống", "warning");
      return;
    }

    setProductForm((prev) => ({
      ...prev,
      toppings: [
        ...(Array.isArray(prev.toppings) ? prev.toppings : []),
        {
          name,
          extraPrice: Number(toppingDraft.extraPrice) || 0,
        },
      ],
    }));
    setToppingDraft({ name: "", extraPrice: 0 });
  };

  const handleRemoveTopping = (indexToRemove) => {
    setProductForm((prev) => ({
      ...prev,
      toppings: (prev.toppings || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const submitCreateProduct = async (e) => {
    e.preventDefault();
    if (!restaurant) return;
    try {
      await createProductForRestaurant(restaurant._id, buildProductPayload());
      showSnack("Tạo sản phẩm thành công!");
      setIsCreateProductModalOpen(false);
      setProductForm(defaultProductForm);
      fetchProducts();
    } catch (error) {
      showSnack("Lỗi: " + error.message, "error");
    }
  };

  const handleOpenEditProduct = (product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name || "",
      price: product.price || 0,
      image: product.image || "",
      category: product.category || "",
      type: product.type || "food",
      allowToppings: Boolean(product.allowToppings),
      toppings: Array.isArray(product.toppings)
        ? product.toppings.map((item) => ({
          name: item?.name || "",
          extraPrice: Number(item?.extraPrice || 0),
        }))
        : [],
      isBestSeller: Boolean(product.isBestSeller),
      description: product.description || "",
      isAvailable: product.isAvailable !== false,
    });
    setIsEditProductModalOpen(true);
  };

  const submitEditProduct = async (e) => {
    e.preventDefault();
    if (!restaurant || !selectedProduct) return;
    try {
      await updateProductForRestaurant(
        restaurant._id,
        selectedProduct._id,
        buildProductPayload(),
      );
      showSnack("Cập nhật sản phẩm thành công!");
      setIsEditProductModalOpen(false);
      fetchProducts();
    } catch (error) {
      showSnack("Lỗi: " + error.message, "error");
    }
  };

  const handleOpenDeleteProduct = (product) => {
    setSelectedProduct(product);
    setIsDeleteProductModalOpen(true);
  };

  const submitDeleteProduct = async () => {
    if (!restaurant || !selectedProduct) return;
    try {
      await deleteProductForRestaurant(restaurant._id, selectedProduct._id);
      showSnack("Đã xoá sản phẩm.");
      setIsDeleteProductModalOpen(false);
      fetchProducts();
    } catch (error) {
      showSnack("Lỗi: " + error.message, "error");
    }
  };

  // ─── Restaurant Handlers ────────────────────
  const handleOpenEditRestaurant = () => {
    if (!restaurant) return;
    setRestaurantForm({
      name: restaurant.name || "",
      image: restaurant.image || "",
      thumbnail: restaurant.thumbnail || "",
      distance: restaurant.distance || "",
      tags: Array.isArray(restaurant.tags) ? restaurant.tags.join(", ") : "",
      type: restaurant.type || "food",
      deliveryTime: restaurant.deliveryTime || 30,
      deliveryFee: restaurant.deliveryFee || 15000,
      address: restaurant.address || "",
      phone: restaurant.phone || "",
      description: restaurant.description || "",
      openingHours: restaurant.openingHours || "",
      isOpen: restaurant.isOpen !== false,
      latitude: restaurant.latitude || 0,
      longitude: restaurant.longitude || 0,
    });
    setIsEditRestaurantModalOpen(true);
  };

  const handleLocationChange = (lat, lng, address) => {
    setRestaurantForm((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address || prev.address,
    }));
  };

  const submitEditRestaurant = async (e) => {
    e.preventDefault();
    if (!restaurant) return;
    try {
      const payload = {
        ...restaurantForm,
        // distance is still required by backend validation, keep existing value when hidden in UI
        distance: (
          restaurantForm.distance ||
          restaurant.distance ||
          "1 km"
        ).trim(),
        tags: restaurantForm.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      await updateMyRestaurant(restaurant._id, payload);
      showSnack("Cập nhật cửa hàng thành công!");
      setIsEditRestaurantModalOpen(false);
      fetchRestaurant();
    } catch (error) {
      showSnack("Lỗi: " + error.message, "error");
    }
  };

  // ─── Filters ────────────────────────────────
  const filteredProducts = productsList.filter((p) => {
    const term = searchQuery.toLowerCase();
    const searchMatch =
      p.name?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term);

    if (productFilter === "all") return searchMatch;
    return searchMatch && p.type === productFilter;
  });

  // ─── Promotion Handlers ──────────────────
  const handleOpenCreatePromotion = (initialData = null) => {
    let productIds = [];

    if (Array.isArray(initialData)) {
      productIds = initialData;
    } else if (initialData && typeof initialData === "object") {
      productIds = [initialData._id];
    } else if (typeof initialData === "string") {
      productIds = [initialData];
    }

    setPromotionForm({
      name: `Flash Sale ${new Date().toLocaleDateString("vi-VN")}`,
      discountPercent: 15,
      isActive: true,
      productIds: productIds,
    });
    setSelectedPromotion(null);
    setIsPromotionModalOpen(true);
  };

  const handleOpenEditPromotion = (promo) => {
    setSelectedPromotion(promo);
    setPromotionForm({
      name: promo.name,
      discountPercent: promo.discountPercent,
      isActive: promo.isActive,
      productIds: promo.productIds || [],
    });
    setIsPromotionModalOpen(true);
  };

  const submitPromotion = async (e) => {
    e.preventDefault();
    if (!restaurant) return;

    if (promotionForm.productIds.length === 0) {
      showSnack("Vui lòng chọn ít nhất một sản phẩm", "warning");
      return;
    }

    try {
      const payload = {
        ...promotionForm,
        restaurantId: restaurant._id,
      };

      if (selectedPromotion) {
        await updatePromotion(selectedPromotion._id, payload);
        showSnack("Cập nhật Flash Sale thành công!");
      } else {
        await createPromotion(payload);
        showSnack("Tạo chương trình Flash Sale thành công!");
      }

      setIsPromotionModalOpen(false);
      fetchPromotions();
      if (activeTab === "products") fetchProducts(); // Cập nhật lại list sản phẩm nếu đang ở tab sản phẩm
    } catch (error) {
      showSnack("Lỗi: " + error.message, "error");
    }
  };

  const handleDeletePromotion = async (id) => {
    showConfirm("Bạn có chắc chắn muốn xoá chương trình Flash Sale này?", async () => {
      try {
        await deletePromotion(id);
        showSnack("Đã xoá chương trình Flash Sale.");
        fetchPromotions();
      } catch (error) {
        showSnack("Lỗi: " + error.message, "error");
      }
    });
  };

  const handleExtendPromotion = (id) => {
    setExtendPromoDialog({ open: true, id, days: "7" });
  };

  const submitExtendPromotion = async () => {
    const { id, days } = extendPromoDialog;
    if (!days || isNaN(days)) {
      showSnack("Vui lòng nhập số ngày hợp lệ", "warning");
      return;
    }
    
    try {
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + parseInt(days));
      await extendPromotion(id, newEndDate);
      showSnack("Đã gia hạn chương trình Flash Sale thành công!");
      setExtendPromoDialog({ open: false, id: null, days: "7" });
      fetchPromotions();
    } catch (error) {
      showSnack("Lỗi: " + error.message, "error");
    }
  };

  // ─── Sidebar Nav Items ──────────────────────
  const navItems = [
    { key: "overview", label: "Tổng quan", icon: <BarChartIcon /> },
    {
      key: "restaurant",
      label: "Thông tin cửa hàng",
      icon: <StorefrontIcon />,
    },
    { key: "products", label: "Quản lý sản phẩm", icon: <InventoryIcon /> },
    {
      key: "flash-sale",
      label: "Chương trình Flash Sale",
      icon: <LocalOfferIcon />,
    },
    { key: "orders", label: "Đơn hàng", icon: <ReceiptLongIcon /> },
  ];

  // ═══════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════
  return (
    <ThemeProvider theme={brandTheme}>
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        {/* ═══ SIDEBAR ═══ */}
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              bgcolor: "#fff",
            },
          }}
        >
          {/* Brand */}
          <Box sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: "transparent" }}>
              <img
                src="/logo.jpg"
                alt="Logo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
              />
            </Avatar>
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="primary.main"
              >
                Quản lý Brand
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {restaurant?.name || "Đang tải..."}
              </Typography>
            </Box>
          </Box>
          <Divider />

          {/* Nav */}
          <List sx={{ px: 1.5, mt: 1 }}>
            {navItems.map((item) => {
              const pendingOrdersCount = allOrders.filter(
                (o) => o.status === "pending",
              ).length;
              return (
                <ListItemButton
                  key={item.key}
                  selected={activeTab === item.key}
                  onClick={() => setActiveTab(item.key)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    py: 1.2,
                    "&.Mui-selected": {
                      bgcolor: alpha("#ee4d2d", 0.08),
                      color: "primary.main",
                      "& .MuiListItemIcon-root": { color: "primary.main" },
                    },
                    "&:hover": { bgcolor: alpha("#ee4d2d", 0.04) },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.key === "orders" ? (
                      <Badge
                        color="error"
                        variant="dot"
                        invisible={pendingOrdersCount === 0}
                        sx={{ "& .MuiBadge-badge": { top: 2, right: 2 } }}
                      >
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: "0.9rem",
                      fontWeight: activeTab === item.key ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>

          {/* Bottom Area */}
          <Box sx={{ mt: "auto", p: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={onLogout}
              sx={{
                justifyContent: "flex-start",
                borderColor: "#ddd",
                color: "text.secondary",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "primary.main",
                  color: "primary.main",
                  bgcolor: alpha("#ee4d2d", 0.04),
                },
              }}
            >
              Đăng xuất
            </Button>
          </Box>
        </Drawer>

        {/* ═══ MAIN CONTENT ═══ */}
        <Box
          component="main"
          sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
        >
          {/* AppBar */}
          <AppBar
            position="sticky"
            elevation={0}
            sx={{ bgcolor: "#fff", borderBottom: "1px solid #eee" }}
          >
            <Toolbar sx={{ gap: 2 }}>
              <Typography
                variant="h6"
                color="text.primary"
                sx={{ minWidth: 200 }}
              >
                {activeTab === "overview"
                  ? "Tổng quan doanh thu"
                  : activeTab === "restaurant"
                    ? "Thông tin cửa hàng"
                    : activeTab === "orders"
                      ? "Quản lý đơn hàng"
                      : "Quản lý sản phẩm"}
              </Typography>

              {/* Search */}
              {activeTab === "products" && (
                <TextField
                  size="small"
                  placeholder="Tìm theo tên, danh mục..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ flexGrow: 1, maxWidth: 450 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              <Box sx={{ flexGrow: 1 }} />
            </Toolbar>
          </AppBar>

          {/* Content */}
          <Box sx={{ p: 3, flexGrow: 1, overflowY: "auto" }}>
            {/* ═══ RESTAURANT INFO TAB ═══ */}
            {activeTab === "restaurant" && (
              <Paper
                elevation={0}
                sx={{ border: "1px solid #f0f0f0", p: 3, borderRadius: 3 }}
              >
                {loading ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 6 }}
                  >
                    <CircularProgress color="primary" />
                  </Box>
                ) : restaurant ? (
                  <>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 3,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="h5"
                          fontWeight={700}
                          sx={{ mb: 0.5 }}
                        >
                          {restaurant.name}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip
                            size="small"
                            label={
                              restaurant.type === "drink"
                                ? "Thức uống"
                                : "Đồ ăn"
                            }
                            variant="outlined"
                          />
                          {restaurant.isOpen ? (
                            <Chip
                              label="Đang mở"
                              color="success"
                              size="small"
                              variant="filled"
                            />
                          ) : (
                            <Chip
                              label="Đóng cửa"
                              color="default"
                              size="small"
                              variant="filled"
                            />
                          )}
                        </Stack>
                      </Box>
                      <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={handleOpenEditRestaurant}
                      >
                        Chỉnh sửa
                      </Button>
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "220px 1fr" },
                        gap: 3,
                      }}
                    >
                      <Avatar
                        variant="rounded"
                        src={restaurant.image}
                        sx={{
                          width: { xs: "100%", md: 220 },
                          height: 220,
                          bgcolor: "#f5f5f5",
                          borderRadius: 2,
                        }}
                      >
                        {restaurant.name?.charAt(0)}
                      </Avatar>

                      <Box
                        sx={{
                          bgcolor: "#fafafa",
                          borderRadius: 2,
                          p: 3,
                          flex: 1,
                        }}
                      >
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "1fr",
                              sm: "repeat(2, 1fr)",
                              lg: "repeat(3, 1fr)",
                            },
                            gap: 3,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                fontWeight: 600,
                              }}
                            >
                              Đánh giá
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                mt: 0.5,
                              }}
                            >
                              <StarIcon
                                sx={{ fontSize: 18, color: "#ffb700" }}
                              />
                              <Typography variant="body2" fontWeight={600}>
                                {restaurant.rating || 0} (
                                {restaurant.reviews || 0} đánh giá)
                              </Typography>
                            </Box>
                          </Box>

                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                fontWeight: 600,
                              }}
                            >
                              Số điện thoại
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ mt: 0.5 }}
                            >
                              {restaurant.phone || "Chưa cập nhật"}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                fontWeight: 600,
                              }}
                            >
                              Giờ mở cửa
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ mt: 0.5 }}
                            >
                              {restaurant.openingHours || "Chưa cập nhật"}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                fontWeight: 600,
                              }}
                            >
                              Giao hàng
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ mt: 0.5 }}
                            >
                              {restaurant.deliveryTime} phút •{" "}
                              {restaurant.deliveryFee?.toLocaleString()}đ
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              gridColumn: {
                                xs: "span 1",
                                sm: "span 2",
                                lg: "span 2",
                              },
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                fontWeight: 600,
                              }}
                            >
                              Địa chỉ
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ mt: 0.5, pr: 2 }}
                            >
                              {restaurant.address || "Chưa cập nhật"}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              gridColumn: {
                                xs: "span 1",
                                sm: "span 2",
                                lg: "span 3",
                              },
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                fontWeight: 600,
                              }}
                            >
                              Tags
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 1,
                                mt: 0.8,
                              }}
                            >
                              {(restaurant.tags || []).map((tag, idx) => (
                                <Chip
                                  key={idx}
                                  label={tag}
                                  size="small"
                                  sx={{
                                    fontWeight: 600,
                                    bgcolor: alpha("#ee4d2d", 0.08),
                                    color: "primary.main",
                                    border: "1px solid",
                                    borderColor: alpha("#ee4d2d", 0.3),
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Box
                    sx={{ textAlign: "center", py: 6, color: "text.secondary" }}
                  >
                    <StorefrontIcon
                      sx={{ fontSize: 64, mb: 2, opacity: 0.3 }}
                    />
                    <Typography>Không tìm thấy thông tin cửa hàng</Typography>
                  </Box>
                )}
              </Paper>
            )}

            {/* ═══ OVERVIEW TAB ═══ */}
            {activeTab === "overview" &&
              (() => {
                const stats = restaurantStats;
                const vnpayRevenue = stats?.vnpayRevenue || 0;
                const cashRevenue = stats?.cashRevenue || 0;
                const pendingOrders = stats?.countByStatus
                  ? ["pending", "confirmed", "preparing", "delivering"].reduce(
                    (s, k) => s + (stats.countByStatus[k] || 0),
                    0,
                  )
                  : allOrders.filter((o) =>
                    [
                      "pending",
                      "confirmed",
                      "preparing",
                      "delivering",
                    ].includes(o.status),
                  ).length;
                const completedOrders =
                  stats?.countByStatus?.delivered ||
                  allOrders.filter((o) => o.status === "delivered").length;
                const cancelledOrders =
                  stats?.countByStatus?.cancelled ||
                  allOrders.filter((o) => o.status === "cancelled").length;

                return (
                  <Box>
                    {/* Welcome Card */}
                    <Card
                      sx={{
                        mb: 3,
                        background:
                          "linear-gradient(135deg, #ee4d2d 0%, #ff7337 100%)",
                        color: "#fff",
                      }}
                      elevation={0}
                    >
                      <CardContent sx={{ py: 3 }}>
                        <Typography variant="h5">
                          Chào mừng trở lại, {user?.fullName || "Quản lý"}! 👋
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ mt: 1, opacity: 0.85 }}
                        >
                          Theo dõi và quản lý mọi hoạt động trên cửa hàng của
                          bạn một cách nhanh chóng.
                        </Typography>
                      </CardContent>
                    </Card>

                    {/* Summary Cards */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, 1fr)",
                          lg: "repeat(5, 1fr)",
                        },
                        gap: 3,
                      }}
                    >
                      {[
                        {
                          icon: <ReceiptLongIcon />,
                          label: "Đơn đang xử lý",
                          value: pendingOrders,
                          color: "#f59e0b",
                          bg: "#fef3c7",
                        },
                        {
                          icon: <DoneAllIcon />,
                          label: "Đơn hoàn thành",
                          value: completedOrders,
                          color: "#10b981",
                          bg: "#d1fae5",
                        },
                        {
                          icon: <BarChartIcon />,
                          label: "Doanh thu món ăn",
                          value: `${(vnpayRevenue + cashRevenue).toLocaleString("vi-VN")}đ`,
                          color: "#ee4d2d",
                          bg: "#fff0eb",
                        },
                        {
                          icon: <StorefrontIcon />,
                          label: "Tiền món (VNPay)",
                          value: `${vnpayRevenue.toLocaleString("vi-VN")}đ`,
                          color: "#2aa1ff",
                          bg: "#e6f4ff",
                        },
                        {
                          icon: <AttachMoneyIcon />,
                          label: "Tiền món (Tiền mặt)",
                          value: `${cashRevenue.toLocaleString("vi-VN")}đ`,
                          color: "#16a34a",
                          bg: "#dcfce7",
                        },
                      ].map((s, i) => (
                        <Card
                          key={i}
                          elevation={0}
                          sx={{ border: "1px solid #f0f0f0" }}
                        >
                          <CardContent
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              py: 2.5,
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: s.bg,
                                color: s.color,
                                width: 52,
                                height: 52,
                              }}
                            >
                              {s.icon}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {s.label}
                              </Typography>
                              <Typography variant="h5" fontWeight={700}>
                                {s.value}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>

                    {/* Charts Row */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                        gap: 3,
                        mt: 3,
                      }}
                    >
                      {/* Donut: Order Status */}
                      <Card
                        elevation={0}
                        sx={{
                          border: "1px solid rgba(0,0,0,0.06)",
                          overflow: "hidden",
                        }}
                      >
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 1 }}>
                            📊 Phân bổ trạng thái đơn
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Tổng: {allOrders.length} đơn hàng
                          </Typography>
                          <Box sx={{ height: 280, mt: 2 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    {
                                      name: "Hoàn thành",
                                      value: completedOrders,
                                      color: "#10b981",
                                    },
                                    {
                                      name: "Đang xử lý",
                                      value: pendingOrders,
                                      color: "#f59e0b",
                                    },
                                    {
                                      name: "Đã hủy",
                                      value: cancelledOrders,
                                      color: "#ef4444",
                                    },
                                  ].filter((d) => d.value > 0)}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={65}
                                  outerRadius={100}
                                  paddingAngle={4}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  {[
                                    {
                                      name: "Hoàn thành",
                                      value: completedOrders,
                                      color: "#10b981",
                                    },
                                    {
                                      name: "Đang xử lý",
                                      value: pendingOrders,
                                      color: "#f59e0b",
                                    },
                                    {
                                      name: "Đã hủy",
                                      value: cancelledOrders,
                                      color: "#ef4444",
                                    },
                                  ]
                                    .filter((d) => d.value > 0)
                                    .map((entry, index) => (
                                      <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RTooltip
                                  formatter={(value, name) => [
                                    `${value} đơn`,
                                    name,
                                  ]}
                                />
                                <Legend
                                  verticalAlign="bottom"
                                  iconType="circle"
                                  iconSize={10}
                                  formatter={(value) => (
                                    <span
                                      style={{
                                        color: "#666",
                                        fontSize: 13,
                                        fontWeight: 500,
                                      }}
                                    >
                                      {value}
                                    </span>
                                  )}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </Box>
                        </CardContent>
                      </Card>

                      {/* Area: Orders Timeline */}
                      <Card
                        elevation={0}
                        sx={{
                          border: "1px solid rgba(0,0,0,0.06)",
                          overflow: "hidden",
                        }}
                      >
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 1 }}>
                            📈 Thống kê đơn hàng
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Lượng đơn hàng trong 6 tháng qua
                          </Typography>
                          <Box sx={{ height: 280, mt: 2 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={(() => {
                                  const months = {};
                                  const monthNames = [
                                    "Th1",
                                    "Th2",
                                    "Th3",
                                    "Th4",
                                    "Th5",
                                    "Th6",
                                    "Th7",
                                    "Th8",
                                    "Th9",
                                    "Th10",
                                    "Th11",
                                    "Th12",
                                  ];
                                  const now = new Date();
                                  for (let i = 5; i >= 0; i--) {
                                    const d = new Date(
                                      now.getFullYear(),
                                      now.getMonth() - i,
                                      1,
                                    );
                                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                                    months[key] = {
                                      month:
                                        monthNames[d.getMonth()] +
                                        " " +
                                        d.getFullYear(),
                                      orders: 0,
                                    };
                                  }
                                  allOrders.forEach((o) => {
                                    if (!o.createdAt) return;
                                    const d = new Date(o.createdAt);
                                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                                    if (months[key]) months[key].orders++;
                                  });
                                  return Object.values(months);
                                })()}
                                margin={{
                                  top: 10,
                                  right: 30,
                                  left: -10,
                                  bottom: 0,
                                }}
                              >
                                <defs>
                                  <linearGradient
                                    id="gradOrders"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="5%"
                                      stopColor="#ee4d2d"
                                      stopOpacity={0.25}
                                    />
                                    <stop
                                      offset="95%"
                                      stopColor="#ee4d2d"
                                      stopOpacity={0}
                                    />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#f0f0f0"
                                />
                                <XAxis
                                  dataKey="month"
                                  tick={{ fontSize: 12, fill: "#999" }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  tick={{ fontSize: 12, fill: "#999" }}
                                  axisLine={false}
                                  tickLine={false}
                                  allowDecimals={false}
                                />
                                <RTooltip
                                  contentStyle={{
                                    borderRadius: 12,
                                    border: "none",
                                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                                  }}
                                />
                                <Legend
                                  verticalAlign="top"
                                  align="right"
                                  iconType="circle"
                                  iconSize={10}
                                  formatter={(value) => (
                                    <span
                                      style={{
                                        color: "#666",
                                        fontSize: 13,
                                        fontWeight: 500,
                                      }}
                                    >
                                      {value}
                                    </span>
                                  )}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="orders"
                                  name="Đơn hàng"
                                  stroke="#ee4d2d"
                                  strokeWidth={2.5}
                                  fillOpacity={1}
                                  fill="url(#gradOrders)"
                                  dot={{
                                    r: 4,
                                    fill: "#ee4d2d",
                                    strokeWidth: 2,
                                    stroke: "#fff",
                                  }}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  </Box>
                );
              })()}

            {/* ═══ PRODUCTS TAB ═══ */}
            {activeTab === "products" && (
              <Paper elevation={0} sx={{ border: "1px solid #f0f0f0" }}>
                <Box
                  sx={{
                    p: 2.5,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="h6">
                    Danh sách sản phẩm ({filteredProducts.length})
                  </Typography>
                  <Stack direction="row" spacing={1.5}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleOpenCreateProduct}
                    >
                      Thêm sản phẩm
                    </Button>
                  </Stack>
                </Box>

                {/* Filter tabs cho sản phẩm */}
                <Box sx={{ px: 2.5, pb: 2, display: "flex", gap: 1 }}>
                  {[
                    { value: "all", label: "Tất cả" },
                    { value: "food", label: "Đồ ăn" },
                    { value: "drink", label: "Thức uống" },
                  ].map((tab) => (
                    <Chip
                      key={tab.value}
                      label={tab.label}
                      onClick={() => setProductFilter(tab.value)}
                      color={
                        productFilter === tab.value ? "primary" : "default"
                      }
                      variant={
                        productFilter === tab.value ? "filled" : "outlined"
                      }
                      sx={{ fontWeight: 600, cursor: "pointer" }}
                    />
                  ))}
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#fafafa" }}>
                        <TableCell>Sản phẩm</TableCell>
                        <TableCell>Danh mục</TableCell>
                        <TableCell>Giá</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell align="right">Hành động</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow
                          key={product._id}
                          hover
                          sx={{ "&:last-child td": { border: 0 } }}
                        >
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                              }}
                            >
                              <Avatar
                                variant="rounded"
                                src={product.image}
                                sx={{ width: 48, height: 48 }}
                              >
                                {product.name?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {product.name}
                                </Typography>
                                {(() => {
                                  const activePromo = promotions.find(
                                    (p) =>
                                      p.isActive &&
                                      p.productIds.includes(product._id),
                                  );
                                  return activePromo ? (
                                    <Chip
                                      label={`Giảm ${activePromo.discountPercent}%`}
                                      size="small"
                                      sx={{
                                        mt: 0.5,
                                        bgcolor: "#ff424e",
                                        color: "#fff",
                                        fontWeight: 700,
                                        fontSize: "0.65rem",
                                        height: 20,
                                        "& .MuiChip-label": { px: 1 },
                                      }}
                                    />
                                  ) : (
                                    product.isBestSeller && (
                                      <Chip
                                        label="Best Seller"
                                        color="warning"
                                        size="small"
                                        sx={{ mt: 0.5 }}
                                      />
                                    )
                                  );
                                })()}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.8} alignItems="flex-start">
                              <Chip
                                icon={
                                  <LocalOfferIcon
                                    sx={{ fontSize: "0.9rem !important" }}
                                  />
                                }
                                label={product.category || "Chưa phân loại"}
                                size="small"
                                sx={{
                                  bgcolor: alpha("#ee4d2d", 0.1),
                                  color: "#b33922",
                                  border: "1px solid",
                                  borderColor: alpha("#ee4d2d", 0.25),
                                  fontWeight: 600,
                                }}
                              />
                              <Chip
                                label={
                                  product.type === "food"
                                    ? "Đồ ăn"
                                    : "Thức uống"
                                }
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: "#d9d9d9",
                                  color: "text.secondary",
                                  bgcolor: "#fff",
                                }}
                              />
                            </Stack>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const activePromo = promotions.find(
                                (p) =>
                                  p.isActive &&
                                  p.productIds.includes(product._id),
                              );
                              return activePromo ? (
                                <Box>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      textDecoration: "line-through",
                                      color: "text.secondary",
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    {product.price?.toLocaleString()}đ
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    fontWeight={700}
                                    color="primary.main"
                                  >
                                    {(
                                      product.price *
                                      (1 - activePromo.discountPercent / 100)
                                    ).toLocaleString()}
                                    đ
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="body1" fontWeight={600}>
                                  {product.price?.toLocaleString()}đ
                                </Typography>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.6} alignItems="flex-start">
                              {product.isAvailable ? (
                                <Chip
                                  icon={
                                    <CheckCircleIcon
                                      sx={{ color: "#0a6b60 !important" }}
                                    />
                                  }
                                  label="Còn hàng"
                                  size="small"
                                  sx={{
                                    bgcolor: alpha("#26aa99", 0.18),
                                    color: "#0a6b60",
                                    fontWeight: 700,
                                  }}
                                />
                              ) : (
                                <Chip
                                  icon={
                                    <BlockIcon
                                      sx={{ color: "#9f1d2f !important" }}
                                    />
                                  }
                                  label="Hết hàng"
                                  size="small"
                                  sx={{
                                    bgcolor: alpha("#ff424e", 0.18),
                                    color: "#9f1d2f",
                                    fontWeight: 700,
                                  }}
                                />
                              )}
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {product.isAvailable
                                  ? "Đang phục vụ"
                                  : "Tạm ngưng bán"}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <Stack
                              direction="row"
                              spacing={0.5}
                              justifyContent="flex-end"
                            >
                              <Tooltip title="Thiết lập Giảm giá (Flash Sale)">
                                <IconButton
                                  size="small"
                                  sx={{ color: "#ee4d2d" }}
                                  onClick={() =>
                                    handleOpenCreatePromotion(product)
                                  }
                                >
                                  <LocalOfferIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Chỉnh sửa">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenEditProduct(product)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Xoá">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    handleOpenDeleteProduct(product)
                                  }
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredProducts.length === 0 && !loading && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            sx={{
                              textAlign: "center",
                              py: 8,
                              color: "text.secondary",
                            }}
                          >
                            <InventoryIcon
                              sx={{ fontSize: 48, mb: 1, opacity: 0.3 }}
                            />
                            <br />
                            Chưa có sản phẩm nào.
                          </TableCell>
                        </TableRow>
                      )}
                      {loading && filteredProducts.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            sx={{ textAlign: "center", py: 8 }}
                          >
                            <CircularProgress color="primary" />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {/* ═══ FLASH SALE TAB ═══ */}
            {activeTab === "flash-sale" && (
              <Box>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    mb: 3,
                    background:
                      "linear-gradient(135deg, #ffedeb 0%, #fff 100%)",
                    border: "1px solid #f2b8aa",
                    borderRadius: 3,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="h5" fontWeight={700} color="#ee4d2d">
                      ⚡ Quản Lý Flash Sale
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      Tạo các chương trình giảm giá để thu hút khách hàng và
                      tăng doanh thu.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenCreatePromotion()}
                    sx={{
                      bgcolor: "#ee4d2d",
                      "&:hover": { bgcolor: "#d74528" },
                    }}
                  >
                    Tạo chương trình mới
                  </Button>
                </Paper>

                {loading ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 8 }}
                  >
                    <CircularProgress color="primary" />
                  </Box>
                ) : promotions.length === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{
                      border: "1px solid #f0f0f0",
                      py: 10,
                      textAlign: "center",
                      borderRadius: 3,
                    }}
                  >
                    <LocalOfferIcon
                      sx={{
                        fontSize: 64,
                        mb: 2,
                        opacity: 0.1,
                        color: "#ee4d2d",
                      }}
                    />
                    <Typography variant="h6" color="text.secondary">
                      Chưa có chương trình Flash Sale nào
                    </Typography>
                    <Button
                      variant="text"
                      color="primary"
                      sx={{ mt: 2 }}
                      onClick={() => handleOpenCreatePromotion()}
                    >
                      Bất đầu tạo chương trình đầu tiên
                    </Button>
                  </Paper>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                      gap: 3,
                    }}
                  >
                    {promotions.map((promo) => (
                      <Card
                        key={promo._id}
                        elevation={0}
                        sx={{
                          border: "1px solid",
                          borderColor: promo.isActive ? "#f2b8aa" : "#eee",
                          borderRadius: 3,
                          overflow: "hidden",
                          transition: "all 0.2s",
                          "&:hover": {
                            boxShadow: "0 8px 24px rgba(238,77,45,0.08)",
                          },
                        }}
                      >
                        <CardContent sx={{ p: 0 }}>
                          <Box
                            sx={{
                              p: 2,
                              bgcolor: promo.isActive
                                ? alpha("#ee4d2d", 0.04)
                                : "#fafafa",
                              borderBottom: "1px solid",
                              borderColor: promo.isActive
                                ? alpha("#ee4d2d", 0.1)
                                : "#eee",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Box>
                              <Typography variant="subtitle1" fontWeight={700}>
                                {promo.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {new Date(promo.createdAt).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </Typography>
                            </Box>
                            <Chip
                              label={promo.isActive ? "ĐANG CHẠY" : "TẠM DỪNG"}
                              size="small"
                              sx={{
                                bgcolor: promo.isActive ? "#ee4d2d" : "#999",
                                color: "#fff",
                                fontWeight: 800,
                                fontSize: "0.65rem",
                              }}
                            />
                          </Box>

                          <Box sx={{ p: 2 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: 1,
                                mb: 2,
                              }}
                            >
                              <Typography
                                variant="h4"
                                fontWeight={800}
                                color="#ee4d2d"
                              >
                                -{promo.discountPercent}%
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                cho các sản phẩm đã chọn
                              </Typography>
                            </Box>

                            <Typography
                              variant="caption"
                              fontWeight={700}
                              color="text.secondary"
                              sx={{ display: "block", mb: 1 }}
                            >
                              SẢN PHẨM ÁP DỤNG ({promo.productIds?.length || 0})
                            </Typography>

                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{ overflowX: "auto", pb: 1 }}
                            >
                              {promo.productIds?.slice(0, 5).map((pid) => {
                                const prod = productsList.find(
                                  (p) => p._id === pid,
                                );
                                return prod ? (
                                  <Tooltip key={pid} title={prod.name}>
                                    <Avatar
                                      variant="rounded"
                                      src={prod.image}
                                      sx={{
                                        width: 52,
                                        height: 52,
                                        border: "1px solid #eee",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                      }}
                                    />
                                  </Tooltip>
                                ) : null;
                              })}
                              {promo.productIds?.length > 5 && (
                                <Avatar
                                  variant="rounded"
                                  sx={{
                                    width: 52,
                                    height: 52,
                                    bgcolor: "#eee",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "#666",
                                  }}
                                >
                                  +{promo.productIds.length - 5}
                                </Avatar>
                              )}
                            </Stack>
                          </Box>

                          <Divider />

                          <Box
                            sx={{
                              p: 1.5,
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 1,
                            }}
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<RefreshIcon />}
                              onClick={() => handleExtendPromotion(promo._id)}
                              sx={{
                                color: "primary.main",
                                borderColor: alpha("#ee4d2d", 0.3),
                              }}
                            >
                              Gia hạn
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="inherit"
                              startIcon={<EditIcon />}
                              onClick={() => handleOpenEditPromotion(promo)}
                              sx={{
                                color: "text.secondary",
                                borderColor: "#ddd",
                              }}
                            >
                              Sửa
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleDeletePromotion(promo._id)}
                              sx={{ borderColor: alpha("#ff424e", 0.3) }}
                            >
                              Xoá
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </Box>
            )}
            {/* ═══ ORDERS TAB ═══ */}
            {activeTab === "orders" &&
              (() => {
                const STATUS_CONFIG = {
                  pending: {
                    label: "Chờ xác nhận",
                    color: "#f59e0b",
                    bg: "#fef3c7",
                    icon: <HourglassEmptyIcon sx={{ fontSize: 16 }} />,
                  },
                  preparing: {
                    label: "Đang chuẩn bị",
                    color: "#8b5cf6",
                    bg: "#ede9fe",
                    icon: <InventoryIcon sx={{ fontSize: 16 }} />,
                  },
                  ready_for_pickup: {
                    label: "Chờ Shipper đến lấy",
                    color: "#f97316",
                    bg: "#ffedd5",
                    icon: <LocalShippingIcon sx={{ fontSize: 16 }} />,
                  },
                  shipper_accepted: {
                    label: "Shipper đã nhận đơn",
                    color: "#06b6d4",
                    bg: "#cffafe",
                    icon: <LocalShippingIcon sx={{ fontSize: 16 }} />,
                  },
                  delivering: {
                    label: "Đang giao hàng",
                    color: "#0ea5e9",
                    bg: "#e0f2fe",
                    icon: <LocalShippingIcon sx={{ fontSize: 16 }} />,
                  },
                  shipper_delivered: {
                    label: "Shipper báo giao xong",
                    color: "#84cc16",
                    bg: "#ecfccb",
                    icon: <DoneAllIcon sx={{ fontSize: 16 }} />,
                  },
                  delivered: {
                    label: "Thành công",
                    color: "#10b981",
                    bg: "#d1fae5",
                    icon: <DoneAllIcon sx={{ fontSize: 16 }} />,
                  },
                  cancelled: {
                    label: "Đã hủy",
                    color: "#ef4444",
                    bg: "#fee2e2",
                    icon: <CancelIcon sx={{ fontSize: 16 }} />,
                  },
                  bombed: {
                    label: "Bị bom hàng",
                    color: "#dc2626",
                    bg: "#fef2f2",
                    icon: <BlockIcon sx={{ fontSize: 16 }} />,
                  },
                };

                const NEXT_ACTION = {
                  pending: {
                    status: "preparing",
                    label: "✅ Xác nhận & Chuẩn bị",
                  },
                };

                const filterTabs = [
                  { value: "all", label: "Tất cả" },
                  { value: "pending", label: "Chờ xác nhận" },
                  { value: "preparing", label: "Đang chuẩn bị" },
                  { value: "ready_for_pickup", label: "Chờ shipper" },
                  { value: "shipper_accepted", label: "Shipper đã nhận" },
                  { value: "delivering", label: "Đang giao" },
                  { value: "shipper_delivered", label: "Báo giao xong" },
                  { value: "delivered", label: "Hoàn thành" },
                  { value: "cancelled", label: "Đã hủy" },
                ];

                const pendingCount = ordersList.filter(
                  (o) => o.status === "pending",
                ).length;

                return (
                  <Box>
                    {/* Filter tabs */}
                    <Paper
                      elevation={0}
                      sx={{
                        border: "1px solid #f0f0f0",
                        mb: 2,
                        p: 1.5,
                        display: "flex",
                        gap: 1,
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {filterTabs.map((tab) => (
                          <Chip
                            key={tab.value}
                            label={
                              tab.value === "pending" && pendingCount > 0
                                ? `${tab.label} (${pendingCount})`
                                : tab.label
                            }
                            onClick={() => {
                              setOrderStatusFilter(tab.value);
                              setTimeout(() => fetchOrders(), 100);
                            }}
                            color={
                              orderStatusFilter === tab.value
                                ? "primary"
                                : "default"
                            }
                            variant={
                              orderStatusFilter === tab.value
                                ? "filled"
                                : "outlined"
                            }
                            sx={{ fontWeight: 600, cursor: "pointer" }}
                          />
                        ))}
                      </Box>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => fetchOrders()}
                        disabled={ordersLoading}
                        size="small"
                      >
                        {ordersLoading ? "Đang tải..." : "Làm mới"}
                      </Button>
                    </Paper>

                    {/* Orders list */}
                    {ordersLoading ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          py: 8,
                        }}
                      >
                        <CircularProgress color="primary" />
                      </Box>
                    ) : ordersList.length === 0 ? (
                      <Paper
                        elevation={0}
                        sx={{
                          border: "1px solid #f0f0f0",
                          py: 8,
                          textAlign: "center",
                          color: "text.secondary",
                        }}
                      >
                        <ReceiptLongIcon
                          sx={{ fontSize: 64, mb: 2, opacity: 0.3 }}
                        />
                        <Typography>Chưa có đơn hàng nào</Typography>
                      </Paper>
                    ) : (
                      <Stack spacing={2}>
                        {ordersList.map((order) => {
                          const cfg =
                            STATUS_CONFIG[order.status] ||
                            STATUS_CONFIG.pending;
                          const nextAction = NEXT_ACTION[order.status];
                          const isUpdating = updatingOrderId === order._id;

                          return (
                            <Paper
                              key={order._id}
                              elevation={0}
                              sx={{
                                border: "1px solid #f0f0f0",
                                borderRadius: 2,
                                overflow: "hidden",
                              }}
                            >
                              {/* Header */}
                              <Box
                                sx={{
                                  px: 2.5,
                                  py: 1.5,
                                  bgcolor: "#fafafa",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  borderBottom: "1px solid #f0f0f0",
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ fontFamily: "monospace" }}
                                  >
                                    #{order._id.slice(-8).toUpperCase()}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {new Date(order.createdAt).toLocaleString(
                                      "vi-VN",
                                    )}
                                  </Typography>
                                </Box>
                                <Chip
                                  icon={cfg.icon}
                                  label={cfg.label}
                                  size="small"
                                  sx={{
                                    bgcolor: cfg.bg,
                                    color: cfg.color,
                                    fontWeight: 700,
                                    border: `1px solid ${cfg.color}30`,
                                  }}
                                />
                              </Box>

                              <Box
                                sx={{
                                  px: 2.5,
                                  py: 2,
                                  display: "flex",
                                  gap: 3,
                                  flexWrap: "wrap",
                                }}
                              >
                                {/* Customer info */}
                                <Box sx={{ minWidth: 160 }}>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    fontWeight={700}
                                  >
                                    KHÁCH HÀNG
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    fontWeight={600}
                                    sx={{ mt: 0.5 }}
                                  >
                                    {order.user?.fullName || "Khách"}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {order.user?.phone || ""}
                                  </Typography>
                                </Box>

                                {/* Address */}
                                <Box sx={{ flex: 1, minWidth: 200 }}>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    fontWeight={700}
                                  >
                                    ĐỊA CHỈ GIAO
                                  </Typography>
                                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    {order.deliveryAddress}
                                  </Typography>
                                </Box>

                                {/* Items */}
                                <Box sx={{ minWidth: 200 }}>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    fontWeight={700}
                                  >
                                    MÓN ĐẶT ({order.items?.length})
                                  </Typography>
                                  <Stack spacing={0.3} sx={{ mt: 0.5 }}>
                                    {order.items
                                      ?.slice(0, 3)
                                      .map((item, idx) => (
                                        <Typography key={idx} variant="body2">
                                          {item.emoji} {item.name} x
                                          {item.quantity}
                                        </Typography>
                                      ))}
                                    {order.items?.length > 3 && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        +{order.items.length - 3} món khác
                                      </Typography>
                                    )}
                                  </Stack>
                                </Box>

                                {/* Total */}
                                <Box sx={{ textAlign: "right" }}>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    fontWeight={700}
                                  >
                                    TIỀN HÀNG
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    color="primary.main"
                                    fontWeight={700}
                                    sx={{ mt: 0.5 }}
                                  >
                                    {(
                                      (order.total || 0) -
                                      (order.deliveryFee || 0)
                                    ).toLocaleString("vi-VN")}
                                    đ
                                  </Typography>
                                  {order.deliveryFee > 0 && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ display: "block", mt: 0.3 }}
                                    >
                                      🚚 Ship:{" "}
                                      {order.deliveryFee?.toLocaleString(
                                        "vi-VN",
                                      )}
                                      đ (shipper)
                                    </Typography>
                                  )}
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {order.paymentMethod?.toUpperCase()}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Note */}
                              {order.note && (
                                <Box sx={{ px: 2.5, pb: 1.5 }}>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    📝 Ghi chú: {order.note}
                                  </Typography>
                                </Box>
                              )}

                              {/* Actions */}
                              <Box
                                sx={{
                                  px: 2.5,
                                  py: 1.5,
                                  bgcolor: "#fafafa",
                                  borderTop: "1px solid #f0f0f0",
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  gap: 1.5,
                                  flexWrap: "wrap",
                                }}
                              >
                                {/* Cancel button for pending */}
                                {order.status === "pending" && (
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    disabled={isUpdating}
                                    onClick={() =>
                                      handleUpdateOrderStatus(
                                        order._id,
                                        "cancelled",
                                      )
                                    }
                                  >
                                    ❌ Từ chối
                                  </Button>
                                )}

                                {/* Standard flow: pending → confirmed → preparing */}
                                {NEXT_ACTION[order.status] && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    disabled={isUpdating}
                                    startIcon={
                                      isUpdating ? (
                                        <CircularProgress
                                          size={16}
                                          color="inherit"
                                        />
                                      ) : null
                                    }
                                    onClick={() =>
                                      handleUpdateOrderStatus(
                                        order._id,
                                        NEXT_ACTION[order.status].status,
                                      )
                                    }
                                  >
                                    {isUpdating
                                      ? "Đang cập nhật..."
                                      : NEXT_ACTION[order.status].label}
                                  </Button>
                                )}

                                {/* Brand: bàn giao cho shipper (preparing → ready_for_pickup) */}
                                {order.status === "preparing" && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    disabled={isUpdating}
                                    sx={{
                                      bgcolor: "#f97316",
                                      "&:hover": { bgcolor: "#ea6c0a" },
                                    }}
                                    startIcon={
                                      isUpdating ? (
                                        <CircularProgress
                                          size={16}
                                          color="inherit"
                                        />
                                      ) : (
                                        <LocalShippingIcon />
                                      )
                                    }
                                    onClick={() =>
                                      handleBrandHandover(order._id)
                                    }
                                  >
                                    {isUpdating
                                      ? "Đang xử lý..."
                                      : "📦 Bàn giao cho Shipper"}
                                  </Button>
                                )}

                                {/* Status info for read-only states */}
                                {order.status === "ready_for_pickup" && (
                                  <Chip
                                    label="⏳ Chờ shipper đến lấy"
                                    color="warning"
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                                {order.status === "shipper_accepted" && (
                                  <Chip
                                    label="🛥 Shipper đang trên đường"
                                    color="info"
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                                {order.status === "delivering" && (
                                  <Chip
                                    label="🚀 Shipper đang giao"
                                    color="info"
                                    size="small"
                                    variant="outlined"
                                  />
                                )}

                                {/* Waiting for customer to confirm (shipper_delivered → delivered) */}
                                {order.status === "shipper_delivered" && (
                                  <Chip
                                    label="⏳ Chờ khách hàng xác nhận"
                                    color="warning"
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            </Paper>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>
                );
              })()}
          </Box>
        </Box>
      </Box>

      {/* ═══════════════════════════════════════════ */}
      {/*  DIALOGS (Modals)                          */}
      {/* ═══════════════════════════════════════════ */}

      {/* ─── Create Product Dialog ─── */}
      <Dialog
        open={isCreateProductModalOpen}
        onClose={() => setIsCreateProductModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Thêm sản phẩm mới</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Tạo sản phẩm mới cho cửa hàng của bạn.
          </Typography>
          <form id="createProductForm" onSubmit={submitCreateProduct}>
            <TextField
              fullWidth
              label="Tên sản phẩm"
              required
              value={productForm.name}
              onChange={(e) =>
                setProductForm({ ...productForm, name: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Giá (VND)"
                type="text"
                required
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                value={String(productForm.price ?? "")}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, "");
                  const normalized = digitsOnly.replace(/^0+(?=\d)/, "");
                  setProductForm({
                    ...productForm,
                    price: normalized === "" ? 0 : Number(normalized),
                  });
                }}
                onBlur={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, "");
                  const normalized = digitsOnly.replace(/^0+(?=\d)/, "");
                  setProductForm({
                    ...productForm,
                    price: normalized === "" ? 0 : Number(normalized),
                  });
                }}
              />
              <FormControl fullWidth required>
                <InputLabel>Danh mục</InputLabel>
                <Select
                  value={
                    PRODUCT_CATEGORY_OPTIONS.includes(productForm.category)
                      ? productForm.category
                      : CUSTOM_CATEGORY_VALUE
                  }
                  label="Danh mục"
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    if (nextValue === CUSTOM_CATEGORY_VALUE) {
                      setProductForm((prev) => ({ ...prev, category: "" }));
                      return;
                    }
                    setProductForm((prev) => ({
                      ...prev,
                      category: nextValue,
                    }));
                  }}
                  renderValue={(selected) => (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LocalOfferIcon sx={{ fontSize: 16, color: "#ee4d2d" }} />
                      <span>
                        {selected === CUSTOM_CATEGORY_VALUE
                          ? "Danh mục tuỳ chỉnh"
                          : selected}
                      </span>
                    </Stack>
                  )}
                >
                  {PRODUCT_CATEGORY_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                  <MenuItem value={CUSTOM_CATEGORY_VALUE}>
                    Danh mục tuỳ chỉnh...
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
            {!PRODUCT_CATEGORY_OPTIONS.includes(productForm.category) && (
              <TextField
                fullWidth
                label="Danh mục tuỳ chỉnh"
                required
                placeholder="VD: Bánh tráng, Trà đào..."
                value={productForm.category}
                onChange={(e) =>
                  setProductForm({ ...productForm, category: e.target.value })
                }
                sx={{ mb: 2 }}
              />
            )}
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Loại</InputLabel>
                <Select
                  value={productForm.type}
                  label="Loại"
                  onChange={(e) => {
                    const nextType = e.target.value;
                    setProductForm((prev) => ({
                      ...prev,
                      type: nextType,
                      allowToppings:
                        nextType === "drink" ? prev.allowToppings : false,
                      toppings: nextType === "drink" ? prev.toppings : [],
                    }));
                  }}
                >
                  <MenuItem value="food">Đồ ăn</MenuItem>
                  <MenuItem value="drink">Thức uống</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Cho phép topping</InputLabel>
                <Select
                  value={productForm.allowToppings ? "true" : "false"}
                  label="Cho phép topping"
                  onChange={(e) => {
                    const nextAllow = e.target.value === "true";
                    if (nextAllow && productForm.type !== "drink") {
                      showSnack(
                        "Chỉ đồ uống mới có thể thêm topping",
                        "warning",
                      );
                      return;
                    }
                    setProductForm((prev) => ({
                      ...prev,
                      allowToppings: nextAllow,
                      toppings: nextAllow ? prev.toppings : [],
                    }));
                    if (nextAllow) {
                      setIsToppingsModalOpen(true);
                    }
                  }}
                >
                  <MenuItem value="true">Có</MenuItem>
                  <MenuItem value="false">Không</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            {productForm.type === "drink" && productForm.allowToppings && (
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  border: "1px dashed #f2b8aa",
                  borderRadius: 2,
                  bgcolor: "#fff8f5",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Đã thiết lập {(productForm.toppings || []).length} topping
                    cho món này.
                  </Typography>
                  <Button
                    type="button"
                    size="small"
                    variant="outlined"
                    onClick={openToppingsModal}
                  >
                    Thiết lập topping
                  </Button>
                </Stack>
              </Box>
            )}
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Best Seller</InputLabel>
                <Select
                  value={productForm.isBestSeller ? "true" : "false"}
                  label="Best Seller"
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      isBestSeller: e.target.value === "true",
                    })
                  }
                >
                  <MenuItem value="true">Có</MenuItem>
                  <MenuItem value="false">Không</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={productForm.isAvailable ? "true" : "false"}
                  label="Trạng thái"
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      isAvailable: e.target.value === "true",
                    })
                  }
                >
                  <MenuItem value="true">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CheckCircleIcon
                        sx={{ fontSize: 18, color: "#26aa99" }}
                      />
                      <span>Còn hàng</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="false">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <BlockIcon sx={{ fontSize: 18, color: "#ff424e" }} />
                      <span>Hết hàng</span>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TextField
              fullWidth
              label="Link hình ảnh (URL)"
              type="url"
              required
              value={productForm.image}
              onChange={(e) =>
                setProductForm({ ...productForm, image: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Mô tả sản phẩm"
              value={productForm.description}
              onChange={(e) =>
                setProductForm({ ...productForm, description: e.target.value })
              }
            />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsCreateProductModalOpen(false)}>
            Huỷ
          </Button>
          <Button
            type="submit"
            form="createProductForm"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Tạo sản phẩm
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Edit Product Dialog ─── */}
      <Dialog
        open={isEditProductModalOpen}
        onClose={() => setIsEditProductModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cập nhật thông tin sản phẩm <strong>{selectedProduct?.name}</strong>
            .
          </Typography>
          <form id="editProductForm" onSubmit={submitEditProduct}>
            <TextField
              fullWidth
              label="Tên sản phẩm"
              required
              value={productForm.name}
              onChange={(e) =>
                setProductForm({ ...productForm, name: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Giá (VND)"
                type="text"
                required
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                value={String(productForm.price ?? "")}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, "");
                  const normalized = digitsOnly.replace(/^0+(?=\d)/, "");
                  setProductForm({
                    ...productForm,
                    price: normalized === "" ? 0 : Number(normalized),
                  });
                }}
                onBlur={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, "");
                  const normalized = digitsOnly.replace(/^0+(?=\d)/, "");
                  setProductForm({
                    ...productForm,
                    price: normalized === "" ? 0 : Number(normalized),
                  });
                }}
              />
              <FormControl fullWidth required>
                <InputLabel>Danh mục</InputLabel>
                <Select
                  value={
                    PRODUCT_CATEGORY_OPTIONS.includes(productForm.category)
                      ? productForm.category
                      : CUSTOM_CATEGORY_VALUE
                  }
                  label="Danh mục"
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    if (nextValue === CUSTOM_CATEGORY_VALUE) {
                      setProductForm((prev) => ({ ...prev, category: "" }));
                      return;
                    }
                    setProductForm((prev) => ({
                      ...prev,
                      category: nextValue,
                    }));
                  }}
                  renderValue={(selected) => (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LocalOfferIcon sx={{ fontSize: 16, color: "#ee4d2d" }} />
                      <span>
                        {selected === CUSTOM_CATEGORY_VALUE
                          ? "Danh mục tuỳ chỉnh"
                          : selected}
                      </span>
                    </Stack>
                  )}
                >
                  {PRODUCT_CATEGORY_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                  <MenuItem value={CUSTOM_CATEGORY_VALUE}>
                    Danh mục tuỳ chỉnh...
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
            {!PRODUCT_CATEGORY_OPTIONS.includes(productForm.category) && (
              <TextField
                fullWidth
                label="Danh mục tuỳ chỉnh"
                required
                placeholder="VD: Bánh tráng, Trà đào..."
                value={productForm.category}
                onChange={(e) =>
                  setProductForm({ ...productForm, category: e.target.value })
                }
                sx={{ mb: 2 }}
              />
            )}
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Loại</InputLabel>
                <Select
                  value={productForm.type}
                  label="Loại"
                  onChange={(e) => {
                    const nextType = e.target.value;
                    setProductForm((prev) => ({
                      ...prev,
                      type: nextType,
                      allowToppings:
                        nextType === "drink" ? prev.allowToppings : false,
                      toppings: nextType === "drink" ? prev.toppings : [],
                    }));
                  }}
                >
                  <MenuItem value="food">Đồ ăn</MenuItem>
                  <MenuItem value="drink">Thức uống</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Cho phép topping</InputLabel>
                <Select
                  value={productForm.allowToppings ? "true" : "false"}
                  label="Cho phép topping"
                  onChange={(e) => {
                    const nextAllow = e.target.value === "true";
                    if (nextAllow && productForm.type !== "drink") {
                      showSnack(
                        "Chỉ đồ uống mới có thể thêm topping",
                        "warning",
                      );
                      return;
                    }
                    setProductForm((prev) => ({
                      ...prev,
                      allowToppings: nextAllow,
                      toppings: nextAllow ? prev.toppings : [],
                    }));
                    if (nextAllow) {
                      setIsToppingsModalOpen(true);
                    }
                  }}
                >
                  <MenuItem value="true">Có</MenuItem>
                  <MenuItem value="false">Không</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            {productForm.type === "drink" && productForm.allowToppings && (
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  border: "1px dashed #f2b8aa",
                  borderRadius: 2,
                  bgcolor: "#fff8f5",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Đã thiết lập {(productForm.toppings || []).length} topping
                    cho món này.
                  </Typography>
                  <Button
                    type="button"
                    size="small"
                    variant="outlined"
                    onClick={openToppingsModal}
                  >
                    Thiết lập topping
                  </Button>
                </Stack>
              </Box>
            )}
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Best Seller</InputLabel>
                <Select
                  value={productForm.isBestSeller ? "true" : "false"}
                  label="Best Seller"
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      isBestSeller: e.target.value === "true",
                    })
                  }
                >
                  <MenuItem value="true">Có</MenuItem>
                  <MenuItem value="false">Không</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={productForm.isAvailable ? "true" : "false"}
                  label="Trạng thái"
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      isAvailable: e.target.value === "true",
                    })
                  }
                >
                  <MenuItem value="true">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CheckCircleIcon
                        sx={{ fontSize: 18, color: "#26aa99" }}
                      />
                      <span>Còn hàng</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="false">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <BlockIcon sx={{ fontSize: 18, color: "#ff424e" }} />
                      <span>Hết hàng</span>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TextField
              fullWidth
              label="Link hình ảnh (URL)"
              type="url"
              required
              value={productForm.image}
              onChange={(e) =>
                setProductForm({ ...productForm, image: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Mô tả sản phẩm"
              value={productForm.description}
              onChange={(e) =>
                setProductForm({ ...productForm, description: e.target.value })
              }
            />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsEditProductModalOpen(false)}>Huỷ</Button>
          <Button type="submit" form="editProductForm" variant="contained">
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Product Dialog ─── */}
      <Dialog
        open={isDeleteProductModalOpen}
        onClose={() => setIsDeleteProductModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle color="error.main">⚠️ Xoá sản phẩm</DialogTitle>
        <DialogContent>
          <Typography>
            Xoá hoàn toàn <strong>{selectedProduct?.name}</strong> khỏi hệ
            thống. Không thể phục hồi!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsDeleteProductModalOpen(false)}>
            Quay lại
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={submitDeleteProduct}
          >
            Có, Xoá ngay
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Edit Restaurant Dialog ─── */}
      <Dialog
        open={isEditRestaurantModalOpen}
        onClose={() => setIsEditRestaurantModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chỉnh sửa thông tin cửa hàng</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cập nhật thông tin cửa hàng của bạn.
          </Typography>
          <form id="editRestaurantForm" onSubmit={submitEditRestaurant}>
            <TextField
              fullWidth
              label="Tên cửa hàng"
              required
              value={restaurantForm.name}
              onChange={(e) =>
                setRestaurantForm({ ...restaurantForm, name: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth required sx={{ mb: 2 }}>
              <InputLabel>Loại cửa hàng</InputLabel>
              <Select
                value={restaurantForm.type}
                label="Loại cửa hàng"
                onChange={(e) =>
                  setRestaurantForm({ ...restaurantForm, type: e.target.value })
                }
              >
                <MenuItem value="food">Đồ ăn</MenuItem>
                <MenuItem value="drink">Thức uống</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Tags (phân tách bằng dấu phẩy)"
              required
              placeholder="VD: Việt Nam, Phở"
              value={restaurantForm.tags}
              onChange={(e) =>
                setRestaurantForm({ ...restaurantForm, tags: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Trạng thái mở cửa</InputLabel>
                <Select
                  value={restaurantForm.isOpen ? "true" : "false"}
                  label="Trạng thái mở cửa"
                  onChange={(e) =>
                    setRestaurantForm({
                      ...restaurantForm,
                      isOpen: e.target.value === "true",
                    })
                  }
                >
                  <MenuItem value="true">Đang mở</MenuItem>
                  <MenuItem value="false">Đóng cửa</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Giờ mở cửa"
                required
                placeholder="VD: 08:00 - 22:00"
                value={restaurantForm.openingHours}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    openingHours: e.target.value,
                  })
                }
              />
            </Stack>
            <TextField
              fullWidth
              label="Link hình ảnh logo (URL)"
              type="url"
              required
              value={restaurantForm.image}
              onChange={(e) =>
                setRestaurantForm({ ...restaurantForm, image: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Link ảnh banner (URL) — ảnh nền rộng phía trên trang"
              type="url"
              placeholder="https://... (để trống sẽ dùng ảnh logo làm nền)"
              value={restaurantForm.thumbnail}
              onChange={(e) =>
                setRestaurantForm({
                  ...restaurantForm,
                  thumbnail: e.target.value,
                })
              }
              sx={{ mb: 2 }}
              helperText="Nên dùng ảnh ngang tỷ lệ 16:9 hoặc 3:1 để đẹp nhất"
            />
            <TextField
              fullWidth
              label="Địa chỉ (Tự động cập nhật khi chọn trên bản đồ)"
              required
              value={restaurantForm.address}
              onChange={(e) =>
                setRestaurantForm({
                  ...restaurantForm,
                  address: e.target.value,
                })
              }
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 1, fontWeight: 700 }}>
              Vị trí trên bản đồ
            </Typography>
            <Box sx={{ mb: 3, borderRadius: 2, overflow: "hidden", border: "1px solid #ddd" }}>
              <LocationPicker
                lat={restaurantForm.latitude}
                lng={restaurantForm.longitude}
                onLocationChange={handleLocationChange}
              />
            </Box>
            <TextField
              fullWidth
              label="Số điện thoại"
              required
              value={restaurantForm.phone}
              onChange={(e) =>
                setRestaurantForm({ ...restaurantForm, phone: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Mô tả cửa hàng"
              required
              value={restaurantForm.description}
              onChange={(e) =>
                setRestaurantForm({
                  ...restaurantForm,
                  description: e.target.value,
                })
              }
            />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsEditRestaurantModalOpen(false)}>
            Huỷ
          </Button>
          <Button type="submit" form="editRestaurantForm" variant="contained">
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Toppings Dialog ─── */}
      <Dialog
        open={isToppingsModalOpen}
        onClose={() => setIsToppingsModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Thiết lập topping</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Thêm topping cho đồ uống. Mỗi topping có thể có phụ thu riêng.
          </Typography>

          <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Tên topping"
              value={toppingDraft.name}
              onChange={(e) =>
                setToppingDraft((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <TextField
              sx={{ minWidth: 170 }}
              label="Phụ thu (VND)"
              type="number"
              inputProps={{ min: 0, step: 1000 }}
              value={toppingDraft.extraPrice}
              onChange={(e) =>
                setToppingDraft((prev) => ({
                  ...prev,
                  extraPrice: Number(e.target.value) || 0,
                }))
              }
            />
            <Button
              type="button"
              variant="contained"
              onClick={handleAddTopping}
            >
              Thêm
            </Button>
          </Stack>

          <Stack spacing={1}>
            {(productForm.toppings || []).length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Chưa có topping nào.
              </Typography>
            )}
            {(productForm.toppings || []).map((item, idx) => (
              <Box
                key={`${item.name}-${idx}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  px: 1.5,
                  py: 1,
                  border: "1px solid #eee",
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2">
                  {item.name}{" "}
                  {Number(item.extraPrice) > 0
                    ? `(+${Number(item.extraPrice).toLocaleString()}đ)`
                    : ""}
                </Typography>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveTopping(idx)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsToppingsModalOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Promotion (Flash Sale) Dialog ─── */}
      <Dialog
        open={isPromotionModalOpen}
        onClose={() => setIsPromotionModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <form onSubmit={submitPromotion}>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h6" fontWeight={800} color="#ee4d2d">
              {selectedPromotion
                ? "Chỉnh sửa Flash Sale"
                : "Tạo chương trình Flash Sale mới"}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {selectedPromotion
                ? "Cập nhật các thông số cho chương trình giảm giá hiện tại."
                : "Thiết lập phần trăm giảm giá và chọn các sản phẩm bạn muốn áp dụng."}
            </Typography>

            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Tên chương trình"
                required
                placeholder="Ví dụ: Flash Sale Cuối Tuần"
                value={promotionForm.name}
                onChange={(e) =>
                  setPromotionForm({ ...promotionForm, name: e.target.value })
                }
              />

              <Box>
                <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                  Mức giảm giá (%)
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    type="number"
                    sx={{ width: 120 }}
                    value={promotionForm.discountPercent}
                    onChange={(e) =>
                      setPromotionForm({
                        ...promotionForm,
                        discountPercent: Number(e.target.value),
                      })
                    }
                    inputProps={{ min: 1, max: 99 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">%</InputAdornment>
                      ),
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {[10, 15, 20, 30, 50].map((val) => (
                        <Chip
                          key={val}
                          label={`${val}%`}
                          onClick={() =>
                            setPromotionForm({
                              ...promotionForm,
                              discountPercent: val,
                            })
                          }
                          color={
                            promotionForm.discountPercent === val
                              ? "primary"
                              : "default"
                          }
                          variant={
                            promotionForm.discountPercent === val
                              ? "filled"
                              : "outlined"
                          }
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Stack>
              </Box>

              <Box>
                <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                  Chọn sản phẩm áp dụng ({promotionForm.productIds.length})
                </Typography>

                <TextField
                  fullWidth
                  size="small"
                  placeholder="Tìm sản phẩm..."
                  value={promoProductSearch}
                  onChange={(e) => setPromoProductSearch(e.target.value)}
                  sx={{ mb: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Paper
                  variant="outlined"
                  sx={{
                    maxHeight: 250,
                    overflowY: "auto",
                    borderRadius: 2,
                    p: 1,
                  }}
                >
                  <List size="small">
                    {productsList
                      .filter(
                        (p) =>
                          !promoProductSearch ||
                          p.name
                            ?.toLowerCase()
                            .includes(promoProductSearch.toLowerCase()),
                      )
                      .map((p) => {
                        const isSelected = (
                          promotionForm.productIds || []
                        ).includes(p._id);
                        const otherPromo = promotions.find(
                          (promo) =>
                            promo.isActive &&
                            promo._id !== selectedPromotion?._id &&
                            promo.productIds.includes(p._id),
                        );

                        return (
                          <ListItemButton
                            key={p._id}
                            dense
                            disabled={!!otherPromo}
                            onClick={() => {
                              if (otherPromo) return;
                              const current = [
                                ...(promotionForm.productIds || []),
                              ];
                              if (isSelected) {
                                setPromotionForm({
                                  ...promotionForm,
                                  productIds: current.filter(
                                    (id) => id !== p._id,
                                  ),
                                });
                              } else {
                                setPromotionForm({
                                  ...promotionForm,
                                  productIds: [...current, p._id],
                                });
                              }
                            }}
                            sx={{
                              borderRadius: 1.5,
                              mb: 0.5,
                              opacity: otherPromo ? 0.6 : 1,
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              size="small"
                              disabled={!!otherPromo}
                            />
                            <Avatar
                              variant="rounded"
                              src={p.image}
                              sx={{ width: 32, height: 32, mr: 1.5 }}
                            />
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Typography variant="body2" fontWeight={600}>
                                    {p.name}
                                  </Typography>
                                  {otherPromo && (
                                    <Chip
                                      label="Đã có Flash Sale khác"
                                      size="small"
                                      color="error"
                                      variant="outlined"
                                      sx={{ height: 18, fontSize: "0.6rem" }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={`${p.price?.toLocaleString()}đ`}
                              primaryTypographyProps={{ variant: "body2" }}
                            />
                          </ListItemButton>
                        );
                      })}
                    {productsList.filter(
                      (p) =>
                        !promoProductSearch ||
                        p.name
                          ?.toLowerCase()
                          .includes(promoProductSearch.toLowerCase()),
                    ).length === 0 && (
                        <Typography
                          variant="body2"
                          sx={{
                            p: 2,
                            textAlign: "center",
                            color: "text.secondary",
                          }}
                        >
                          Không tìm thấy sản phẩm nào
                        </Typography>
                      )}
                  </List>
                </Paper>
              </Box>

              <FormControl fullWidth>
                <InputLabel>Trạng thái kích hoạt</InputLabel>
                <Select
                  value={promotionForm.isActive ? "true" : "false"}
                  label="Trạng thái kích hoạt"
                  onChange={(e) =>
                    setPromotionForm({
                      ...promotionForm,
                      isActive: e.target.value === "true",
                    })
                  }
                >
                  <MenuItem value="true">Bắt đầu ngay</MenuItem>
                  <MenuItem value="false">Tạm dừng (Bản nháp)</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
            <Button
              onClick={() => setIsPromotionModalOpen(false)}
              sx={{ color: "text.secondary" }}
            >
              Huỷ bỏ
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: "#ee4d2d",
                "&:hover": { bgcolor: "#d74528" },
                px: 4,
                boxShadow: "0 4px 12px rgba(238,77,45,0.2)",
              }}
            >
              {selectedPromotion ? "Lưu thay đổi" : "Kích hoạt Flash Sale"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* ═══ EXTEND PROMOTION DIALOG ═══ */}
      <Dialog 
        open={extendPromoDialog.open} 
        onClose={() => setExtendPromoDialog({ ...extendPromoDialog, open: false })}
        PaperProps={{ sx: { borderRadius: 3, width: "100%", maxWidth: 360 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Gia hạn Flash Sale</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Nhập số ngày bạn muốn gia hạn thêm cho chương trình này.
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Số ngày gia hạn"
            value={extendPromoDialog.days}
            onChange={(e) => setExtendPromoDialog({ ...extendPromoDialog, days: e.target.value })}
            autoFocus
            InputProps={{
              inputProps: { min: 1 },
              endAdornment: <Typography variant="caption" color="text.secondary">Ngày</Typography>
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setExtendPromoDialog({ ...extendPromoDialog, open: false })}>Huỷ</Button>
          <Button 
            onClick={submitExtendPromotion}
            variant="contained"
            sx={{ bgcolor: "#ee4d2d", "&:hover": { bgcolor: "#d44027" } }}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══ SNACKBAR ═══ */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};
export default BrandDashboardPage;
