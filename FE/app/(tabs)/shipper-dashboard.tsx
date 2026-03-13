import React, { useState, useEffect, useCallback } from 'react';
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

    const inProgress = myOrders.filter((o) => ['shipper_accepted', 'delivering', 'shipper_delivered'].includes(o.status));
    const history = myOrders.filter((o) => ['delivered', 'cancelled'].includes(o.status));
    const currentList = tabIndex === 0 ? available : tabIndex === 1 ? inProgress : history;

    // ─── Action Button Renderer ───────────────────────
    const renderActionButton = (order: any) => {
        const isBusy = actioningId === order._id;
        if (tabIndex === 0) {
            return (
                <TouchableOpacity
                    style={styles.mainActionBtn}
                    onPress={() => doAction(order._id, shipperAPI.acceptOrder, 'Đã nhận đơn! Đến nhà hàng lấy hàng nhé 🏍️')}
                    disabled={isBusy}
                    activeOpacity={0.8}
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
                    <TouchableOpacity
                        style={styles.mainActionBtn}
                        onPress={() => doAction(order._id, shipperAPI.pickupOrder, 'Đã lấy hàng! Giao cho khách đi nào 📦')}
                        disabled={isBusy}
                        activeOpacity={0.8}
                    >
                        <LinearGradient colors={['#3b82f6', '#60a5fa']} style={styles.mainActionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            {isBusy ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="local-shipping" size={22} color="#fff" />}
                            <Text style={styles.mainActionText}>{isBusy ? 'Đang xử lý...' : 'Đã Lấy Hàng'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                );
            }
            if (order.status === 'delivering') {
                return (
                    <TouchableOpacity
                        style={styles.mainActionBtn}
                        onPress={() => doAction(order._id, shipperAPI.completeDelivery, 'Tuyệt! Đã báo giao thành công 🎉')}
                        disabled={isBusy}
                        activeOpacity={0.8}
                    >
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
                        <Text style={styles.waitingText}>Đang chờ khách hàng xác nhận...</Text>
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
                    {/* Customer */}
                    <View style={styles.deliveryRow}>
                        <View style={[styles.deliveryDot, { backgroundColor: '#f59e0b' }]} />
                        <View style={styles.deliveryLine} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.deliveryLabel}>Khách hàng</Text>
                            <Text style={styles.deliveryValue}>{order.user?.fullName || 'Khách'}</Text>
                            {order.user?.phone && <Text style={styles.deliveryPhone}>{order.user.phone}</Text>}
                        </View>
                    </View>
                    {/* Address */}
                    <View style={styles.deliveryRow}>
                        <View style={[styles.deliveryDot, { backgroundColor: '#10b981' }]} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.deliveryLabel}>Giao đến</Text>
                            <Text style={styles.deliveryValue} numberOfLines={2}>{order.deliveryAddress || 'Nhận tại cửa hàng'}</Text>
                        </View>
                    </View>
                </View>

                {/* Items Preview */}
                <View style={styles.itemsPreview}>
                    <View style={styles.itemsLeft}>
                        <Text style={styles.itemsCount}>{items.length} món</Text>
                        <Text style={styles.itemsList} numberOfLines={1}>
                            {items.slice(0, 2).map((it: any) => `${it.emoji || '🍽️'} ${it.name}`).join(', ')}
                            {items.length > 2 ? ` +${items.length - 2}` : ''}
                        </Text>
                    </View>
                    <View style={styles.priceTag}>
                        <Text style={styles.priceLabel}>Tổng</Text>
                        <Text style={styles.priceValue}>{fmt(order.total)}đ</Text>
                    </View>
                </View>

                {/* Payment */}
                <View style={styles.paymentRow}>
                    <MaterialCommunityIcons
                        name={order.paymentMethod === 'cash' ? 'cash' : 'credit-card-outline'}
                        size={16}
                        color="#64748b"
                    />
                    <Text style={styles.paymentText}>
                        {order.paymentMethod === 'cash' ? 'Tiền mặt' : (order.paymentMethod || '').toUpperCase()}
                    </Text>
                </View>

                {/* Action Button */}
                {renderActionButton(order)}
            </View>
        );
    };

    // ─── Loading State ────────────────────────────────
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
                            <MaterialCommunityIcons name="package-variant" size={20} color="#ef4444" />
                        </View>
                        <Text style={styles.statNumber}>{available.length}</Text>
                        <Text style={styles.statLabel}>Chờ nhận</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                            <MaterialCommunityIcons name="truck-fast" size={20} color="#3b82f6" />
                        </View>
                        <Text style={styles.statNumber}>{inProgress.length}</Text>
                        <Text style={styles.statLabel}>Đang giao</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                            <MaterialCommunityIcons name="check-circle" size={20} color="#10b981" />
                        </View>
                        <Text style={styles.statNumber}>{history.filter(o => o.status === 'delivered').length}</Text>
                        <Text style={styles.statLabel}>Hoàn thành</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* ── Pill Tabs ── */}
            <View style={styles.tabsWrapper}>
                {[
                    { label: 'Chờ Nhận', count: available.length, color: '#ef4444' },
                    { label: 'Đang Giao', count: inProgress.length, color: '#3b82f6' },
                    { label: 'Lịch Sử', count: 0, color: 'transparent' },
                ].map((tab, i) => (
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

            {/* ── Order List ── */}
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
                                size={40}
                                color="#d1d5db"
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
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
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
        flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
            android: { elevation: 6 },
        }),
    },
    statItem: { flex: 1, alignItems: 'center', gap: 6 },
    statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    statNumber: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
    statLabel: { fontSize: 11, fontWeight: '600', color: '#94a3b8' },
    statDivider: { width: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },

    // Pill Tabs
    tabsWrapper: {
        flexDirection: 'row', marginHorizontal: 16, marginTop: 16, marginBottom: 8,
        backgroundColor: '#e2e8f0', borderRadius: 14, padding: 4,
    },
    pillTab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 10, borderRadius: 12, gap: 6,
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

    // Empty State
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

    // Items Preview
    itemsPreview: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginHorizontal: 16, padding: 12, backgroundColor: '#f8fafc',
        borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    },
    itemsLeft: { flex: 1, marginRight: 12 },
    itemsCount: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 2 },
    itemsList: { fontSize: 13, color: '#334155' },
    priceTag: { alignItems: 'flex-end' },
    priceLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
    priceValue: { fontSize: 18, fontWeight: '800', color: '#ee4d2d' },

    // Payment
    paymentRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginHorizontal: 16, marginTop: 10, marginBottom: 4,
    },
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
});
