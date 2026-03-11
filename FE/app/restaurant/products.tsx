import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions, SafeAreaView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/constants/auth-context';
import { productAPI, restaurantAPI } from '@/constants/api';
import { ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { API_BASE_URL } from '@/constants/api';

const resolveProductImage = (image: string) => {
    if (!image || typeof image !== 'string') return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80';
    if (image.startsWith('http') || image.startsWith('data:image')) return image;
    const base = API_BASE_URL.replace(/\/api$/, '');
    return image.startsWith('/') ? `${base}${image}` : `${base}/${image}`;
};

const { width } = Dimensions.get('window');



export default function RestaurantProducts() {
    const router = useRouter();
    const { user, token } = useAuth();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            const init = async () => {
                if (token) {
                    const restRes = await restaurantAPI.getMyRestaurant(token).catch(() => null);
                    const restId = restRes?.data?._id || user?.id;
                    setRestaurantId(restId);
                    fetchProducts(restId);
                }
            };
            init();
        }, [user?.id, token])
    );

    const fetchProducts = async (restId: string) => {
        if (!restId) return;
        try {
            setLoading(true);
            const res = await productAPI.getProductsByRestaurant(restId, { limit: 50 });
            if (res.success) {
                setProducts(res.data);
            }
        } catch (error) {
            console.error('Lỗi khi tải sản phẩm:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleVisibility = async (product: any) => {
        if (!restaurantId || !token) return;
        try {
            const productId = product._id || product.id;
            const res = await productAPI.updateProduct(token, restaurantId, productId, {
                isAvailable: !product.isAvailable
            });
            if (res.success) {
                fetchProducts(restaurantId);
            }
        } catch (error: any) {
            const msg = error.message || 'Lỗi khi cập nhật trạng thái';
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Lỗi', msg);
        }
    };

    const confirmDelete = (productId: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
                performDelete(productId);
            }
        } else {
            Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa sản phẩm này?', [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Xóa', style: 'destructive', onPress: () => performDelete(productId) }
            ]);
        }
    };

    const performDelete = async (productId: string) => {
        if (!restaurantId || !token) return;
        try {
            const res = await productAPI.deleteProduct(token, restaurantId, productId);
            if (res.success) {
                fetchProducts(restaurantId);
            }
        } catch (error: any) {
            const msg = error.message || 'Lỗi khi xoá sản phẩm';
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Lỗi', msg);
        }
    };

    return (
        <SafeAreaView style={s.safeArea}>
            <View style={s.container}>
                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={AppColors.primary} />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Thực Đơn Của Tôi</Text>
                    <View style={s.headerIcons}>
                        <TouchableOpacity style={s.headerIconButton}>
                            <Ionicons name="search-outline" size={22} color={AppColors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Products List */}
                <ScrollView contentContainerStyle={s.productList} showsVerticalScrollIndicator={false}>
                    {loading ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={AppColors.primary} />
                        </View>
                    ) : products.length === 0 ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <Ionicons name="fast-food-outline" size={48} color={AppColors.gray} />
                            <Text style={{ marginTop: 12, color: AppColors.gray }}>Chưa có món ăn nào trong thực đơn</Text>
                        </View>
                    ) : (
                        products.map((product) => (
                            <View key={product._id || product.id} style={s.productCard}>
                                {/* Product Info */}
                                <View style={s.productInfoRow}>
                                    <ExpoImage source={{ uri: resolveProductImage(product.image) }} style={s.productImage} />
                                    <View style={s.productDetails}>
                                        <Text style={s.productName} numberOfLines={2}>{product.name}</Text>
                                        {product.isBestSeller && (
                                            <View style={s.productBadge}>
                                                <Text style={s.productBadgeText}>Bán chạy</Text>
                                            </View>
                                        )}
                                        <View style={s.priceRow}>
                                            <Text style={s.productPrice}>đ{product.price?.toLocaleString() || 0}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Product Stats */}
                                <View style={s.statsGrid}>
                                    <View style={s.statRow}>
                                        <View style={s.statItem}>
                                            <Ionicons name="heart-outline" size={14} color={AppColors.gray} />
                                            <Text style={s.statText}>{product.likes || 0} Yêu thích</Text>
                                        </View>
                                        <View style={s.statItem}>
                                            <Ionicons name="bag-check-outline" size={14} color={AppColors.gray} />
                                            <Text style={s.statText}>Đã bán {product.sold || 0}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Actions */}
                                <View style={s.actionRow}>
                                    <TouchableOpacity style={s.actionBtn} onPress={() => handleToggleVisibility(product)}>
                                        <Ionicons name={product.isAvailable ? "eye-off-outline" : "eye-outline"} size={16} color={AppColors.charcoal} style={{ marginRight: 4 }} />
                                        <Text style={s.actionBtnText}>{product.isAvailable ? 'Ẩn món' : 'Hiện món'}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[s.actionBtn, s.actionBtnPrimary]}
                                        onPress={() => router.push(`/restaurant/edit-product?id=${product._id || product.id}`)}
                                    >
                                        <Ionicons name="pencil-outline" size={16} color={AppColors.primary} style={{ marginRight: 4 }} />
                                        <Text style={[s.actionBtnText, s.actionBtnTextPrimary]}>Sửa</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={s.actionBtnMore} onPress={() => confirmDelete(product._id || product.id)}>
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Bottom Sticky Action */}
                <View style={s.bottomContainer}>
                    <TouchableOpacity
                        style={s.addProductBtn}
                        onPress={() => router.push('/restaurant/add-product')}
                    >
                        <Text style={s.addProductBtnText}>Thêm 1 sản phẩm mới</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 10 : 30, // SafeAreaView handles most of it
        paddingBottom: 12, paddingHorizontal: Spacing.lg,
        backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
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

    adBanner: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9',
        paddingHorizontal: 12, paddingVertical: 10,
    },
    adIconWrapper: { backgroundColor: '#C8E6C9', borderRadius: 12, padding: 4, marginRight: 8 },
    adText: { flex: 1, fontSize: 12, color: '#2E7D32', fontWeight: '500' },
    adBtn: { backgroundColor: '#2A9D8F', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
    adBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },

    warningBanner: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0',
        paddingHorizontal: 12, paddingVertical: 10,
    },
    warningText: { flex: 1, fontSize: 12, color: '#E65100', marginLeft: 8, marginRight: 8 },
    warningBtn: { backgroundColor: AppColors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
    warningBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },

    productList: { padding: 12 },
    productCard: {
        backgroundColor: '#fff', borderRadius: 8,
        padding: 12, marginBottom: 12,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
            android: { elevation: 1 },
        }),
    },
    productInfoRow: { flexDirection: 'row', marginBottom: 12 },
    productImage: { width: 70, height: 70, borderRadius: 6, borderWidth: 1, borderColor: '#F3F4F6' },
    productDetails: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
    productName: { fontSize: 14, fontWeight: '500', color: AppColors.charcoal, lineHeight: 20 },
    productBadge: { alignSelf: 'flex-start', backgroundColor: '#E0F7FA', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2, marginTop: 4 },
    productBadgeText: { fontSize: 10, color: '#00838F', fontWeight: '500' },
    priceRow: { flexDirection: 'row', marginTop: 6 },
    productPrice: { fontSize: 14, color: AppColors.charcoal },

    statsGrid: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, marginBottom: 12 },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    statItem: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 },
    statText: { fontSize: 13, color: AppColors.gray, fontWeight: '500' },

    actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    actionBtn: { flex: 1, flexDirection: 'row', paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 4 },
    actionBtnText: { fontSize: 13, color: AppColors.charcoal, fontWeight: '600' },
    actionBtnPrimary: { borderColor: AppColors.primary, backgroundColor: '#FFF5F0' },
    actionBtnTextPrimary: { color: AppColors.primary },
    actionBtnMore: { width: 44, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FEE2E2', backgroundColor: '#FEF2F2', borderRadius: 4 },

    bottomContainer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', paddingHorizontal: 16,
        paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 16, // SafeArea equivalent
        borderTopWidth: 1, borderTopColor: '#E5E7EB',
    },
    addProductBtn: {
        backgroundColor: AppColors.primary, borderRadius: 6,
        paddingVertical: 14, alignItems: 'center',
    },
    addProductBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
