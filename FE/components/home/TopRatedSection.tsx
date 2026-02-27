import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

const TOP_RATED = [
    {
        id: '1', name: 'Nhà hàng Hải Sản Biển Đông',
        rating: 5.0, reviews: 1283, distance: '1.2 km',
        tags: ['Hải sản', 'Nướng'], emoji: '🦞',
        gradient: ['#FF6B35', '#FFB627'],
    },
    {
        id: '2', name: 'Phở Thìn Bờ Hồ',
        rating: 4.9, reviews: 3421, distance: '0.8 km',
        tags: ['Phở', 'Việt Nam'], emoji: '🍜',
        gradient: ['#2D6A4F', '#52B788'],
    },
    {
        id: '3', name: 'Sushi Hokkaido',
        rating: 4.9, reviews: 892, distance: '2.5 km',
        tags: ['Nhật Bản', 'Sushi'], emoji: '🍣',
        gradient: ['#6C5CE7', '#A29BFE'],
    },
    {
        id: '4', name: 'Pizza 4P\'s',
        rating: 4.8, reviews: 5210, distance: '1.8 km',
        tags: ['Pizza', 'Ý'], emoji: '🍕',
        gradient: ['#E17055', '#FAB1A0'],
    },
];

export default function TopRatedSection() {
    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={s.title}>⭐ Quán Rating 5 Sao</Text>
                <TouchableOpacity>
                    <Text style={s.seeAll}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {TOP_RATED.map((item) => (
                    <TouchableOpacity key={item.id} style={s.card} activeOpacity={0.85}>
                        {/* Emoji Header */}
                        <View style={[s.emojiHeader, { backgroundColor: item.gradient[0] + '15' }]}>
                            <Text style={s.emoji}>{item.emoji}</Text>
                            <View style={s.ratingBadge}>
                                <Ionicons name="star" size={11} color="#FFB627" />
                                <Text style={s.ratingText}>{item.rating}</Text>
                            </View>
                        </View>
                        {/* Info */}
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
                                    <View key={tag} style={s.tag}>
                                        <Text style={s.tagText}>{tag}</Text>
                                    </View>
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
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
            android: { elevation: 4 },
        }),
    },
    emojiHeader: {
        height: 90, justifyContent: 'center', alignItems: 'center', position: 'relative',
    },
    emoji: { fontSize: 44 },
    ratingBadge: {
        position: 'absolute', top: 8, right: 8,
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: '#fff', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
            android: { elevation: 2 },
        }),
    },
    ratingText: { fontSize: 12, fontWeight: '700', color: AppColors.charcoal },
    info: { padding: 12 },
    name: { fontSize: 14, fontWeight: '700', color: AppColors.charcoal, marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
    metaText: { fontSize: 11, color: AppColors.gray },
    dot: { fontSize: 8, color: AppColors.gray },
    tagRow: { flexDirection: 'row', gap: 6 },
    tag: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    tagText: { fontSize: 10, fontWeight: '600', color: AppColors.darkGray },
});
