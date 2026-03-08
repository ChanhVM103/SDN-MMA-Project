import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useFavorites } from '@/constants/favorites-context';
import { API_BASE_URL } from '@/constants/api';

import { getFlashSaleRestaurants } from '@/constants/restaurant-api';

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

export default function FlashSaleSection() {
    const router = useRouter();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [timeLeft, setTimeLeft] = useState({ h: 2, m: 15, s: 30 });
    const [flashDeals, setFlashDeals] = useState<any[]>([]);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchDeals = async () => {
            try {
                const data = await getFlashSaleRestaurants();
                setFlashDeals(data || []);
            } catch (error) {
                console.error("Failed to load flash deals:", error);
            }
        };
        fetchDeals();

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                let { h, m, s } = prev;
                s -= 1;
                if (s < 0) { s = 59; m -= 1; }
                if (m < 0) { m = 59; h -= 1; }
                if (h < 0) { h = 0; m = 0; s = 0; }
                return { h, m, s };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const pad = (n: number) => n.toString().padStart(2, '0');

    const handlePress = (item: any) => {
        const restaurantId = item?._id || item?.id;
        if (!restaurantId) return;
        router.push({ pathname: '/restaurant/[id]', params: { id: restaurantId, data: JSON.stringify(item) } } as any);
    };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <View style={s.headerLeft}>
                    <Text style={s.title}>⚡ Flash Sale</Text>
                    <View style={s.timerRow}>
                        <View style={s.timerBox}><Text style={s.timerText}>{pad(timeLeft.h)}</Text></View>
                        <Text style={s.timerColon}>:</Text>
                        <View style={s.timerBox}><Text style={s.timerText}>{pad(timeLeft.m)}</Text></View>
                        <Text style={s.timerColon}>:</Text>
                        <View style={s.timerBox}><Text style={s.timerText}>{pad(timeLeft.s)}</Text></View>
                    </View>
                </View>
                <TouchableOpacity><Text style={s.seeAll}>Xem tất cả</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll} nestedScrollEnabled={true}>
                {flashDeals.map((item) => {
                    const itemId = String(item._id || item.id || '');
                    const imageUri = resolveRestaurantImage(item);
                    const showImage = Boolean(imageUri) && !imageErrors[itemId];

                    return (
                        <TouchableOpacity key={item._id || item.id} style={s.card} activeOpacity={0.85} onPress={() => handlePress(item)}>
                            <View style={s.discountBadge}>
                                <Text style={s.discountText}>-{item.discountPercent || 0}%</Text>
                            </View>
                            <TouchableOpacity style={s.heartBtn} onPress={() => toggleFavorite(item._id || item.id)} activeOpacity={0.7}>
                                <Ionicons name={isFavorite(item._id || item.id) ? 'heart' : 'heart-outline'} size={16} color={isFavorite(item._id || item.id) ? '#EF4444' : '#ccc'} />
                            </TouchableOpacity>
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
                            <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                            <Text style={s.soldText}>Còn lại {item.deliveryTime} phút</Text>
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
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { fontSize: 18, fontWeight: '800', color: AppColors.charcoal },
    seeAll: { fontSize: 14, fontWeight: '600', color: AppColors.primary },
    timerRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    timerBox: { backgroundColor: '#EF4444', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
    timerText: { fontSize: 11, fontWeight: '800', color: '#fff' },
    timerColon: { fontSize: 12, fontWeight: '800', color: '#EF4444' },
    scroll: { gap: 12 },
    card: { width: 140, backgroundColor: '#fff', borderRadius: BorderRadius.lg, padding: 12, alignItems: 'center', position: 'relative', overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 }, android: { elevation: 4 } }) },
    discountBadge: { position: 'absolute', top: 0, left: 0, backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 3, borderBottomRightRadius: 10, borderTopLeftRadius: BorderRadius.lg },
    discountText: { fontSize: 11, fontWeight: '800', color: '#fff' },
    heartBtn: { position: 'absolute', top: 8, right: 8, zIndex: 10 },
    imageBox: {
        marginTop: 10,
        marginBottom: 8,
        width: 72,
        height: 72,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#FFF3ED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: { width: '100%', height: '100%' },
    emoji: { fontSize: 36 },
    name: { fontSize: 12, fontWeight: '700', color: AppColors.charcoal, textAlign: 'center', marginBottom: 4 },
    originalPrice: { fontSize: 11, color: AppColors.gray, textDecorationLine: 'line-through' },
    salePrice: { fontSize: 16, fontWeight: '800', color: '#EF4444', marginBottom: 8 },
    progressBg: { width: '100%', height: 6, backgroundColor: '#FEE2E2', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    soldText: { fontSize: 10, color: AppColors.gray, marginTop: 4 },
});
