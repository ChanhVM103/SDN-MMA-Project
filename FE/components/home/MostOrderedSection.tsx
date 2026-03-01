import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';

const MOST_ORDERED = [
    { id: '1', name: 'Bún Bò Huế', orders: '12.5k', emoji: '🍜', price: '45.000đ', badge: '#1', isFlashSale: false, discountPercent: 0, deliveryTime: 20, deliveryFee: 10000, isOpen: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80', tags: ['Bún bò', 'Huế'], menu: [{ id: 'm1', name: 'Bún Bò Huế Đặc Biệt', price: 65000, emoji: '🍲', category: 'Bún', isBestSeller: true, description: 'Giò heo, chả cua, huyết heo' }, { id: 'm2', name: 'Bún Bò Thường', price: 45000, emoji: '🍜', category: 'Bún', description: 'Thịt bò, nước dùng cay' }] },
    { id: '2', name: 'Cơm Gà Xối Mỡ', orders: '9.8k', emoji: '🍗', price: '55.000đ', badge: '#2', isFlashSale: false, discountPercent: 0, deliveryTime: 15, deliveryFee: 0, isOpen: true, rating: 4.7, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', tags: ['Cơm gà', 'Freeship'], menu: [{ id: 'm1', name: 'Cơm Gà Xối Mỡ', price: 55000, emoji: '🍗', category: 'Cơm Gà', isBestSeller: true, description: 'Gà xối mỡ giòn, cơm trắng dẻo' }, { id: 'm2', name: 'Cơm Gà Luộc', price: 50000, emoji: '🍚', category: 'Cơm Gà', description: 'Gà ta luộc, nước chấm gừng' }] },
    { id: '3', name: 'Bánh Mì Thịt', orders: '8.2k', emoji: '🥖', price: '25.000đ', badge: '#3', isFlashSale: true, discountPercent: 10, deliveryTime: 10, deliveryFee: 0, isOpen: true, rating: 4.9, image: 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=400&q=80', tags: ['Bánh mì', 'Freeship'], menu: [{ id: 'm1', name: 'Bánh Mì Thịt Đặc Biệt', price: 30000, emoji: '🥖', category: 'Bánh Mì', isBestSeller: true, description: 'Thịt, pate, rau sống, dưa leo' }, { id: 'm2', name: 'Bánh Mì Trứng', price: 20000, emoji: '🥚', category: 'Bánh Mì', description: 'Trứng ốp la, maggi' }] },
    { id: '4', name: 'Trà Sữa Trân Châu', orders: '7.6k', emoji: '🧋', price: '35.000đ', badge: '#4', isFlashSale: false, discountPercent: 0, deliveryTime: 15, deliveryFee: 15000, isOpen: true, rating: 4.6, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', tags: ['Trà sữa'], menu: [{ id: 'm1', name: 'Trà Sữa Trân Châu Đen', price: 35000, emoji: '🧋', category: 'Trà Sữa', isBestSeller: true, description: 'Trân châu đen, trà sữa kem' }, { id: 'm2', name: 'Trà Đào Cam Sả', price: 40000, emoji: '🍑', category: 'Trà Trái Cây', isNew: true, description: 'Đào, cam, sả tươi' }] },
    { id: '5', name: 'Phở Bò Tái', orders: '6.9k', emoji: '🍲', price: '50.000đ', badge: '#5', isFlashSale: false, discountPercent: 0, deliveryTime: 20, deliveryFee: 10000, isOpen: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80', tags: ['Phở', 'Việt Nam'], menu: [{ id: 'm1', name: 'Phở Bò Tái', price: 75000, emoji: '🍜', category: 'Phở', isBestSeller: true, description: 'Bò tái, nước dùng trong' }, { id: 'm2', name: 'Phở Bò Viên', price: 70000, emoji: '🍲', category: 'Phở', description: 'Bò viên dai, nước dùng ngọt' }] },
];

const BADGE_COLORS: Record<string, [string, string]> = {
    '#1': ['#FFB627', '#FF9500'],
    '#2': ['#9CA3AF', '#6B7280'],
    '#3': ['#D97706', '#B45309'],
};

export default function MostOrderedSection() {
    const router = useRouter();

    const handlePress = (item: typeof MOST_ORDERED[0]) => {
        router.push({ pathname: '/restaurant/[id]', params: { id: item.id, data: JSON.stringify(item) } } as any);
    };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={s.title}>🏆 Đặt Nhiều Nhất</Text>
                <Pressable><Text style={s.seeAll}>Xem tất cả</Text></Pressable>
            </View>
            {MOST_ORDERED.map((item, idx) => (
                <Pressable
                    key={item.id}
                    style={({ pressed }) => [s.card, idx < MOST_ORDERED.length - 1 && { marginBottom: 10 }, pressed && { opacity: 0.8 }]}
                    onPress={() => handlePress(item)}
                >
                    {BADGE_COLORS[item.badge] ? (
                        <LinearGradient colors={BADGE_COLORS[item.badge]} style={s.rankBadge}>
                            <Text style={s.rankText}>{item.badge}</Text>
                        </LinearGradient>
                    ) : (
                        <View style={[s.rankBadge, { backgroundColor: '#F3F4F6' }]}>
                            <Text style={[s.rankText, { color: AppColors.darkGray }]}>{item.badge}</Text>
                        </View>
                    )}
                    <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
                    <View style={s.info}>
                        <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                        <View style={s.metaRow}>
                            <Ionicons name="cart-outline" size={12} color={AppColors.gray} />
                            <Text style={s.metaText}>{item.orders} đã đặt</Text>
                        </View>
                    </View>
                    <Text style={s.price}>{item.price}</Text>
                </Pressable>
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
    rankBadge: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    rankText: { fontSize: 12, fontWeight: '800', color: '#fff' },
    info: { flex: 1 },
    name: { fontSize: 14, fontWeight: '700', color: AppColors.charcoal, marginBottom: 3 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: AppColors.gray },
    price: { fontSize: 15, fontWeight: '800', color: AppColors.primary },
});
