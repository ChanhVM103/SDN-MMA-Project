import React, { useState, useEffect, useCallback } from "react";
import {
  getAvailableOrders,
  getShipperOrders,
  shipperAcceptOrder,
  shipperPickedUp,
  shipperCompleteDelivery,
} from "../services/order-api";

// MUI Components
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Button,
  Chip,
  Tabs,
  Tab,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Badge,
  Divider,
  Snackbar,
  Alert,
  Container,
  Paper,
  Grid,
} from "@mui/material";
import { ThemeProvider, createTheme, alpha } from "@mui/material/styles";

// MUI Icons
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import LogoutIcon from "@mui/icons-material/Logout";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";

// ─── Theme configuration ─────────────────────────
const shipperTheme = createTheme({
  palette: {
    primary: {
      main: "#ee4d2d",
      light: "#ff7337",
      contrastText: "#fff",
    },
    secondary: {
      main: "#3b82f6",
    },
    success: {
      main: "#10b981",
    },
    warning: {
      main: "#f59e0b",
    },
    info: {
      main: "#0ea5e9",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 8,
          padding: "8px 16px",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
          border: "1px solid #e2e8f0",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.95rem",
          minHeight: 56,
        },
      },
    },
  },
});

// ─── Status configuration ─────────────────────────
const STATUS_CONFIG = {
  pending: { label: "Chờ xác nhận", color: "warning" },
  confirmed: { label: "Đã xác nhận", color: "info" },
  preparing: { label: "Đang chuẩn bị", color: "info" },
  ready_for_pickup: { label: "Sẵn sàng lấy hàng", color: "warning" },
  shipper_accepted: { label: "Đã nhận đơn", color: "info" },
  delivering: { label: "Đang giao hàng", color: "primary" },
  shipper_delivered: { label: "Chờ nhà hàng xác nhận", color: "warning" },
  delivered: { label: "Đã giao thành công", color: "success" },
  cancelled: { label: "Đã huỷ", color: "error" },
};

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");
const fmtDate = (d) => (d ? new Date(d).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "");

