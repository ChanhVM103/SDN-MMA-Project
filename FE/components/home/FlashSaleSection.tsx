import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';

const FLASH_DEALS = [
    { id: '1', name: 'Combo Burger Đôi', original: '180.000đ', sale: '99.000đ', discount: '-45%', emoji: '🍔', sold: 82 },
    { id: '2', name: 'Set Sushi 12 Miếng', original: '320.000đ', sale: '199.000đ', discount: '-38%', emoji: '🍣', sold: 64 },
    { id: '3', name: 'Trà Sữa 1 Lít', original: '75.000đ', sale: '29.000đ', discount: '-61%', emoji: '🧋', sold: 95 },
    { id: '4', name: 'Pizza Size L', original: '250.000đ', sale: '149.000đ', discount: '-40%', emoji: '🍕', sold: 73 },
];

export default function FlashSaleSection() {
    const [timeLeft, setTimeLeft] = useState({ h: 2, m: 15, s: 30 });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                let { h, m, s } = prev;
                s -= 1;
                if (s < 0) { s = 59; m -= 1; }
                if (m < 0) { m = 59; h -= 1; }
                if (h < 0) { h = 0; m = 0; s = 0; }
                return { h, m, s };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const pad = (n: number) => n.toString().padStart(2, '0');

    return (
        <View style={s.container}>
            <View style={s.header}>
                <View style={s.headerLeft}>
                    <Text style={s.title}>⚡ Flash Sale</Text>
                    <View style={s.timerRow}>
                        <View style={s.timerBox}><Text style={s.timerText}>{pad(timeLeft.h)}</Text></View>
                        <Text style={s.timerColon}>:</Text>
                        <View style={s.timerBox}><Text style={s.timerText}>{pad(timeLeft.m)}</Text></View>
                        <Text style={s.timerColon}>:</Text>
                        <View style={s.timerBox}><Text style={s.timerText}>{pad(timeLeft.s)}</Text></View>
                    </View>
                </View>
                <TouchableOpacity>
                    <Text style={s.seeAll}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {FLASH_DEALS.map((item) => (
                    <TouchableOpacity key={item.id} style={s.card} activeOpacity={0.85}>
                        {/* Discount Badge */}
                        <View style={s.discountBadge}>
                            <Text style={s.discountText}>{item.discount}</Text>
                        </View>
                        <View style={s.emojiBox}>
                            <Text style={{ fontSize: 36 }}>{item.emoji}</Text>
                        </View>
                        <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                        <Text style={s.originalPrice}>{item.original}</Text>
                        <Text style={s.salePrice}>{item.sale}</Text>
                        {/* Progress bar */}
                        <View style={s.progressBg}>
                            <LinearGradient
                                colors={['#FF6B35', '#EF4444']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[s.progressFill, { width: `${item.sold}%` }]}
                            />
                        </View>
                        <Text style={s.soldText}>Đã bán {item.sold}%</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { fontSize: 18, fontWeight: '800', color: AppColors.charcoal },
    seeAll: { fontSize: 14, fontWeight: '600', color: AppColors.primary },
    timerRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    timerBox: { backgroundColor: '#EF4444', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
    timerText: { fontSize: 11, fontWeight: '800', color: '#fff' },
    timerColon: { fontSize: 12, fontWeight: '800', color: '#EF4444' },
    scroll: { gap: 12 },
    card: {
        width: 140, backgroundColor: '#fff', borderRadius: BorderRadius.lg,
        padding: 12, alignItems: 'center', position: 'relative', overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
            android: { elevation: 4 },
        }),
    },
    discountBadge: {
        position: 'absolute', top: 0, left: 0,
        backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 3,
        borderBottomRightRadius: 10, borderTopLeftRadius: BorderRadius.lg,
    },
    discountText: { fontSize: 11, fontWeight: '800', color: '#fff' },
    emojiBox: { marginTop: 10, marginBottom: 8 },
    name: { fontSize: 12, fontWeight: '700', color: AppColors.charcoal, textAlign: 'center', marginBottom: 4 },
    originalPrice: { fontSize: 11, color: AppColors.gray, textDecorationLine: 'line-through' },
    salePrice: { fontSize: 16, fontWeight: '800', color: '#EF4444', marginBottom: 8 },
    progressBg: { width: '100%', height: 6, backgroundColor: '#FEE2E2', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    soldText: { fontSize: 10, color: AppColors.gray, marginTop: 4 },
});
