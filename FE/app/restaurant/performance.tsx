import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/constants/auth-context';
import { restaurantAPI, orderAPI } from '@/constants/api';

export default function PerformanceScreen() {
    const router = useRouter();
    const { token, logout } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async (isRefresh = false) => {
        if (!token) return;
        if (isRefresh) setRefreshing(true);
        try {
            const restRes = await restaurantAPI.getMyRestaurant(token);
            if (restRes?.success) {
                const res = await orderAPI.getRestaurantOrderStats(token, restRes.data._id);
                if (res.success) {
                    setStats(res.data);
                }
            }
        } catch (error: any) {
            console.error("Performance fetch error:", error);
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

    const countByStatus = stats?.countByStatus || {};
    const totalOrders = stats?.totalOrders || 0;
    const delivered = countByStatus.delivered || 0;
    const cancelled = countByStatus.cancelled || 0;
    const pending = countByStatus.pending || 0;
    const preparing = countByStatus.preparing || 0;
    const delivering = countByStatus.delivering || 0;
    const totalRevenue = stats?.totalRevenue || 0;

    // Rates
    const completionRate = totalOrders > 0 ? ((delivered / totalOrders) * 100).toFixed(1) : '0.0';
    const cancelRate = totalOrders > 0 ? ((cancelled / totalOrders) * 100).toFixed(1) : '0.0';
    const avgOrderValue = delivered > 0 ? Math.round(totalRevenue / delivered) : 0;

    const statusCards = [
        { label: 'Tổng đơn hàng', value: totalOrders, icon: 'receipt-outline', color: '#3B82F6', bg: '#EFF6FF' },
        { label: 'Đã hoàn thành', value: delivered, icon: 'checkmark-circle-outline', color: '#10B981', bg: '#D1FAE5' },
        { label: 'Đang xử lý', value: pending + preparing + delivering, icon: 'time-outline', color: '#F59E0B', bg: '#FEF3C7' },
        { label: 'Đã hủy', value: cancelled, icon: 'close-circle-outline', color: '#EF4444', bg: '#FEE2E2' },
    ];

    const revenueCards = [
        { label: 'Tổng doanh thu', value: `${totalRevenue.toLocaleString()}đ`, icon: 'wallet-outline', color: '#10B981' },
        { label: 'TB/đơn', value: `${avgOrderValue.toLocaleString()}đ`, icon: 'trending-up-outline', color: '#8B5CF6' },
    ];

    const progressData = [
        { label: 'Chờ xác nhận', count: pending, color: '#F59E0B' },
        { label: 'Đang chuẩn bị', count: preparing, color: '#3B82F6' },
        { label: 'Đang giao', count: delivering, color: '#10B981' },
        { label: 'Đã giao', count: delivered, color: '#059669' },
        { label: 'Đã hủy', count: cancelled, color: '#EF4444' },
    ];

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={AppColors.charcoal} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Hiệu quả bán hàng</Text>
            </View>

            <ScrollView
                contentContainerStyle={s.content}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={[AppColors.primary]} />}
            >
                {loading ? (
                    <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 60 }} />
                ) : (
                    <>
                        {/* Completion & Cancel Rate Cards */}
                        <View style={s.rateRow}>
                            <LinearGradient colors={['#10B981', '#059669']} style={s.rateCard}>
                                <Ionicons name="trending-up" size={28} color="#fff" />
                                <Text style={s.rateValue}>{completionRate}%</Text>
                                <Text style={s.rateLabel}>Tỷ lệ hoàn thành</Text>
                            </LinearGradient>
                            <LinearGradient colors={['#EF4444', '#DC2626']} style={s.rateCard}>
                                <Ionicons name="trending-down" size={28} color="#fff" />
                                <Text style={s.rateValue}>{cancelRate}%</Text>
                                <Text style={s.rateLabel}>Tỷ lệ hủy đơn</Text>
                            </LinearGradient>
                        </View>

                        {/* Order Status Grid */}
                        <Text style={s.sectionTitle}>Tổng quan đơn hàng</Text>
                        <View style={s.statusGrid}>
                            {statusCards.map((card, idx) => (
                                <View key={idx} style={[s.statusCard, { backgroundColor: card.bg }]}>
                                    <Ionicons name={card.icon as any} size={24} color={card.color} />
                                    <Text style={[s.statusValue, { color: card.color }]}>{card.value}</Text>
                                    <Text style={s.statusLabel}>{card.label}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Revenue Breakdown */}
                        <Text style={s.sectionTitle}>Doanh thu chi tiết</Text>
                        <View style={s.revenueGrid}>
                            {revenueCards.map((card, idx) => (
                                <View key={idx} style={s.revenueCard}>
                                    <View style={[s.revenueIcon, { backgroundColor: card.color + '15' }]}>
                                        <Ionicons name={card.icon as any} size={20} color={card.color} />
                                    </View>
                                    <Text style={s.revenueValue}>{card.value}</Text>
                                    <Text style={s.revenueLabel}>{card.label}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Status Breakdown */}
                        <Text style={s.sectionTitle}>Phân bổ trạng thái</Text>
                        <View style={s.progressSection}>
                            {progressData.map((item, idx) => {
                                const maxCount = Math.max(...progressData.map(d => d.count), 1);
                                const pct = (item.count / maxCount) * 100;
                                return (
                                    <View key={idx} style={s.progressRow}>
                                        <Text style={s.progressLabel}>{item.label}</Text>
                                        <View style={s.progressBarBg}>
                                            <View style={[s.progressBarFill, { width: `${Math.max(pct, 2)}%`, backgroundColor: item.color }]} />
                                        </View>
                                        <Text style={[s.progressCount, { color: item.color }]}>{item.count}</Text>
                                    </View>
                                );
                            })}
                        </View>

                        <View style={{ height: 40 }} />
                    </>
                )}
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

    // Rate cards
    rateRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    rateCard: {
        flex: 1, borderRadius: 16, padding: 18, alignItems: 'center', gap: 6,
    },
    rateValue: { fontSize: 28, fontWeight: '900', color: '#fff' },
    rateLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

    // Section
    sectionTitle: { fontSize: 16, fontWeight: '700', color: AppColors.charcoal, marginBottom: 12, marginTop: 4 },

    // Status grid
    statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    statusCard: {
        width: '48%' as any, borderRadius: 14, padding: 16, alignItems: 'center', gap: 6,
        flexGrow: 1, flexBasis: '46%',
    },
    statusValue: { fontSize: 24, fontWeight: '800' },
    statusLabel: { fontSize: 11, color: AppColors.gray, fontWeight: '500' },

    // Revenue
    revenueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    revenueCard: {
        backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6,
        flexGrow: 1, flexBasis: '46%',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
            android: { elevation: 1 },
        }),
    },
    revenueIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    revenueValue: { fontSize: 16, fontWeight: '800', color: AppColors.charcoal },
    revenueLabel: { fontSize: 11, color: AppColors.gray, fontWeight: '500' },

    // Progress bars
    progressSection: {
        backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 14,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
            android: { elevation: 1 },
        }),
    },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    progressLabel: { width: 90, fontSize: 12, fontWeight: '600', color: AppColors.charcoal },
    progressBarBg: { flex: 1, height: 10, backgroundColor: '#F3F4F6', borderRadius: 5, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 5 },
    progressCount: { width: 30, fontSize: 13, fontWeight: '800', textAlign: 'right' },
});
