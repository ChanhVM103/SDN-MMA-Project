import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';

const NEARBY = [
    { id: '1', name: 'Bún Chả Hương Liên', distance: '200m', time: '10 phút', rating: 4.7, emoji: '🍜', promo: 'Giảm 20%', isFlashSale: true, discountPercent: 20, deliveryTime: 10, deliveryFee: 0, isOpen: true, image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80', tags: ['Bún chả', 'Hà Nội'], menu: [{ id: 'm1', name: 'Bún Chả Đặc Biệt', price: 65000, emoji: '🍜', category: 'Bún Chả', isBestSeller: true, description: 'Chả viên + chả miếng, bún tươi' }, { id: 'm2', name: 'Nem Rán', price: 35000, emoji: '🥟', category: 'Kèm Thêm', description: 'Nem rán giòn, nước chấm chua ngọt' }] },
    { id: '2', name: 'Cơm Tấm Sài Gòn', distance: '350m', time: '15 phút', rating: 4.5, emoji: '🍚', promo: 'Free ship', isFlashSale: false, discountPercent: 0, deliveryTime: 15, deliveryFee: 0, isOpen: true, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80', tags: ['Cơm tấm', 'Sài Gòn'], menu: [{ id: 'm1', name: 'Cơm Tấm Sườn Bì Chả', price: 55000, emoji: '🍖', category: 'Cơm Tấm', isBestSeller: true, description: 'Sườn nướng, bì, chả trứng' }, { id: 'm2', name: 'Cơm Tấm Gà Nướng', price: 50000, emoji: '🍗', category: 'Cơm Tấm', description: 'Gà nướng mật ong' }] },
    { id: '3', name: 'Trà Sữa Gong Cha', distance: '500m', time: '12 phút', rating: 4.6, emoji: '🧋', promo: '', isFlashSale: false, discountPercent: 0, deliveryTime: 12, deliveryFee: 15000, isOpen: true, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', tags: ['Trà sữa', 'Đài Loan'], menu: [{ id: 'm1', name: 'Trà Sữa Trân Châu', price: 45000, emoji: '🧋', category: 'Trà Sữa', isBestSeller: true, description: 'Trân châu đen, trà sữa',isCustomizable: true }, { id: 'm2', name: 'Matcha Latte', price: 55000, emoji: '🍵', category: 'Trà Sữa', isNew: true, description: 'Matcha Nhật nguyên chất',isCustomizable: true }] },
    { id: '4', name: 'Bánh Mì Phượng', distance: '800m', time: '18 phút', rating: 4.8, emoji: '🥖', promo: 'Mua 2 giảm 1', isFlashSale: true, discountPercent: 50, deliveryTime: 18, deliveryFee: 10000, isOpen: true, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', tags: ['Bánh mì', 'Hội An'], menu: [{ id: 'm1', name: 'Bánh Mì Thịt Đặc Biệt', price: 30000, emoji: '🥖', category: 'Bánh Mì', isBestSeller: true, description: 'Thịt, pate, rau sống, dưa leo' }, { id: 'm2', name: 'Bánh Mì Chả Cá', price: 28000, emoji: '🐟', category: 'Bánh Mì', description: 'Chả cá Hội An đặc sản' }] },
];

export default function NearbySection() {
    const router = useRouter();

    const handlePress = (item: typeof NEARBY[0]) => {
        router.push({ pathname: '/restaurant/[id]', params: { id: item.id, data: JSON.stringify(item) } } as any);
    };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={s.title}>📍 Gần bạn</Text>
                <TouchableOpacity><Text style={s.seeAll}>Xem tất cả</Text></TouchableOpacity>
            </View>
            {NEARBY.map((item, idx) => (
                <TouchableOpacity key={item.id} style={[s.card, idx < NEARBY.length - 1 && { marginBottom: 10 }]} activeOpacity={0.7} onPress={() => handlePress(item)}>
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
                        <View style={s.promoBadge}><Text style={s.promoText}>{item.promo}</Text></View>
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
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: BorderRadius.md, padding: 12, gap: 12, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 3 } }) },
    emojiBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#FFF3ED', justifyContent: 'center', alignItems: 'center' },
    info: { flex: 1 },
    name: { fontSize: 14, fontWeight: '700', color: AppColors.charcoal, marginBottom: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: AppColors.gray },
    dot: { fontSize: 8, color: AppColors.gray },
    promoBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    promoText: { fontSize: 10, fontWeight: '700', color: '#EF4444' },
});
