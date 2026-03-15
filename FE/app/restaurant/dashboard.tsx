import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions, Alert, Modal } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/constants/auth-context';
import { orderAPI, restaurantAPI, API_BASE_URL } from '@/constants/api';
import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');



const menuGrid = [
    { icon: 'cube-outline', label: 'Sản phẩm của tôi', color: '#E85D04', route: '/restaurant/products' },
    { icon: 'pricetag-outline', label: 'Khuyến mãi', color: '#FF9800', route: '/restaurant/promotions' },
    { icon: 'wallet-outline', label: 'Tài chính', color: '#F4A261', route: '/restaurant/finance' },
    { icon: 'bar-chart-outline', label: 'Hiệu quả bán hàng', color: '#E63946', route: '/restaurant/performance' },
];

export default function RestaurantDashboard() {
    const router = useRouter();
    const { user, token, logout } = useAuth();
    const isBrand = user?.role === 'brand';
    const [stats, setStats] = React.useState<any>(null);
    const [restaurant, setRestaurant] = React.useState<any>(null);
    const [restaurantId, setRestaurantId] = React.useState<string | null>(null);
    const [isNotifVisible, setIsNotifVisible] = React.useState(false);

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm('Bạn có chắc muốn đăng xuất?');
            if (confirmed) {
                logout().then(() => router.replace('/sign-in' as any));
            }
        } else {
            Alert.alert(
                'Đăng xuất',
                'Bạn có chắc muốn đăng xuất?',
                [
                    { text: 'Hủy', style: 'cancel' },
                    {
                        text: 'Đăng xuất',
                        style: 'destructive',
                        onPress: async () => {
                            await logout();
                            router.replace('/sign-in' as any);
                        },
                    },
                ]
            );
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            const fetchStats = async () => {
                if (token) {
                    try {
                        let restId = restaurantId;
                        if (!restId) {
                            try {
                                const restRes = await restaurantAPI.getMyRestaurant(token);
                                if (restRes?.success) {
                                    setRestaurant(restRes.data);
                                    restId = restRes.data._id;
                                    setRestaurantId(restId);
                                }
                            } catch (e: any) {
                                if (e.status === 401) {
                                    Alert.alert("Phiên làm việc hết hạn", "Vui lòng đăng nhập lại.");
                                    logout().then(() => router.replace('/sign-in' as any));
                                    return;
                                }
                                throw e;
                            }
                        }

                        if (restId) {
                            const res = await orderAPI.getRestaurantOrderStats(token, restId);
                            if (res.success) {
                                setStats(res.data);
                            }
                        }
                    } catch (error: any) {
                        console.error("Failed to fetch dashboard stats:", error);
                        if (error.status === 401) {
                            Alert.alert("Phiên làm việc hết hạn", "Vui lòng đăng nhập lại.");
                            logout().then(() => router.replace('/sign-in' as any));
                        }
                    }
                }
            };
            fetchStats();
        }, [token, restaurantId, logout])
    );

    const resolveShopImage = (image: string) => {
        if (!image || typeof image !== 'string') return '';
        if (image.startsWith('http') || image.startsWith('data:image')) return image;
        const base = API_BASE_URL.replace(/\/api$/, '');
        return image.startsWith('/') ? `${base}${image}` : `${base}/${image}`;
    };

    const avatarUri = resolveShopImage(restaurant?.image);

    // Build notifications from stats
    const notifications = React.useMemo(() => {
        const list = [];
        // 1. New Orders (Pending)
        if (stats?.countByStatus?.pending > 0) {
            list.push({
                id: 'notif-pending',
                title: 'Đơn hàng mới',
                message: `Bạn đang có ${stats.countByStatus.pending} đơn hàng đang chờ xác nhận.`,
                icon: 'time',
                color: '#F59E0B',
                tab: 'pending'
            });
        }
        // 2. Preparing Orders
        if (stats?.countByStatus?.preparing > 0) {
            list.push({
                id: 'notif-preparing',
                title: 'Đang chuẩn bị',
                message: `Có ${stats.countByStatus.preparing} đơn hàng đang được chế biến.`,
                icon: 'restaurant',
                color: '#3B82F6',
                tab: 'preparing'
            });
        }
        // 3. Delivering Orders
        if (stats?.countByStatus?.delivering > 0) {
            list.push({
                id: 'notif-delivering',
                title: 'Đang giao hàng',
                message: `${stats.countByStatus.delivering} đơn hàng đang trên đường tới khách hàng.`,
                icon: 'bicycle',
                color: '#10B981',
                tab: 'delivering'
            });
        }
        // 4. Shipper Delivered (Waiting for customer to confirm)
        if (stats?.countByStatus?.shipper_delivered > 0) {
            list.push({
                id: 'notif-shipper-delivered',
                title: 'Đã giao tới khách',
                message: `${stats.countByStatus.shipper_delivered} đơn shipper báo đã giao xong. Đang chờ khách hàng xác nhận nhận đơn.`,
                icon: 'checkmark-circle',
                color: '#F472B6',
                tab: 'delivered'
            });
        }
        return list;
    }, [stats]);

    return (
        <View style={s.container}>
            <LinearGradient
                colors={['#FF6B35', '#E55A2B']}
                style={s.topHero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={s.header}>
                    {!isBrand && (
                        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                    )}
                    <Text style={s.headerTitle}>Shop của tôi</Text>
                    <View style={s.headerIcons}>
                        <TouchableOpacity 
                            style={s.headerIconButton} 
                            onPress={() => router.push('/restaurant/edit-shop' as any)}
                        >
                            <Ionicons name="settings-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={s.headerIconButton} 
                            onPress={handleLogout}
                        >
                            <Ionicons name="log-out-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={s.headerIconButton}
                            onPress={() => setIsNotifVisible(true)}
                        >
                            <Ionicons name="notifications-outline" size={22} color="#fff" />
                            {notifications.length > 0 && (
                                <View style={s.badge}>
                                    <Text style={s.badgeText}>{notifications.length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Refined Shop Info - Now clickable to Edit Shop */}
                <TouchableOpacity 
                    style={s.shopHeroContent} 
                    activeOpacity={0.9}
                    onPress={() => router.push('/restaurant/edit-shop' as any)}
                >
                    <View style={s.shopAvatarWrapper}>
                        {avatarUri ? (
                            <ExpoImage source={{ uri: avatarUri }} style={s.shopAvatar} contentFit="cover" />
                        ) : (
                            <View style={[s.shopAvatar, { backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }]}>
                                <Ionicons name="storefront" size={30} color="#fff" />
                            </View>
                        )}
                        <View style={s.statusDotBorder}>
                            <View style={[s.statusDot, { backgroundColor: restaurant?.isOpen ? '#10B981' : '#EF4444' }]} />
                        </View>
                    </View>
                    <View style={s.shopHeroText}>
                        <Text style={s.shopNameText}>{restaurant?.name || user?.fullName || 'Shop của tôi'}</Text>
                        <View style={s.shopStatusRow}>
                            <Text style={s.shopStatusText}>
                                {restaurant?.isOpen ? '● Đang mở cửa' : '○ Đang đóng cửa'}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 100 }}
                style={s.scrollView}
            >
                {/* Revenue Premium Card */}
                <View style={[s.premiumCard, s.revenueCard]}>
                    <View style={s.revenueHeader}>
                        <Text style={s.revenueLabel}>Tổng doanh thu đồ ăn</Text>
                        <Ionicons name="trending-up" size={20} color="#10B981" />
                    </View>
                    <Text style={s.revenueAmount}>{(stats?.totalRevenue || 0).toLocaleString()} <Text style={s.currencyText}>VNĐ</Text></Text>
                    <View style={s.revenueFooter}>
                        <Text style={s.revenueSubtext}>Cập nhật lần cuối: Vừa xong</Text>
                    </View>
                </View>

                {/* Orders Overview */}
                <View style={s.sectionHeaderContainer}>
                    <Text style={s.sectionLabel}>Trạng thái đơn hàng</Text>
                    <TouchableOpacity onPress={() => router.push('/restaurant/orders')}>
                        <Text style={s.viewAllLink}>Tất cả ({stats?.totalOrders || 0})</Text>
                    </TouchableOpacity>
                </View>

                <View style={s.orderStatsGrid}>
                    <TouchableOpacity 
                        style={s.orderStatBox} 
                        onPress={() => router.push({ pathname: '/restaurant/orders', params: { tab: 'pending' } })}
                    >
                        <View style={[s.orderIconCircle, { backgroundColor: '#FEF3C7' }]}>
                            <Ionicons name="time" size={20} color="#D97706" />
                        </View>
                        <Text style={s.orderStatLabel}>Chờ xác nhận</Text>
                        <Text style={[s.orderStatCount, { color: '#D97706' }]}>{stats?.countByStatus?.pending || 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={s.orderStatBox} 
                        onPress={() => router.push({ pathname: '/restaurant/orders', params: { tab: 'preparing' } })}
                    >
                        <View style={[s.orderIconCircle, { backgroundColor: '#DBEAFE' }]}>
                            <Ionicons name="restaurant" size={20} color="#2563EB" />
                        </View>
                        <Text style={s.orderStatLabel}>Đang chuẩn bị</Text>
                        <Text style={[s.orderStatCount, { color: '#2563EB' }]}>{stats?.countByStatus?.preparing || 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={s.orderStatBox} 
                        onPress={() => router.push({ pathname: '/restaurant/orders', params: { tab: 'delivering' } })}
                    >
                        <View style={[s.orderIconCircle, { backgroundColor: '#D1FAE5' }]}>
                            <Ionicons name="bicycle" size={20} color="#059669" />
                        </View>
                        <Text style={s.orderStatLabel}>Đang giao</Text>
                        <Text style={[s.orderStatCount, { color: '#059669' }]}>{stats?.countByStatus?.delivering || 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={s.orderStatBox} 
                        onPress={() => router.push({ pathname: '/restaurant/orders', params: { tab: 'cancelled' } })}
                    >
                        <View style={[s.orderIconCircle, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="close-circle" size={20} color="#DC2626" />
                        </View>
                        <Text style={s.orderStatLabel}>Đã hủy</Text>
                        <Text style={[s.orderStatCount, { color: '#DC2626' }]}>{stats?.countByStatus?.cancelled || 0}</Text>
                    </TouchableOpacity>
                </View>

                {/* Management Grid */}
                <View style={s.sectionHeaderContainer}>
                    <Text style={s.sectionLabel}>Công cụ quản lý</Text>
                </View>
                
                <View style={s.menuGrid}>
                    {menuGrid.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            activeOpacity={0.8}
                            style={s.menuItemCard}
                            onPress={() => item.route && router.push(item.route as any)}
                        >
                            <View style={[s.menuItemIcon, { backgroundColor: item.color + '15' }]}>
                                <Ionicons name={item.icon as any} size={24} color={item.color} />
                            </View>
                            <Text style={s.menuItemLabel}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Notification Modal */}
            <Modal visible={isNotifVisible} transparent animationType="slide">
                <View style={s.modalOverlay}>
                    <View style={s.notifModalContainer}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Thông báo Orders</Text>
                            <TouchableOpacity onPress={() => setIsNotifVisible(false)} style={s.closeModalBtn}>
                                <Ionicons name="close" size={24} color="#1E293B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={s.notifList} showsVerticalScrollIndicator={false}>
                            {notifications.length === 0 ? (
                                <View style={s.emptyNotifView}>
                                    <View style={s.emptyNotifIcon}>
                                        <Ionicons name="notifications-off-outline" size={50} color="#CBD5E1" />
                                    </View>
                                    <Text style={s.emptyNotifText}>Hết thông báo quan trọng rồi!</Text>
                                    <Text style={s.emptyNotifSub}>Các đơn hàng mới cần xử lý sẽ hiện ở đây.</Text>
                                </View>
                            ) : (
                                notifications.map((notif) => (
                                    <TouchableOpacity 
                                        key={notif.id} 
                                        style={s.notifItem}
                                        onPress={() => {
                                            setIsNotifVisible(false);
                                            router.push({ pathname: '/restaurant/orders', params: { tab: notif.tab } });
                                        }}
                                    >
                                        <View style={[s.notifIconBox, { backgroundColor: notif.color + '15' }]}>
                                            <Ionicons name={notif.icon as any} size={22} color={notif.color} />
                                        </View>
                                        <View style={s.notifContent}>
                                            <Text style={s.notifTitle}>{notif.title}</Text>
                                            <Text style={s.notifMessage}>{notif.message}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    topHero: {
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    backBtn: { padding: 4 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#fff', marginLeft: 8 },
    headerIcons: { flexDirection: 'row', gap: 15 },
    headerIconButton: { padding: 4, position: 'relative' },
    badge: {
        position: 'absolute', top: -4, right: -6, backgroundColor: '#EF4444',
        borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1,
        borderWidth: 2, borderColor: '#FF6B35',
    },
    badgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },

    shopHeroContent: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20,
    },
    shopAvatarWrapper: {
        position: 'relative',
        marginRight: 15,
    },
    shopAvatar: {
        width: 70, height: 70, borderRadius: 35,
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
    },
    statusDotBorder: {
        position: 'absolute', bottom: 2, right: 2,
        backgroundColor: '#fff', borderRadius: 8, padding: 2,
    },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    shopHeroText: { gap: 4 },
    shopNameText: { fontSize: 22, fontWeight: '900', color: '#fff' },
    shopStatusRow: { flexDirection: 'row', alignItems: 'center' },
    shopStatusText: { color: '#fff', fontSize: 13, fontWeight: '600', opacity: 0.9 },

    scrollView: { flex: 1, marginTop: -20 },
    
    premiumCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        marginHorizontal: 16,
        padding: 24,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
            android: { elevation: 10 },
        }),
    },
    revenueCard: {
        marginBottom: 25,
    },
    revenueHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8,
    },
    revenueLabel: { color: '#64748B', fontSize: 13, fontWeight: '600' },
    revenueAmount: { fontSize: 32, fontWeight: '900', color: '#0F172A' },
    currencyText: { fontSize: 16, color: '#64748B', fontWeight: '700' },
    revenueFooter: {
        marginTop: 15, paddingTop: 15,
        borderTopWidth: 1, borderTopColor: '#F1F5F9',
    },
    revenueSubtext: { fontSize: 12, color: '#94A3B8' },

    sectionHeaderContainer: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, marginBottom: 15,
    },
    sectionLabel: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    viewAllLink: { fontSize: 13, color: '#FF6B35', fontWeight: '700' },

    orderStatsGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        paddingHorizontal: 12, marginBottom: 25,
    },
    orderStatBox: {
        width: '45.1%', // Just under 50% for 2 per row
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        margin: '2.45%',
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8 },
            android: { elevation: 3 },
        }),
    },
    orderIconCircle: {
        width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 10,
    },
    orderStatLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 4 },
    orderStatCount: { fontSize: 20, fontWeight: '800' },

    menuGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        paddingHorizontal: 12, marginBottom: 25,
    },
    menuItemCard: {
        width: '45.1%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        margin: '2.45%',
        flexDirection: 'row',
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8 },
            android: { elevation: 3 },
        }),
    },
    menuItemIcon: {
        width: 42, height: 42, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 12,
    },
    menuItemLabel: { fontSize: 13, fontWeight: '700', color: '#1E293B', flex: 1 },

    marketingBanner: {
        marginHorizontal: 16, marginBottom: 30,
        borderRadius: 20, overflow: 'hidden',
    },
    marketingGradient: {
        flexDirection: 'row', alignItems: 'center',
        padding: 20, justifyContent: 'space-between',
    },
    marketingTextWrapper: { flex: 0.8 },
    marketingTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 4 },
    marketingSub: { color: '#fff', fontSize: 11, fontWeight: '500', opacity: 0.8 },
    marketingIcon: {},

    taskBanner: {
        marginHorizontal: 16, padding: 14,
        borderRadius: 8, borderWidth: 1, borderColor: '#FEE2E2', backgroundColor: '#FFFAFA',
        position: 'relative',
    },
    taskTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 6 },
    taskDesc: { fontSize: 13, color: '#64748B', flexWrap: 'wrap', paddingRight: 80 },
    adBadge: { backgroundColor: '#FF6B35', color: '#fff', fontSize: 9, fontWeight: 'bold', paddingHorizontal: 4, borderRadius: 2, marginRight: 4, overflow: 'hidden' },
    startTaskBtn: {
        position: 'absolute', right: 14, bottom: 14,
        backgroundColor: '#FF6B35', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4,
    },
    startTaskText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    // Notifications Premium Styles
    modalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(15, 23, 42, 0.4)', 
        justifyContent: 'flex-end' 
    },
    notifModalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '60%',
        paddingTop: 20,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20 },
            android: { elevation: 20 },
        }),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
    closeModalBtn: { padding: 4 },
    notifList: { flex: 1, padding: 20 },
    emptyNotifView: { 
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingTop: 60 
    },
    emptyNotifIcon: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#F8FAFC', justifyContent: 'center',
        alignItems: 'center', marginBottom: 20
    },
    emptyNotifText: { fontSize: 18, fontWeight: '800', color: '#475569', marginBottom: 8 },
    emptyNotifSub: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },
    notifItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8 },
            android: { elevation: 2 },
        }),
    },
    notifIconBox: {
        width: 48, height: 48, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 15
    },
    notifContent: { flex: 1, gap: 2 },
    notifTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    notifMessage: { fontSize: 13, color: '#64748B', lineHeight: 18 },
});
