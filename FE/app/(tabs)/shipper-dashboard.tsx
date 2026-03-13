import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ActivityIndicator,
    TouchableOpacity, ScrollView, RefreshControl, Alert as RNAlert,
    Dimensions, Platform,
} from 'react-native';
import { useAuth } from '@/constants/auth-context';
import { AppColors } from '@/constants/theme';
import { shipperAPI } from '@/constants/api';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────
const fmt = (n: number) => Number(n || 0).toLocaleString('vi-VN');
const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    ready_for_pickup: { label: 'Sẵn sàng lấy hàng', color: '#f97316', bg: '#fff7ed', icon: 'package-variant' },
    shipper_accepted: { label: 'Đã nhận đơn', color: '#06b6d4', bg: '#ecfeff', icon: 'motorbike' },
    delivering: { label: 'Đang giao hàng', color: '#3b82f6', bg: '#eff6ff', icon: 'truck-fast' },
    shipper_delivered: { label: 'Chờ xác nhận', color: '#f59e0b', bg: '#fffbeb', icon: 'clock-check-outline' },
    delivered: { label: 'Đã giao', color: '#10b981', bg: '#ecfdf5', icon: 'check-circle' },
    cancelled: { label: 'Đã huỷ', color: '#ef4444', bg: '#fef2f2', icon: 'close-circle' },
};

