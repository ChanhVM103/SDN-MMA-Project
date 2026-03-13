import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, Platform, Animated, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';

import { getAllRestaurants } from '@/constants/restaurant-api';

const SEARCH_HISTORY = ['Burger gà giòn', 'Sushi combo', 'Trà sữa'];

const POPULAR_SEARCHES = [
    { id: '1', name: 'Bún bò', emoji: '🍜' },
    { id: '2', name: 'Gà rán', emoji: '🍗' },
    { id: '3', name: 'Trà sữa', emoji: '🧋' },
    { id: '4', name: 'Cơm tấm', emoji: '🍚' },
    { id: '5', name: 'Bánh tráng', emoji: '🥟' },
    { id: '6', name: 'Chè', emoji: '🍨' },
    { id: '7', name: 'Bánh mì', emoji: '🥖' },
    { id: '8', name: 'Pizza', emoji: '🍕' },
];

const TRENDING_KEYWORDS = [
    { id: '1', text: 'Maycha 1Đ', hot: true },
    { id: '2', text: 'ToCoToCo 1.000Đ', hot: true },
    { id: '3', text: 'Gong Cha Giảm 50%', hot: false },
    { id: '4', text: 'Free Ship Extra', hot: false },
    { id: '5', text: 'Mì cay 7 cấp', hot: false },
];

