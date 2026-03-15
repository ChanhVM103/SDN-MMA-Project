import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/constants/auth-context';
import { orderAPI, restaurantAPI } from '@/constants/api';
import { LinearGradient } from 'expo-linear-gradient';
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
    const params = useLocalSearchParams<{ tab: string }>();
    const { user, token, logout } = useAuth();
    const [activeTab, setActiveTab] = useState(params.tab || 'pending');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);

    // Deep link support: update tab if params change while component is mounted
    useEffect(() => {
        if (params.tab && TABS.some(t => t.id === params.tab)) {
            setActiveTab(params.tab);
        }
    }, [params.tab]);

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
                    <Text style={s.headerTitle}>Quản Lý Đơn Hàng</Text>
                    <TouchableOpacity onPress={fetchOrders} style={s.refreshBtn}>
                        <Ionicons name="refresh" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Styled Tabs */}
                <View style={s.tabsWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsContent}>
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[s.tabItem, isActive && s.tabItemActive]}
                                    onPress={() => setActiveTab(tab.id)}
                                >
                                    <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{tab.label}</Text>
                                    {isActive && <View style={s.activeDot} />}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </LinearGradient>

            {/* Content */}
            {loading ? (
                <View style={s.centerView}>
                    <ActivityIndicator size="large" color="#FF6B35" />
                    <Text style={s.loadingText}>Đang tải đơn hàng...</Text>
                </View>
            ) : (
                <ScrollView 
                    style={s.listContainer} 
                    contentContainerStyle={{ paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                >
                    {orders.length === 0 ? (
                        <View style={s.emptyView}>
                            <View style={s.emptyIconCircle}>
                                <Ionicons name="receipt-outline" size={60} color="#E2E8F0" />
                            </View>
                            <Text style={s.emptyTitle}>Chưa có đơn hàng nào</Text>
                            <Text style={s.emptySub}>Các đơn hàng mới sẽ xuất hiện tại đây</Text>
                        </View>
                    ) : (
                        orders.map((order, idx) => (
                            <View key={order._id || order.id || `res-order-${idx}`} style={s.orderCard}>
                                <View style={s.cardHeader}>
                                    <View style={s.customerInfo}>
                                        <View style={s.avatarPlaceholder}>
                                            <Text style={s.avatarInitial}>
                                                {(order.user?.fullName || 'K')[0].toUpperCase()}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text style={s.customerName}>{order.user?.fullName || 'Khách hàng'}</Text>
                                            <Text style={s.orderTime}>
                                                <Ionicons name="time-outline" size={11} /> {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[s.statusBadge, { backgroundColor: STATUS_MAP[order.status]?.color + '15' }]}>
                                        <Text style={[s.statusBadgeText, { color: STATUS_MAP[order.status]?.color }]}>
                                            {STATUS_MAP[order.status]?.label || order.status}
                                        </Text>
                                    </View>
                                </View>

                                <View style={s.itemsPreview}>
                                    {order.items.map((item: any, itemIdx: number) => (
                                        <View key={item._id || item.id || `item-${idx}-${itemIdx}`} style={s.itemRow}>
                                            <Text style={s.itemEmoji}>{item.emoji || '🍽️'}</Text>
                                            <View style={s.itemMain}>
                                                <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
                                                {!!item.note && (
                                                    <Text style={s.itemNote} numberOfLines={1}>+ {item.note}</Text>
                                                )}
                                            </View>
                                            <View style={s.itemQtyPrice}>
                                                <Text style={s.itemQty}>x{item.quantity}</Text>
                                                <Text style={s.itemPrice}>{(item.price * item.quantity).toLocaleString()}đ</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                <View style={s.cardFooter}>
                                    <View style={s.totalContainer}>
                                        <Text style={s.totalLabel}>Tổng thanh toán</Text>
                                        <Text style={s.totalValue}>{order.total.toLocaleString()}đ</Text>
                                    </View>
                                    
                                    <View style={s.actionRow}>
                                        {activeTab === 'pending' && (
                                            <>
                                                <TouchableOpacity style={s.declineBtn} onPress={() => promptCancel(order._id)}>
                                                    <Text style={s.declineBtnText}>Từ chối</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={s.acceptBtn} onPress={() => handleUpdateStatus(order._id, 'preparing')}>
                                                    <Text style={s.acceptBtnText}>Chấp nhận đơn</Text>
                                                </TouchableOpacity>
                                            </>
                                        )}
                                        {activeTab === 'preparing' && (
                                            <TouchableOpacity style={s.readyBtn} onPress={() => handleUpdateStatus(order._id, 'ready_for_pickup')}>
                                                <LinearGradient colors={['#10B981', '#059669']} style={s.readyGradient}>
                                                    <Ionicons name="bicycle" size={18} color="#fff" />
                                                    <Text style={s.readyBtnText}>Giao cho Shipper</Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        )}
                                        {activeTab === 'delivering' && (
                                            <View style={s.deliveringInfo}>
                                                <ActivityIndicator size="small" color="#3B82F6" style={{ marginRight: 8 }} />
                                                <Text style={s.deliveringText}>Shipper đang trên đường giao...</Text>
                                            </View>
                                        )}
                                        {activeTab === 'delivered' && (
                                            order.status === 'shipper_delivered' ? (
                                                <View style={[s.deliveringInfo, { backgroundColor: '#FDF2F8' }]}>
                                                    <ActivityIndicator size="small" color="#F472B6" style={{ marginRight: 8 }} />
                                                    <Text style={[s.deliveringText, { color: '#F472B6' }]}>Đang chờ khách xác nhận...</Text>
                                                </View>
                                            ) : (
                                                <View style={s.completedInfo}>
                                                    <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginRight: 4 }} />
                                                    <Text style={s.completedText}>Hoàn thành • +{(order.subtotal || order.total).toLocaleString()}đ</Text>
                                                </View>
                                            )
                                        )}
                                        {activeTab === 'cancelled' && (
                                            <View style={s.cancelledInfo}>
                                                <Ionicons name="close-circle" size={18} color="#EF4444" style={{ marginRight: 4 }} />
                                                <Text style={s.cancelledText}>Đã hủy: {order.statusHistory?.find((h: any) => h.status === 'cancelled')?.note || 'Không có lý do'}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}

            {/* Cancel Reason Modal */}
            <Modal visible={isCancelModalVisible} transparent animationType="fade">
                <View style={s.modalOverlay}>
                    <View style={s.modalContainer}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Từ chối đơn hàng</Text>
                            <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                        <Text style={s.modalSubTitle}>Vui lòng chọn hoặc nhập lý do từ chối để thông báo cho khách hàng.</Text>
                        
                        <View style={s.reasonPresets}>
                            {['Cửa hàng đã đóng cửa', 'Hết món rồi ạ', 'Quá xa không giao được'].map(r => (
                                <TouchableOpacity key={r} style={s.reasonChip} onPress={() => setCancelReason(r)}>
                                    <Text style={[s.reasonChipText, cancelReason === r && s.reasonChipTextActive]}>{r}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={s.textInput}
                            placeholder="Hoặc nhập lý do khác..."
                            value={cancelReason}
                            onChangeText={setCancelReason}
                            multiline
                            numberOfLines={3}
                        />

                        <TouchableOpacity style={s.confirmDeclineBtn} onPress={handleConfirmCancel}>
                            <Text style={s.confirmDeclineBtnText}>Xác nhận từ chối</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingBottom: 15,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', flex: 1, marginLeft: 15 },
    refreshBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },

    tabsWrapper: {
        marginBottom: 10,
    },
    tabsContent: {
        paddingHorizontal: 20,
        gap: 25,
        height: 50,
        alignItems: 'center',
    },
    tabItem: {
        paddingVertical: 8,
        position: 'relative',
    },
    tabItemActive: {},
    tabLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
    tabLabelActive: { fontSize: 15, fontWeight: '800', color: '#fff' },
    activeDot: {
        position: 'absolute', bottom: -5, left: '40%',
        width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff',
    },

    listContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
    centerView: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: '#64748B', fontSize: 14, fontWeight: '500' },
    
    emptyView: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
    emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    emptySub: { fontSize: 14, color: '#94A3B8', marginTop: 8 },

    orderCard: {
        backgroundColor: '#fff', borderRadius: 20, marginBottom: 16,
        padding: 16,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
            android: { elevation: 3 },
        }),
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    customerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF6B3515', justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { fontSize: 18, fontWeight: '800', color: '#FF6B35' },
    customerName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    orderTime: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '500' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusBadgeText: { fontSize: 11, fontWeight: '800' },

    itemsPreview: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 12, marginBottom: 15 },
    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    itemEmoji: { fontSize: 20, marginRight: 10 },
    itemMain: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: '700', color: '#334155' },
    itemNote: { fontSize: 11, color: '#FF6B35', fontWeight: '600', marginTop: 1 },
    itemQtyPrice: { alignItems: 'flex-end' },
    itemQty: { fontSize: 12, color: '#94A3B8', fontWeight: '700' },
    itemPrice: { fontSize: 13, fontWeight: '800', color: '#1E293B' },

    cardFooter: {},
    totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 4 },
    totalLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    totalValue: { fontSize: 18, fontWeight: '900', color: '#FF6B35' },

    actionRow: { flexDirection: 'row', gap: 10 },
    declineBtn: { flex: 1, height: 46, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    declineBtnText: { color: '#64748B', fontWeight: '800', fontSize: 14 },
    acceptBtn: { flex: 2, height: 46, borderRadius: 14, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center' },
    acceptBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
    
    readyBtn: { flex: 1, height: 48, borderRadius: 16, overflow: 'hidden' },
    readyGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    readyBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },

    deliveringInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, backgroundColor: '#EFF6FF', borderRadius: 12 },
    deliveringText: { color: '#3B82F6', fontWeight: '700', fontSize: 13 },
    completedInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, backgroundColor: '#ECFDF5', borderRadius: 12 },
    completedText: { color: '#10B981', fontWeight: '700', fontSize: 13 },
    cancelledInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, backgroundColor: '#FEF2F2', borderRadius: 12 },
    cancelledText: { color: '#EF4444', fontWeight: '700', fontSize: 13, textAlign: 'center' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '90%', backgroundColor: '#fff', borderRadius: 24, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
    modalSubTitle: { fontSize: 14, color: '#64748B', marginBottom: 20, lineHeight: 20 },
    reasonPresets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
    reasonChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
    reasonChipText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    reasonChipTextActive: { color: '#FF6B35' },
    textInput: {
        backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16,
        padding: 15, fontSize: 14, color: '#1E293B', marginBottom: 25,
        textAlignVertical: 'top', minHeight: 80,
    },
    confirmDeclineBtn: { height: 50, borderRadius: 16, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' },
    confirmDeclineBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