// ─── Main Component ───────────────────────────────
export default function ShipperDashboardScreen() {
    const { user, token } = useAuth();
    const [tabIndex, setTabIndex] = useState(0);
    const [available, setAvailable] = useState<any[]>([]);
    const [myOrders, setMyOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actioningId, setActioningId] = useState<string | null>(null);

    const loadData = useCallback(async (silent = false) => {
        if (!token) return;
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const [availRes, myRes] = await Promise.all([
                shipperAPI.getAvailableOrders(token),
                shipperAPI.getMyOrders(token),
            ]);
            setAvailable(availRes?.data || availRes || []);
            setMyOrders(myRes?.data || myRes || []);
        } catch (err: any) {
            RNAlert.alert('Lỗi', 'Không thể tải dữ liệu: ' + (err?.message || ''));
        } finally {
            if (!silent) setLoading(false);
            else setRefreshing(false);
        }
    }, [token]);

    useEffect(() => { loadData(); }, [loadData]);
    useEffect(() => {
        const t = setInterval(() => loadData(true), 30000);
        return () => clearInterval(t);
    }, [loadData]);

    const doAction = async (orderId: string, fn: (t: string, id: string) => Promise<any>, successMsg: string) => {
        if (!token) return;
        setActioningId(orderId);
        try {
            await fn(token, orderId);
            RNAlert.alert('✅ Thành công', successMsg);
            await loadData(true);
        } catch (err: any) {
            RNAlert.alert('Lỗi', err?.message || 'Có lỗi xảy ra');
        } finally {
            setActioningId(null);
        }
    };

    // ── Derived Data ──────────────────────────────────
    const inProgress = myOrders.filter((o) => ['shipper_accepted', 'delivering', 'shipper_delivered'].includes(o.status));
    const history = myOrders.filter((o) => ['delivered', 'cancelled'].includes(o.status));
    const delivered = history.filter(o => o.status === 'delivered');
    const cancelled = history.filter(o => o.status === 'cancelled');

    // Total income from deliveryFee of all delivered orders
    const totalIncome = useMemo(() => {
        return delivered.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
    }, [delivered]);

    const currentList = tabIndex === 0 ? available : tabIndex === 1 ? inProgress : tabIndex === 2 ? history : [];

    const tabs = [
        { label: 'Chờ Nhận', count: available.length, color: '#ef4444' },
        { label: 'Đang Giao', count: inProgress.length, color: '#3b82f6' },
        { label: 'Lịch Sử', count: 0, color: 'transparent' },
        { label: 'Thống Kê', count: 0, color: 'transparent' },
    ];

    // ─── Action Button Renderer ───────────────────────
    const renderActionButton = (order: any) => {
        const isBusy = actioningId === order._id;
        if (tabIndex === 0) {
            return (
                <TouchableOpacity
                    style={styles.mainActionBtn}
                    onPress={() => doAction(order._id, shipperAPI.acceptOrder, 'Đã nhận đơn! Đến nhà hàng lấy hàng nhé 🏍️')}
                    disabled={isBusy} activeOpacity={0.8}
                >
                    <LinearGradient colors={['#ee4d2d', '#ff6633']} style={styles.mainActionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        {isBusy ? <ActivityIndicator size="small" color="#fff" /> : <MaterialCommunityIcons name="motorbike" size={22} color="#fff" />}
                        <Text style={styles.mainActionText}>{isBusy ? 'Đang xử lý...' : 'Nhận Đơn Giao'}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            );
        }
        if (tabIndex === 1) {
            if (order.status === 'shipper_accepted') {
                return (
                    <TouchableOpacity style={styles.mainActionBtn}
                        onPress={() => doAction(order._id, shipperAPI.pickupOrder, 'Đã lấy hàng! Giao cho khách đi nào 📦')}
                        disabled={isBusy} activeOpacity={0.8}>
                        <LinearGradient colors={['#3b82f6', '#60a5fa']} style={styles.mainActionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            {isBusy ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="local-shipping" size={22} color="#fff" />}
                            <Text style={styles.mainActionText}>{isBusy ? 'Đang xử lý...' : 'Đã Lấy Hàng'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                );
            }
            if (order.status === 'delivering') {
                return (
                    <TouchableOpacity style={styles.mainActionBtn}
                        onPress={() => doAction(order._id, shipperAPI.completeDelivery, 'Tuyệt! Đã báo giao thành công 🎉')}
                        disabled={isBusy} activeOpacity={0.8}>
                        <LinearGradient colors={['#10b981', '#34d399']} style={styles.mainActionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            {isBusy ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="done-all" size={22} color="#fff" />}
                            <Text style={styles.mainActionText}>{isBusy ? 'Đang xử lý...' : 'Đã Giao Hàng'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                );
            }
            if (order.status === 'shipper_delivered') {
                return (
                    <View style={styles.waitingBanner}>
                        <MaterialCommunityIcons name="clock-check-outline" size={20} color="#92400e" />
                        <Text style={styles.waitingText}>Đang chờ nhà hàng xác nhận...</Text>
                    </View>
                );
            }
        }
        return null;
    };

    // ─── Order Card ───────────────────────────────────
    const renderOrderCard = (order: any) => {
        const cfg = STATUS_CONFIG[order.status] || { label: order.status, color: '#6b7280', bg: '#f3f4f6', icon: 'help-circle' };
        const items = order.items || [];
        const fee = order.deliveryFee || 0;

        return (
            <View key={order._id} style={styles.orderCard}>
                {/* Top: Restaurant + Status */}
                <View style={styles.cardTop}>
                    <View style={styles.restaurantRow}>
                        <View style={styles.restaurantIcon}>
                            <MaterialIcons name="storefront" size={18} color={AppColors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.restaurantName} numberOfLines={1}>{order.restaurantName || 'Nhà hàng'}</Text>
                            <Text style={styles.orderTime}>#{String(order._id).slice(-6).toUpperCase()} • {fmtDate(order.createdAt)}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusChip, { backgroundColor: cfg.bg }]}>
                        <MaterialCommunityIcons name={cfg.icon as any} size={14} color={cfg.color} />
                        <Text style={[styles.statusChipText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                </View>

                {/* Delivery Info */}
                <View style={styles.deliveryInfo}>
                    <View style={styles.deliveryRow}>
                        <View style={[styles.deliveryDot, { backgroundColor: '#f59e0b' }]} />
                        <View style={styles.deliveryLine} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.deliveryLabel}>Khách hàng</Text>
                            <Text style={styles.deliveryValue}>{order.user?.fullName || 'Khách'}</Text>
                            {order.user?.phone && <Text style={styles.deliveryPhone}>{order.user.phone}</Text>}
                        </View>
                    </View>
                    <View style={styles.deliveryRow}>
                        <View style={[styles.deliveryDot, { backgroundColor: '#10b981' }]} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.deliveryLabel}>Giao đến</Text>
                            <Text style={styles.deliveryValue} numberOfLines={2}>{order.deliveryAddress || 'Nhận tại cửa hàng'}</Text>
                        </View>
                    </View>
                </View>

                {/* ── Items Detail Box ── */}
                <View style={styles.itemsBox}>
                    <Text style={styles.itemsBoxTitle}>Đơn hàng ({items.length} món)</Text>
                    {items.map((item: any, i: number) => (
                        <View key={i} style={styles.itemDetailRow}>
                            <Text style={styles.itemDetailName} numberOfLines={1}>
                                {item.emoji || '🍽️'} {item.name} <Text style={styles.itemDetailQty}>x{item.quantity}</Text>
                            </Text>
                            <Text style={styles.itemDetailPrice}>{fmt(item.price * item.quantity)}đ</Text>
                        </View>
                    ))}

                    {/* Delivery Fee (Shipper Income) */}
                    {fee > 0 && (
                        <>
                            <View style={styles.itemsDivider} />
                            <View style={styles.itemDetailRow}>
                                <Text style={styles.deliveryFeeLabel}>🚚 Phí giao hàng (thu nhập)</Text>
                                <Text style={styles.deliveryFeeValue}>+{fmt(fee)}đ</Text>
                            </View>
                        </>
                    )}

                    {/* Total + Payment */}
                    <View style={styles.itemsDivider} />
                    <View style={styles.totalRow}>
                        <View style={styles.paymentInfo}>
                            <MaterialCommunityIcons
                                name={order.paymentMethod === 'cash' ? 'cash' : 'credit-card-outline'}
                                size={16} color="#64748b"
                            />
                            <Text style={styles.paymentText}>
                                Thanh toán: {order.paymentMethod === 'cash' ? 'Tiền mặt' : (order.paymentMethod || '').toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.totalAmount}>{fmt(order.total)}đ</Text>
                    </View>
                </View>

                {/* Action Button */}
                {renderActionButton(order)}
            </View>
        );
    };

    // ─── Statistics Tab Content ────────────────────────
    const renderStatisticsTab = () => {
        const totalOrders = myOrders.length;
        const completedCount = delivered.length;
        const cancelledCount = cancelled.length;
        const inProgressCount = inProgress.length;
        const completionRate = totalOrders > 0 ? Math.round((completedCount / totalOrders) * 100) : 0;

        // Group by date for recent activity
        const recentDays: { date: string; count: number; income: number }[] = [];
        const dayMap = new Map<string, { count: number; income: number }>();
        delivered.forEach(o => {
            const d = new Date(o.createdAt).toLocaleDateString('vi-VN');
            const prev = dayMap.get(d) || { count: 0, income: 0 };
            dayMap.set(d, { count: prev.count + 1, income: prev.income + (o.deliveryFee || 0) });
        });
        dayMap.forEach((val, key) => recentDays.push({ date: key, ...val }));
        recentDays.sort((a, b) => b.date.localeCompare(a.date));

        return (
            <ScrollView
                style={styles.orderList}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30, paddingTop: 8 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={['#ee4d2d']} />}
            >
                {/* Income Hero Card */}
                <View style={styles.incomeHeroCard}>
                    <LinearGradient colors={['#10b981', '#059669']} style={styles.incomeHeroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <Text style={styles.incomeHeroLabel}>💰 Tổng thu nhập</Text>
                        <Text style={styles.incomeHeroAmount}>{fmt(totalIncome)}đ</Text>
                        <Text style={styles.incomeHeroSub}>Từ {completedCount} đơn hoàn thành</Text>
                    </LinearGradient>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statsGridItem}>
                        <View style={[styles.statsGridIcon, { backgroundColor: '#eff6ff' }]}>
                            <MaterialCommunityIcons name="package-variant" size={22} color="#3b82f6" />
                        </View>
                        <Text style={styles.statsGridNumber}>{totalOrders}</Text>
                        <Text style={styles.statsGridLabel}>Tổng đơn</Text>
                    </View>
                    <View style={styles.statsGridItem}>
                        <View style={[styles.statsGridIcon, { backgroundColor: '#ecfdf5' }]}>
                            <MaterialCommunityIcons name="check-circle" size={22} color="#10b981" />
                        </View>
                        <Text style={styles.statsGridNumber}>{completedCount}</Text>
                        <Text style={styles.statsGridLabel}>Hoàn thành</Text>
                    </View>
                    <View style={styles.statsGridItem}>
                        <View style={[styles.statsGridIcon, { backgroundColor: '#fff7ed' }]}>
                            <MaterialCommunityIcons name="truck-fast" size={22} color="#f97316" />
                        </View>
                        <Text style={styles.statsGridNumber}>{inProgressCount}</Text>
                        <Text style={styles.statsGridLabel}>Đang giao</Text>
                    </View>
                    <View style={styles.statsGridItem}>
                        <View style={[styles.statsGridIcon, { backgroundColor: '#fef2f2' }]}>
                            <MaterialCommunityIcons name="close-circle" size={22} color="#ef4444" />
                        </View>
                        <Text style={styles.statsGridNumber}>{cancelledCount}</Text>
                        <Text style={styles.statsGridLabel}>Đã huỷ</Text>
                    </View>
                </View>

                {/* Completion Rate */}
                <View style={styles.rateCard}>
                    <View style={styles.rateHeader}>
                        <Text style={styles.rateTitle}>📊 Tỉ lệ hoàn thành</Text>
                        <Text style={[styles.ratePercent, { color: completionRate >= 80 ? '#10b981' : completionRate >= 50 ? '#f59e0b' : '#ef4444' }]}>{completionRate}%</Text>
                    </View>
                    <View style={styles.rateBarBg}>
                        <View style={[styles.rateBarFill, { width: `${completionRate}%`, backgroundColor: completionRate >= 80 ? '#10b981' : completionRate >= 50 ? '#f59e0b' : '#ef4444' }]} />
                    </View>
                    <Text style={styles.rateSub}>{completedCount} / {totalOrders} đơn giao thành công</Text>
                </View>

                {/* Average income per order */}
                <View style={styles.avgCard}>
                    <View style={styles.avgRow}>
                        <View style={styles.avgItem}>
                            <Text style={styles.avgLabel}>TB / đơn</Text>
                            <Text style={styles.avgValue}>{completedCount > 0 ? fmt(Math.round(totalIncome / completedCount)) : '0'}đ</Text>
                        </View>
                        <View style={styles.avgDivider} />
                        <View style={styles.avgItem}>
                            <Text style={styles.avgLabel}>Tổng thu nhập</Text>
                            <Text style={[styles.avgValue, { color: '#10b981' }]}>{fmt(totalIncome)}đ</Text>
                        </View>
                    </View>
                </View>

                {/* Recent Activity */}
                {recentDays.length > 0 && (
                    <View style={styles.recentCard}>
                        <Text style={styles.recentTitle}>📅 Hoạt động gần đây</Text>
                        {recentDays.slice(0, 7).map((day, i) => (
                            <View key={i} style={styles.recentRow}>
                                <View style={styles.recentDate}>
                                    <MaterialCommunityIcons name="calendar" size={16} color="#94a3b8" />
                                    <Text style={styles.recentDateText}>{day.date}</Text>
                                </View>
                                <View style={styles.recentStats}>
                                    <View style={styles.recentStatItem}>
                                        <Text style={styles.recentStatCount}>{day.count} đơn</Text>
                                    </View>
                                    <Text style={styles.recentStatIncome}>+{fmt(day.income)}đ</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        );
    };

    // ─── Loading ──────────────────────────────────────
    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <LinearGradient colors={['#ee4d2d', '#ff6633']} style={styles.loadingGradient}>
                    <MaterialCommunityIcons name="motorbike" size={48} color="#fff" />
                    <Text style={styles.loadingTitle}>Shipper Dashboard</Text>
                    <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
                    <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* ── Gradient Header ── */}
            <LinearGradient colors={['#ee4d2d', '#ff6633', '#FF8F65']} style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerGreeting}>Xin chào 👋</Text>
                        <Text style={styles.headerName}>{user?.fullName || 'Shipper'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => loadData(true)} style={styles.headerRefresh} activeOpacity={0.7}>
                        {refreshing ? <ActivityIndicator size="small" color="#ee4d2d" /> : <Ionicons name="refresh" size={20} color="#ee4d2d" />}
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                            <MaterialCommunityIcons name="package-variant" size={18} color="#ef4444" />
                        </View>
                        <Text style={styles.statNumber}>{available.length}</Text>
                        <Text style={styles.statLabel}>Chờ nhận</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                            <MaterialCommunityIcons name="truck-fast" size={18} color="#3b82f6" />
                        </View>
                        <Text style={styles.statNumber}>{inProgress.length}</Text>
                        <Text style={styles.statLabel}>Đang giao</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                            <MaterialCommunityIcons name="check-circle" size={18} color="#10b981" />
                        </View>
                        <Text style={styles.statNumber}>{delivered.length}</Text>
                        <Text style={styles.statLabel}>Hoàn thành</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                            <Text style={{ fontSize: 16 }}>💰</Text>
                        </View>
                        <Text style={[styles.statNumber, { color: '#10b981', fontSize: 16 }]}>{fmt(totalIncome)}đ</Text>
                        <Text style={styles.statLabel}>Thu nhập</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* ── Pill Tabs (scrollable for 4 tabs) ── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScrollView} contentContainerStyle={styles.tabsScrollContent}>
                <View style={styles.tabsWrapper}>
                    {tabs.map((tab, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.pillTab, tabIndex === i && styles.activePillTab]}
                            onPress={() => setTabIndex(i)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.pillTabText, tabIndex === i && styles.activePillTabText]}>{tab.label}</Text>
                            {tab.count > 0 && (
                                <View style={[styles.pillBadge, { backgroundColor: tabIndex === i ? '#fff' : tab.color }]}>
                                    <Text style={[styles.pillBadgeText, { color: tabIndex === i ? '#ee4d2d' : '#fff' }]}>{tab.count}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* ── Content ── */}
            {tabIndex === 3 ? renderStatisticsTab() : (
                <ScrollView
                    style={styles.orderList}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30, paddingTop: 8 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={['#ee4d2d']} />}
                >
                    {currentList.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <MaterialCommunityIcons
                                    name={tabIndex === 0 ? 'package-variant' : tabIndex === 1 ? 'truck-fast' : 'history'}
                                    size={40} color="#d1d5db"
                                />
                            </View>
                            <Text style={styles.emptyTitle}>
                                {tabIndex === 0 ? 'Chưa có đơn nào chờ giao' : tabIndex === 1 ? 'Bạn chưa nhận đơn nào' : 'Chưa có lịch sử giao hàng'}
                            </Text>
                            <Text style={styles.emptySub}>Kéo xuống để làm mới danh sách</Text>
                        </View>
                    ) : (
                        currentList.map(renderOrderCard)
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },

    // Loading
    loadingContainer: { flex: 1 },
    loadingGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
    loadingTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 12 },
    loadingText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 8 },

    // Header
    header: {
        paddingTop: Platform.OS === 'ios' ? 10 : 16,
        paddingBottom: 20, paddingHorizontal: 20,
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
    headerName: { fontSize: 22, fontWeight: '800', color: '#fff' },
    headerRefresh: {
        width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff',
        justifyContent: 'center', alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
            android: { elevation: 4 },
        }),
    },

    // Stats
    statsContainer: {
        flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
            android: { elevation: 6 },
        }),
    },
    statItem: { flex: 1, alignItems: 'center', gap: 4 },
    statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    statNumber: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
    statLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8' },
    statDivider: { width: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },

    // Pill Tabs
    tabsScrollView: { maxHeight: 52, marginTop: 14 },
    tabsScrollContent: { paddingHorizontal: 16 },
    tabsWrapper: {
        flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 14, padding: 4,
    },
    pillTab: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, gap: 6,
    },
    activePillTab: {
        backgroundColor: '#ee4d2d',
        ...Platform.select({
            ios: { shadowColor: '#ee4d2d', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
            android: { elevation: 3 },
        }),
    },
    pillTabText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
    activePillTabText: { color: '#fff' },
    pillBadge: { minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
    pillBadgeText: { fontSize: 11, fontWeight: '800' },

    // Order List
    orderList: { flex: 1 },
    emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
    emptyIcon: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9',
        justifyContent: 'center', alignItems: 'center', marginBottom: 8,
        borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed',
    },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#64748b' },
    emptySub: { fontSize: 13, color: '#94a3b8' },

    // Order Card
    orderCard: {
        backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
            android: { elevation: 3 },
        }),
    },
    cardTop: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: 16, paddingBottom: 12,
    },
    restaurantRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 },
    restaurantIcon: {
        width: 38, height: 38, borderRadius: 12, backgroundColor: '#FFF3ED',
        justifyContent: 'center', alignItems: 'center',
    },
    restaurantName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    orderTime: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    statusChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    },
    statusChipText: { fontSize: 11, fontWeight: '700' },

    // Delivery Info
    deliveryInfo: { paddingHorizontal: 16, gap: 4, marginBottom: 12 },
    deliveryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 6 },
    deliveryDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
    deliveryLine: {
        position: 'absolute', left: 4, top: 18, width: 2, height: 28,
        backgroundColor: '#e2e8f0', borderRadius: 1,
    },
    deliveryLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
    deliveryValue: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginTop: 1 },
    deliveryPhone: { fontSize: 12, color: '#64748b', marginTop: 1 },

    // Items Detail Box
    itemsBox: {
        marginHorizontal: 16, padding: 14, backgroundColor: '#f8fafc',
        borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    },
    itemsBoxTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 10 },
    itemDetailRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 5,
    },
    itemDetailName: { fontSize: 14, color: '#0f172a', flex: 1, marginRight: 8 },
    itemDetailQty: { color: '#64748b', fontWeight: '700', fontSize: 13 },
    itemDetailPrice: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    itemsDivider: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#cbd5e1', marginVertical: 8 },
    deliveryFeeLabel: { fontSize: 13, fontWeight: '600', color: '#059669' },
    deliveryFeeValue: { fontSize: 15, fontWeight: '800', color: '#059669' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    paymentInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    totalAmount: { fontSize: 20, fontWeight: '900', color: '#ee4d2d' },

    // Payment
    paymentText: { fontSize: 12, color: '#64748b', fontWeight: '500' },

    // Action Buttons
    mainActionBtn: { marginHorizontal: 16, marginTop: 10, marginBottom: 16, borderRadius: 14, overflow: 'hidden' },
    mainActionGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16, gap: 10,
    },
    mainActionText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
    waitingBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        marginHorizontal: 16, marginTop: 10, marginBottom: 16,
        backgroundColor: '#fef3c7', paddingVertical: 14, borderRadius: 14, gap: 8,
    },
    waitingText: { color: '#92400e', fontSize: 14, fontWeight: '700' },

    // ── Statistics Tab ──────────────────────────────
    incomeHeroCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
    incomeHeroGradient: { padding: 24, alignItems: 'center', gap: 6 },
    incomeHeroLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
    incomeHeroAmount: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: 1 },
    incomeHeroSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

    statsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16,
    },
    statsGridItem: {
        width: (width - 42) / 2, backgroundColor: '#fff', borderRadius: 16, padding: 16,
        alignItems: 'center', gap: 8,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
            android: { elevation: 2 },
        }),
    },
    statsGridIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    statsGridNumber: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
    statsGridLabel: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },

    rateCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
            android: { elevation: 2 },
        }),
    },
    rateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    rateTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    ratePercent: { fontSize: 22, fontWeight: '900' },
    rateBarBg: { height: 10, backgroundColor: '#e2e8f0', borderRadius: 5, overflow: 'hidden' },
    rateBarFill: { height: '100%', borderRadius: 5 },
    rateSub: { fontSize: 12, color: '#94a3b8', marginTop: 8 },

    avgCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
            android: { elevation: 2 },
        }),
    },
    avgRow: { flexDirection: 'row', alignItems: 'center' },
    avgItem: { flex: 1, alignItems: 'center', gap: 4 },
    avgLabel: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
    avgValue: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
    avgDivider: { width: 1, height: 40, backgroundColor: '#e2e8f0' },

    recentCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
            android: { elevation: 2 },
        }),
    },
    recentTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 14 },
    recentRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    recentDate: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    recentDateText: { fontSize: 13, fontWeight: '600', color: '#334155' },
    recentStats: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    recentStatItem: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    recentStatCount: { fontSize: 12, fontWeight: '700', color: '#64748b' },
    recentStatIncome: { fontSize: 14, fontWeight: '800', color: '#10b981' },
});
