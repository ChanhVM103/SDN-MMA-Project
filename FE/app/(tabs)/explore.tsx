import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, FlatList,
    TouchableOpacity, Image, Platform, Dimensions,
    TextInput, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 12) / 3; // 3 cột

// ── Mock Data ─────────────────────────────────────
const BANNERS = [
    'Deal Hot Hôm Nay Từ 0đ...',
    'Miễn phí ship đơn đầu',
    'Giảm 50k cho thành viên mới',
];

const QUICK_CATEGORIES = [
    { id: '1', label: 'Sống Khỏe', emoji: '🥗', color: '#E8F5E9' },
    { id: '2', label: 'Giảm 50k', emoji: '🏷️', color: '#FFF3E0' },
    { id: '3', label: '99k Off', emoji: '⚡', color: '#FCE4EC' },
    { id: '4', label: 'No Sung', emoji: '🍜', color: '#E3F2FD' },
    { id: '5', label: 'Freeship', emoji: '🚀', color: '#F3E5F5' },
];

const RESTAURANTS = [
    {
        id: '1',
        name: 'Chè Ngon Phố',
        category: 'Tráng miệng',
        rating: 4.9,
        deliveryTime: 20,
        deliveryFee: 0,
        isFlashSale: true,
        discountPercent: 30,
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80',
        tags: ['Chè', 'Tráng miệng'],
        isNew: false,
        isTopRated: true,
        menu: [
            { id: 'm1', name: 'Chè Thái', price: 35000, emoji: '🍧', category: 'Chè Đặc Biệt', isBestSeller: true, description: 'Chè Thái truyền thống với nước cốt dừa thơm béo' },
            { id: 'm2', name: 'Chè Ba Màu', price: 30000, emoji: '🍨', category: 'Chè Đặc Biệt', description: 'Đậu xanh, đậu đỏ, thạch rau câu' },
            { id: 'm3', name: 'Chè Bưởi', price: 28000, emoji: '🍡', category: 'Chè Truyền Thống', isBestSeller: true, description: 'Bưởi tươi, nước cốt dừa' },
            { id: 'm4', name: 'Chè Hạt Sen', price: 32000, emoji: '🍮', category: 'Chè Truyền Thống', isNew: true, description: 'Hạt sen long nhãn bổ dưỡng' },
            { id: 'm5', name: 'Trà Sữa Trân Châu', price: 40000, emoji: '🧋', category: 'Đồ Uống', isBestSeller: true, description: 'Trân châu đen, trà sữa kem cheese' },
            { id: 'm6', name: 'Sinh Tố Xoài', price: 35000, emoji: '🥭', category: 'Đồ Uống', description: 'Xoài Cát Chu tươi' },
        ],
    },
    {
        id: '2',
        name: 'Bếp Việt - Cơm Văn Phòng',
        category: 'Cơm',
        rating: 4.8,
        deliveryTime: 25,
        deliveryFee: 15000,
        isFlashSale: true,
        discountPercent: 20,
        image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80',
        tags: ['Cơm', 'Món Việt'],
        isNew: false,
        isTopRated: true,
        menu: [
            { id: 'm1', name: 'Cơm Sườn Nướng', price: 55000, emoji: '🍖', category: 'Cơm Phần', isBestSeller: true, description: 'Sườn heo nướng than, dưa cải' },
            { id: 'm2', name: 'Cơm Gà Chiên Mắm', price: 50000, emoji: '🍗', category: 'Cơm Phần', description: 'Gà chiên mắm tỏi, cơm trắng' },
            { id: 'm3', name: 'Canh Chua Cá Lóc', price: 35000, emoji: '🐟', category: 'Canh', isBestSeller: true, description: 'Cá lóc tươi, me, cà chua' },
            { id: 'm4', name: 'Rau Muống Xào Tỏi', price: 25000, emoji: '🥬', category: 'Món Rau', description: 'Rau muống xào tỏi phi thơm' },
        ],
    },
    {
        id: '3',
        name: 'Trà Sữa Tococoto',
        category: 'Trà sữa',
        rating: 4.7,
        deliveryTime: 15,
        deliveryFee: 0,
        isFlashSale: true,
        discountPercent: 15,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
        tags: ['Trà sữa', 'Đồ uống'],
        isNew: false,
        isTopRated: true,
        menu: [
            { id: 'm1', name: 'Trà Sữa Oolong', price: 45000, emoji: '🧋', category: 'Trà Sữa', isBestSeller: true, description: 'Oolong đài loan, trân châu đen' },
            { id: 'm2', name: 'Matcha Latte', price: 55000, emoji: '🍵', category: 'Trà Sữa', isNew: true, description: 'Matcha Nhật Bản nguyên chất' },
            { id: 'm3', name: 'Hồng Trà Kem Cheese', price: 50000, emoji: '☕', category: 'Trà Sữa', isBestSeller: true, description: 'Kem cheese béo ngậy' },
        ],
    },
    {
        id: '4',
        name: 'Bánh Cuốn Nóng Hà Nội',
        category: 'Bánh cuốn',
        rating: 4.6,
        deliveryTime: 30,
        deliveryFee: 10000,
        isFlashSale: true,
        discountPercent: 10,
        image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80',
        tags: ['Bánh cuốn', 'Món Bắc'],
        isNew: true,
        isTopRated: false,
        menu: [
            { id: 'm1', name: 'Bánh Cuốn Thịt', price: 45000, emoji: '🫔', category: 'Bánh Cuốn', isBestSeller: true, description: 'Thịt heo băm, mộc nhĩ, nước mắm chua ngọt' },
            { id: 'm2', name: 'Bánh Cuốn Tôm', price: 55000, emoji: '🦐', category: 'Bánh Cuốn', description: 'Tôm tươi, hành phi thơm' },
            { id: 'm3', name: 'Chả Lụa', price: 20000, emoji: '🍖', category: 'Kèm Thêm', description: 'Chả lụa Huế thượng hạng' },
        ],
    },
    {
        id: '5',
        name: 'Bánh Cuốn Phú Lý',
        category: 'Bánh cuốn',
        rating: 4.5,
        deliveryTime: 25,
        deliveryFee: 0,
        isFlashSale: true,
        discountPercent: 25,
        image: 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=400&q=80',
        tags: ['Bánh cuốn', 'Freeship'],
        isNew: true,
        isTopRated: false,
        menu: [
            { id: 'm1', name: 'Bánh Cuốn Đặc Biệt', price: 60000, emoji: '🫔', category: 'Bánh Cuốn', isBestSeller: true, description: 'Thịt + tôm + trứng + chả' },
            { id: 'm2', name: 'Bánh Cuốn Chay', price: 40000, emoji: '🥬', category: 'Bánh Cuốn', isNew: true, description: 'Nấm, đậu phụ, rau củ' },
        ],
    },
    {
        id: '6',
        name: 'Bún Thúy - Bún Đặc Sản',
        category: 'Bún',
        rating: 4.8,
        deliveryTime: 20,
        deliveryFee: 0,
        isFlashSale: false,
        discountPercent: 0,
        image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80',
        tags: ['Bún bò', 'Freeship'],
        isNew: true,
        isTopRated: false,
        menu: [
            { id: 'm1', name: 'Bún Bò Huế', price: 65000, emoji: '🍲', category: 'Bún', isBestSeller: true, description: 'Nước dùng cay nồng đặc trưng Huế' },
            { id: 'm2', name: 'Bún Riêu Cua', price: 60000, emoji: '🦀', category: 'Bún', description: 'Cua đồng, cà chua, đậu phụ' },
            { id: 'm3', name: 'Bún Thịt Nướng', price: 55000, emoji: '🍖', category: 'Bún', isBestSeller: true, description: 'Thịt nướng than hoa thơm lừng' },
        ],
    },
    {
        id: '7',
        name: 'Ân Thỏa Thích Freeship',
        category: 'Nhiều món',
        rating: 4.7,
        deliveryTime: 35,
        deliveryFee: 0,
        isFlashSale: false,
        discountPercent: 0,
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
        tags: ['Freeship', 'Đa dạng'],
        isNew: false,
        isTopRated: false,
        menu: [
            { id: 'm1', name: 'Gà Rán Giòn', price: 75000, emoji: '🍗', category: 'Gà', isBestSeller: true, description: 'Gà rán 2 miếng, khoai tây chiên' },
            { id: 'm2', name: 'Pizza Mini', price: 65000, emoji: '🍕', category: 'Pizza', description: 'Pizza cá ngừ, phô mai mozzarella' },
            { id: 'm3', name: 'Burger Bò', price: 55000, emoji: '🍔', category: 'Burger', isBestSeller: true, description: 'Bò xay, phô mai, rau xà lách' },
        ],
    },
];

