import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/constants/auth-context';
import { useRouter } from 'expo-router';

export default function FavoritesScreen() {
    const { user } = useAuth();
    const router = useRouter();

    if (!user) {
        return (
            <View style={s.container}>
                <LinearGradient colors={['#EF4444', '#DC2626']} style={s.header}>
                    <Text style={s.headerTitle}>Đã thích</Text>
                </LinearGradient>
                <View style={s.emptyContainer}>
                    <Text style={{ fontSize: 56, marginBottom: 16 }}>💝</Text>
                    <Text style={s.emptyTitle}>Danh sách yêu thích trống</Text>
                    <Text style={s.emptySubtitle}>Đăng nhập để lưu các món ăn yêu thích</Text>
                    <TouchableOpacity onPress={() => router.push('/sign-in' as any)}>
                        <LinearGradient colors={['#EF4444', '#DC2626']} style={s.btn}>
                            <Text style={s.btnText}>Đăng nhập</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={s.container}>
            <LinearGradient colors={['#EF4444', '#DC2626']} style={s.header}>
                <Text style={s.headerTitle}>Đã thích</Text>
            </LinearGradient>
            <View style={s.emptyContainer}>
                <Text style={{ fontSize: 56, marginBottom: 16 }}>❤️</Text>
                <Text style={s.emptyTitle}>Chưa có món yêu thích</Text>
                <Text style={s.emptySubtitle}>Nhấn ❤️ để lưu món ăn bạn thích</Text>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppColors.offWhite },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20, paddingHorizontal: Spacing.lg, alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: AppColors.charcoal, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: AppColors.gray, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    btn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: BorderRadius.md },
    btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
