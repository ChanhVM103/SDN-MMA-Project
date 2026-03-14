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
            <LinearGradient
                colors={['#FF6B35', '#E55A2B']}
                style={s.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Tài chính & Doanh thu</Text>
                    <TouchableOpacity onPress={() => fetchData(true)} style={s.refreshBtn}>
                        <Ionicons name="refresh" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView
                style={s.content}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={['#FF6B35']} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Balance Card Section */}
                <View style={s.balanceSection}>
                    <LinearGradient 
                        colors={['#10B981', '#059669']} 
                        style={s.balanceCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={s.balanceRow}>
                            <View>
                                <Text style={s.balanceLabel}>Tổng doanh thu</Text>
                                <Text style={s.balanceAmount}>{(stats?.totalRevenue || 0).toLocaleString()}<Text style={s.currencyText}>đ</Text></Text>
                            </View>
                            <View style={s.balanceIconCircle}>
                                <Ionicons name="wallet-outline" size={30} color="#fff" />
                            </View>
                        </View>
                        <View style={s.balanceFooter}>
                            <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.8)" />
                            <Text style={s.balanceFooterText}>Đã bao gồm chiết khấu nhà hàng</Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Quick Stats Grid */}
                <View style={s.statsGrid}>
                    <View style={s.statCard}>
                        <View style={[s.statIconBox, { backgroundColor: '#EFF6FF' }]}>
                            <Ionicons name="receipt-outline" size={20} color="#3B82F6" />
                        </View>
                        <Text style={s.statValue}>{completedOrders.length}</Text>
                        <Text style={s.statLabel}>Đơn hoàn thành</Text>
                    </View>
                    <View style={s.statCard}>
                        <View style={[s.statIconBox, { backgroundColor: '#F0FDF4' }]}>
                            <Ionicons name="trending-up-outline" size={20} color="#10B981" />
                        </View>
                        <Text style={s.statValue}>
                            {completedOrders.length > 0 ? Math.round(totalDeliveredRevenue / completedOrders.length).toLocaleString() : 0}đ
                        </Text>
                        <Text style={s.statLabel}>Trung bình/đơn</Text>
                    </View>
                </View>

                {/* History Section */}
                <View style={s.historySection}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>Lịch sử doanh thu</Text>
                        <TouchableOpacity>
                            <Text style={s.seeAllText}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator color="#FF6B35" style={{ marginTop: 40 }} />
                    ) : completedOrders.length === 0 ? (
                        <View style={s.emptyBox}>
                            <View style={s.emptyIconCircle}>
                                <Ionicons name="receipt-outline" size={50} color="#E2E8F0" />
                            </View>
                            <Text style={s.emptyText}>Chưa có đơn hoàn thành nào</Text>
                            <Text style={s.emptySub}>Các đơn đã giao thành công sẽ hiện ở đây</Text>
                        </View>
                    ) : (
                        completedOrders.map((order, idx) => (
                            <View key={order._id || `order-${idx}`} style={s.orderCard}>
                                <View style={s.orderMain}>
                                    <View style={s.orderInfo}>
                                        <View style={s.orderIdRow}>
                                            <Text style={s.orderId}>#{(order._id || '').slice(-6).toUpperCase()}</Text>
                                            <View style={s.dot} />
                                            <Text style={s.orderDate}>{formatDate(order.updatedAt || order.createdAt)}</Text>
                                        </View>
                                        <Text style={s.orderItemsSummary} numberOfLines={1}>
                                            {(order.items || []).map((i: any) => i.name).join(', ')}
                                        </Text>
                                    </View>
                                    <View style={s.orderAmountBox}>
                                        <Text style={s.orderAmount}>+{(order.subtotal || order.total || 0).toLocaleString()}đ</Text>
                                        <Text style={s.orderStatusText}>Hoàn thành</Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', flex: 1, marginLeft: 15 },
    refreshBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

    content: { flex: 1 },
    balanceSection: { padding: 20, paddingTop: 24 },
    balanceCard: { 
        borderRadius: 24, padding: 24,
        ...Platform.select({
            ios: { shadowColor: '#059669', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
            android: { elevation: 8 },
        }),
    },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700', marginBottom: 6 },
    balanceAmount: { color: '#fff', fontSize: 32, fontWeight: '900' },
    currencyText: { fontSize: 20, fontWeight: '700' },
    balanceIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    balanceFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    balanceFooterText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },

    statsGrid: { flexDirection: 'row', gap: 16, paddingHorizontal: 20, marginBottom: 30 },
    statCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
            android: { elevation: 2 },
        }),
    },
    statIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statValue: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 2 },
    statLabel: { fontSize: 11, color: '#64748B', fontWeight: '700' },

    historySection: { paddingHorizontal: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 17, fontWeight: '900', color: '#1E293B' },
    seeAllText: { fontSize: 13, color: '#FF6B35', fontWeight: '800' },

    emptyBox: { alignItems: 'center', paddingVertical: 60, backgroundColor: '#fff', borderRadius: 24 },
    emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyText: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    emptySub: { fontSize: 13, color: '#94A3B8', marginTop: 6 },

    orderCard: {
        backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
            android: { elevation: 2 },
        }),
    },
    orderMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderInfo: { flex: 1, marginRight: 15 },
    orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    orderId: { fontSize: 14, fontWeight: '900', color: '#1E293B' },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' },
    orderDate: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    orderItemsSummary: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
    orderAmountBox: { alignItems: 'flex-end' },
    orderAmount: { fontSize: 16, fontWeight: '900', color: '#10B981', marginBottom: 2 },
    orderStatusText: { fontSize: 10, color: '#10B981', fontWeight: '800', backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
});