const COLLECTIONS = [
    {
        id: 'topRated',
        title: 'Top Quán Rating 5⭐ tuần này',
        subtitle: 'Gợi ý những tin đồ ẩm thực đánh giá 5⭐',
        data: RESTAURANTS.filter(r => r.isTopRated),
    },
    {
        id: 'new',
        title: 'Quán Mới Lên Sàn',
        subtitle: 'Khám phá ngay hàng loạt quán mới cực ngon',
        data: RESTAURANTS.filter(r => r.isNew),
    },
    {
        id: 'freeship',
        title: 'Ăn Thỏa Thích, Freeship 0Đ',
        subtitle: 'Bánh ngọt, chân gà, bánh tráng trộn... Freeship',
        data: RESTAURANTS.filter(r => r.deliveryFee === 0),
    },
];

// ── Restaurant Card (3 cột, ảnh thật) ────────────
function RestaurantCard({ item, onPress }: { item: typeof RESTAURANTS[0]; onPress: () => void }) {
    return (
        <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
            <View style={s.cardImgWrap}>
                <Image
                    source={{ uri: item.image }}
                    style={s.cardImg}
                    resizeMode="cover"
                />
                {item.isFlashSale && (
                    <View style={s.flashTag}>
                        <Text style={s.flashTagText}>Flash Sale</Text>
                    </View>
                )}
            </View>
            <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
            <View style={s.cardMeta}>
                <Ionicons name="star" size={10} color="#FFB627" />
                <Text style={s.cardRating}>{item.rating}</Text>
                <Text style={s.cardDot}>•</Text>
                <Text style={s.cardTime}>{item.deliveryTime}p</Text>
            </View>
            <Text style={s.cardFee}>
                {item.deliveryFee === 0 ? '🚀 Freeship' : `Ship ${(item.deliveryFee / 1000).toFixed(0)}k`}
            </Text>
        </TouchableOpacity>
    );
}

