import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions, SafeAreaView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/constants/auth-context';
import { productAPI, restaurantAPI } from '@/constants/api';
import { ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { API_BASE_URL } from '@/constants/api';
import { LinearGradient } from 'expo-linear-gradient';

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
        const productId = product._id || product.id;
        const newStatus = !product.isAvailable;

        try {
            // Optimistic sync update for smoothness
            setProducts(prev => prev.map(p => 
                (p._id === productId || p.id === productId) 
                ? { ...p, isAvailable: newStatus } 
                : p
            ));

            const res = await productAPI.updateProduct(token, restaurantId, productId, {
                isAvailable: newStatus
            });
            
            if (!res.success) {
                // Revert on failure
                setProducts(prev => prev.map(p => 
                    (p._id === productId || p.id === productId) 
                    ? { ...p, isAvailable: !newStatus } 
                    : p
                ));
                throw new Error(res.message);
            }
        } catch (error: any) {
            const msg = error.message || 'Lỗi khi cập nhật trạng thái';
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Lỗi', msg);
            // Ensure state is correct even if error didn't revert properly
            fetchProducts(restaurantId);
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
                    <Text style={s.headerTitle}>Quản lý Thực đơn</Text>
                    <TouchableOpacity 
                        onPress={() => router.push('/restaurant/add-product')} 
                        style={s.addBtn}
                    >
                        <Ionicons name="add" size={26} color="#fff" />
                    </TouchableOpacity>
                </View>
                
                <View style={s.headerStats}>
                    <View style={s.statItem}>
                        <Text style={s.statValue}>{products.length}</Text>
                        <Text style={s.statLabel}>Món ăn</Text>
                    </View>
                    <View style={s.statDivider} />
                    <View style={s.statItem}>
                        <Text style={s.statValue}>
                            {products.reduce((acc, p) => acc + (p.sold || 0), 0)}
                        </Text>
                        <Text style={s.statLabel}>Đã bán</Text>
                    </View>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={s.centerView}>
                    <ActivityIndicator size="large" color="#FF6B35" />
                </View>
            ) : (
                <ScrollView 
                    style={s.content} 
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {products.length === 0 ? (
                        <View style={s.emptyView}>
                            <View style={s.emptyIconCircle}>
                                <Ionicons name="fast-food-outline" size={60} color="#E2E8F0" />
                            </View>
                            <Text style={s.emptyTitle}>Chưa có món ăn</Text>
                            <Text style={s.emptySub}>Thêm các món ăn ngon của bạn vào thực đơn ngay!</Text>
                            <TouchableOpacity 
                                style={s.emptyActionBtn} 
                                onPress={() => router.push('/restaurant/add-product')}
                            >
                                <Text style={s.emptyActionBtnText}>+ Thêm món mới</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        products.map((product) => (
                            <View 
                                key={product._id || product.id} 
                                style={[
                                    s.productCard,
                                    !product.isAvailable && { opacity: 0.6, backgroundColor: '#F1F5F9' }
                                ]}
                            >
                                <View style={s.cardTop}>
                                    <ExpoImage 
                                        source={{ uri: resolveProductImage(product.image) }} 
                                        style={[
                                            s.productImage,
                                            !product.isAvailable && { tintColor: 'gray' }
                                        ]} 
                                        contentFit="cover"
                                    />
                                    <View style={s.productDetails}>
                                        <View>
                                            <Text style={[s.productName, !product.isAvailable && { color: '#64748B' }]} numberOfLines={1}>{product.name}</Text>
                                            <Text style={[s.productPrice, !product.isAvailable && { color: '#94A3B8' }]}>{product.price?.toLocaleString()}đ</Text>
                                        </View>
                                        <View style={s.metaRow}>
                                            <View style={s.metaItem}>
                                                <Ionicons name="heart" size={12} color={product.isAvailable ? "#EF4444" : "#CBD5E1"} />
                                                <Text style={s.metaText}>{product.likes || 0}</Text>
                                            </View>
                                            <View style={s.metaItem}>
                                                <Ionicons name="cart" size={12} color="#64748B" />
                                                <Text style={s.metaText}>Đã bán {product.sold || 0}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={[s.statusTag, { backgroundColor: product.isAvailable ? '#10B98115' : '#E2E8F0' }]}>
                                        <View style={[s.statusDot, { backgroundColor: product.isAvailable ? '#10B981' : '#94A3B8' }]} />
                                        <Text style={[s.statusTagText, { color: product.isAvailable ? '#10B981' : '#64748B' }]}>
                                            {product.isAvailable ? 'Hiển thị' : 'Đang ẩn'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={s.cardDivider} />

                                <View style={s.cardActions}>
                                    <TouchableOpacity 
                                        style={s.iconActionBtn} 
                                        onPress={() => confirmDelete(product._id || product.id)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                    
                                    <View style={s.mainActions}>
                                        <TouchableOpacity 
                                            style={[s.actionBtn, s.visibilityBtn]} 
                                            onPress={() => handleToggleVisibility(product)}
                                        >
                                            <Ionicons 
                                                name={product.isAvailable ? "eye-off-outline" : "eye-outline"} 
                                                size={18} 
                                                color="#64748B" 
                                            />
                                            <Text style={s.actionBtnText}>
                                                {product.isAvailable ? 'Ẩn món' : 'Hiện món'}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={[s.actionBtn, s.editBtn]} 
                                            onPress={() => router.push(`/restaurant/edit-product?id=${product._id || product.id}`)}
                                        >
                                            <Ionicons name="pencil-outline" size={18} color="#fff" />
                                            <Text style={[s.actionBtnText, { color: '#fff' }]}>Sửa món</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}

            {/* Sticky Floating Action Button */}
            {products.length > 0 && (
                <TouchableOpacity 
                    style={s.fab} 
                    onPress={() => router.push('/restaurant/add-product')}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#FF6B35', '#E55A2B']}
                        style={s.fabGradient}
                    >
                        <Ionicons name="add" size={30} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 25,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, marginBottom: 20,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', flex: 1, marginLeft: 15 },
    addBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },

    headerStats: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 30,
    },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 24, fontWeight: '900', color: '#fff' },
    statLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 20 },

    content: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
    centerView: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    emptyView: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    emptySub: { fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
    emptyActionBtn: {
        marginTop: 30, backgroundColor: '#FF6B35', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16,
        ...Platform.select({
            ios: { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
            android: { elevation: 5 },
        }),
    },
    emptyActionBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

    productCard: {
        backgroundColor: '#fff', borderRadius: 24, marginBottom: 16, padding: 16,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 12 },
            android: { elevation: 3 },
        }),
    },
    cardTop: { flexDirection: 'row', alignItems: 'center' },
    productImage: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#F1F5F9' },
    productDetails: { flex: 1, marginLeft: 16, justifyContent: 'space-between', height: 80, paddingVertical: 4 },
    productName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    productPrice: { fontSize: 15, fontWeight: '800', color: '#FF6B35', marginTop: 2 },
    metaRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    statusTag: { 
        position: 'absolute', top: -4, right: -4,
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, gap: 4 
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusTagText: { fontSize: 10, fontWeight: '800' },

    cardDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
    
    cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    iconActionBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
    mainActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { 
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, 
        borderRadius: 14, gap: 6, justifyContent: 'center' 
    },
    visibilityBtn: { backgroundColor: '#F1F5F9' },
    editBtn: { backgroundColor: '#FF6B35' },
    actionBtnText: { color: '#1E293B', fontWeight: '800', fontSize: 13 },

    fab: {
        position: 'absolute', bottom: 30, right: 20,
        width: 60, height: 60, borderRadius: 30,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15 },
            android: { elevation: 8 },
        }),
    },
    fabGradient: { flex: 1, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
});
