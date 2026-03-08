import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/constants/auth-context';
import { useOrder } from '@/constants/order-context';
import { useRouter } from 'expo-router';
import { apiRequest } from '@/constants/api';

export default function OrdersScreen() {
    const { user, token } = useAuth();
    const { orders, markAsReviewed } = useOrder();
    const router = useRouter();

    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            await apiRequest('/reviews', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    restaurantId: selectedOrder.restaurantId,
                    orderId: selectedOrder.id,
                    rating,
                    comment
                })
            });
            Alert.alert('Thành công', 'Cảm ơn bạn đã đánh giá!');
            markAsReviewed(selectedOrder.id);
            setReviewModalVisible(false);
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi gửi đánh giá.');
        } finally {
            setIsSubmitting(false);
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
                        {!order.hasReviewed && order.restaurantId && (
                            <TouchableOpacity onPress={() => openReviewModal(order)} style={s.reviewBtn}>
                                <Text style={s.reviewBtnText}>Đánh giá</Text>
                            </TouchableOpacity>
                        )}
                        {order.hasReviewed && (
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
                            <Text style={s.modalTitle}>Đánh giá nhà hàng</Text>
                            <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                                <Ionicons name="close" size={24} color={AppColors.gray} />
                            </TouchableOpacity>
                        </View>
                        <Text style={s.modalSubtitle}>{selectedOrder?.restaurantName}</Text>
                        
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