// ── Collection Section ────────────────────────────
function CollectionSection({
    title, subtitle, data, onPress
}: {
    title: string; subtitle: string;
    data: typeof RESTAURANTS;
    onPress: (item: typeof RESTAURANTS[0]) => void;
}) {
    return (
        <View style={s.section}>
            <View style={s.sectionHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={s.sectionTitle}>{title}</Text>
                    <Text style={s.sectionSub} numberOfLines={1}>{subtitle}</Text>
                </View>
                <TouchableOpacity>
                    <Text style={s.seeAll}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={data}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.hList}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <RestaurantCard item={item} onPress={() => onPress(item)} />
                )}
            />
        </View>
    );
}

// ── Main Screen ───────────────────────────────────
export default function ExploreScreen() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [bannerIdx, setBannerIdx] = useState(0);

    const handleRestaurantPress = (item: typeof RESTAURANTS[0]) => {
        router.push({ pathname: '/restaurant/[id]', params: { id: item.id, data: JSON.stringify(item) } } as any);
    };

    return (
        <View style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <View style={s.searchBar}>
                    <Ionicons name="search-outline" size={16} color={AppColors.gray} />
                    <TextInput
                        style={s.searchInput}
                        placeholder="Deal Hot Hôm Nay Từ 0đ..."
                        placeholderTextColor={AppColors.gray}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Quick Categories */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickCats}>
                    {QUICK_CATEGORIES.map(cat => (
                        <TouchableOpacity key={cat.id} style={s.quickCat} activeOpacity={0.7}>
                            <View style={[s.quickCatCircle, { backgroundColor: cat.color }]}>
                                <Text style={s.quickCatEmoji}>{cat.emoji}</Text>
                            </View>
                            <Text style={s.quickCatLabel}>{cat.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Collections */}
                {COLLECTIONS.map(col => (
                    <CollectionSection
                        key={col.id}
                        title={col.title}
                        subtitle={col.subtitle}
                        data={col.data}
                        onPress={handleRestaurantPress}
                    />
                ))}

                <View style={{ height: 80 }} />
            </ScrollView>
        </View>
    );
}

// ── Styles ────────────────────────────────────────
const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },

    header: {
        paddingTop: Platform.OS === 'ios' ? 56 : 36,
        paddingHorizontal: Spacing.lg,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#F5F5F5',
        borderRadius: BorderRadius.full,
        paddingHorizontal: 14, paddingVertical: 10,
    },
    searchInput: { flex: 1, fontSize: 14, color: AppColors.charcoal },

    // Quick categories
    quickCats: { paddingHorizontal: Spacing.lg, paddingVertical: 16, gap: 16 },
    quickCat: { alignItems: 'center', gap: 6 },
    quickCatCircle: {
        width: 52, height: 52, borderRadius: 26,
        justifyContent: 'center', alignItems: 'center',
    },
    quickCatEmoji: { fontSize: 24 },
    quickCatLabel: { fontSize: 11, fontWeight: '600', color: AppColors.charcoal, textAlign: 'center' },

    // Section
    section: { marginBottom: 8 },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'flex-start',
        paddingHorizontal: Spacing.lg, marginBottom: 10,
    },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: AppColors.charcoal },
    sectionSub: { fontSize: 12, color: AppColors.gray, marginTop: 2 },
    seeAll: { fontSize: 13, fontWeight: '600', color: AppColors.primary, marginTop: 2 },
    hList: { paddingHorizontal: Spacing.lg, gap: 10 },

    // Card
    card: { width: CARD_WIDTH },
    cardImgWrap: {
        width: CARD_WIDTH,
        height: CARD_WIDTH,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        marginBottom: 6,
        backgroundColor: '#F3F4F6',
        position: 'relative',
    },
    cardImg: { width: '100%', height: '100%' },
    flashTag: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: AppColors.primary,
        paddingVertical: 3, alignItems: 'center',
    },
    flashTagText: { fontSize: 10, fontWeight: '800', color: '#fff' },
    cardName: { fontSize: 12, fontWeight: '700', color: AppColors.charcoal, marginBottom: 2 },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 },
    cardRating: { fontSize: 11, fontWeight: '700', color: AppColors.charcoal },
    cardDot: { fontSize: 11, color: AppColors.gray },
    cardTime: { fontSize: 11, color: AppColors.gray },
    cardFee: { fontSize: 11, color: AppColors.primary, fontWeight: '600' },
});