export default function SearchScreen() {
    const router = useRouter();
    const [searchText, setSearchText] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        // Auto-focus and animate in
        setTimeout(() => inputRef.current?.focus(), 300);
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
    }, []);

    // Search logic with debounce
    useEffect(() => {
        if (searchText.trim().length === 0) {
            setResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await getAllRestaurants({ search: searchText, limit: 20 });
                setResults(Array.isArray(data) ? data : data?.restaurants || []);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchText]);

    const handleBack = () => {
        Keyboard.dismiss();
        router.back();
    };

    const handleSelectRestaurant = (restaurant: any) => {
        router.push({
            pathname: '/restaurant/[id]',
            params: { id: restaurant._id || restaurant.id, data: JSON.stringify(restaurant) }
        } as any);
    };

    return (
        <View style={s.container}>
            {/* Search Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={handleBack} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={AppColors.charcoal} />
                </TouchableOpacity>
                <View style={s.searchBox}>
                    <Ionicons name="search" size={18} color={AppColors.gray} />
                    <TextInput
                        ref={inputRef}
                        style={s.searchInput}
                        placeholder="Tìm món ăn, nhà hàng..."
                        placeholderTextColor={AppColors.gray}
                        value={searchText}
                        onChangeText={setSearchText}
                        returnKeyType="search"
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Ionicons name="close-circle" size={18} color={AppColors.gray} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={s.scrollContent}
            >
                {searchText.length > 0 ? (
                    <View style={s.resultsContainer}>
                        {loading ? (
                            <View style={s.loadingBox}>
                                <Text style={s.loadingText}>Đang tìm kiếm...</Text>
                            </View>
                        ) : results.length > 0 ? (
                            results.map((item, idx) => (
                                <TouchableOpacity
                                    key={item._id || idx}
                                    style={s.resultItem}
                                    onPress={() => handleSelectRestaurant(item)}
                                >
                                    <View style={s.resultIcon}>
                                        <Ionicons name="restaurant-outline" size={20} color={AppColors.primary} />
                                    </View>
                                    <View style={s.resultInfo}>
                                        <Text style={s.resultName}>{item.name}</Text>
                                        <Text style={s.resultAddress} numberOfLines={1}>{item.address}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={AppColors.gray} />
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={s.noResultBox}>
                                <Ionicons name="search-outline" size={48} color={AppColors.lightGray} />
                                <Text style={s.noResultText}>Không tìm thấy nhà hàng nào phù hợp</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        {/* Trending Keywords */}
                        <View style={s.trendingBar}>
                            <Ionicons name="trending-up" size={16} color={AppColors.primary} />
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.trendingScroll}>
                                {TRENDING_KEYWORDS.map((kw) => (
                                    <TouchableOpacity key={kw.id} style={s.trendingChip} activeOpacity={0.7} onPress={() => setSearchText(kw.text)}>
                                        {kw.hot && <Text style={s.hotBadge}>🔥</Text>}
                                        <Text style={s.trendingText}>{kw.text}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Search History */}
                        {SEARCH_HISTORY.length > 0 && (
                            <View style={s.section}>
                                <View style={s.sectionHeader}>
                                    <Text style={s.sectionTitle}>Lịch sử tìm kiếm</Text>
                                    <TouchableOpacity>
                                        <Text style={s.clearText}>Xóa lịch sử tìm kiếm</Text>
                                    </TouchableOpacity>
                                </View>
                                {SEARCH_HISTORY.map((item, idx) => (
                                    <TouchableOpacity key={idx} style={s.historyItem} activeOpacity={0.6} onPress={() => setSearchText(item)}>
                                        <Ionicons name="time-outline" size={18} color={AppColors.gray} />
                                        <Text style={s.historyText}>{item}</Text>
                                        <Ionicons name="arrow-forward-outline" size={16} color={AppColors.gray} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Popular Searches */}
                        <View style={s.section}>
                            <Text style={s.sectionTitle}>Phổ biến</Text>
                            <View style={s.popularGrid}>
                                {POPULAR_SEARCHES.map((item) => (
                                    <TouchableOpacity key={item.id} style={s.popularItem} activeOpacity={0.7} onPress={() => setSearchText(item.name)}>
                                        <View style={s.popularEmoji}>
                                            <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
                                        </View>
                                        <Text style={s.popularName}>{item.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Quick Suggest Tags */}
                        <View style={s.section}>
                            <Text style={s.sectionTitle}>Gợi ý cho bạn</Text>
                            <View style={s.tagRow}>
                                {['Đồ ăn vặt', 'Cơm trưa', 'Món Nhật', 'Healthy', 'Đồ uống', 'Lẩu'].map((tag) => (
                                    <TouchableOpacity key={tag} style={s.tag} activeOpacity={0.7} onPress={() => setSearchText(tag)}>
                                        <Text style={s.tagText}>{tag}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </Animated.View>
                )}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 56 : 36,
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 10,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: BorderRadius.md,
        paddingHorizontal: 14,
        height: 44,
        gap: 10,
        borderWidth: 1.5,
        borderColor: AppColors.primary,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: AppColors.charcoal,
        paddingVertical: 0,
    },

    scrollContent: { paddingBottom: 40 },

    // Trending bar
    trendingBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#FFF8F5',
        gap: 8,
    },
    trendingScroll: { flex: 1 },
    trendingChip: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        gap: 2,
    },
    hotBadge: { fontSize: 12 },
    trendingText: { fontSize: 13, color: AppColors.darkGray, fontWeight: '500' },

    // Section
    section: { paddingHorizontal: 16, marginTop: 20 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: AppColors.charcoal },
    clearText: { fontSize: 13, color: AppColors.gray },

    // History
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 12,
    },
    historyText: { flex: 1, fontSize: 14, color: AppColors.charcoal },

    // Popular grid (2 columns x 4 rows)
    popularGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 4,
    },
    popularItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '47%',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#FAFAFA',
        borderRadius: BorderRadius.md,
        gap: 10,
    },
    popularEmoji: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
            android: { elevation: 2 },
        }),
    },
    popularName: { fontSize: 13, fontWeight: '600', color: AppColors.charcoal },

    // Tags
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 4,
    },
    tag: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BorderRadius.full,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    tagText: { fontSize: 13, fontWeight: '500', color: AppColors.darkGray },

    // Results
    resultsContainer: { paddingHorizontal: 16, marginTop: 10 },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 12,
    },
    resultIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF1ED',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultInfo: { flex: 1, gap: 2 },
    resultName: { fontSize: 15, fontWeight: '600', color: AppColors.charcoal },
    resultAddress: { fontSize: 13, color: AppColors.gray },

    // States
    loadingBox: { padding: 40, alignItems: 'center' },
    loadingText: { color: AppColors.gray, fontSize: 14 },
    noResultBox: { padding: 60, alignItems: 'center', gap: 12 },
    noResultText: { color: AppColors.gray, fontSize: 14, textAlign: 'center' },
});
