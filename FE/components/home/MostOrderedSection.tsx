import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

const MOST_ORDERED = [
    { id: '1', name: 'Bún Bò Huế', orders: '12.5k', emoji: '🍜', price: '45.000đ', badge: '#1' },
    { id: '2', name: 'Cơm Gà Xối Mỡ', orders: '9.8k', emoji: '🍗', price: '55.000đ', badge: '#2' },
    { id: '3', name: 'Bánh Mì Thịt', orders: '8.2k', emoji: '🥖', price: '25.000đ', badge: '#3' },
    { id: '4', name: 'Trà Sữa Trân Châu', orders: '7.6k', emoji: '🧋', price: '35.000đ', badge: '#4' },
    { id: '5', name: 'Phở Bò Tái', orders: '6.9k', emoji: '🍲', price: '50.000đ', badge: '#5' },
];

const BADGE_COLORS: Record<string, string[]> = {
    '#1': ['#FFB627', '#FF9500'],
    '#2': ['#9CA3AF', '#6B7280'],
    '#3': ['#D97706', '#B45309'],
};

export default function MostOrderedSection() {
    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={s.title}>🏆 Đặt Nhiều Nhất</Text>
                <TouchableOpacity>
                    <Text style={s.seeAll}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>
            {MOST_ORDERED.map((item, idx) => (
                <TouchableOpacity key={item.id} style={[s.card, idx < MOST_ORDERED.length - 1 && { marginBottom: 10 }]} activeOpacity={0.7}>
                    {/* Rank Badge */}
                    {BADGE_COLORS[item.badge] ? (
                        <LinearGradient colors={BADGE_COLORS[item.badge] as any} style={s.rankBadge}>
                            <Text style={s.rankText}>{item.badge}</Text>
                        </LinearGradient>
                    ) : (
                        <View style={[s.rankBadge, { backgroundColor: '#F3F4F6' }]}>
                            <Text style={[s.rankText, { color: AppColors.darkGray }]}>{item.badge}</Text>
                        </View>
                    )}
                    {/* Emoji */}
                    <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
                    {/* Info */}
                    <View style={s.info}>
                        <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                        <View style={s.metaRow}>
                            <Ionicons name="cart-outline" size={12} color={AppColors.gray} />
                            <Text style={s.metaText}>{item.orders} đã đặt</Text>
                        </View>
                    </View>
                    <Text style={s.price}>{item.price}</Text>
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
    rankBadge: {
        width: 30, height: 30, borderRadius: 8,
        justifyContent: 'center', alignItems: 'center',
    },
    rankText: { fontSize: 12, fontWeight: '800', color: '#fff' },
    info: { flex: 1 },
    name: { fontSize: 14, fontWeight: '700', color: AppColors.charcoal, marginBottom: 3 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: AppColors.gray },
    price: { fontSize: 15, fontWeight: '800', color: AppColors.primary },
});
