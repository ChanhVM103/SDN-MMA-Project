import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useFavorites } from '@/constants/favorites-context';
import { getAllRestaurants } from '@/constants/restaurant-api';
import { API_BASE_URL } from '@/constants/api';

const parseDistanceToMeters = (distance: string) => {
    if (!distance || typeof distance !== 'string') return Number.MAX_SAFE_INTEGER;
    const raw = distance.trim().toLowerCase();
    const numeric = Number(raw.replace(',', '.').replace(/[^0-9.]/g, ''));
    if (Number.isNaN(numeric)) return Number.MAX_SAFE_INTEGER;
    if (raw.includes('km')) return numeric * 1000;
    return numeric;
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

const getPromoText = (item: any) => {
    if (item?.isFlashSale && Number(item?.discountPercent) > 0) {
        return `Giảm ${item.discountPercent}%`;
    }
    if (Number(item?.deliveryFee) === 0) {
        return 'Free ship';
    }
    return '';
};

export default function NearbySection() {
    const router = useRouter();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [nearby, setNearby] = useState<any[]>([]);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchNearby = async () => {
            try {
                const data = await getAllRestaurants({ page: 1, limit: 30, sortBy: 'rating', sortOrder: -1 });
                const list = Array.isArray(data) ? data : [];
                const sortedByDistance = [...list]
                    .sort((a, b) => parseDistanceToMeters(a.distance) - parseDistanceToMeters(b.distance))
                    .slice(0, 6);
                setNearby(sortedByDistance);
            } catch (error) {
                console.error("Failed to load nearby restaurants:", error);
            }
        };
        fetchNearby();
    }, []);

    const handlePress = (item: any) => {
        const restaurantId = item?._id || item?.id;
        if (!restaurantId) return;
        router.push({ pathname: '/restaurant/[id]', params: { id: restaurantId, data: JSON.stringify(item) } } as any);
    };

    if (nearby.length === 0) return null;

    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={s.title}>📍 Gần bạn</Text>
                <TouchableOpacity><Text style={s.seeAll}>Xem tất cả</Text></TouchableOpacity>
            </View>
            {nearby.map((item, idx) => {
                const itemId = String(item._id || item.id || '');
                const imageUri = resolveRestaurantImage(item);
                const showImage = Boolean(imageUri) && !imageErrors[itemId];
                const promoText = getPromoText(item);

                return (
                    <TouchableOpacity key={itemId || `${idx}`} style={[s.card, idx < nearby.length - 1 && { marginBottom: 10 }]} activeOpacity={0.7} onPress={() => handlePress(item)}>
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
                            <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                            <View style={s.metaRow}>
                                <Ionicons name="star" size={12} color="#FFB627" />
                                <Text style={s.metaText}>{item.rating || '4.0'}</Text>
                                <Text style={s.dot}>•</Text>
                                <Ionicons name="location-outline" size={12} color={AppColors.gray} />
                                <Text style={s.metaText}>{item.distance || 'N/A'}</Text>
                                <Text style={s.dot}>•</Text>
                                <Ionicons name="time-outline" size={12} color={AppColors.gray} />
                                <Text style={s.metaText}>{item.deliveryTime ? `${item.deliveryTime} phút` : 'N/A'}</Text>
                            </View>
                        </View>
                        {promoText ? (
                            <View style={s.promoBadge}><Text style={s.promoText}>{promoText}</Text></View>
                        ) : null}
                        <TouchableOpacity onPress={() => toggleFavorite(item._id || item.id)} activeOpacity={0.7} style={{ padding: 4 }}>
                            <Ionicons name={isFavorite(item._id || item.id) ? 'heart' : 'heart-outline'} size={20} color={isFavorite(item._id || item.id) ? '#EF4444' : AppColors.gray} />
                        </TouchableOpacity>
                    </TouchableOpacity>
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
    imageBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#FFF3ED', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    image: { width: '100%', height: '100%' },
    emoji: { fontSize: 28 },
    info: { flex: 1 },
    name: { fontSize: 14, fontWeight: '700', color: AppColors.charcoal, marginBottom: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: AppColors.gray },
    dot: { fontSize: 8, color: AppColors.gray },
    promoBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    promoText: { fontSize: 10, fontWeight: '700', color: '#EF4444' },
});
