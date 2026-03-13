import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Pressable, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useFavorites } from '@/constants/favorites-context';
import { getMostOrderedRestaurants } from '@/constants/restaurant-api';
import { API_BASE_URL } from '@/constants/api';

const BADGE_COLORS: Record<string, [string, string]> = {
    '#1': ['#FFB627', '#FF9500'],
    '#2': ['#9CA3AF', '#6B7280'],
    '#3': ['#D97706', '#B45309'],
};

const formatCompactNumber = (value: number) => {
    if (!value || value <= 0) return '0';
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1).replace('.0', '')}k`;
    }
    return `${value}`;
};

const resolveRestaurantImage = (item: any) => {
    const rawImage =
        item?.image ||
        item?.thumbnail ||
        (Array.isArray(item?.images) ? item.images[0] : '');

    if (!rawImage || typeof rawImage !== 'string') return '';
    if (rawImage.startsWith('http://') || rawImage.startsWith('https://') || rawImage.startsWith('data:image')) {
        return rawImage;
    }

    const base = API_BASE_URL.replace(/\/api$/, '');
    return rawImage.startsWith('/') ? `${base}${rawImage}` : `${base}/${rawImage}`;
};

export default function MostOrderedSection() {
    const router = useRouter();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [mostOrdered, setMostOrdered] = useState<any[]>([]);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchMostOrdered = async () => {
            try {
                const data = await getMostOrderedRestaurants();
                setMostOrdered(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to load most ordered restaurants:", error);
            }
        };
        fetchMostOrdered();
    }, []);

    const handlePress = (item: any) => {
        const restaurantId = item?._id || item?.id;
        if (!restaurantId) return;
        router.push({ pathname: '/restaurant/[id]', params: { id: restaurantId, data: JSON.stringify(item) } } as any);
    };

    if (mostOrdered.length === 0) return null;

    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={s.title}>🏆 Đặt Nhiều Nhất</Text>
            </View>
            {mostOrdered.map((item, idx) => {
                const itemId = String(item._id || item.id || '');
                const badge = `#${idx + 1}`;
                const imageUri = resolveRestaurantImage(item);
                const showImage = Boolean(imageUri) && !imageErrors[itemId];

                return (
                    <Pressable
                        key={itemId || `${idx}`}
                        style={({ pressed }) => [s.card, idx < mostOrdered.length - 1 && { marginBottom: 10 }, pressed && { opacity: 0.8 }]}
                        onPress={() => handlePress(item)}
                    >
                        {BADGE_COLORS[badge] ? (
                            <LinearGradient colors={BADGE_COLORS[badge]} style={s.rankBadge}>
                                <Text style={s.rankText}>{badge}</Text>
                            </LinearGradient>
                        ) : (
                            <View style={[s.rankBadge, { backgroundColor: '#F3F4F6' }]}>
                                <Text style={[s.rankText, { color: AppColors.darkGray }]}>{badge}</Text>
                            </View>
                        )}
                        <View style={s.imageBox}>
                            {showImage ? (
                                <Image
                                    source={{ uri: imageUri }}
                                    style={s.image}
                                    resizeMode="cover"
                                    onError={() => setImageErrors((prev) => ({ ...prev, [itemId]: true }))}
                                />
                            ) : (
                                <Text style={s.emoji}>{item.emoji || '🍽️'}</Text>
                            )}
                        </View>
                        <View style={s.info}>
                            <View style={s.nameRow}>
                                <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                                {Number(item.discountPercent) > 0 && (
                                    <LinearGradient
                                        colors={['#FEF2F2', '#FEE2E2']}
                                        style={s.promoBadge}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <Text style={s.promoText}>Giảm {item.discountPercent}%</Text>
                                    </LinearGradient>
                                )}
                            </View>
                            <View style={s.metaRow}>
                                <Ionicons name="cart-outline" size={12} color={AppColors.gray} />
                                <Text style={s.metaText}>{formatCompactNumber(item.totalOrders || 0)} đã đặt</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => toggleFavorite(item._id || item.id)} activeOpacity={0.7} style={{ padding: 4 }}>
                            <Ionicons name={isFavorite(item._id || item.id) ? 'heart' : 'heart-outline'} size={20} color={isFavorite(item._id || item.id) ? '#EF4444' : AppColors.gray} />
                        </TouchableOpacity>
                    </Pressable>
                );
            })}
        </View>
    );
}

const s = StyleSheet.create({
    container: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    title: { fontSize: 18, fontWeight: '800', color: AppColors.charcoal },
    seeAll: { fontSize: 14, fontWeight: '600', color: AppColors.primary },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: BorderRadius.md, padding: 12, gap: 12, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 3 } }) },
    rankBadge: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    rankText: { fontSize: 12, fontWeight: '800', color: '#fff' },
    imageBox: { width: 38, height: 38, borderRadius: 10, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF3ED' },
    image: { width: '100%', height: '100%' },
    emoji: { fontSize: 24 },
    info: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
    name: { fontSize: 14, fontWeight: '700', color: AppColors.charcoal, flex: 1 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: AppColors.gray },
    promoBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
    promoText: { fontSize: 10, fontWeight: '800', color: '#EF4444' },
});
