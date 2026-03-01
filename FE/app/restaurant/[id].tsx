import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, SectionList, TouchableOpacity,
    Animated, Platform, Dimensions, ScrollView, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = 240;

interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    emoji: string;
    category: string;
    isBestSeller?: boolean;
    isNew?: boolean;
}

interface SectionData {
    title: string;
    data: MenuItem[];
}

// ── Skeleton ──────────────────────────────────────
function Skeleton() {
    const anim = useRef(new Animated.Value(0.4)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={{ opacity: anim }}>
            <View style={sk.hero} />
            <View style={sk.info}>
                <View style={sk.title} />
                <View style={sk.sub} />
                <View style={sk.statsRow}>
                    {[1, 2, 3].map(i => <View key={i} style={sk.stat} />)}
                </View>
            </View>
            {[1, 2, 3, 4, 5].map(i => (
                <View key={i} style={sk.item}>
                    <View style={sk.itemImg} />
                    <View style={sk.itemRight}>
                        <View style={sk.l1} />
                        <View style={sk.l2} />
                        <View style={sk.l3} />
                    </View>
                </View>
            ))}
        </Animated.View>
    );
}

// ── Menu Item ─────────────────────────────────────
function MenuCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
    return (
        <View style={s.menuItem}>
            <View style={s.menuImgBox}>
                <Text style={s.menuEmoji}>{item.emoji}</Text>
                {item.isBestSeller && (
                    <View style={s.bestTag}>
                        <Text style={s.bestTagText}>🔥 Bán chạy</Text>
                    </View>
                )}
                {item.isNew && (
                    <View style={s.newTag}>
                        <Text style={s.newTagText}>Mới</Text>
                    </View>
                )}
            </View>
            <View style={s.menuInfo}>
                <Text style={s.menuName}>{item.name}</Text>
                {!!item.description && (
                    <Text style={s.menuDesc} numberOfLines={2}>{item.description}</Text>
                )}
                <Text style={s.menuPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
            </View>
            <TouchableOpacity style={s.addBtn} onPress={onAdd}>
                <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

// ── Main Screen ───────────────────────────────────
export default function RestaurantDetailScreen() {
    const { id, data } = useLocalSearchParams<{ id: string; data: string }>();
    const router = useRouter();

    const [restaurant, setRestaurant] = useState<any>(null);
    const [sections, setSections] = useState<SectionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('');
    const [cart, setCart] = useState<Record<string, number>>({});

    const scrollY = useRef(new Animated.Value(0)).current;
    const sectionListRef = useRef<SectionList>(null);
    const tabScrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        // Parse dữ liệu từ params (mock data)
        try {
            const parsed = JSON.parse(data || '{}');
            setRestaurant(parsed);

            // Nhóm menu theo category
            const grouped: Record<string, MenuItem[]> = {};
            (parsed.menu || []).forEach((item: MenuItem) => {
                if (!grouped[item.category]) grouped[item.category] = [];
                grouped[item.category].push(item);
            });
            const secs = Object.keys(grouped).map(cat => ({ title: cat, data: grouped[cat] }));
            setSections(secs);
            if (secs.length > 0) setActiveTab(secs[0].title);
        } catch (e) {
            console.error(e);
        } finally {
            setTimeout(() => setLoading(false), 800); // giả lập loading
        }
    }, []);

    // Animated values
    const navBg = scrollY.interpolate({ inputRange: [HERO_HEIGHT - 80, HERO_HEIGHT - 40], outputRange: [0, 1], extrapolate: 'clamp' });
    const heroOpacity = scrollY.interpolate({ inputRange: [0, HERO_HEIGHT - 60], outputRange: [1, 0], extrapolate: 'clamp' });

    const cartTotal = Object.values(cart).reduce((a, b) => a + b, 0);

    const handleTabPress = (title: string, idx: number) => {
        setActiveTab(title);
        sectionListRef.current?.scrollToLocation({
            sectionIndex: idx, itemIndex: 0,
            animated: true, viewOffset: 100,
        });
    };

    const handleAdd = (itemId: string) => {
        setCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    };

    if (loading) {
        return (
            <View style={s.container}>
                <TouchableOpacity style={s.fabBack} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <ScrollView><Skeleton /></ScrollView>
            </View>
        );
    }

    if (!restaurant) return null;

    return (
        <View style={s.container}>
            {/* Nav bar mờ dần khi scroll */}
            <Animated.View style={[s.navBar, { opacity: navBg }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={AppColors.charcoal} />
                </TouchableOpacity>
                <Text style={s.navTitle} numberOfLines={1}>{restaurant.name}</Text>
                <TouchableOpacity>
                    <Ionicons name="share-outline" size={22} color={AppColors.charcoal} />
                </TouchableOpacity>
            </Animated.View>

            {/* Nút back khi ở hero */}
            <Animated.View style={[s.fabBack, { opacity: heroOpacity }]}>
                <TouchableOpacity onPress={() => router.back()} style={s.fabBackBtn}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
            </Animated.View>

            <SectionList
                ref={sectionListRef}
                sections={sections}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}

                ListHeaderComponent={
                    <View>
                        {/* Hero ảnh */}
                        <View style={s.hero}>
                            <Image
                                source={{ uri: restaurant.image }}
                                style={s.heroImg}
                                resizeMode="cover"
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.5)']}
                                style={s.heroOverlay}
                            />
                        </View>

                        {/* Info card */}
                        <View style={s.infoCard}>
                            <View style={s.infoTop}>
                                <Text style={s.restName}>{restaurant.name}</Text>
                                <View style={[s.statusChip, { backgroundColor: restaurant.isOpen !== false ? '#D1FAE5' : '#FEE2E2' }]}>
                                    <View style={[s.statusDot, { backgroundColor: restaurant.isOpen !== false ? '#10B981' : '#EF4444' }]} />
                                    <Text style={[s.statusText, { color: restaurant.isOpen !== false ? '#065F46' : '#991B1B' }]}>
                                        {restaurant.isOpen !== false ? 'Đang mở' : 'Đóng cửa'}
                                    </Text>
                                </View>
                            </View>

                            {/* Tags */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                                <View style={s.tagsRow}>
                                    {(restaurant.tags || []).map((tag: string) => (
                                        <View key={tag} style={s.tag}>
                                            <Text style={s.tagText}>{tag}</Text>
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>

                            {/* Stats */}
                            <View style={s.statsBox}>
                                <View style={s.statItem}>
                                    <Ionicons name="star" size={18} color="#FFB627" />
                                    <Text style={s.statVal}>{restaurant.rating}</Text>
                                    <Text style={s.statSub}>Đánh giá</Text>
                                </View>
                                <View style={s.statDivider} />
                                <View style={s.statItem}>
                                    <Ionicons name="time-outline" size={18} color={AppColors.primary} />
                                    <Text style={s.statVal}>{restaurant.deliveryTime}p</Text>
                                    <Text style={s.statSub}>Giao hàng</Text>
                                </View>
                                <View style={s.statDivider} />
                                <View style={s.statItem}>
                                    <Ionicons name="bicycle-outline" size={18} color={AppColors.primary} />
                                    <Text style={s.statVal}>
                                        {restaurant.deliveryFee === 0 ? 'Free' : `${(restaurant.deliveryFee / 1000).toFixed(0)}k`}
                                    </Text>
                                    <Text style={s.statSub}>Phí ship</Text>
                                </View>
                            </View>

                            {/* Flash sale banner */}
                            {restaurant.isFlashSale && (
                                <View style={s.flashBanner}>
                                    <Text style={s.flashBannerText}>⚡ Flash Sale - Giảm {restaurant.discountPercent}% hôm nay!</Text>
                                </View>
                            )}
                        </View>

                        {/* Category tabs */}
                        <View style={s.tabsWrapper}>
                            <ScrollView ref={tabScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsList}>
                                {sections.map((sec, idx) => (
                                    <TouchableOpacity
                                        key={sec.title}
                                        style={[s.tab, activeTab === sec.title && s.tabActive]}
                                        onPress={() => handleTabPress(sec.title, idx)}
                                    >
                                        <Text style={[s.tabText, activeTab === sec.title && s.tabTextActive]}>
                                            {sec.title}
                                        </Text>
                                        {activeTab === sec.title && <View style={s.tabLine} />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                }

                renderSectionHeader={({ section }) => (
                    <View style={s.secHeader}>
                        <Text style={s.secTitle}>{section.title}</Text>
                    </View>
                )}

                renderItem={({ item }) => (
                    <MenuCard item={item} onAdd={() => handleAdd(item.id)} />
                )}

                ItemSeparatorComponent={() => <View style={s.separator} />}
                ListFooterComponent={<View style={{ height: 120 }} />}
            />

            {/* Cart FAB */}
            {cartTotal > 0 && (
                <View style={s.cartFab}>
                    <TouchableOpacity activeOpacity={0.9}>
                        <LinearGradient colors={['#FF6B35', '#E55A2B']} style={s.cartFabInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <View style={s.cartBadge}>
                                <Text style={s.cartBadgeText}>{cartTotal}</Text>
                            </View>
                            <Text style={s.cartFabText}>Xem giỏ hàng</Text>
                            <Text style={s.cartFabPrice}>
                                {Object.entries(cart).reduce((total, [itemId, qty]) => {
                                    const item = sections.flatMap(s => s.data).find(i => i.id === itemId);
                                    return total + (item?.price || 0) * qty;
                                }, 0).toLocaleString('vi-VN')}đ
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },

    navBar: {
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'ios' ? 56 : 36,
        paddingBottom: 12, paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    navTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: AppColors.charcoal, marginHorizontal: 12 },

    fabBack: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 56 : 36,
        left: 16, zIndex: 99,
    },
    fabBackBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center', alignItems: 'center',
    },

    hero: { width, height: HERO_HEIGHT, position: 'relative' },
    heroImg: { width: '100%', height: '100%' },
    heroOverlay: { ...StyleSheet.absoluteFillObject },

    infoCard: {
        backgroundColor: '#fff',
        marginTop: -20,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: Spacing.lg,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 10 },
            android: { elevation: 4 },
        }),
    },
    infoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    restName: { flex: 1, fontSize: 22, fontWeight: '800', color: AppColors.charcoal, marginRight: 10 },
    statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    statusText: { fontSize: 12, fontWeight: '700' },

    tagsRow: { flexDirection: 'row', gap: 8 },
    tag: { backgroundColor: '#FFF3ED', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    tagText: { fontSize: 12, color: AppColors.primary, fontWeight: '600' },

    statsBox: {
        flexDirection: 'row', backgroundColor: '#FFF8F5',
        borderRadius: BorderRadius.md, padding: 14, marginBottom: 12,
    },
    statItem: { flex: 1, alignItems: 'center', gap: 4 },
    statVal: { fontSize: 14, fontWeight: '800', color: AppColors.charcoal },
    statSub: { fontSize: 11, color: AppColors.gray },
    statDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 8 },

    flashBanner: {
        backgroundColor: '#FEF2F2', borderRadius: BorderRadius.md,
        padding: 10, borderWidth: 1, borderColor: '#FECACA',
    },
    flashBannerText: { fontSize: 13, fontWeight: '700', color: '#EF4444', textAlign: 'center' },

    tabsWrapper: {
        backgroundColor: '#fff',
        borderBottomWidth: 1.5, borderBottomColor: '#F3F4F6',
    },
    tabsList: { paddingHorizontal: Spacing.lg },
    tab: { paddingHorizontal: 14, paddingVertical: 12, position: 'relative' },
    tabActive: {},
    tabText: { fontSize: 14, fontWeight: '600', color: AppColors.gray },
    tabTextActive: { color: AppColors.primary },
    tabLine: { position: 'absolute', bottom: 0, left: 14, right: 14, height: 2.5, backgroundColor: AppColors.primary, borderRadius: 2 },

    secHeader: {
        backgroundColor: '#F9FAFB',
        paddingHorizontal: Spacing.lg, paddingVertical: 10,
        borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F3F4F6',
    },
    secTitle: { fontSize: 14, fontWeight: '800', color: AppColors.charcoal },

    menuItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingVertical: 14,
        backgroundColor: '#fff',
    },
    separator: { height: 1, backgroundColor: '#F9FAFB', marginLeft: Spacing.lg + 76 + 14 },
    menuImgBox: {
        width: 80, height: 80, borderRadius: 12,
        backgroundColor: '#FFF3ED',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 14, position: 'relative',
    },
    menuEmoji: { fontSize: 40 },
    bestTag: {
        position: 'absolute', bottom: -6, left: -4,
        backgroundColor: '#FFF3ED', borderRadius: 8, borderWidth: 1, borderColor: '#FFE0CC',
        paddingHorizontal: 5, paddingVertical: 2,
    },
    bestTagText: { fontSize: 9, fontWeight: '700', color: AppColors.primary },
    newTag: {
        position: 'absolute', top: -4, right: -4,
        backgroundColor: '#10B981', borderRadius: 6,
        paddingHorizontal: 5, paddingVertical: 2,
    },
    newTagText: { fontSize: 9, fontWeight: '800', color: '#fff' },

    menuInfo: { flex: 1 },
    menuName: { fontSize: 14, fontWeight: '700', color: AppColors.charcoal, marginBottom: 4 },
    menuDesc: { fontSize: 12, color: AppColors.gray, lineHeight: 16, marginBottom: 6 },
    menuPrice: { fontSize: 15, fontWeight: '800', color: AppColors.primary },

    addBtn: {
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: AppColors.primary,
        justifyContent: 'center', alignItems: 'center',
        marginLeft: 10,
    },

    cartFab: {
        position: 'absolute', bottom: Platform.OS === 'ios' ? 28 : 16,
        left: 20, right: 20,
        borderRadius: BorderRadius.lg, overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: AppColors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12 },
            android: { elevation: 8 },
        }),
    },
    cartFabInner: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14, gap: 10,
    },
    cartBadge: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center', alignItems: 'center',
    },
    cartBadgeText: { fontSize: 12, fontWeight: '800', color: '#fff' },
    cartFabText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#fff' },
    cartFabPrice: { fontSize: 14, fontWeight: '800', color: '#fff' },
});

const sk = StyleSheet.create({
    hero: { width, height: HERO_HEIGHT, backgroundColor: '#E5E7EB' },
    info: { backgroundColor: '#fff', padding: Spacing.lg, marginTop: -20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    title: { height: 22, backgroundColor: '#E5E7EB', borderRadius: 11, width: '60%', marginBottom: 10 },
    sub: { height: 14, backgroundColor: '#F3F4F6', borderRadius: 7, width: '80%', marginBottom: 16 },
    statsRow: { flexDirection: 'row', gap: 10 },
    stat: { flex: 1, height: 56, backgroundColor: '#F3F4F6', borderRadius: 12 },
    item: { flexDirection: 'row', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
    itemImg: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#E5E7EB', marginRight: 14 },
    itemRight: { flex: 1, gap: 8, justifyContent: 'center' },
    l1: { height: 14, backgroundColor: '#E5E7EB', borderRadius: 7, width: '70%' },
    l2: { height: 11, backgroundColor: '#F3F4F6', borderRadius: 6, width: '90%' },
    l3: { height: 16, backgroundColor: '#FFF3ED', borderRadius: 8, width: '30%' },
});
