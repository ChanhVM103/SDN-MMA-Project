import React, { useState, useEffect } from "react";
import {
  getAllUsersApi,
  updateUserApi,
  deleteUserApi,
  adminCreateRestaurantApi,
  getAllRestaurantsApi,
  updateRestaurantApi,
  deleteRestaurantApi,
  adminCreateUserApi,
} from "../services/admin-api";

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
  Tabs,
  Tab,
  Stack,
  useTheme,
  alpha,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// MUI Icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import StorefrontIcon from "@mui/icons-material/Storefront";
import InventoryIcon from "@mui/icons-material/Inventory";
import ReceiptIcon from "@mui/icons-material/Receipt";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import StarIcon from "@mui/icons-material/Star";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

// Recharts
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

// Custom Shopee-inspired MUI theme
const adminTheme = createTheme({
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

const AdminDashboardPage = ({ user, onLogout, navigate }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [usersList, setUsersList] = useState([]);
  const [restaurantsList, setRestaurantsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [resSearchQuery, setResSearchQuery] = useState("");

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isCreateRestaurantModalOpen, setIsCreateRestaurantModalOpen] =
    useState(false);
  const [isEditResModalOpen, setIsEditResModalOpen] = useState(false);
  const [isDeleteResModalOpen, setIsDeleteResModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // Forms
  const [editForm, setEditForm] = useState({ role: "user", isActive: true });
  const [createUserForm, setCreateUserForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "user",
  });
  const defaultRestaurantForm = {
    name: "",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80",
    rating: 0,
    reviews: 0,
    distance: "",
    tags: "",
    type: "food",
    isFlashSale: false,
    discountPercent: 0,
    deliveryTime: 30,
    deliveryFee: 15000,
    isOpen: true,
    address: "",
    phone: "",
    description: "",
    openingHours: "",
    latitude: 0,
    longitude: 0,
    owner: "",
  };
  const [restaurantForm, setRestaurantForm] = useState(defaultRestaurantForm);

  const toRestaurantPayload = (form) => ({
    name: form.name,
    image: form.image,
    rating: Number(form.rating),
    reviews: Number(form.reviews),
    distance: form.distance,
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    type: form.type,
    isFlashSale: Boolean(form.isFlashSale),
    discountPercent: Number(form.discountPercent),
    deliveryTime: Number(form.deliveryTime),
    deliveryFee: Number(form.deliveryFee),
    isOpen: Boolean(form.isOpen),
    address: form.address,
    phone: form.phone,
    description: form.description,
    openingHours: form.openingHours,
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
  });

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const showSnack = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    else if (activeTab === "restaurants") fetchRestaurants();
    else if (activeTab === "dashboard") {
      // fetch both for chart data
      fetchUsers();
      fetchRestaurants();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsersApi();
      // After teammate's refactor, adminApiRequest returns payload.data directly
      // which is already the array of users
      if (Array.isArray(data)) {
        setUsersList(data);
      } else if (data?.users) {
        // fallback for original format
        setUsersList(data.users);
      }
    } catch (error) {
      showSnack("Lỗi tải danh sách người dùng: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const data = await getAllRestaurantsApi(1, 100);
      if (data) setRestaurantsList(data);
    } catch (error) {
      showSnack("Lỗi tải danh sách cửa hàng: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── User Handlers ─────────────────────────
  const handleOpenEdit = (u) => {
    setSelectedUser(u);
    setEditForm({ role: u.role, isActive: u.isActive });
    setIsEditModalOpen(true);
  };
  const handleOpenDelete = (u) => {
    setSelectedUser(u);
    setIsDeleteModalOpen(true);
  };

  const submitEditUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await updateUserApi(selectedUser._id, editForm);
      showSnack("Cập nhật thành công!");
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (error) {
      showSnack("Lỗi: " + error.message, "error");
    }
  };

  const submitDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await deleteUserApi(selectedUser._id);
      showSnack("Đã xoá tài khoản.");
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (error) {
      showSnack("Lỗi: " + error.message, "error");
    }
  };

  const submitCreateUser = async (e) => {
    e.preventDefault();
    try {
      await adminCreateUserApi(createUserForm);
      showSnack("Tạo tài khoản thành công!");
      setIsCreateUserModalOpen(false);
      setCreateUserForm({
        fullName: "",
        email: "",
        password: "",
        phone: "",
        role: "user",
      });
      fetchUsers();
    } catch (error) {
      showSnack("Lỗi: " + error.message, "error");
    }
  };

  // ─── Restaurant Handlers ────────────────────
  const handleOpenCreateRestaurant = (u) => {
    setSelectedUser(u);
    setRestaurantForm({ ...defaultRestaurantForm, owner: u._id || "" });
    setIsCreateRestaurantModalOpen(true);
  };

  const submitCreateRestaurant = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await adminCreateRestaurantApi({
        ownerId: selectedUser._id,
        ...toRestaurantPayload(restaurantForm),
      });
      showSnack("Tạo cửa hàng thành công!");
      setIsCreateRestaurantModalOpen(false);
      setRestaurantForm(defaultRestaurantForm);
      fetchUsers();
    } catch (error) {
      showSnack("Lỗi: " + error.message, "error");
    }
  };

  const handleOpenEditRes = (res) => {
    setSelectedRestaurant(res);
    setRestaurantForm({
      name: res.name || "",
      image: res.image || "",
      rating: res.rating ?? 0,
      reviews: res.reviews ?? 0,
      distance: res.distance || "",
      tags: Array.isArray(res.tags) ? res.tags.join(", ") : "",
      type: res.type || "food",
      isFlashSale: Boolean(res.isFlashSale),
      discountPercent: res.discountPercent ?? 0,
      deliveryTime: res.deliveryTime ?? 30,
      deliveryFee: res.deliveryFee ?? 15000,
      isOpen: res.isOpen !== false,
      address: res.address || "",
      phone: res.phone || "",
      description: res.description || "",
      openingHours: res.openingHours || "",
      latitude: res.latitude ?? 0,
      longitude: res.longitude ?? 0,
      owner: res.owner?._id || "",
    });
    if (usersList.length === 0) fetchUsers();
    setIsEditResModalOpen(true);
  };
  const handleOpenDeleteRes = (res) => {
    setSelectedRestaurant(res);
    setIsDeleteResModalOpen(true);
  };

  const submitEditRestaurant = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    try {
      const payload = toRestaurantPayload(restaurantForm);
      if (restaurantForm.owner) {
        payload.owner = restaurantForm.owner;
      }
      await updateRestaurantApi(selectedRestaurant._id, payload);
      showSnack("Cập nhật nhà hàng thành công!");
      setIsEditResModalOpen(false);
      fetchRestaurants();
    } catch (error) {
      showSnack("Lỗi: " + error.message, "error");
    }
  };

  const submitDeleteRestaurant = async () => {
    if (!selectedRestaurant) return;
    try {
      await deleteRestaurantApi(selectedRestaurant._id);
      showSnack("Đã xoá cửa hàng.");
      setIsDeleteResModalOpen(false);
      fetchRestaurants();
    } catch (error) {
      showSnack("Lỗi: " + error.message, "error");
    }
  };

  // ─── Filters ────────────────────────────────
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredRestaurants = restaurantsList.filter((r) => {
    const term = resSearchQuery.toLowerCase();
    return (
      r.name?.toLowerCase().includes(term) ||
      r.owner?.email?.toLowerCase().includes(term)
    );
  });

  // ─── Sidebar Nav Items ──────────────────────
  const navItems = [
    { key: "dashboard", label: "Tổng quan", icon: <DashboardIcon /> },
    { key: "users", label: "Quản lý User", icon: <PeopleIcon /> },
    { key: "restaurants", label: "Cửa hàng", icon: <StorefrontIcon /> },
    {
      key: "products",
      label: "Sản phẩm",
      icon: <InventoryIcon />,
      disabled: true,
    },
    { key: "orders", label: "Đơn hàng", icon: <ReceiptIcon />, disabled: true },
  ];

  const getRoleChip = (role) => {
    const map = {
      admin: { label: "Admin", color: "error" },
      brand: { label: "Brand", color: "warning" },
      user: { label: "User", color: "default" },
    };
    const c = map[role] || map.user;
    return (
      <Chip label={c.label} color={c.color} size="small" variant="outlined" />
    );
  };

  const getStatusChip = (isActive) =>
    isActive ? (
      <Chip
        icon={<CheckCircleIcon />}
        label="Hoạt động"
        color="success"
        size="small"
        variant="filled"
        sx={{ fontWeight: 600 }}
      />
    ) : (
      <Chip
        icon={<BlockIcon />}
        label="Bị khoá"
        color="error"
        size="small"
        variant="filled"
        sx={{ fontWeight: 600 }}
      />
    );

  // ═══════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════
  return (
    <ThemeProvider theme={adminTheme}>
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
            <Box
              sx={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.1)",
              }}
            />
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
                Foodie admin
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Bảng điều khiển
              </Typography>
            </Box>
          </Box>
          <Divider />

          {/* Nav */}
          <List sx={{ px: 1.5, mt: 1 }}>
            {navItems.map((item) => (
              <ListItemButton
                key={item.key}
                selected={activeTab === item.key}
                disabled={item.disabled}
                onClick={() => {
                  setActiveTab(item.key);
                  setSearchQuery("");
                  setResSearchQuery("");
                }}
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
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: "0.9rem",
                    fontWeight: activeTab === item.key ? 600 : 400,
                  }}
                />
              </ListItemButton>
            ))}
          </List>

          {/* Bottom Area */}
          <Box sx={{ mt: "auto", p: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <ListItemButton sx={{ borderRadius: 2 }} disabled>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText
                primary="Cài đặt"
                primaryTypographyProps={{ fontSize: "0.9rem" }}
              />
            </ListItemButton>
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
                {activeTab === "dashboard"
                  ? "Dashboard"
                  : activeTab === "users"
                    ? "Quản lý Người Dùng"
                    : "Quản lý Cửa Hàng"}
              </Typography>

              {/* Search */}
              {(activeTab === "users" || activeTab === "restaurants") && (
                <TextField
                  size="small"
                  placeholder={
                    activeTab === "users"
                      ? "Tìm theo tên hoặc email..."
                      : "Tìm theo tên cửa hàng, email chủ..."
                  }
                  value={activeTab === "users" ? searchQuery : resSearchQuery}
                  onChange={(e) =>
                    activeTab === "users"
                      ? setSearchQuery(e.target.value)
                      : setResSearchQuery(e.target.value)
                  }
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

              <Button
                variant="outlined"
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={onLogout}
                sx={{
                  borderColor: "#ddd",
                  color: "text.secondary",
                  "&:hover": {
                    borderColor: "primary.main",
                    color: "primary.main",
                  },
                }}
              >
                Đăng xuất
              </Button>

              <Tooltip title={user?.fullName || "Admin"}>
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    width: 38,
                    height: 38,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  {user?.fullName?.charAt(0) || "A"}
                </Avatar>
              </Tooltip>
            </Toolbar>
          </AppBar>

          {/* Content */}
          <Box sx={{ p: 3, flexGrow: 1, overflowY: "auto" }}>
            {/* ═══ DASHBOARD TAB ═══ */}
            {activeTab === "dashboard" && (
              <>
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
                      Chào mừng trở lại, {user?.fullName || "Admin"}! 👋
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.85 }}>
                      Theo dõi và quản lý mọi hoạt động trên nền tảng của bạn
                      một cách nhanh chóng.
                    </Typography>
                  </CardContent>
                </Card>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 3,
                  }}
                >
                  {[
                    {
                      icon: <ShoppingCartIcon />,
                      label: "Đơn hàng tuần này",
                      value: "1,204",
                      color: "#ee4d2d",
                      bg: "#fff0eb",
                    },
                    {
                      icon: <AttachMoneyIcon />,
                      label: "Doanh thu tháng",
                      value: "₫245M",
                      color: "#26aa99",
                      bg: "#e8f5e9",
                    },
                    {
                      icon: <PeopleIcon />,
                      label: "Tổng người dùng",
                      value: usersList.length || "--",
                      color: "#2aa1ff",
                      bg: "#e6f4ff",
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
                          <Typography variant="body2" color="text.secondary">
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

                {/* ═══ CHARTS ROW ═══ */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 3,
                    mt: 3,
                  }}
                >
                  {/* ─── Donut: User Role Distribution ─── */}
                  <Card
                    elevation={0}
                    sx={{
                      border: "1px solid rgba(0,0,0,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        👥 Phân bổ vai trò người dùng
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tổng: {usersList.length} người dùng
                      </Typography>
                      <Box sx={{ height: 280, mt: 2 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                {
                                  name: "Khách hàng",
                                  value: usersList.filter(
                                    (u) => u.role === "user",
                                  ).length,
                                  color: "#2aa1ff",
                                },
                                {
                                  name: "Thương hiệu",
                                  value: usersList.filter(
                                    (u) => u.role === "brand",
                                  ).length,
                                  color: "#ffb700",
                                },
                                {
                                  name: "Quản trị",
                                  value: usersList.filter(
                                    (u) => u.role === "admin",
                                  ).length,
                                  color: "#ee4d2d",
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
                                  name: "Khách hàng",
                                  value: usersList.filter(
                                    (u) => u.role === "user",
                                  ).length,
                                  color: "#2aa1ff",
                                },
                                {
                                  name: "Thương hiệu",
                                  value: usersList.filter(
                                    (u) => u.role === "brand",
                                  ).length,
                                  color: "#ffb700",
                                },
                                {
                                  name: "Quản trị",
                                  value: usersList.filter(
                                    (u) => u.role === "admin",
                                  ).length,
                                  color: "#ee4d2d",
                                },
                              ]
                                .filter((d) => d.value > 0)
                                .map((entry, index) => (
                                  <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                            <RTooltip
                              formatter={(value, name) => [
                                `${value} người`,
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

                  {/* ─── Bar: Restaurant Ratings ─── */}
                  <Card
                    elevation={0}
                    sx={{
                      border: "1px solid rgba(0,0,0,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        ⭐ Đánh giá cửa hàng
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Top cửa hàng được đánh giá cao nhất
                      </Typography>
                      <Box sx={{ height: 280, mt: 2 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[...restaurantsList]
                              .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                              .slice(0, 6)
                              .map((r) => ({
                                name: r.name?.substring(0, 15) || "N/A",
                                rating: r.rating || 0,
                                reviews: r.reviews || 0,
                              }))}
                            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f0f0f0"
                            />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 11, fill: "#999" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              domain={[0, 5]}
                              tick={{ fontSize: 11, fill: "#999" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <RTooltip
                              contentStyle={{
                                borderRadius: 12,
                                border: "none",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                              }}
                              formatter={(value, name) => [
                                name === "rating"
                                  ? `${value} ⭐`
                                  : `${value} đánh giá`,
                                name === "rating" ? "Điểm" : "Lượt",
                              ]}
                            />
                            <Bar
                              dataKey="rating"
                              fill="#ffb700"
                              radius={[8, 8, 0, 0]}
                              barSize={32}
                              background={{
                                fill: "#f5f5f5",
                                radius: [8, 8, 0, 0],
                              }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>

                {/* ─── Area: User Registration Timeline ─── */}
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid rgba(0,0,0,0.06)",
                    overflow: "hidden",
                    mt: 3,
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      📈 Thống kê đăng ký người dùng theo tháng
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Xu hướng tăng trưởng số người dùng mới
                    </Typography>
                    <Box sx={{ height: 300, mt: 2 }}>
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
                            // Initialize last 6 months
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
                                users: 0,
                                brands: 0,
                              };
                            }
                            // Count registrations
                            usersList.forEach((u) => {
                              if (!u.createdAt) return;
                              const d = new Date(u.createdAt);
                              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                              if (months[key]) {
                                if (u.role === "brand") months[key].brands++;
                                else months[key].users++;
                              }
                            });
                            return Object.values(months);
                          })()}
                          margin={{ top: 10, right: 30, left: -10, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="gradUsers"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#2aa1ff"
                                stopOpacity={0.25}
                              />
                              <stop
                                offset="95%"
                                stopColor="#2aa1ff"
                                stopOpacity={0}
                              />
                            </linearGradient>
                            <linearGradient
                              id="gradBrands"
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
                            dataKey="users"
                            name="Người dùng"
                            stroke="#2aa1ff"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#gradUsers)"
                            dot={{
                              r: 4,
                              fill: "#2aa1ff",
                              strokeWidth: 2,
                              stroke: "#fff",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="brands"
                            name="Thương hiệu"
                            stroke="#ee4d2d"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#gradBrands)"
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

                {/* Loading overlay for charts */}
                {loading && usersList.length === 0 && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 6 }}
                  >
                    <CircularProgress color="primary" />
                  </Box>
                )}
              </>
            )}

            {/* ═══ USERS TAB ═══ */}
            {activeTab === "users" && (
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
                    Danh sách tài khoản ({filteredUsers.length})
                  </Typography>
                  <Stack direction="row" spacing={1.5}>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={fetchUsers}
                      disabled={loading}
                    >
                      {loading ? "Đang tải..." : "Làm mới"}
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<PersonAddIcon />}
                      onClick={() => setIsCreateUserModalOpen(true)}
                    >
                      Thêm tài khoản
                    </Button>
                  </Stack>
                </Box>

                {/* Role Tabs */}
                <Box sx={{ px: 2.5, borderBottom: "1px solid #f0f0f0" }}>
                  <Tabs
                    value={roleFilter}
                    onChange={(_, v) => setRoleFilter(v)}
                    textColor="primary"
                    indicatorColor="primary"
                    sx={{
                      "& .MuiTab-root": {
                        textTransform: "none",
                        fontWeight: 500,
                        minHeight: 44,
                      },
                    }}
                  >
                    <Tab value="all" label="Tất cả" />
                    <Tab value="user" label="Khách hàng" />
                    <Tab value="brand" label="Thương hiệu" />
                    <Tab value="admin" label="Quản trị viên" />
                  </Tabs>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#fafafa" }}>
                        <TableCell>Tài khoản</TableCell>
                        <TableCell>Liên hệ</TableCell>
                        <TableCell>Phân quyền</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell align="right">Hành động</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow
                          key={u._id}
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
                                sx={{
                                  bgcolor:
                                    u.role === "admin"
                                      ? "error.main"
                                      : u.role === "brand"
                                        ? "warning.main"
                                        : "primary.main",
                                  width: 36,
                                  height: 36,
                                  fontSize: "0.85rem",
                                }}
                              >
                                {u.fullName?.charAt(0) || "U"}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {u.fullName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Tham gia:{" "}
                                  {new Date(
                                    u.createdAt || Date.now(),
                                  ).toLocaleDateString("vi-VN")}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{u.email}</Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {u.phone || "---"}
                            </Typography>
                          </TableCell>
                          <TableCell>{getRoleChip(u.role)}</TableCell>
                          <TableCell>{getStatusChip(u.isActive)}</TableCell>
                          <TableCell align="right">
                            <Stack
                              direction="row"
                              spacing={0.5}
                              justifyContent="flex-end"
                            >
                              {u.role === "brand" && !u.hasRestaurant && (
                                <Tooltip title="Tạo cửa hàng">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() =>
                                      handleOpenCreateRestaurant(u)
                                    }
                                  >
                                    <AddBusinessIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {u.role === "brand" && u.hasRestaurant && (
                                <Chip
                                  icon={<CheckCircleIcon />}
                                  label="Đã có CH"
                                  color="success"
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                              <Tooltip title="Chỉnh sửa">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenEdit(u)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {user?._id !== u._id && (
                                <Tooltip title="Xoá">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleOpenDelete(u)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredUsers.length === 0 && !loading && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            sx={{
                              textAlign: "center",
                              py: 8,
                              color: "text.secondary",
                            }}
                          >
                            <SearchIcon
                              sx={{ fontSize: 48, mb: 1, opacity: 0.3 }}
                            />
                            <br />
                            Không tìm thấy người dùng nào.
                          </TableCell>
                        </TableRow>
                      )}
                      {loading && filteredUsers.length === 0 && (
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

            {/* ═══ RESTAURANTS TAB ═══ */}
            {activeTab === "restaurants" && (
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
                    Danh sách cửa hàng ({filteredRestaurants.length})
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchRestaurants}
                    disabled={loading}
                  >
                    {loading ? "Đang tải..." : "Làm mới"}
                  </Button>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#fafafa" }}>
                        <TableCell>Cửa hàng</TableCell>
                        <TableCell>Chủ sở hữu (Brand)</TableCell>
                        <TableCell>Chỉ số</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell align="right">Hành động</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredRestaurants.map((r) => (
                        <TableRow
                          key={r._id}
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
                                src={r.image}
                                sx={{ width: 44, height: 44 }}
                              >
                                {r.name?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {r.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Phí: {r.deliveryFee?.toLocaleString()}đ •{" "}
                                  {r.deliveryTime}p
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {r.owner ? (
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {r.owner.fullName || "Brand User"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {r.owner.email}
                                </Typography>
                              </Box>
                            ) : (
                              <Chip
                                label="Vô chủ"
                                color="error"
                                size="small"
                                variant="filled"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <StarIcon
                                sx={{ fontSize: 16, color: "#ffb700" }}
                              />
                              <Typography variant="body2">
                                {r.rating || 0} ({r.reviews || 0})
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {r.isOpen ? (
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
                          </TableCell>
                          <TableCell align="right">
                            <Stack
                              direction="row"
                              spacing={0.5}
                              justifyContent="flex-end"
                            >
                              <Tooltip title="Chỉnh sửa / Chuyển nhượng">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenEditRes(r)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Xoá cửa hàng">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleOpenDeleteRes(r)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredRestaurants.length === 0 && !loading && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            sx={{
                              textAlign: "center",
                              py: 8,
                              color: "text.secondary",
                            }}
                          >
                            <StorefrontIcon
                              sx={{ fontSize: 48, mb: 1, opacity: 0.3 }}
                            />
                            <br />
                            Chưa có dữ liệu cửa hàng.
                          </TableCell>
                        </TableRow>
                      )}
                      {loading && filteredRestaurants.length === 0 && (
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
          </Box>
        </Box>
      </Box>

      {/* ═══════════════════════════════════════════ */}
      {/*  DIALOGS (Modals)                          */}
      {/* ═══════════════════════════════════════════ */}

      {/* ─── Edit User Dialog ─── */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Chỉnh sửa phân quyền</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedUser?.fullName} ({selectedUser?.email})
          </Typography>
          <form id="editUserForm" onSubmit={submitEditUser}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={editForm.role}
                label="Vai trò"
                onChange={(e) =>
                  setEditForm({ ...editForm, role: e.target.value })
                }
              >
                <MenuItem value="user">Người tiêu dùng (User)</MenuItem>
                <MenuItem value="brand">
                  Thương hiệu / Cửa hàng (Brand)
                </MenuItem>
                <MenuItem value="admin">Quản trị viên (Admin)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={editForm.isActive ? "true" : "false"}
                label="Trạng thái"
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    isActive: e.target.value === "true",
                  })
                }
              >
                <MenuItem value="true">Cho phép truy cập</MenuItem>
                <MenuItem value="false">Tạm khóa tài khoản</MenuItem>
              </Select>
            </FormControl>
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsEditModalOpen(false)}>Huỷ</Button>
          <Button type="submit" form="editUserForm" variant="contained">
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete User Dialog ─── */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle color="error.main">⚠️ Xoá tài khoản</DialogTitle>
        <DialogContent>
          <Typography>
            Hành động này sẽ xoá hoàn toàn{" "}
            <strong>{selectedUser?.fullName}</strong> và không thể phục hồi.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsDeleteModalOpen(false)}>Quay lại</Button>
          <Button variant="contained" color="error" onClick={submitDeleteUser}>
            Có, Xoá ngay
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Create User Dialog ─── */}
      <Dialog
        open={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Tạo Tài khoản mới</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Thêm trực tiếp tài khoản và phân quyền vào hệ thống.
          </Typography>
          <form id="createUserForm" onSubmit={submitCreateUser}>
            <TextField
              fullWidth
              label="Họ và Tên"
              required
              placeholder="Vd: Nguyễn Văn A"
              value={createUserForm.fullName}
              onChange={(e) =>
                setCreateUserForm({
                  ...createUserForm,
                  fullName: e.target.value,
                })
              }
              sx={{ mb: 2 }}
            />
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Email đăng nhập"
                required
                type="email"
                value={createUserForm.email}
                onChange={(e) =>
                  setCreateUserForm({
                    ...createUserForm,
                    email: e.target.value,
                  })
                }
              />
              <TextField
                fullWidth
                label="Số điện thoại"
                value={createUserForm.phone}
                onChange={(e) =>
                  setCreateUserForm({
                    ...createUserForm,
                    phone: e.target.value,
                  })
                }
              />
            </Stack>
            <TextField
              fullWidth
              label="Mật khẩu khởi tạo"
              required
              type="text"
              placeholder="Tối thiểu 6 ký tự"
              inputProps={{ minLength: 6 }}
              value={createUserForm.password}
              onChange={(e) =>
                setCreateUserForm({
                  ...createUserForm,
                  password: e.target.value,
                })
              }
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Phân quyền (Role)</InputLabel>
              <Select
                value={createUserForm.role}
                label="Phân quyền (Role)"
                onChange={(e) =>
                  setCreateUserForm({ ...createUserForm, role: e.target.value })
                }
              >
                <MenuItem value="user">Người tiêu dùng (User)</MenuItem>
                <MenuItem value="brand">
                  Thương hiệu / Cửa hàng (Brand)
                </MenuItem>
                <MenuItem value="admin">Quản trị viên (Admin)</MenuItem>
              </Select>
            </FormControl>
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsCreateUserModalOpen(false)}>Huỷ</Button>
          <Button
            type="submit"
            form="createUserForm"
            variant="contained"
            startIcon={<PersonAddIcon />}
          >
            Tạo tài khoản
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Create Restaurant Dialog ─── */}
      <Dialog
        open={isCreateRestaurantModalOpen}
        onClose={() => setIsCreateRestaurantModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Khởi tạo cửa hàng</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cấp quyền quản lý cửa hàng cho{" "}
            <strong>{selectedUser?.fullName}</strong>.
          </Typography>
          <form id="createResForm" onSubmit={submitCreateRestaurant}>
            <TextField
              fullWidth
              label="Tên nhà hàng"
              required
              value={restaurantForm.name}
              onChange={(e) =>
                setRestaurantForm({ ...restaurantForm, name: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Đánh giá (0-5)"
                type="number"
                required
                inputProps={{ min: 0, max: 5, step: 0.1 }}
                value={restaurantForm.rating}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    rating: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <TextField
                fullWidth
                label="Số lượt đánh giá"
                type="number"
                required
                inputProps={{ min: 0 }}
                value={restaurantForm.reviews}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    reviews: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Khoảng cách"
                required
                placeholder="VD: 1.2 km"
                value={restaurantForm.distance}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    distance: e.target.value,
                  })
                }
              />
              <FormControl fullWidth required>
                <InputLabel>Loại cửa hàng</InputLabel>
                <Select
                  value={restaurantForm.type}
                  label="Loại cửa hàng"
                  onChange={(e) =>
                    setRestaurantForm({
                      ...restaurantForm,
                      type: e.target.value,
                    })
                  }
                >
                  <MenuItem value="food">Đồ ăn</MenuItem>
                  <MenuItem value="drink">Thức uống</MenuItem>
                </Select>
              </FormControl>
            </Stack>
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
              <TextField
                fullWidth
                label="Thời gian giao (Phút)"
                type="number"
                required
                inputProps={{ min: 0 }}
                value={restaurantForm.deliveryTime}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    deliveryTime: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
              <TextField
                fullWidth
                label="Phí vận chuyển (VND)"
                type="number"
                required
                inputProps={{ min: 0 }}
                value={restaurantForm.deliveryFee}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    deliveryFee: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Giảm giá Flash Sale (%)"
                type="number"
                required
                inputProps={{ min: 0, max: 100 }}
                value={restaurantForm.discountPercent}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    discountPercent: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
              <FormControl fullWidth required>
                <InputLabel>Flash Sale</InputLabel>
                <Select
                  value={restaurantForm.isFlashSale ? "true" : "false"}
                  label="Flash Sale"
                  onChange={(e) =>
                    setRestaurantForm({
                      ...restaurantForm,
                      isFlashSale: e.target.value === "true",
                    })
                  }
                >
                  <MenuItem value="true">Có</MenuItem>
                  <MenuItem value="false">Không</MenuItem>
                </Select>
              </FormControl>
            </Stack>
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
              label="Link hình ảnh bìa (URL)"
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
              label="Địa chỉ"
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
              sx={{ mb: 2 }}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Vĩ độ (Latitude)"
                type="number"
                required
                inputProps={{ step: "any" }}
                value={restaurantForm.latitude}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    latitude: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <TextField
                fullWidth
                label="Kinh độ (Longitude)"
                type="number"
                required
                inputProps={{ step: "any" }}
                value={restaurantForm.longitude}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    longitude: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </Stack>
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsCreateRestaurantModalOpen(false)}>
            Huỷ
          </Button>
          <Button
            type="submit"
            form="createResForm"
            variant="contained"
            startIcon={<AddBusinessIcon />}
          >
            Khởi tạo ngay
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Edit Restaurant Dialog ─── */}
      <Dialog
        open={isEditResModalOpen}
        onClose={() => setIsEditResModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <EditIcon color="primary" /> Chỉnh sửa Cửa hàng
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Thay đổi thông tin hoặc <strong>chuyển nhượng</strong> cửa hàng{" "}
            <strong>{selectedRestaurant?.name}</strong>.
          </Typography>
          <form id="editResForm" onSubmit={submitEditRestaurant}>
            <TextField
              fullWidth
              label="Tên nhà hàng"
              required
              value={restaurantForm.name}
              onChange={(e) =>
                setRestaurantForm({ ...restaurantForm, name: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Đánh giá (0-5)"
                type="number"
                required
                inputProps={{ min: 0, max: 5, step: 0.1 }}
                value={restaurantForm.rating}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    rating: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <TextField
                fullWidth
                label="Số lượt đánh giá"
                type="number"
                required
                inputProps={{ min: 0 }}
                value={restaurantForm.reviews}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    reviews: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Khoảng cách"
                required
                placeholder="VD: 1.2 km"
                value={restaurantForm.distance}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    distance: e.target.value,
                  })
                }
              />
              <FormControl fullWidth required>
                <InputLabel>Loại cửa hàng</InputLabel>
                <Select
                  value={restaurantForm.type}
                  label="Loại cửa hàng"
                  onChange={(e) =>
                    setRestaurantForm({
                      ...restaurantForm,
                      type: e.target.value,
                    })
                  }
                >
                  <MenuItem value="food">Đồ ăn</MenuItem>
                  <MenuItem value="drink">Thức uống</MenuItem>
                </Select>
              </FormControl>
            </Stack>
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
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Chủ sở hữu (Chuyển nhượng)</InputLabel>
              <Select
                value={restaurantForm.owner || ""}
                label="Chủ sở hữu (Chuyển nhượng)"
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    owner: e.target.value,
                  })
                }
                startAdornment={
                  <SwapHorizIcon sx={{ mr: 1, color: "text.secondary" }} />
                }
              >
                {selectedRestaurant?.owner && (
                  <MenuItem value={selectedRestaurant.owner._id}>
                    {selectedRestaurant.owner.email} (Chủ hiện tại)
                  </MenuItem>
                )}
                {usersList
                  .filter(
                    (u) =>
                      u.role === "brand" &&
                      !u.hasRestaurant &&
                      u._id !== selectedRestaurant?.owner?._id,
                  )
                  .map((brand) => (
                    <MenuItem key={brand._id} value={brand._id}>
                      {brand.email} ({brand.fullName})
                    </MenuItem>
                  ))}
              </Select>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                * Chỉ hiển thị tài khoản Brand chưa sở hữu cửa hàng.
              </Typography>
            </FormControl>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Thời gian giao (Phút)"
                type="number"
                required
                inputProps={{ min: 0 }}
                value={restaurantForm.deliveryTime}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    deliveryTime: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
              <TextField
                fullWidth
                label="Phí vận chuyển (VND)"
                type="number"
                required
                inputProps={{ min: 0 }}
                value={restaurantForm.deliveryFee}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    deliveryFee: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Giảm giá Flash Sale (%)"
                type="number"
                required
                inputProps={{ min: 0, max: 100 }}
                value={restaurantForm.discountPercent}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    discountPercent: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
              <FormControl fullWidth required>
                <InputLabel>Flash Sale</InputLabel>
                <Select
                  value={restaurantForm.isFlashSale ? "true" : "false"}
                  label="Flash Sale"
                  onChange={(e) =>
                    setRestaurantForm({
                      ...restaurantForm,
                      isFlashSale: e.target.value === "true",
                    })
                  }
                >
                  <MenuItem value="true">Có</MenuItem>
                  <MenuItem value="false">Không</MenuItem>
                </Select>
              </FormControl>
            </Stack>
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
              label="Link hình ảnh bìa (URL)"
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
              label="Địa chỉ"
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
              sx={{ mb: 2 }}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Vĩ độ (Latitude)"
                type="number"
                required
                inputProps={{ step: "any" }}
                value={restaurantForm.latitude}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    latitude: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <TextField
                fullWidth
                label="Kinh độ (Longitude)"
                type="number"
                required
                inputProps={{ step: "any" }}
                value={restaurantForm.longitude}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    longitude: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </Stack>
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsEditResModalOpen(false)}>Huỷ</Button>
          <Button type="submit" form="editResForm" variant="contained">
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Restaurant Dialog ─── */}
      <Dialog
        open={isDeleteResModalOpen}
        onClose={() => setIsDeleteResModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle color="error.main">⚠️ Xoá cửa hàng</DialogTitle>
        <DialogContent>
          <Typography>
            Xoá hoàn toàn <strong>{selectedRestaurant?.name}</strong> khỏi hệ
            thống và giải phóng Brand. Không thể phục hồi!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsDeleteResModalOpen(false)}>
            Quay lại
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={submitDeleteRestaurant}
          >
            Có, Xoá ngay
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

export default AdminDashboardPage;
