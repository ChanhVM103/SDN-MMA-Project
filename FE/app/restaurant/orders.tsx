import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/constants/auth-context';
import { orderAPI, restaurantAPI } from '@/constants/api';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const TABS = [
    { id: 'pending', label: 'Chờ xác nhận' },
    { id: 'preparing', label: 'Đang chuẩn bị' },
    { id: 'delivering', label: 'Đang giao' },
    { id: 'delivered', label: 'Đã giao' },
    { id: 'cancelled', label: 'Đã Huỷ' },
];

export default function RestaurantOrders() {
    const router = useRouter();
    const { user, token, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('pending');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);

    const STATUS_MAP: any = {
        pending: { label: 'Chờ xác nhận', color: '#F59E0B' },
        preparing: { label: 'Đang chuẩn bị', color: '#3B82F6' },
        ready_for_pickup: { label: 'Chờ shipper lấy', color: '#6B7280' },
        shipper_accepted: { label: 'Shipper đã nhận đơn', color: '#8B5CF6' },
        delivering: { label: 'Đang giao hàng', color: '#10B981' },
        shipper_delivered: { label: 'Shipper báo đã giao', color: '#F472B6' },
        delivered: { label: 'Đã hoàn thành', color: '#10B981' },
        cancelled: { label: 'Đã hủy', color: '#EF4444' },
    };

    // Cancel Modal State
    const [isCancelModalVisible, setCancelModalVisible] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        const init = async () => {
            if (token) {
                try {
                    const res = await restaurantAPI.getMyRestaurant(token);
                    if (res?.success) {
                        setRestaurantId(res.data?._id);
                    } else {
                        console.warn("Could not find restaurant for this brand user");
                        setRestaurantId(null);
                    }
                } catch (e: any) {
                    if (e.status === 401) {
                        Alert.alert("Phiên làm việc hết hạn", "Vui lòng đăng nhập lại.");
                        logout().then(() => router.replace('/sign-in' as any));
                    }
                }
            }
        };
        init();
    }, [token, user, logout]);

    useEffect(() => {
        if (restaurantId) {
            fetchOrders();
        }
    }, [activeTab, restaurantId]);

    const fetchOrders = async () => {
        if (!restaurantId || !token) return;
        setLoading(true);
        try {
            const res = await orderAPI.getRestaurantOrders(token, restaurantId, { status: activeTab, limit: 50 });
            if (res.success) {
                setOrders(res.data || []);
            }
        } catch (error: any) {
            console.error("Error fetching orders:", error);
            if (error.status === 401) {
                Alert.alert("Phiên làm việc hết hạn", "Vui lòng đăng nhập lại.");
                logout().then(() => router.replace('/sign-in' as any));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        if (!restaurantId || !token) return;
        try {
            const res = await orderAPI.updateRestaurantOrderStatus(token, restaurantId, orderId, newStatus);
            if (res.success) {
                fetchOrders();
            } else {
                Alert.alert('Lỗi', res.message || 'Không thể cập nhật trạng thái');
            }
        } catch (err: any) {
            Alert.alert('Lỗi', err.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleConfirmCancel = async () => {
        if (!cancelReason.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập lý do từ chối');
            return;
        }
        if (!selectedOrderId || !restaurantId || !token) return;

        try {
            const res = await orderAPI.cancelRestaurantOrder(token, restaurantId, selectedOrderId, cancelReason);
            if (res.success) {
                setCancelModalVisible(false);
                setCancelReason('');
                setSelectedOrderId(null);
                fetchOrders();
            } else {
                Alert.alert('Lỗi', res.message || 'Không thể từ chối đơn hàng');
            }
        } catch (err: any) {
            Alert.alert('Lỗi', err.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const promptCancel = (orderId: string) => {
        setSelectedOrderId(orderId);
        setCancelReason('');
        setCancelModalVisible(true);
    };

    return (
        <View style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={AppColors.primary} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Quản Lý Đơn Hàng</Text>
            </View>

            {/* Tabs */}
            <View style={s.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={[s.tabItem, isActive && s.tabItemActive]}
                                onPress={() => setActiveTab(tab.id)}
                            >
                                <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{tab.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Content */}
            <ScrollView style={s.listContainer}>
                {loading ? (
                    <View style={s.centerView}>
                        <ActivityIndicator size="large" color={AppColors.primary} />
                    </View>
                ) : orders.length === 0 ? (
                    <View style={s.centerView}>
                        <Ionicons name="receipt-outline" size={48} color={AppColors.gray} />
                        <Text style={s.emptyText}>Chưa có đơn hàng nào</Text>
                    </View>
                ) : (
                    orders.map((order, idx) => (
                        <View key={order._id || order.id || `res-order-${idx}`} style={s.orderCard}>
                            <View style={s.cardHeader}>
                                <View style={s.userInfo}>
                                    <Ionicons name="person-circle-outline" size={32} color={AppColors.gray} />
                                    <View style={s.userTextGroup}>
                                        <Text style={s.userName}>{order.user?.fullName || 'Khách hàng'}</Text>
                                        <Text style={s.orderTime}>{new Date(order.createdAt).toLocaleString('vi-VN')}</Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={s.orderTotal}>{order.total.toLocaleString()}đ</Text>
                                    <View style={[s.statusBadge, { backgroundColor: STATUS_MAP[order.status]?.color || AppColors.gray }]}>
                                        <Text style={s.statusBadgeText}>{STATUS_MAP[order.status]?.label || order.status}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={s.itemsContainer}>
                                {order.items.map((item: any, itemIdx: number) => (
                                    <View key={item._id || item.id || `item-${idx}-${itemIdx}`} style={s.itemRow}>
                                        <Text style={{ fontSize: 22, marginRight: 8 }}>{item.emoji || '🍽️'}</Text>
                                        <View style={s.itemInfo}>
                                            <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
                                            <Text style={s.itemMeta}>x{item.quantity}</Text>
                                            {!!item.note && (
                                                <Text style={[s.itemAddons, { color: AppColors.primary }]}>+ {item.note}</Text>
                                            )}
                                        </View>
                                        <Text style={s.itemPrice}>{(item.price * item.quantity).toLocaleString()}đ</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Divider */}
                            <View style={s.divider} />

                            {/* Action Buttons based on Status */}
                            <View style={s.cardFooter}>
                                {activeTab === 'pending' && (
                                    <>
                                        <TouchableOpacity style={[s.btn, s.btnOutline]} onPress={() => promptCancel(order._id)}>
                                            <Text style={[s.btnText, s.btnTextOutline]}>Từ chối</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={() => handleUpdateStatus(order._id, 'preparing')}>
                                            <Text style={s.btnTextPrimary}>Xác nhận & Chuẩn bị</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                                {activeTab === 'preparing' && (
                                    <TouchableOpacity style={[s.btn, s.btnPrimary, { flex: 1 }]} onPress={() => handleUpdateStatus(order._id, 'ready_for_pickup')}>
                                        <Text style={s.btnTextPrimary}>Giao cho Shipper</Text>
                                    </TouchableOpacity>
                                )}
                                {activeTab === 'delivering' && (
                                    <Text style={s.infoText}>Shipper đang giao hàng. Chờ khách xác nhận đã nhận...</Text>
                                )}
                                {activeTab === 'delivered' && (
                                    <Text style={[s.infoText, { color: '#10B981', fontWeight: 'bold' }]}>Đã hoàn thành. Doanh thu +{(order.subtotal || order.total).toLocaleString()}đ</Text>
                                )}
                                {activeTab === 'cancelled' && (
                                    <View>
                                        <Text style={[s.infoText, { color: '#EF4444' }]}>Đơn đã huỷ</Text>
                                        {/* Display reason if available in history */}
                                        <Text style={{ fontSize: 12, color: AppColors.gray }}>
                                            Lý do: {order.statusHistory?.find((h: any) => h.status === 'cancelled')?.note || 'Không có lý do'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    ))
                )}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Cancel Reason Modal */}
            <Modal visible={isCancelModalVisible} transparent animationType="fade">
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <Text style={s.modalTitle}>Từ chối đơn hàng</Text>
                        <Text style={s.modalSub}>Vui lòng nhập lý do để báo cho khách hàng biết (Ví dụ: Hết món, Đóng cửa...)</Text>

                        <TextInput
                            style={s.textInput}
                            placeholder="Nhập lý do..."
                            value={cancelReason}
                            onChangeText={setCancelReason}
                            multiline
                            autoFocus
                        />

                        <View style={s.modalActions}>
                            <TouchableOpacity style={s.modalBtnClose} onPress={() => setCancelModalVisible(false)}>
                                <Text style={s.modalBtnTextClose}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.modalBtnSubmit} onPress={handleConfirmCancel}>
                                <Text style={s.modalBtnTextSubmit}>Xác Nhận Xóa</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        paddingTop: 50, paddingBottom: 15, paddingHorizontal: 16,
    },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: AppColors.charcoal },

    tabsContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    tabItem: {
        paddingVertical: 14, paddingHorizontal: 16,
        borderBottomWidth: 2, borderBottomColor: 'transparent',
    },
    tabItemActive: { borderBottomColor: AppColors.primary },
    tabLabel: { fontSize: 14, color: AppColors.gray, fontWeight: '500' },
    tabLabelActive: { color: AppColors.primary, fontWeight: '700' },

    listContainer: { padding: 12 },
    centerView: { padding: 40, alignItems: 'center', justifyContent: 'center' },
    emptyText: { marginTop: 12, color: AppColors.gray, fontSize: 14 },

    orderCard: {
        backgroundColor: '#fff', borderRadius: 8, padding: 16,
        marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    userTextGroup: { justifyContent: 'center' },
    userName: { fontSize: 15, fontWeight: 'bold', color: AppColors.charcoal },
    orderTime: { fontSize: 12, color: AppColors.gray, marginTop: 2 },
    orderTotal: { fontSize: 16, fontWeight: 'bold', color: AppColors.primary },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
    statusBadgeText: { fontSize: 10, color: '#fff', fontWeight: 'bold' },

    itemsContainer: { backgroundColor: '#F9FAFB', borderRadius: 6, padding: 10 },
    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    itemImage: { width: 40, height: 40, borderRadius: 4, marginRight: 10 },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 14, color: AppColors.charcoal, fontWeight: '500' },
    itemMeta: { fontSize: 12, color: AppColors.gray, marginTop: 2 },
    itemAddons: { fontSize: 11, color: AppColors.primary, marginTop: 2 },
    itemPrice: { fontSize: 14, fontWeight: '500', color: AppColors.charcoal },

    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
    cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },

    btn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
    btnText: { color: AppColors.charcoal, fontWeight: 'bold', fontSize: 13 },
    btnPrimary: { backgroundColor: AppColors.primary },
    btnTextPrimary: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    btnOutline: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB' },
    btnTextOutline: { color: AppColors.charcoal, fontWeight: 'bold', fontSize: 13 },

    infoText: { fontSize: 13, color: AppColors.gray, fontStyle: 'italic', textAlign: 'center', flex: 1, paddingVertical: 8 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 8, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: AppColors.charcoal },
    modalSub: { fontSize: 13, color: AppColors.gray, marginBottom: 16 },
    textInput: {
        borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 4,
        padding: 10, minHeight: 80, textAlignVertical: 'top', fontSize: 14,
        marginBottom: 20, backgroundColor: '#F9FAFB'
    },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    modalBtnClose: { paddingVertical: 10, paddingHorizontal: 16 },
    modalBtnTextClose: { color: AppColors.gray, fontWeight: '600' },
    modalBtnSubmit: { backgroundColor: '#EF4444', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 4 },
    modalBtnTextSubmit: { color: '#fff', fontWeight: 'bold' },
});
