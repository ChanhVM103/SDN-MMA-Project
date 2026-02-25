import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';

const NEARBY = [
    { id: '1', name: 'Bún Chả Hương Liên', distance: '200m', time: '10 phút', rating: 4.7, emoji: '🍜', promo: 'Giảm 20%' },
    { id: '2', name: 'Cơm Tấm Sài Gòn', distance: '350m', time: '15 phút', rating: 4.5, emoji: '🍚', promo: 'Free ship' },
    { id: '3', name: 'Trà Sữa Gong Cha', distance: '500m', time: '12 phút', rating: 4.6, emoji: '🧋', promo: '' },
    { id: '4', name: 'Bánh Mì Phượng', distance: '800m', time: '18 phút', rating: 4.8, emoji: '🥖', promo: 'Mua 2 giảm 1' },
];

export default function NearbySection() {
    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={s.title}>📍 Gần bạn</Text>
                <TouchableOpacity>
                    <Text style={s.seeAll}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>
            {NEARBY.map((item, idx) => (
                <TouchableOpacity key={item.id} style={[s.card, idx < NEARBY.length - 1 && { marginBottom: 10 }]} activeOpacity={0.7}>
                    <View style={s.emojiBox}>
                        <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
                    </View>
                    <View style={s.info}>
                        <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                        <View style={s.metaRow}>
                            <Ionicons name="star" size={12} color="#FFB627" />
                            <Text style={s.metaText}>{item.rating}</Text>
                            <Text style={s.dot}>•</Text>
                            <Ionicons name="location-outline" size={12} color={AppColors.gray} />
                            <Text style={s.metaText}>{item.distance}</Text>
                            <Text style={s.dot}>•</Text>
                            <Ionicons name="time-outline" size={12} color={AppColors.gray} />
                            <Text style={s.metaText}>{item.time}</Text>
                        </View>
                    </View>
                    {item.promo ? (
                        <View style={s.promoBadge}>
                            <Text style={s.promoText}>{item.promo}</Text>
                        </View>
                    ) : (
                        <Ionicons name="chevron-forward" size={18} color={AppColors.gray} />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
}

const s = StyleSheet.create({
    container: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    title: { fontSize: 18, fontWeight: '800', color: AppColors.charcoal },
    seeAll: { fontSize: 14, fontWeight: '600', color: AppColors.primary },
    card: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: BorderRadius.md, padding: 12, gap: 12,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
            android: { elevation: 3 },
        }),
    },
    emojiBox: {
        width: 50, height: 50, borderRadius: 14,
        backgroundColor: '#FFF3ED', justifyContent: 'center', alignItems: 'center',
    },
    info: { flex: 1 },
    name: { fontSize: 14, fontWeight: '700', color: AppColors.charcoal, marginBottom: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: AppColors.gray },
    dot: { fontSize: 8, color: AppColors.gray },
    promoBadge: {
        backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    },
    promoText: { fontSize: 10, fontWeight: '700', color: '#EF4444' },
});
