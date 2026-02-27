import React, { useRef, useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Platform, Animated, Dimensions, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/constants/auth-context';
import { authAPI } from '@/constants/api';
import AddressPicker from '@/components/AddressPicker';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout, token, updateUser } = useAuth();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const [showAddressModal, setShowAddressModal] = useState(false);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleLogout = () => {
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
    };

    // Not logged in state
    if (!user) {
        return (
            <View style={s.container}>
                <LinearGradient colors={['#FF6B35', '#E55A2B', '#C44A20']} style={s.headerGradient}>
                    <View style={s.headerContent}>
                        <Ionicons name="person-circle-outline" size={80} color="rgba(255,255,255,0.5)" />
                        <Text style={s.headerTitle}>Hồ Sơ Của Tôi</Text>
                        <Text style={s.headerSubtitle}>Đăng nhập để quản lý tài khoản</Text>
                    </View>
                </LinearGradient>
                <View style={s.guestContainer}>
                    <View style={s.guestCard}>
                        <Text style={{ fontSize: 48, marginBottom: 16 }}>🔐</Text>
                        <Text style={s.guestTitle}>Chào mừng đến FoodieHub!</Text>
                        <Text style={s.guestSubtitle}>Đăng nhập để xem hồ sơ, lịch sử đơn hàng và nhiều hơn nữa</Text>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => router.push('/sign-in' as any)}
                        >
                            <LinearGradient
                                colors={['#FF6B35', '#E55A2B']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={s.signInButton}
                            >
                                <Ionicons name="log-in-outline" size={20} color="#fff" />
                                <Text style={s.signInButtonText}>Đăng nhập</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={s.signUpLink}
                            onPress={() => router.push('/sign-up' as any)}
                        >
                            <Text style={s.signUpLinkText}>
                                Chưa có tài khoản? <Text style={s.signUpLinkAction}>Đăng ký</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    // Logged in state
    const getInitials = (name: string) => {
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    const getProviderIcon = (provider: string): keyof typeof Ionicons.glyphMap => {
        switch (provider) {
            case 'google': return 'logo-google';
            case 'facebook': return 'logo-facebook';
            default: return 'mail-outline';
        }
    };

    const menuItems = [
        { icon: 'receipt-outline' as const, label: 'Lịch sử đơn hàng', color: '#FF6B35' },
        { icon: 'heart-outline' as const, label: 'Yêu thích', color: '#EF4444' },
        { icon: 'location-outline' as const, label: 'Địa chỉ giao hàng', color: '#2D6A4F' },
        { icon: 'card-outline' as const, label: 'Phương thức thanh toán', color: '#6C5CE7' },
        { icon: 'notifications-outline' as const, label: 'Thông báo', color: '#FFB627' },
        { icon: 'settings-outline' as const, label: 'Cài đặt', color: '#9CA3AF' },
    ];

    return (
        <View style={s.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header with gradient */}
                <LinearGradient colors={['#FF6B35', '#E55A2B', '#C44A20']} style={s.headerGradient}>
                    <View style={s.decorCircle1} />
                    <View style={s.decorCircle2} />
                    <Animated.View style={[s.headerContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        {/* Avatar */}
                        <View style={s.avatarContainer}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                                style={s.avatarGradient}
                            >
                                <Text style={s.avatarText}>{getInitials(user.fullName)}</Text>
                            </LinearGradient>
                            <View style={s.onlineDot} />
                        </View>
                        <Text style={s.headerTitle}>{user.fullName}</Text>
                        <Text style={s.headerSubtitle}>{user.email}</Text>
                        <View style={s.providerBadge}>
                            <Ionicons name={getProviderIcon(user.authProvider)} size={14} color="#fff" />
                            <Text style={s.providerText}>
                                {user.authProvider === 'local' ? 'Email' : user.authProvider.charAt(0).toUpperCase() + user.authProvider.slice(1)}
                            </Text>
                        </View>
                    </Animated.View>
                </LinearGradient>

                {/* User Info Card */}
                <Animated.View style={[s.infoSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={s.infoCard}>
                        <Text style={s.infoCardTitle}>Thông tin tài khoản</Text>
                        <View style={s.infoRow}>
                            <Ionicons name="person-outline" size={20} color={AppColors.primary} />
                            <View style={s.infoContent}>
                                <Text style={s.infoLabel}>Họ và tên</Text>
                                <Text style={s.infoValue}>{user.fullName}</Text>
                            </View>
                        </View>
                        <View style={s.infoDivider} />
                        <View style={s.infoRow}>
                            <Ionicons name="mail-outline" size={20} color={AppColors.primary} />
                            <View style={s.infoContent}>
                                <Text style={s.infoLabel}>Email</Text>
                                <Text style={s.infoValue}>{user.email}</Text>
                            </View>
                        </View>
                        {user.phone ? (
                            <>
                                <View style={s.infoDivider} />
                                <View style={s.infoRow}>
                                    <Ionicons name="call-outline" size={20} color={AppColors.primary} />
                                    <View style={s.infoContent}>
                                        <Text style={s.infoLabel}>Số điện thoại</Text>
                                        <Text style={s.infoValue}>{user.phone}</Text>
                                    </View>
                                </View>
                            </>
                        ) : null}
                        <View style={s.infoDivider} />
                        <View style={s.infoRow}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={AppColors.primary} />
                            <View style={s.infoContent}>
                                <Text style={s.infoLabel}>Vai trò</Text>
                                <Text style={s.infoValue}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Delivery Address Card */}
                <Animated.View style={[s.addressSection, { opacity: fadeAnim }]}>
                    <View style={s.addressCard}>
                        <View style={s.addressHeader}>
                            <View style={[s.menuIconContainer, { backgroundColor: '#2D6A4F15' }]}>
                                <Ionicons name="location" size={20} color="#2D6A4F" />
                            </View>
                            <Text style={s.addressCardTitle}>Địa chỉ giao hàng</Text>
                            <TouchableOpacity
                                style={s.editBtn}
                                onPress={() => setShowAddressModal(true)}
                            >
                                <Ionicons name="pencil" size={14} color={AppColors.primary} />
                                <Text style={s.editBtnText}>Sửa</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={s.addressContent}>
                            <Ionicons name="location-outline" size={16} color={AppColors.gray} />
                            <Text style={s.addressValue}>
                                {user.address || 'Chưa có địa chỉ — nhấn Sửa để thêm'}
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Address Picker */}
                <AddressPicker
                    visible={showAddressModal}
                    onClose={() => setShowAddressModal(false)}
                    initialAddress={user.address || ''}
                    onSave={async (address) => {
                        try {
                            if (token) {
                                const res = await authAPI.updateProfile(token, { address });
                                if (res.success) {
                                    await updateUser({ ...user, address });
                                }
                            }
                        } catch (e) {
                            Alert.alert('Lỗi', 'Không thể cập nhật địa chỉ');
                        }
                        setShowAddressModal(false);
                    }}
                />

                {/* Menu Items */}
                <Animated.View style={[s.menuSection, { opacity: fadeAnim }]}>
                    <View style={s.menuCard}>
                        {menuItems.map((item, index) => (
                            <React.Fragment key={item.label}>
                                <TouchableOpacity style={s.menuRow} activeOpacity={0.6}>
                                    <View style={[s.menuIconContainer, { backgroundColor: item.color + '15' }]}>
                                        <Ionicons name={item.icon} size={20} color={item.color} />
                                    </View>
                                    <Text style={s.menuLabel}>{item.label}</Text>
                                    <Ionicons name="chevron-forward" size={18} color={AppColors.gray} />
                                </TouchableOpacity>
                                {index < menuItems.length - 1 && <View style={s.menuDivider} />}
                            </React.Fragment>
                        ))}
                    </View>
                </Animated.View>

                {/* Logout Button */}
                <View style={s.logoutSection}>
                    <TouchableOpacity style={s.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                        <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                        <Text style={s.logoutText}>Đăng xuất</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppColors.offWhite },

    // Header
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 60 : 45,
        paddingBottom: 30,
        overflow: 'hidden',
    },
    decorCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)', top: -50, right: -50 },
    decorCircle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: -30 },
    headerContent: { alignItems: 'center', paddingHorizontal: Spacing.lg },
    avatarContainer: { position: 'relative', marginBottom: 12 },
    avatarGradient: {
        width: 88, height: 88, borderRadius: 44,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
    },
    avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
    onlineDot: {
        position: 'absolute', bottom: 4, right: 4,
        width: 16, height: 16, borderRadius: 8,
        backgroundColor: '#10B981', borderWidth: 3, borderColor: '#E55A2B',
    },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
    providerBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12,
        paddingVertical: 5, borderRadius: 20,
    },
    providerText: { fontSize: 12, fontWeight: '600', color: '#fff' },

    // Info Card
    infoSection: { paddingHorizontal: Spacing.lg, marginTop: -10 },
    infoCard: {
        backgroundColor: '#fff', borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
            android: { elevation: 4 },
        }),
    },
    infoCardTitle: { fontSize: 16, fontWeight: '700', color: AppColors.charcoal, marginBottom: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    infoContent: { marginLeft: 14, flex: 1 },
    infoLabel: { fontSize: 12, color: AppColors.gray, fontWeight: '500', marginBottom: 2 },
    infoValue: { fontSize: 15, color: AppColors.charcoal, fontWeight: '600' },
    infoDivider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 34 },

    // Menu
    menuSection: { paddingHorizontal: Spacing.lg, marginTop: 16 },
    menuCard: {
        backgroundColor: '#fff', borderRadius: BorderRadius.lg,
        paddingVertical: 4,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
            android: { elevation: 3 },
        }),
    },
    menuRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingVertical: 14,
    },
    menuIconContainer: {
        width: 36, height: 36, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    },
    menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: AppColors.charcoal, marginLeft: 14 },
    menuDivider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 74 },

    // Logout
    logoutSection: { paddingHorizontal: Spacing.lg, marginTop: 20 },
    logoutButton: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
        backgroundColor: '#FEE2E2', borderRadius: BorderRadius.md,
        paddingVertical: 16, borderWidth: 1, borderColor: '#FECACA',
    },
    logoutText: { fontSize: 16, fontWeight: '700', color: '#EF4444' },

    // Guest State
    guestContainer: { flex: 1, paddingHorizontal: Spacing.lg, marginTop: -10 },
    guestCard: {
        backgroundColor: '#fff', borderRadius: BorderRadius.lg,
        padding: Spacing.xl, alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
            android: { elevation: 4 },
        }),
    },
    guestTitle: { fontSize: 20, fontWeight: '800', color: AppColors.charcoal, marginBottom: 8 },
    guestSubtitle: { fontSize: 14, color: AppColors.gray, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    signInButton: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 32, paddingVertical: 16, borderRadius: BorderRadius.md,
        ...Platform.select({
            ios: { shadowColor: AppColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
            android: { elevation: 6 },
        }),
    },
    signInButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    signUpLink: { marginTop: 16 },
    signUpLinkText: { fontSize: 14, color: AppColors.gray },
    signUpLinkAction: { fontWeight: '700', color: AppColors.primary },

    // Address Card
    addressSection: { paddingHorizontal: Spacing.lg, marginTop: 16 },
    addressCard: {
        backgroundColor: '#fff', borderRadius: BorderRadius.lg, padding: Spacing.lg,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
            android: { elevation: 3 },
        }),
    },
    addressHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    addressCardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: AppColors.charcoal, marginLeft: 12 },
    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#FFF3ED' },
    editBtnText: { fontSize: 13, fontWeight: '600', color: AppColors.primary },
    addressContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingLeft: 48 },
    addressValue: { flex: 1, fontSize: 14, color: AppColors.darkGray, lineHeight: 20 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 24 },
    modalContent: { backgroundColor: '#fff', borderRadius: BorderRadius.lg, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: AppColors.charcoal, marginBottom: 16 },
    modalInput: {
        borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: BorderRadius.md,
        padding: 14, fontSize: 15, color: AppColors.charcoal,
        minHeight: 80, textAlignVertical: 'top',
    },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
    modalCancel: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    modalCancelText: { fontSize: 15, fontWeight: '600', color: AppColors.gray },
    modalSave: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, backgroundColor: AppColors.primary },
    modalSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
