import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { getPublicBrands } from '@/constants/brand-api';

export default function BrandSection() {
    const router = useRouter();
    const [brands, setBrands] = useState<any[]>([]);

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const data = await getPublicBrands();
                setBrands(data || []);
            } catch (error) {
                console.error("Failed to load brands:", error);
            }
        };
        fetchBrands();
    }, []);

    if (brands.length === 0) return null;

    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={s.title}>🎁 Gia nhập Foodie Hub</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
                    <Text style={s.seeAll}>Trở thành đối tác &gt;</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {brands.map((brand, idx) => (
                    <TouchableOpacity
                        key={brand._id || brand.id || `brand-${idx}`}
                        style={s.card}
                        activeOpacity={0.85}
                    >
                        <View style={s.avatarContainer}>
                            {brand.avatar ? (
                                <Image
                                    source={{ uri: brand.avatar }}
                                    style={s.avatar}
                                />
                            ) : (
                                <View style={[s.avatar, s.avatarPlaceholder]}>
                                    <Text style={s.avatarInitial}>
                                        {brand.fullName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text style={s.name} numberOfLines={1}>{brand.fullName}</Text>
                        <View style={s.badge}>
                            <Text style={s.badgeText}>Đối tác</Text>
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
    seeAll: { fontSize: 13, fontWeight: '600', color: AppColors.primary },
    scroll: { gap: 12, paddingBottom: 10 },
    card: {
        width: 100,
        backgroundColor: '#fff',
        borderRadius: BorderRadius.lg,
        padding: 12,
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
            android: { elevation: 2 }
        }),
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f3f4f6',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        backgroundColor: '#e5e7eb',
    },
    avatarInitial: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#9ca3af'
    },
    name: {
        fontSize: 12,
        fontWeight: '700',
        color: AppColors.charcoal,
        textAlign: 'center',
        marginBottom: 4
    },
    badge: {
        backgroundColor: '#d1fae5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '600',
        color: '#10b981'
    }
});
