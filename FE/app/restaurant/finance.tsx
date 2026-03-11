import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/constants/auth-context';
import { restaurantAPI, orderAPI } from '@/constants/api';

export default function FinanceScreen() {
    const router = useRouter();
    const { token, logout } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [completedOrders, setCompletedOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);

    const fetchData = async (isRefresh = false) => {
        if (!token) return;
        if (isRefresh) setRefreshing(true);
        try {
            const restRes = await restaurantAPI.getMyRestaurant(token);
            if (restRes?.success) {
                const restId = restRes.data._id;
                setRestaurantId(restId);

                // Fetch stats
                const statsRes = await orderAPI.getRestaurantOrderStats(token, restId);
                if (statsRes.success) {
                    setStats(statsRes.data);
                }

                // Fetch completed (delivered) orders
                const ordersRes = await orderAPI.getRestaurantOrders(token, restId, { status: 'delivered', limit: 50 });
                if (ordersRes.success) {
                    setCompletedOrders(ordersRes.data || []);
                }
            }
        } catch (error: any) {
            console.error("Finance fetch error:", error);
            if (error.status === 401) {
                Alert.alert("Phiên làm việc hết hạn", "Vui lòng đăng nhập lại.");
                logout().then(() => router.replace('/sign-in' as any));
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, [token]);

    const formatDate = (dateIso: string) => {
        const d = new Date(dateIso);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const totalDeliveredRevenue = completedOrders.reduce((sum, o) => sum + (o.subtotal || o.total || 0), 0);

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={AppColors.charcoal} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Tài chính</Text>
            </View>

            <ScrollView
                contentContainerStyle={s.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={[AppColors.primary]} />}
            >
                {/* Balance Card */}
                <LinearGradient colors={['#10B981', '#059669']} style={s.balanceCard}>
                    <Text style={s.balanceLabel}>Tổng doanh thu</Text>
                    <Text style={s.balanceAmount}>{(stats?.totalRevenue || 0).toLocaleString()} đ</Text>
                    <View style={s.balanceFooter}>
                        <Text style={s.balanceFooterText}>Doanh thu tiền đồ ăn</Text>
                    </View>
                </LinearGradient>

                {/* Quick Stats Row */}
                <View style={s.statsRow}>
                    <View style={s.statCard}>
                        <Text style={s.statIcon}></Text>
                        <Text style={s.statValue}>{completedOrders.length}</Text>
                        <Text style={s.statLabel}>Đơn hoàn thành</Text>
                    </View>
                    <View style={s.statCard}>
                        <Text style={s.statIcon}></Text>
                        <Text style={s.statValue}>{completedOrders.length > 0 ? Math.round(totalDeliveredRevenue / completedOrders.length).toLocaleString() : 0}đ</Text>
                        <Text style={s.statLabel}>Trung bình/đơn</Text>
                    </View>
                </View>

                {/* Completed Orders History */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Lịch sử đơn hoàn thành</Text>
                    {loading ? (
                        <ActivityIndicator color={AppColors.primary} style={{ marginTop: 20 }} />
                    ) : completedOrders.length === 0 ? (
                        <View style={s.emptyBox}>
                            <Ionicons name="receipt-outline" size={40} color={AppColors.gray} />
                            <Text style={s.emptyText}>Chưa có đơn hoàn thành nào</Text>
                        </View>
                    ) : (
                        completedOrders.map((order, idx) => (
                            <View key={order._id || `order-${idx}`} style={s.orderCard}>
                                <View style={s.orderHeader}>
                                    <View style={s.orderIdBadge}>
                                        <Text style={s.orderIdText}>#{(order._id || '').slice(-6).toUpperCase()}</Text>
                                    </View>
                                    <Text style={s.orderDate}>{formatDate(order.updatedAt || order.createdAt)}</Text>
                                </View>

                                {/* Items */}
                                <View style={s.orderItems}>
                                    {(order.items || []).map((item: any, itemIdx: number) => (
                                        <View key={item._id || `item-${itemIdx}`} style={s.orderItem}>
                                            <Text style={s.orderItemEmoji}>{item.emoji || '🍽️'}</Text>
                                            <View style={s.orderItemInfo}>
                                                <Text style={s.orderItemName} numberOfLines={1}>{item.quantity}x {item.name}</Text>
                                                {!!item.note && (
                                                    <Text style={s.orderItemNote}>+ {item.note}</Text>
                                                )}
                                            </View>
                                            <Text style={s.orderItemPrice}>{(item.price * item.quantity).toLocaleString()}đ</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Order Total */}
                                <View style={s.orderFooter}>
                                    <Text style={s.orderTotalLabel}>Doanh thu</Text>
                                    <Text style={s.orderTotalAmount}>+{(order.subtotal || order.total || 0).toLocaleString()}đ</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 15, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: AppColors.charcoal },
    content: { padding: 16 },

    // Balance card
    balanceCard: { borderRadius: 16, padding: 24, marginBottom: 16 },
    balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
    balanceAmount: { color: '#fff', fontSize: 32, fontWeight: '900', marginBottom: 16 },
    balanceFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 12 },
    balanceFooterText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },

    // Quick stats
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    statCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
            android: { elevation: 2 },
        }),
    },
    statIcon: { fontSize: 24, marginBottom: 6 },
    statValue: { fontSize: 18, fontWeight: '800', color: AppColors.charcoal, marginBottom: 2 },
    statLabel: { fontSize: 11, color: AppColors.gray, fontWeight: '500' },

    // Section
    section: { marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: AppColors.charcoal, marginBottom: 12 },
    emptyBox: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#fff', borderRadius: 12 },
    emptyText: { fontSize: 14, color: AppColors.gray, marginTop: 12 },

    // Order card
    orderCard: {
        backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
            android: { elevation: 1 },
        }),
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    orderIdBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    orderIdText: { fontSize: 12, fontWeight: '700', color: '#3B82F6' },
    orderDate: { fontSize: 11, color: AppColors.gray },

    // Order items
    orderItems: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8 },
    orderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 8 },
    orderItemEmoji: { fontSize: 18 },
    orderItemInfo: { flex: 1 },
    orderItemName: { fontSize: 12, fontWeight: '600', color: AppColors.charcoal },
    orderItemNote: { fontSize: 11, color: AppColors.primary },
    orderItemPrice: { fontSize: 12, fontWeight: '600', color: AppColors.gray },

    // Order footer
    orderFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 8, paddingTop: 10,
    },
    orderTotalLabel: { fontSize: 13, fontWeight: '600', color: AppColors.charcoal },
    orderTotalAmount: { fontSize: 16, fontWeight: '800', color: '#10B981' },
});