// ─── Main Component ───────────────────────────────
export default function ShipperDashboardPage({ user, onLogout }) {
  const [tabIndex, setTabIndex] = useState(0); // 0: Chờ nhận, 1: Đang giao, 2: Lịch sử
  const [available, setAvailable] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actioningId, setActioningId] = useState(null);

  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });

  const showToast = (msg, severity = "success") => {
    setToast({ open: true, msg, severity });
  };
  const closeToast = () => setToast((prev) => ({ ...prev, open: false }));

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [avail, mine] = await Promise.all([getAvailableOrders(), getShipperOrders()]);
      setAvailable(avail || []);
      setMyOrders(mine || []);
    } catch (err) {
      showToast("Lỗi tải dữ liệu: " + err.message, "error");
    } finally {
      if (!silent) setLoading(false);
      else setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(() => loadData(true), 30000);
    return () => clearInterval(t);
  }, [loadData]);

  const doAction = async (orderId, fn, successMsg) => {
    setActioningId(orderId);
    try {
      await fn(orderId);
      showToast(successMsg, "success");
      await loadData(true);
    } catch (err) {
      showToast("Lỗi: " + err.message, "error");
    } finally {
      setActioningId(null);
    }
  };

  // Derive data
  const inProgress = myOrders.filter((o) => ["shipper_accepted", "delivering", "shipper_delivered"].includes(o.status));
  const history = myOrders.filter((o) => ["delivered", "cancelled"].includes(o.status));

  // Determine current list to render
  const currentList = tabIndex === 0 ? available : tabIndex === 1 ? inProgress : history;

  // ─── Render Action Area per Order ─────────────────
  const renderActionArea = (order) => {
    const isBusy = actioningId === order._id;

    if (tabIndex === 0) {
      // Chờ nhận
      return (
        <Button
          fullWidth
          variant="contained"
          size="large"
          color="primary"
          startIcon={isBusy ? <CircularProgress size={20} color="inherit" /> : <TwoWheelerIcon />}
          disabled={isBusy}
          onClick={() => doAction(order._id, shipperAcceptOrder, "Đã nhận đơn! Đến nhà hàng lấy hàng nhé.")}
        >
          {isBusy ? "Đang xử lý..." : "Nhận Đơn Giao"}
        </Button>
      );
    }

    if (tabIndex === 1) {
      // Đang giao
      if (order.status === "shipper_accepted") {
        return (
          <Button
            fullWidth
            variant="contained"
            size="large"
            color="secondary"
            startIcon={isBusy ? <CircularProgress size={20} color="inherit" /> : <LocalShippingIcon />}
            disabled={isBusy}
            onClick={() => doAction(order._id, shipperPickedUp, "Đã lấy hàng! Giao cho khách đi nào.")}
          >
            {isBusy ? "Đang xử lý..." : "Xác Nhận Đã Lấy Hàng"}
          </Button>
        );
      }
      if (order.status === "delivering") {
        return (
          <Button
            fullWidth
            variant="contained"
            size="large"
            color="success"
            startIcon={isBusy ? <CircularProgress size={20} color="inherit" /> : <DoneAllIcon />}
            disabled={isBusy}
            onClick={() => doAction(order._id, shipperCompleteDelivery, "Tuyệt! Đã báo giao thành công.")}
          >
            {isBusy ? "Đang xử lý..." : "Xác Nhận Đã Giao"}
          </Button>
        );
      }
      if (order.status === "shipper_delivered") {
        return (
          <Alert severity="warning" sx={{ width: "100%", justifyContent: "center", "& .MuiAlert-message": { fontWeight: 600 } }}>
            Đang chờ nhà hàng xác nhận hoàn thành...
          </Alert>
        );
      }
    }

    return null;
  };

  return (
    <ThemeProvider theme={shipperTheme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 6 }}>
        {/* ── Header ── */}
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: "white", borderBottom: "1px solid #e2e8f0" }}>
          <Container maxWidth="md">
            <Toolbar disableGutters sx={{ justifyContent: "space-between", py: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: alpha("#ee4d2d", 0.1), color: "primary.main", width: 44, height: 44 }}>
                  <TwoWheelerIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" color="text.primary" sx={{ lineHeight: 1.2 }}>
                    Shipper Dashboard
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Xin chào, <b>{user?.fullName || "Shipper"}</b>
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1.5}>
                <Button variant="outlined" color="primary" startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />} onClick={() => loadData(true)}>
                  Làm mới
                </Button>
                <Button variant="text" color="error" startIcon={<LogoutIcon />} onClick={onLogout}>
                  Đăng xuất
                </Button>
              </Stack>
            </Toolbar>
          </Container>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 4 }}>
          {/* ── Summary Cards ── */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={4}>
              <Paper elevation={0} sx={{ p: 2, textAlign: "center", border: "1px solid #e2e8f0", borderRadius: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                  <AssignmentReturnIcon fontSize="small" /> Đơn chờ nhận
                </Typography>
                <Typography variant="h4" color="primary.main" fontWeight={800}>
                  {available.length}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper elevation={0} sx={{ p: 2, textAlign: "center", border: "1px solid #e2e8f0", borderRadius: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                  <LocalShippingIcon fontSize="small" color="secondary" /> Đơn đang giao
                </Typography>
                <Typography variant="h4" color="secondary.main" fontWeight={800}>
                  {inProgress.length}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper elevation={0} sx={{ p: 2, textAlign: "center", border: "1px solid #e2e8f0", borderRadius: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                  <CheckCircleIcon fontSize="small" color="success" /> Đã hoàn thành
                </Typography>
                <Typography variant="h4" color="success.main" fontWeight={800}>
                  {history.filter((o) => o.status === "delivered").length}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* ── Tabs ── */}
          <Paper elevation={0} sx={{ borderBottom: 1, borderColor: "divider", mb: 3, border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden" }}>
            <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} variant="fullWidth" indicatorColor="primary" textColor="primary">
              <Tab
                label={
                  <Badge color="error" badgeContent={available.length} sx={{ "& .MuiBadge-badge": { right: -15, top: -2 } }}>
                    Chờ Nhận
                  </Badge>
                }
              />
              <Tab
                label={
                  <Badge color="secondary" badgeContent={inProgress.length} sx={{ "& .MuiBadge-badge": { right: -15, top: -2 } }}>
                    Đang Giao
                  </Badge>
                }
              />
              <Tab label="Lịch Sử" />
            </Tabs>
          </Paper>

          {/* ── Content ── */}
          {loading ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 10 }}>
              <CircularProgress color="primary" sx={{ mb: 2 }} />
              <Typography color="text.secondary">Đang tải dữ liệu...</Typography>
            </Box>
          ) : currentList.length === 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 10, textAlign: "center", color: "text.secondary" }}>
              <ReceiptLongIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
              <Typography variant="h6">Chưa có đơn hàng nào</Typography>
              <Typography variant="body2">Không có đơn hàng nào trong phân mục này.</Typography>
            </Box>
          ) : (
            <Stack spacing={2.5}>
              {currentList.map((order) => {
                const cfg = STATUS_CONFIG[order.status] || { label: order.status, color: "default" };
                const items = order.items || [];

                return (
                  <Card key={order._id}>
                    <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                      {/* Card Header */}
                      <Box sx={{ px: 3, py: 2, bgcolor: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
                        <Box>
                          <Typography variant="subtitle1" color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <StorefrontIcon fontSize="small" color="primary" /> {order.restaurantName || "Nhà hàng"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                            <AccessTimeIcon fontSize="inherit" /> #{String(order._id).slice(-8).toUpperCase()} • {fmtDate(order.createdAt)}
                          </Typography>
                        </Box>
                        <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 600, borderRadius: 1.5 }} />
                      </Box>

                      {/* Card Body */}
                      <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                          {/* Left col: Customer info */}
                          <Grid item xs={12} md={7}>
                            <Stack spacing={2}>
                              <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                                <Avatar sx={{ bgcolor: alpha("#f59e0b", 0.1), color: "#f59e0b", width: 36, height: 36 }}>
                                  <PersonIcon fontSize="small" />
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                    Khách hàng
                                  </Typography>
                                  <Typography variant="body1" fontWeight={600} color="text.primary">
                                    {order.user?.fullName || "Khách ẩn danh"}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {order.user?.phone || "Không có số ĐT"}
                                  </Typography>
                                </Box>
                              </Box>

                              <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                                <Avatar sx={{ bgcolor: alpha("#10b981", 0.1), color: "#10b981", width: 36, height: 36 }}>
                                  <LocationOnIcon fontSize="small" />
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                    Địa chỉ giao hàng
                                  </Typography>
                                  <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.4 }}>
                                    {order.deliveryAddress || "Nhận tại cửa hàng"}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              {order.note && (
                                <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                                  <Avatar sx={{ bgcolor: alpha("#94a3b8", 0.1), color: "#64748b", width: 36, height: 36 }}>
                                    <ReceiptLongIcon fontSize="small" />
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                      Ghi chú
                                    </Typography>
                                    <Typography variant="body2" color="text.primary">
                                      {order.note}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}
                            </Stack>
                          </Grid>

                          {/* Right col: Order items */}
                          <Grid item xs={12} md={5}>
                            <Box sx={{ bgcolor: "#f8fafc", p: 2, borderRadius: 2, border: "1px dashed #cbd5e1", height: "100%" }}>
                              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                                Đơn hàng ({items.length} món)
                              </Typography>
                              <Stack spacing={1} sx={{ mb: 2 }}>
                                {items.slice(0, 3).map((item, i) => (
                                  <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="body2" color="text.primary" sx={{ flex: 1, pr: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                      {item.emoji || "🍽️"} {item.name} <span style={{ color: "#64748b", fontWeight: 600 }}>x{item.quantity}</span>
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                      {fmt(item.price * item.quantity)}đ
                                    </Typography>
                                  </Box>
                                ))}
                                {items.length > 3 && (
                                  <Typography variant="caption" color="text.secondary">
                                    + {items.length - 3} món khác...
                                  </Typography>
                                )}
                              </Stack>

                              <Divider sx={{ my: 1.5, borderStyle: "dashed" }} />
                              
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="body2" color="text.secondary">
                                  {order.paymentMethod === "cash" ? "Thanh toán:" : "Thanh toán:"} {order.paymentMethod === "cash" ? "Tiền mặt" : order.paymentMethod?.toUpperCase()}
                                </Typography>
                                <Typography variant="h6" color="primary.main">
                                  {fmt(order.total)}đ
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>

                      {/* Card Footer Actions */}
                      {renderActionArea(order) && (
                        <Box sx={{ px: 3, py: 2, borderTop: "1px solid #e2e8f0", bgcolor: "#fff" }}>
                          {renderActionArea(order)}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Container>
      </Box>

      {/* Snackbar */}
      <Snackbar open={toast.open} autoHideDuration={3000} onClose={closeToast} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={closeToast} severity={toast.severity} sx={{ width: "100%", borderRadius: 2, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
