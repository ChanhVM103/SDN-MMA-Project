import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, FlatList, Image, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/constants/auth-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useFavorites } from '@/constants/favorites-context';
import { userAPI, API_BASE_URL } from '@/constants/api';

const resolveRestaurantImage = (item: any) => {
    const rawImage =
        item?.image || (Array.isArray(item?.images) ? item.images[0] : '');
    if (!rawImage || typeof rawImage !== 'string') return '';
    if (rawImage.startsWith('http')) return rawImage;
    const base = API_BASE_URL.replace(/\/api$/, '');
    return rawImage.startsWith('/') ? `${base}${rawImage}` : `${base}/${rawImage}`;
};

export default function FavoritesScreen() {
    const { user, token } = useAuth();
    const { toggleFavorite, refreshFavorites: refreshContext } = useFavorites();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [favoriteList, setFavoriteList] = useState<any[]>([]);

    const fetchFavorites = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await userAPI.getFavorites(token);
            if (res.success) {
                setFavoriteList(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (token) fetchFavorites();
        }, [token])
    );

    const handleRemoveOne = async (id: string) => {
        try {
            await toggleFavorite(id);
            setFavoriteList(prev => prev.filter(item => (item._id || item.id) !== id));
            await refreshContext();
        } catch (error) {
            console.error('Failed to remove favorite:', error);
            Alert.alert('Lỗi', 'Không thể xoá nhà hàng khỏi danh sách yêu thích');
        }
    };

    if (!user) {
        return (
            <View style={s.container}>
                <LinearGradient colors={['#EF4444', '#DC2626']} style={s.header}>
                    <Text style={s.headerTitle}>Đã thích</Text>
                </LinearGradient>
                <View style={s.emptyContainer}>
                    <Text style={{ fontSize: 56, marginBottom: 16 }}>💝</Text>
                    <Text style={s.emptyTitle}>Danh sách yêu thích trống</Text>
                    <Text style={s.emptySubtitle}>Đăng nhập để lưu các món ăn yêu thích</Text>
                    <TouchableOpacity onPress={() => router.push('/sign-in' as any)}>
                        <LinearGradient colors={['#EF4444', '#DC2626']} style={s.btn}>
                            <Text style={s.btnText}>Đăng nhập</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const renderItem = ({ item }: { item: any }) => {
        const imageUri = resolveRestaurantImage(item);
        const itemId = item._id || item.id;

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                style={s.card}
                onPress={() => {
                    router.push({ pathname: '/restaurant/[id]', params: { id: itemId, data: JSON.stringify(item) } } as any);
                }}
            >
                <View style={{ flexDirection: 'row', flex: 1 }}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={s.cardImage} />
                    ) : (
                        <View style={[s.cardImage, { backgroundColor: '#FFF3ED', justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={{ fontSize: 32 }}>{item.emoji || '🍽️'}</Text>
                        </View>
                    )}
                    <View style={s.cardInfo}>
                        <View style={s.cardHeader}>
                            <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
                            {item.discountPercent > 0 && (
                                <View style={s.promoBadge}>
                                    <Text style={s.promoText}>-{item.discountPercent}%</Text>
                                </View>
                            )}
                            <TouchableOpacity
                                onPress={() => handleRemoveOne(itemId)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={s.heartBtn}
                            >
                                <Ionicons name="heart" size={22} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                        <Text style={s.cardAddress} numberOfLines={1}>{item.address || 'Hà Nội'}</Text>
                        <View style={s.cardFooter}>
                            <View style={s.ratingBox}>
                                <Ionicons name="star" size={14} color="#FFB627" />
                                <Text style={s.ratingText}>{item.rating || '4.5'}</Text>
                            </View>
                            <Text style={s.reviewsText}>({item.reviews || 0} đánh giá)</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={s.container}>
            <LinearGradient colors={['#EF4444', '#DC2626']} style={s.header}>
                <Text style={s.headerTitle}>Đã thích</Text>
            </LinearGradient>

            {loading && favoriteList.length === 0 ? (
                <View style={s.loadingContainer}>
                    <ActivityIndicator size="large" color="#EF4444" />
                </View>
            ) : favoriteList.length === 0 ? (
                <View style={s.emptyContainer}>
                    <Text style={{ fontSize: 56, marginBottom: 16 }}>❤️</Text>
                    <Text style={s.emptyTitle}>Chưa có món yêu thích</Text>
                    <Text style={s.emptySubtitle}>Nhấn ❤️ để lưu món ăn bạn thích</Text>
                </View>
            ) : (
                <FlatList
                    data={favoriteList}
                    renderItem={renderItem}
                    keyExtractor={(item) => (item._id || item.id).toString()}
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppColors.offWhite },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20, paddingHorizontal: Spacing.lg,
        alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: AppColors.charcoal, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: AppColors.gray, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    btn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: BorderRadius.md },
    btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    list: { padding: Spacing.lg, gap: 16 },
    card: {
        backgroundColor: '#fff', borderRadius: BorderRadius.lg, overflow: 'hidden',
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
    },
    cardImage: { width: 100, height: 100 },
    cardInfo: { flex: 1, padding: 12, justifyContent: 'center' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    cardName: { fontSize: 16, fontWeight: '700', color: AppColors.charcoal, flex: 1, marginRight: 8 },
    cardAddress: { fontSize: 12, color: AppColors.gray, marginBottom: 8 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { fontSize: 13, fontWeight: '700', color: AppColors.charcoal },
    reviewsText: { fontSize: 12, color: AppColors.gray },
    heartBtn: { padding: 4 },
    promoBadge: {
        backgroundColor: '#FF4D4D',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
    },
    promoText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
});