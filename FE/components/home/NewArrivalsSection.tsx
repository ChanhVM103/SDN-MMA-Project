import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { productAPI, API_BASE_URL } from '@/constants/api';

const resolveProductImage = (image: string) => {
    if (!image || typeof image !== 'string') return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80';
    if (image.startsWith('http')) return image;
    const base = API_BASE_URL.replace(/\/api$/, '');
    return image.startsWith('/') ? `${base}${image}` : `${base}/${image}`;
};

export default function NewArrivalsSection() {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNewProducts = async () => {
            try {
                const res = await productAPI.getAllProducts({ limit: 8, sortBy: 'createdAt', sortOrder: -1 });
                if (res.success) {
                    setProducts(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch new products:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNewProducts();
    }, []);

    if (!loading && products.length === 0) return null;

    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={s.title}>✨ Món Mới Lên Kệ</Text>
                <TouchableOpacity onPress={() => router.push('/search' as any)}>
                    <Text style={s.seeAll}>Khám phá</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.scrollContent}
            >
                {loading ? (
                    [1, 2, 3].map((i) => (
                        <View key={i} style={[s.card, s.skeleton]} />
                    ))
                ) : (
                    products.map((item) => (
                        <TouchableOpacity
                            key={item._id}
                            style={s.card}
                            activeOpacity={0.8}
                            onPress={() => router.push({ pathname: '/restaurant/[id]', params: { id: item.restaurantId?._id || item.restaurantId, highlightProduct: item._id } } as any)}
                        >
                            <View style={s.imageContainer}>
                                <Image
                                    source={{ uri: resolveProductImage(item.image) }}
                                    style={s.image}
                                    resizeMode="cover"
                                />
                                {item.isBestSeller && (
                                    <View style={s.badge}>
                                        <Text style={s.badgeText}>HOT</Text>
                                    </View>
                                )}
                            </View>
                            <View style={s.info}>
                                <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                                <Text style={s.restaurant} numberOfLines={1}>
                                    {item.restaurantId?.name || 'Nhà hàng'}
                                </Text>
                                <View style={s.footer}>
                                    <Text style={s.price}>{item.price?.toLocaleString()}đ</Text>
                                    <View style={s.addBtn}>
                                        <Ionicons name="add" size={16} color="#fff" />
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        marginTop: Spacing.xl,
        paddingLeft: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: Spacing.lg,
        marginBottom: 14,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: AppColors.charcoal,
    },
    seeAll: {
        fontSize: 14,
        fontWeight: '600',
        color: AppColors.primary,
    },
    scrollContent: {
        paddingRight: Spacing.lg,
        gap: 12,
    },
    card: {
        width: 160,
        backgroundColor: '#fff',
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    skeleton: {
        height: 200,
        backgroundColor: '#E5E7EB',
    },
    imageContainer: {
        width: '100%',
        height: 120,
        backgroundColor: '#F3F4F6',
    },
    image: { width: '100%', height: '100%' },
    badge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#EF4444',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
    info: {
        padding: 10,
    },
    name: {
        fontSize: 14,
        fontWeight: '700',
        color: AppColors.charcoal,
        marginBottom: 2,
    },
    restaurant: {
        fontSize: 11,
        color: AppColors.gray,
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        fontSize: 14,
        fontWeight: '800',
        color: AppColors.primary,
    },
    addBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: AppColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
