import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions, Alert } from 'react-native';
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
    const [stats, setStats] = React.useState<any>(null);
    const [restaurant, setRestaurant] = React.useState<any>(null);
    const [restaurantId, setRestaurantId] = React.useState<string | null>(null);

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

    return (
        <View style={s.container}>
            {/* Header section identical to standard back header but styled for shop */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={AppColors.primary} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Shop của tôi</Text>
                <View style={s.headerIcons}>
                    <TouchableOpacity style={s.headerIconButton} onPress={() => router.push('/restaurant/edit-shop' as any)}>
                        <Ionicons name="settings-outline" size={22} color={AppColors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.headerIconButton}>
                        <Ionicons name="notifications-outline" size={22} color={AppColors.primary} />
                        <View style={s.badge}><Text style={s.badgeText}>0</Text></View>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Shop Banner / Info */}
                <View style={s.shopInfoCard}>
                    <View style={s.shopAvatarContainer}>
                        {avatarUri ? (
                            <ExpoImage source={{ uri: avatarUri }} style={s.shopAvatar} contentFit="cover" />
                        ) : (
                            <View style={[s.shopAvatar, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
                                <Ionicons name="storefront" size={30} color={AppColors.gray} />
                            </View>
                        )}
                    </View>
                    <View style={s.shopDetails}>
                        <Text style={s.shopNameText}>{restaurant?.name || user?.fullName || 'Shop của tôi'}</Text>
                        <View style={s.shopLinkRow}>
                            <Text style={s.shopLinkText}>foodiehub.com/{user?.id?.slice(-8) || 'shop'}</Text>
                            <Ionicons name="copy-outline" size={12} color={AppColors.gray} />
                        </View>
                    </View>
                    <TouchableOpacity style={s.viewShopBtn} onPress={() => router.push('/restaurant/edit-shop' as any)}>
                        <Text style={s.viewShopBtnText}>Xem Shop</Text>
                    </TouchableOpacity>
                </View>

                {/* Promotional Banner (Placeholder similar to Shopee's Ad banner) */}
                <View style={s.promoBannerContainer}>
                    <LinearGradient
                        colors={['#FF6B35', '#E55A2B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={s.promoBanner}
                    >
                        <Text style={s.promoBannerTitle}>TỐI ĐA DOANH THU</Text>
                        <Text style={s.promoBannerSubtitle}>DỊCH VỤ HIỂN THỊ FOODIEHUB</Text>
                    </LinearGradient>
                </View>

                {/* Revenue Overview */}
                <View style={s.sectionCard}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>💰 Doanh thu của bạn</Text>
                    </View>
                    <View style={s.revenueContainer}>
                        <Text style={s.revenueAmount}>{(stats?.totalRevenue || 0).toLocaleString()} đ</Text>
                        <Text style={s.revenueSubtext}>Doanh thu tiền đồ ăn (chưa tính phí giao hàng)</Text>
                    </View>
                </View>

                {/* Orders Overview */}
                <View style={s.sectionCard}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>Đơn hàng</Text>
                        <TouchableOpacity style={s.viewHistoryBtn} onPress={() => router.push('/restaurant/orders')}>
                            <Text style={s.viewHistoryText}>Xem lịch sử đơn hàng</Text>
                            <Ionicons name="chevron-forward" size={16} color={AppColors.gray} />
                        </TouchableOpacity>
                    </View>
                    <View style={s.orderStatsContainer}>
                        <TouchableOpacity style={s.orderStatItem} onPress={() => router.push({ pathname: '/restaurant/orders', params: { tab: 'pending' } })}>
                            <Text style={s.orderStatCount}>{stats?.countByStatus?.pending || 0}</Text>
                            <Text style={s.orderStatLabel} numberOfLines={2}>Chờ xác nhận</Text>
                        </TouchableOpacity>
                        <View style={s.dividerVertical} />
                        <TouchableOpacity style={s.orderStatItem} onPress={() => router.push({ pathname: '/restaurant/orders', params: { tab: 'preparing' } })}>
                            <Text style={s.orderStatCount}>{stats?.countByStatus?.preparing || 0}</Text>
                            <Text style={s.orderStatLabel} numberOfLines={2}>Đang chuẩn</Text>
                        </TouchableOpacity>
                        <View style={s.dividerVertical} />
                        <TouchableOpacity style={s.orderStatItem} onPress={() => router.push({ pathname: '/restaurant/orders', params: { tab: 'delivering' } })}>
                            <Text style={s.orderStatCount}>{stats?.countByStatus?.delivering || 0}</Text>
                            <Text style={s.orderStatLabel} numberOfLines={2}>Đang giao</Text>
                        </TouchableOpacity>
                        <View style={s.dividerVertical} />
                        <TouchableOpacity style={s.orderStatItem} onPress={() => router.push({ pathname: '/restaurant/orders', params: { tab: 'cancelled' } })}>
                            <Text style={s.orderStatCount}>{stats?.countByStatus?.cancelled || 0}</Text>
                            <Text style={s.orderStatLabel} numberOfLines={2}>Đơn hủy</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Menu Grid */}
                <View style={s.sectionCard}>
                    <View style={s.menuGridContainer}>
                        {menuGrid.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.7}
                                style={s.menuGridItem}
                                onPress={() => item.route && router.push(item.route as any)}
                            >
                                <View style={[s.menuGridIconWrapper, { backgroundColor: item.color }]}>
                                    <Ionicons name={item.icon as any} size={24} color="#fff" />
                                </View>
                                <Text style={s.menuGridLabel}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 12, paddingHorizontal: Spacing.lg,
        backgroundColor: '#fff',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
            android: { elevation: 3 },
        }),
        zIndex: 10,
    },
    backBtn: { padding: 4, marginRight: 8 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: AppColors.charcoal },
    headerIcons: { flexDirection: 'row', gap: 12 },
    headerIconButton: { padding: 4, position: 'relative' },
    badge: {
        position: 'absolute', top: -2, right: -6, backgroundColor: AppColors.primary,
        borderRadius: 10, paddingHorizontal: 4, paddingVertical: 1,
        borderWidth: 1.5, borderColor: '#fff',
    },
    badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

    shopInfoCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        padding: Spacing.lg, marginBottom: 12,
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    shopAvatarContainer: { marginRight: 12 },
    shopAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: '#E5E7EB' },
    shopDetails: { flex: 1, justifyContent: 'center' },
    shopNameText: { fontSize: 16, fontWeight: '700', color: AppColors.charcoal, marginBottom: 4 },
    shopLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    shopLinkText: { fontSize: 13, color: AppColors.gray },
    viewShopBtn: {
        borderWidth: 1, borderColor: AppColors.primary, borderRadius: 4,
        paddingHorizontal: 12, paddingVertical: 6,
    },
    viewShopBtnText: { color: AppColors.primary, fontSize: 12, fontWeight: '600' },

    promoBannerContainer: { paddingHorizontal: 12, paddingBottom: 12 },
    promoBanner: {
        borderRadius: BorderRadius.md, padding: Spacing.lg,
        height: 100, justifyContent: 'center', alignItems: 'flex-start',
    },
    promoBannerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
    promoBannerSubtitle: { color: '#fff', fontSize: 14, fontWeight: '600', opacity: 0.9 },

    sectionCard: {
        backgroundColor: '#fff', borderRadius: BorderRadius.md,
        marginHorizontal: 12, marginBottom: 12, paddingVertical: 14,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
            android: { elevation: 2 },
        }),
    },
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, marginBottom: 12,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: AppColors.charcoal },
    viewHistoryBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    viewHistoryText: { fontSize: 13, color: AppColors.gray },

    orderStatsContainer: { flexDirection: 'row', alignItems: 'stretch' },
    orderStatItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 4 },
    orderStatCount: { fontSize: 22, fontWeight: '700', color: AppColors.charcoal, marginBottom: 4 },
    orderStatLabel: { fontSize: 12, color: AppColors.gray, textAlign: 'center', height: 40 },
    dividerVertical: { width: 1, backgroundColor: '#F3F4F6' },

    revenueContainer: { paddingHorizontal: 16, paddingBottom: 8 },
    revenueAmount: { fontSize: 28, fontWeight: '900', color: '#10B981', marginBottom: 4 },
    revenueSubtext: { fontSize: 13, color: AppColors.gray },

    menuGridContainer: {
        flexDirection: 'row', flexWrap: 'wrap', paddingTop: 8,
    },
    menuGridItem: {
        width: '33.33%', alignItems: 'center', marginBottom: 20, paddingHorizontal: 8,
    },
    menuGridIconWrapper: {
        width: 44, height: 44, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 8,
    },
    menuGridLabel: {
        fontSize: 12, color: AppColors.charcoal, textAlign: 'center',
    },

    taskBanner: {
        marginHorizontal: 16, padding: 14,
        borderRadius: 8, borderWidth: 1, borderColor: '#FEE2E2', backgroundColor: '#FFFAFA',
        position: 'relative',
    },
    taskTitle: { fontSize: 15, fontWeight: '600', color: AppColors.charcoal, marginBottom: 6 },
    taskDesc: { fontSize: 13, color: AppColors.gray, flexWrap: 'wrap', paddingRight: 80 },
    adBadge: { backgroundColor: AppColors.primary, color: '#fff', fontSize: 9, fontWeight: 'bold', paddingHorizontal: 4, borderRadius: 2, marginRight: 4, overflow: 'hidden' },
    startTaskBtn: {
        position: 'absolute', right: 14, bottom: 14,
        backgroundColor: AppColors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4,
    },
    startTaskText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
