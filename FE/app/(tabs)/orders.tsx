import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/constants/auth-context';
import { useOrder } from '@/constants/order-context';
import { useRouter } from 'expo-router';
import { apiRequest, orderAPI } from '@/constants/api';
import { useFocusEffect } from '@react-navigation/native';

export default function OrdersScreen() {
    const { user, token, logout } = useAuth();
    const { orders, markAsReviewed } = useOrder();
    const router = useRouter();

    const STATUS_MAP: any = {
        pending: { label: 'Chờ xác nhận', color: '#F59E0B' },
        preparing: { label: 'Đang chuẩn bị', color: '#3B82F6' },
        delivering: { label: 'Đang giao hàng', color: '#10B981' },
        delivered: { label: 'Đã giao', color: '#10B981' },
        cancelled: { label: 'Đã hủy', color: '#EF4444' },
    };

    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dbOrders, setDbOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        if (!token) {
            setDbOrders([]);
            setLoading(false);
            return;
        }
        try {
            const res = await orderAPI.getMyOrders(token, { limit: 50 });
            if (res.success) {
                setDbOrders(res.data);
            }
        } catch (e: any) {
            console.error("Failed to fetch my orders:", e);
            if (e.status === 401) {
                Alert.alert("Phiên đăng nhập hết hạn", "Vui lòng đăng nhập lại.", [
                    { text: "OK", onPress: () => logout().then(() => router.replace('/sign-in' as any)) }
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [token])
    );

    const displayOrders = token ? dbOrders : orders;

    const openReviewModal = (order: any) => {
        if (!user) {
            Alert.alert("Lỗi", "Vui lòng đăng nhập để đánh giá.");
            return;
        }
        setSelectedOrder(order);
        setRating(5);
        setComment('');
        setReviewModalVisible(true);
    };

    const submitReview = async () => {
        if (!selectedOrder || !user || !token) return;
        setIsSubmitting(true);
        try {
            const orderId = selectedOrder._id || selectedOrder.id;
            const restaurantId = selectedOrder.restaurant?._id || selectedOrder.restaurant || selectedOrder.restaurantId;
            await apiRequest('/reviews', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    restaurantId,
                    orderId,
                    rating,
                    comment
                })
            });
            Alert.alert('Thành công', 'Cảm ơn bạn đã đánh giá!');
            setReviewModalVisible(false);
            fetchOrders(); // Refresh to update isReviewed status
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi gửi đánh giá.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmReceived = async (orderId: string) => {
        if (!token) return;

        const performConfirm = async () => {
            try {
                const res = await orderAPI.confirmOrderReceived(token, orderId);
                if (res.success) {
                    await fetchOrders(); // Refresh orders

                    // Prompt rating immediately after confirming delivery
                    const confirmedOrder = res.data;
                    if (confirmedOrder) {
                        if (Platform.OS === 'web') {
                            if (window.confirm("Đã xác nhận thành công! Bạn có muốn đánh giá ngay không?")) {
                                setSelectedOrder(confirmedOrder);
                                setRating(5);
                                setComment('');
                                setReviewModalVisible(true);
                            }
                        } else {
                            Alert.alert(
                                "Xác nhận thành công!",
                                "Bạn có muốn đánh giá ngay không? Bạn cũng có thể đánh giá sau.",
                                [
                                    { text: "Để sau", style: "cancel" },
                                    {
                                        text: "Đánh giá ngay",
                                        onPress: () => {
                                            setSelectedOrder(confirmedOrder);
                                            setRating(5);
                                            setComment('');
                                            setReviewModalVisible(true);
                                        }
                                    }
                                ]
                            );
                        }
                    }
                } else {
                    const msg = res.message || "Không thể xác nhận";
                    if (Platform.OS === 'web') window.alert(msg);
                    else Alert.alert("Lỗi", msg);
                }
            } catch (error: any) {
                const msg = error.message || "Có lỗi xảy ra";
                if (Platform.OS === 'web') window.alert(msg);
                else Alert.alert("Lỗi", msg);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm("Bạn đã nhận được đơn hàng này?")) {
                await performConfirm();
            }
        } else {
            Alert.alert(
                "Xác nhận",
                "Bạn đã nhận được đơn hàng này?",
                [
                    { text: "Hủy", style: "cancel" },
                    { text: "Đã nhận", onPress: performConfirm }
                ]
            );
        }
    };

    const formatDate = (dateIso: string) => {
        const date = new Date(dateIso);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date
                .getMinutes()
                .toString()
                .padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <View style={s.container}>
                <LinearGradient colors={['#FF6B35', '#E55A2B']} style={s.header}>
                    <Text style={s.headerTitle}>Đơn hàng</Text>
                </LinearGradient>
                <View style={[s.emptyContainer, { justifyContent: 'center' }]}>
                    <ActivityIndicator size="large" color={AppColors.primary} />
                </View>
            </View>
        );
    }

    if (!user && displayOrders.length === 0) {
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

    if (displayOrders.length === 0) {
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

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.listContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchOrders} colors={[AppColors.primary]} />
                }
            >
                {displayOrders.map((order, idx) => (
                    <View key={order._id || order.id || `order-${idx}`} style={s.orderCard}>
                        <View style={s.orderHeaderRow}>
                            <View style={s.thumbBox}>
                                <Text style={s.thumbText}>{order.items?.[0]?.emoji || '🍽️'}</Text>
                            </View>
                            <View style={s.orderInfo}>
                                <Text style={s.restaurantName} numberOfLines={1}>{order.restaurantName}</Text>
                                <Text style={s.address}>{order.restaurant?.address || order.restaurantAddress || order.deliveryAddress}</Text>
                                <Text style={s.price}>{(order.totalPrice || order.total || 0).toLocaleString('vi-VN')} đ ({order.itemCount || order.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0} món)</Text>
                                <Text style={[s.status, { color: STATUS_MAP[order.status]?.color || AppColors.gray }]}>
                                    Trạng thái: {STATUS_MAP[order.status]?.label || order.status}
                                </Text>
                            </View>
                        </View>
                        <Text style={s.timeText}>Đặt lúc: {formatDate(order.createdAt)}</Text>

                        {/* Item details */}
                        {order.items && order.items.length > 0 && (
                            <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8 }}>
                                {order.items.map((item: any, itemIdx: number) => (
                                    <View key={item._id || `item-${idx}-${itemIdx}`} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 8 }}>
                                        <Text style={{ fontSize: 18 }}>{item.emoji || '🍽️'}</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 12, fontWeight: '600', color: AppColors.charcoal }}>{item.quantity}x {item.name}</Text>
                                            {!!item.note && (
                                                <Text style={{ fontSize: 11, color: AppColors.primary }}>+ {item.note}</Text>
                                            )}
                                        </View>
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: AppColors.primary }}>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {order.status === 'delivering' && (
                            <TouchableOpacity
                                onPress={() => handleConfirmReceived(order._id || order.id)}
                                style={[s.reviewBtn, { backgroundColor: '#10B981' }]}
                            >
                                <Text style={s.reviewBtnText}>Đã nhận được hàng</Text>
                            </TouchableOpacity>
                        )}

                        {!order.isReviewed && (order.status === 'delivered') && (
                            <TouchableOpacity onPress={() => openReviewModal(order)} style={s.reviewBtn}>
                                <Text style={s.reviewBtnText}>⭐ Đánh giá món ăn</Text>
                            </TouchableOpacity>
                        )}
                        {order.isReviewed && (
                            <View style={s.reviewedBox}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={s.reviewedText}>Đã đánh giá</Text>
                            </View>
                        )}
                    </View>
                ))}
                <View style={{ height: 90 }} />
            </ScrollView>
            {/* Modal Đánh giá */}
            <Modal visible={reviewModalVisible} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Đánh giá đơn hàng</Text>
                            <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                                <Ionicons name="close" size={24} color={AppColors.gray} />
                            </TouchableOpacity>
                        </View>
                        <Text style={s.modalSubtitle}>{selectedOrder?.restaurantName}</Text>

                        {/* Show order items */}
                        {selectedOrder?.items && selectedOrder.items.length > 0 && (
                            <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10, marginBottom: 16 }}>
                                {selectedOrder.items.map((item: any, idx: number) => (
                                    <Text key={idx} style={{ fontSize: 13, color: AppColors.charcoal, marginBottom: 2 }}>
                                        {item.emoji || '🍽️'} {item.name} x{item.quantity}
                                    </Text>
                                ))}
                            </View>
                        )}

                        <View style={s.ratingRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                    <Ionicons
                                        name={star <= rating ? "star" : "star-outline"}
                                        size={36}
                                        color="#FFB627"
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={s.commentInput}
                            placeholder="Nhập nhận xét của bạn..."
                            multiline
                            numberOfLines={4}
                            value={comment}
                            onChangeText={setComment}
                        />

                        <TouchableOpacity style={s.submitReviewBtn} onPress={submitReview} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={s.submitReviewText}>Gửi Đánh Giá</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
    image: { width: '100%', height: '100%' },
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
    reviewBtn: { marginTop: 12, backgroundColor: AppColors.primary, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
    reviewBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    reviewedBox: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#D1FAE5', paddingVertical: 8, borderRadius: 8, gap: 4 },
    reviewedText: { color: '#065F46', fontWeight: '600', fontSize: 13 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: AppColors.charcoal },
    modalSubtitle: { fontSize: 14, color: AppColors.gray, marginBottom: 20 },
    ratingRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
    commentInput: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, height: 100, textAlignVertical: 'top', color: AppColors.charcoal, marginBottom: 24 },
    submitReviewBtn: { backgroundColor: AppColors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    submitReviewText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
