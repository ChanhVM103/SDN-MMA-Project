import React from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/constants/auth-context';
import { useOrder } from '@/constants/order-context';
import { useRouter } from 'expo-router';

export default function OrdersScreen() {
    const { user } = useAuth();
    const { orders } = useOrder();
    const router = useRouter();

    const formatDate = (dateIso: string) => {
        const date = new Date(dateIso);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date
            .getMinutes()
            .toString()
            .padStart(2, '0')}`;
    };

    if (!user && orders.length === 0) {
        return (
            <View style={s.container}>
                <LinearGradient colors={['#FF6B35', '#E55A2B']} style={s.header}>
                    <Text style={s.headerTitle}>Đơn hàng</Text>
                </LinearGradient>
                <View style={s.emptyContainer}>
                    <Text style={{ fontSize: 56, marginBottom: 16 }}>📦</Text>
                    <Text style={s.emptyTitle}>Chưa có đơn hàng</Text>
                    <Text style={s.emptySubtitle}>Đăng nhập để xem lịch sử đơn hàng của bạn</Text>
                    <TouchableOpacity onPress={() => router.push('/sign-in' as any)}>
                        <LinearGradient colors={['#FF6B35', '#E55A2B']} style={s.btn}>
                            <Text style={s.btnText}>Đăng nhập</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (orders.length === 0) {
        return (
            <View style={s.container}>
                <LinearGradient colors={['#FF6B35', '#E55A2B']} style={s.header}>
                    <Text style={s.headerTitle}>Đơn hàng</Text>
                </LinearGradient>
                <View style={s.emptyContainer}>
                    <Text style={{ fontSize: 56, marginBottom: 16 }}>🛒</Text>
                    <Text style={s.emptyTitle}>Chưa có đơn hàng nào</Text>
                    <Text style={s.emptySubtitle}>Hãy đặt món đầu tiên của bạn ngay!</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={s.container}>
            <LinearGradient colors={['#FF6B35', '#E55A2B']} style={s.header}>
                <Text style={s.headerTitle}>Đơn hàng</Text>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.listContent}>
                {orders.map(order => (
                    <View key={order.id} style={s.orderCard}>
                        <View style={s.orderHeaderRow}>
                            <View style={s.thumbBox}>
                                <Text style={s.thumbText}>{order.items[0]?.emoji || '🍽️'}</Text>
                            </View>
                            <View style={s.orderInfo}>
                                <Text style={s.restaurantName} numberOfLines={1}>{order.restaurantName}</Text>
                                <Text style={s.address}>{order.restaurantAddress}</Text>
                                <Text style={s.price}>{order.totalPrice.toLocaleString('vi-VN')} đ ({order.itemCount} món)</Text>
                                <Text style={s.status}>Trạng thái: {order.status}</Text>
                            </View>
                        </View>
                        <Text style={s.timeText}>Đặt lúc: {formatDate(order.createdAt)}</Text>
                    </View>
                ))}
                <View style={{ height: 90 }} />
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppColors.offWhite },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20, paddingHorizontal: Spacing.lg, alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    listContent: { padding: Spacing.lg, gap: 12 },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: BorderRadius.md,
        padding: 12,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
            android: { elevation: 2 },
        }),
    },
    orderHeaderRow: { flexDirection: 'row', gap: 10 },
    thumbBox: {
        width: 62,
        height: 62,
        borderRadius: 10,
        backgroundColor: '#FFF3ED',
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbText: { fontSize: 30 },
    orderInfo: { flex: 1 },
    restaurantName: { fontSize: 15, fontWeight: '700', color: AppColors.charcoal },
    address: { fontSize: 12, color: AppColors.gray, marginTop: 2 },
    price: { fontSize: 14, color: AppColors.charcoal, marginTop: 4, fontWeight: '600' },
    status: { fontSize: 12, color: AppColors.gray, marginTop: 2 },
    timeText: { marginTop: 8, fontSize: 11, color: AppColors.gray },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: AppColors.charcoal, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: AppColors.gray, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    btn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: BorderRadius.md },
    btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
