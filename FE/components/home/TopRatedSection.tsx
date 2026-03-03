import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useFavorites } from '@/constants/favorites-context';

const TOP_RATED = [
    { id: '1', name: 'Nhà hàng Hải Sản Biển Đông', rating: 5.0, reviews: 1283, distance: '1.2 km', tags: ['Hải sản', 'Nướng'], emoji: '🦞', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', isFlashSale: false, discountPercent: 0, deliveryTime: 30, deliveryFee: 20000, isOpen: true, menu: [{ id: 'm1', name: 'Tôm Hùm Nướng', price: 450000, emoji: '🦞', category: 'Hải Sản', isBestSeller: true, description: 'Tôm hùm tươi nướng muối ớt' }, { id: 'm2', name: 'Cua Rang Me', price: 320000, emoji: '🦀', category: 'Hải Sản', description: 'Cua biển rang me chua ngọt' }, { id: 'm3', name: 'Ốc Hương Xào Bơ', price: 180000, emoji: '🐚', category: 'Hải Sản', isBestSeller: true, description: 'Ốc hương tươi xào bơ tỏi' }] },
    { id: '2', name: 'Phở Thìn Bờ Hồ', rating: 4.9, reviews: 3421, distance: '0.8 km', tags: ['Phở', 'Việt Nam'], emoji: '🍜', image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80', isFlashSale: true, discountPercent: 15, deliveryTime: 20, deliveryFee: 0, isOpen: true, menu: [{ id: 'm1', name: 'Phở Bò Tái', price: 75000, emoji: '🍜', category: 'Phở', isBestSeller: true, description: 'Nước dùng xương trong vắt' }, { id: 'm2', name: 'Phở Bò Chín', price: 75000, emoji: '🍜', category: 'Phở', description: 'Bò chín mềm đậm đà' }, { id: 'm3', name: 'Quẩy', price: 10000, emoji: '🥐', category: 'Kèm Thêm', description: 'Quẩy chiên giòn' }] },
    { id: '3', name: 'Sushi Hokkaido', rating: 4.9, reviews: 892, distance: '2.5 km', tags: ['Nhật Bản', 'Sushi'], emoji: '🍣', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80', isFlashSale: false, discountPercent: 0, deliveryTime: 40, deliveryFee: 25000, isOpen: true, menu: [{ id: 'm1', name: 'Sushi Cá Hồi', price: 185000, emoji: '🍣', category: 'Sushi', isBestSeller: true, description: 'Cá hồi Na Uy tươi' }, { id: 'm2', name: 'Dragon Roll', price: 165000, emoji: '🍱', category: 'Maki', isBestSeller: true, description: 'Tôm tempura, bơ, cá hồi' }] },
    { id: '4', name: "Pizza 4P's", rating: 4.8, reviews: 5210, distance: '1.8 km', tags: ['Pizza', 'Ý'], emoji: '🍕', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80', isFlashSale: true, discountPercent: 20, deliveryTime: 35, deliveryFee: 0, isOpen: true, menu: [{ id: 'm1', name: 'Pizza Margherita', price: 159000, emoji: '🍕', category: 'Pizza', isBestSeller: true, description: 'Sốt cà chua, mozzarella' }, { id: 'm2', name: 'Pizza Pepperoni', price: 189000, emoji: '🍕', category: 'Pizza', description: 'Pepperoni, phô mai 3 loại' }, { id: 'm3', name: 'Pasta Carbonara', price: 145000, emoji: '🍝', category: 'Pasta', isBestSeller: true, description: 'Trứng, phô mai parmesan' }] },
];

export default function TopRatedSection() {
    const router = useRouter();
    const { isFavorite, toggleFavorite } = useFavorites();

    const handlePress = (item: typeof TOP_RATED[0]) => {
        router.push({ pathname: '/restaurant/[id]', params: { id: item.id, data: JSON.stringify(item) } } as any);
    };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={s.title}>⭐ Quán Rating 5 Sao</Text>
                <TouchableOpacity><Text style={s.seeAll}>Xem tất cả</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {TOP_RATED.map((item) => (
                    <TouchableOpacity key={item.id} style={s.card} activeOpacity={0.85} onPress={() => handlePress(item)}>
                        <View style={s.emojiHeader}>
                            <Text style={s.emoji}>{item.emoji}</Text>
                            <View style={s.ratingBadge}>
                                <Ionicons name="star" size={11} color="#FFB627" />
                                <Text style={s.ratingText}>{item.rating}</Text>
                            </View>
                            <TouchableOpacity style={s.heartBtn} onPress={() => toggleFavorite(item.id)} activeOpacity={0.7}>
                                <Ionicons name={isFavorite(item.id) ? 'heart' : 'heart-outline'} size={18} color={isFavorite(item.id) ? '#EF4444' : '#999'} />
                            </TouchableOpacity>
                        </View>
                        <View style={s.info}>
                            <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                            <View style={s.metaRow}>
                                <Ionicons name="location-outline" size={12} color={AppColors.gray} />
                                <Text style={s.metaText}>{item.distance}</Text>
                                <Text style={s.dot}>•</Text>
                                <Text style={s.metaText}>{item.reviews} đánh giá</Text>
                            </View>
                            <View style={s.tagRow}>
                                {item.tags.map((tag) => (
                                    <View key={tag} style={s.tag}><Text style={s.tagText}>{tag}</Text></View>
                                ))}
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
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
