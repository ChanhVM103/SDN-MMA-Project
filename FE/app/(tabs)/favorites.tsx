import React from 'react';
import {
    View, Text, StyleSheet, Platform, TouchableOpacity,
    FlatList, Image, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/constants/auth-context';
import { useFavorites } from '@/constants/favorites-context';
import { RESTAURANTS } from './explore';
import { useRouter } from 'expo-router';

export default function FavoritesScreen() {
    const { user } = useAuth();
    const { favorites, toggleFavorite } = useFavorites();
    const router = useRouter();

    const favoriteRestaurants = RESTAURANTS.filter(r => favorites.includes(r.id));

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

    if (favoriteRestaurants.length === 0) {
        return (
            <View style={s.container}>
                <LinearGradient colors={['#EF4444', '#DC2626']} style={s.header}>
                    <Text style={s.headerTitle}>Đã thích</Text>
                </LinearGradient>
                <View style={s.emptyContainer}>
                    <Text style={{ fontSize: 56, marginBottom: 16 }}>❤️</Text>
                    <Text style={s.emptyTitle}>Chưa có món yêu thích</Text>
                    <Text style={s.emptySubtitle}>Nhấn ❤️ trên các quán ăn để lưu vào danh sách yêu thích</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={s.container}>
            <LinearGradient colors={['#EF4444', '#DC2626']} style={s.header}>
                <Text style={s.headerTitle}>Đã thích ({favoriteRestaurants.length})</Text>
            </LinearGradient>
            <FlatList
                data={favoriteRestaurants}
                keyExtractor={item => item.id}
                contentContainerStyle={s.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={s.card}
                        activeOpacity={0.85}
                        onPress={() => router.push({
                            pathname: '/restaurant/[id]',
                            params: { id: item.id, data: JSON.stringify(item) },
                        } as any)}
                    >
                        <Image source={{ uri: item.image }} style={s.cardImage} resizeMode="cover" />
                        <View style={s.cardContent}>
                            <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
                            <Text style={s.cardCategory}>{item.category}</Text>
                            <View style={s.cardMeta}>
                                <Ionicons name="star" size={12} color="#FFB627" />
                                <Text style={s.cardRating}>{item.rating}</Text>
                                <Text style={s.cardDot}>•</Text>
                                <Text style={s.cardTime}>{item.deliveryTime} phút</Text>
                                <Text style={s.cardDot}>•</Text>
                                <Text style={s.cardFee}>
                                    {item.deliveryFee === 0 ? 'Freeship' : `Ship ${(item.deliveryFee / 1000).toFixed(0)}k`}
                                </Text>
                            </View>
                            {item.isFlashSale && (
                                <View style={s.saleBadge}>
                                    <Ionicons name="flash" size={12} color="#fff" />
                                    <Text style={s.saleBadgeText}>Giảm {item.discountPercent}%</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity
                            style={s.heartButton}
                            onPress={() => toggleFavorite(item.id)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="heart" size={22} color="#EF4444" />
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
            />
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
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: AppColors.charcoal, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: AppColors.gray, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    btn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: BorderRadius.md },
    btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    listContent: { padding: Spacing.lg, gap: 12 },
    card: {
        flexDirection: 'row', backgroundColor: '#fff',
        borderRadius: BorderRadius.lg, overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
            android: { elevation: 3 },
        }),
    },
    cardImage: { width: 110, height: 110 },
    cardContent: { flex: 1, padding: 12, justifyContent: 'center' },
    cardName: { fontSize: 15, fontWeight: '700', color: AppColors.charcoal, marginBottom: 2 },
    cardCategory: { fontSize: 12, color: AppColors.gray, marginBottom: 6 },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    cardRating: { fontSize: 12, fontWeight: '700', color: AppColors.charcoal },
    cardDot: { fontSize: 12, color: AppColors.gray },
    cardTime: { fontSize: 12, color: AppColors.gray },
    cardFee: { fontSize: 12, color: AppColors.primary, fontWeight: '600' },
    saleBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#EF4444', borderRadius: 6,
        paddingHorizontal: 8, paddingVertical: 3,
        alignSelf: 'flex-start', marginTop: 6,
    },
    saleBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
    heartButton: {
        justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 14,
    },
});
