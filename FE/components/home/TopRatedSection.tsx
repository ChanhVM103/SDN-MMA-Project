import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useFavorites } from '@/constants/favorites-context';
import { getTopRatedRestaurants } from '@/constants/restaurant-api';
import { API_BASE_URL } from '@/constants/api';

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

export default function TopRatedSection() {
    const router = useRouter();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [topRated, setTopRated] = useState<any[]>([]);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchTopRated = async () => {
            try {
                const data = await getTopRatedRestaurants();
                setTopRated(data || []);
            } catch (error) {
                console.error("Failed to load top rated restaurants:", error);
            }
        };
        fetchTopRated();
    }, []);

    const handlePress = (item: any) => {
        const restaurantId = item?._id || item?.id;
        if (!restaurantId) return;
        router.push({ pathname: '/restaurant/[id]', params: { id: restaurantId, data: JSON.stringify(item) } } as any);
    };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={s.title}>⭐ Quán Rating 5 Sao</Text>
                <TouchableOpacity><Text style={s.seeAll}>Xem tất cả</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {topRated.map((item) => {
                    const itemId = String(item._id || item.id || '');
                    const imageUri = resolveRestaurantImage(item);
                    const showImage = Boolean(imageUri) && !imageErrors[itemId];

                    return (
                        <TouchableOpacity key={item._id || item.id} style={s.card} activeOpacity={0.85} onPress={() => handlePress(item)}>
                            <View style={s.emojiHeader}>
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
                                <View style={s.ratingBadge}>
                                    <Ionicons name="star" size={11} color="#FFB627" />
                                    <Text style={s.ratingText}>{item.rating || '4.0'}</Text>
                                </View>
                                <TouchableOpacity style={s.heartBtn} onPress={() => toggleFavorite(item._id || item.id)} activeOpacity={0.7}>
                                    <Ionicons name={isFavorite(item._id || item.id) ? 'heart' : 'heart-outline'} size={18} color={isFavorite(item._id || item.id) ? '#EF4444' : '#999'} />
                                </TouchableOpacity>
                            </View>
                            <View style={s.info}>
                                <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                                <View style={s.metaRow}>
                                    <Ionicons name="location-outline" size={12} color={AppColors.gray} />
                                    <Text style={s.metaText}>{item.distance || '1.0 km'}</Text>
                                    <Text style={s.dot}>•</Text>
                                    <Text style={s.metaText}>{item.reviews || 0} đánh giá</Text>
                                </View>
                                <View style={s.tagRow}>
                                    {(item.tags || []).slice(0, 2).map((tag: string) => (
                                        <View key={tag} style={s.tag}><Text style={s.tagText}>{tag}</Text></View>
                                    ))}
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    title: { fontSize: 18, fontWeight: '800', color: AppColors.charcoal },
    seeAll: { fontSize: 14, fontWeight: '600', color: AppColors.primary },
    scroll: { gap: 12 },
    card: {
        width: 180, backgroundColor: '#fff', borderRadius: BorderRadius.lg, overflow: 'hidden',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 }, android: { elevation: 4 } }),
    },
    emojiHeader: { height: 90, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF3ED', position: 'relative' },
    image: { width: '100%', height: '100%' },
    emoji: { fontSize: 44 },
    ratingBadge: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fff', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
    ratingText: { fontSize: 12, fontWeight: '700', color: AppColors.charcoal },
    heartBtn: { position: 'absolute', top: 8, left: 8 },
    info: { padding: 12 },
    name: { fontSize: 14, fontWeight: '700', color: AppColors.charcoal, marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
    metaText: { fontSize: 11, color: AppColors.gray },
    dot: { fontSize: 8, color: AppColors.gray },
    tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    tag: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    tagText: { fontSize: 10, fontWeight: '600', color: AppColors.darkGray },
});
