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
                    <Text style={s.headerTitle}>Hiệu suất Kinh doanh</Text>
                    <TouchableOpacity onPress={() => fetchData(true)} style={s.refreshBtn}>
                        <Ionicons name="refresh" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView
                style={s.content}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={['#FF6B35']} />}
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 60 }} />
                ) : (
                    <>
                        {/* Summary Metrics */}
                        <View style={s.summarySection}>
                            <View style={s.rateRow}>
                                <LinearGradient 
                                    colors={['#10B981', '#059669']} 
                                    style={s.rateCard}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={s.rateIconCircle}>
                                        <Ionicons name="trending-up" size={20} color="#fff" />
                                    </View>
                                    <Text style={s.rateValue}>{completionRate}%</Text>
                                    <Text style={s.rateLabel}>Tỷ lệ hoàn thành</Text>
                                </LinearGradient>
                                <LinearGradient 
                                    colors={['#EF4444', '#DC2626']} 
                                    style={s.rateCard}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={s.rateIconCircle}>
                                        <Ionicons name="trending-down" size={20} color="#fff" />
                                    </View>
                                    <Text style={s.rateValue}>{cancelRate}%</Text>
                                    <Text style={s.rateLabel}>Tỷ lệ hủy đơn</Text>
                                </LinearGradient>
                            </View>
                        </View>

                        {/* Order Status Grid */}
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>Chỉ số đơn hàng</Text>
                        </View>
                        <View style={s.statusGrid}>
                            {statusCards.map((card, idx) => (
                                <View key={idx} style={s.statusCard}>
                                    <View style={[s.statusIconBox, { backgroundColor: card.bg }]}>
                                        <Ionicons name={card.icon as any} size={22} color={card.color} />
                                    </View>
                                    <View>
                                        <Text style={s.statusValueText}>{card.value}</Text>
                                        <Text style={s.statusLabelText}>{card.label}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Revenue Breakdown */}
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>Hiệu quả tài chính</Text>
                        </View>
                        <View style={s.revenueGrid}>
                            {revenueCards.map((card, idx) => (
                                <View key={idx} style={s.revenueCard}>
                                    <View style={[s.revenueIcon, { backgroundColor: card.color + '10' }]}>
                                        <Ionicons name={card.icon as any} size={24} color={card.color} />
                                    </View>
                                    <View style={s.revenueInfo}>
                                        <Text style={[s.revenueValue, { color: card.color }]}>{card.value}</Text>
                                        <Text style={s.revenueLabel}>{card.label}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Status Breakdown Bars */}
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>Luồng vận hành</Text>
                        </View>
                        <View style={s.progressSection}>
                            {progressData.map((item, idx) => {
                                const maxCount = Math.max(...progressData.map(d => d.count), 1);
                                const pct = (item.count / maxCount) * 100;
                                return (
                                    <View key={idx} style={s.progressRow}>
                                        <View style={s.progressInfo}>
                                            <Text style={s.progressLabelText}>{item.label}</Text>
                                            <Text style={[s.progressCount, { color: item.color }]}>{item.count} đơn</Text>
                                        </View>
                                        <View style={s.progressBarBg}>
                                            <View style={[s.progressBarFill, { width: `${Math.max(pct, 2)}%`, backgroundColor: item.color }]} />
                                        </View>
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
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', flex: 1, marginLeft: 15 },
    refreshBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

    content: { flex: 1 },
    summarySection: { padding: 20 },
    rateRow: { flexDirection: 'row', gap: 16 },
    rateCard: {
        flex: 1, borderRadius: 24, padding: 20,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 15 },
            android: { elevation: 4 },
        }),
    },
    rateIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    rateValue: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 4 },
    rateLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '700', textTransform: 'uppercase' },

    sectionHeader: { paddingHorizontal: 20, marginBottom: 15, marginTop: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B' },

    statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginBottom: 25 },
    statusCard: {
        width: '48%' as any, backgroundColor: '#fff', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
            android: { elevation: 1 },
        }),
    },
    statusIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    statusValueText: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
    statusLabelText: { fontSize: 11, color: '#64748B', fontWeight: '700' },

    revenueGrid: { paddingHorizontal: 20, gap: 12, marginBottom: 25 },
    revenueCard: {
        backgroundColor: '#fff', borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
            android: { elevation: 1 },
        }),
    },
    revenueIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    revenueInfo: { flex: 1 },
    revenueValue: { fontSize: 20, fontWeight: '900', marginBottom: 2 },
    revenueLabel: { fontSize: 13, color: '#64748B', fontWeight: '700' },

    progressSection: {
        backgroundColor: '#fff', borderRadius: 24, padding: 20, marginHorizontal: 20, gap: 20,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
            android: { elevation: 2 },
        }),
    },
    progressRow: { gap: 10 },
    progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressLabelText: { fontSize: 14, fontWeight: '800', color: '#475569' },
    progressCount: { fontSize: 13, fontWeight: '900' },
    progressBarBg: { height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 5 },
});
