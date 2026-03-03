import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal,
    Animated, Dimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppColors, BorderRadius } from '@/constants/theme';

const { width, height } = Dimensions.get('window');
const POPUP_KEY = '@foodiehub_sale_popup_shown';

interface SalePopupProps {
    onClose?: () => void;
}

export default function SalePopup({ onClose }: SalePopupProps) {
    const [visible, setVisible] = useState(false);
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const bounceAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Show popup after home screen has fully loaded
        const timer = setTimeout(() => {
            setVisible(true);
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(bounceAnim, { toValue: -10, duration: 500, useNativeDriver: true }),
                        Animated.timing(bounceAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
                    ])
                ).start();
            });
        }, 3500);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 0.5, duration: 200, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => {
            setVisible(false);
            onClose?.();
        });
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
            <Animated.View style={[s.overlay, { opacity: opacityAnim }]}>
                <TouchableOpacity style={s.overlayTouch} activeOpacity={1} onPress={handleClose} />
                <Animated.View
                    style={[
                        s.popup,
                        {
                            transform: [{ scale: scaleAnim }],
                            opacity: opacityAnim,
                        },
                    ]}
                >
                    <LinearGradient
                        colors={['#FF6B35', '#E55A2B', '#C44A20']}
                        style={s.popupGradient}
                    >
                        {/* Close Button */}
                        <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
                            <Ionicons name="close" size={22} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>

                        {/* Decorative circles */}
                        <View style={s.circle1} />
                        <View style={s.circle2} />
                        <View style={s.circle3} />

                        {/* Content */}
                        <Animated.Text style={[s.emoji, { transform: [{ translateY: bounceAnim }] }]}>
                            🎉
                        </Animated.Text>
                        <Text style={s.badge}>ƯU ĐÃI ĐẶC BIỆT</Text>
                        <Text style={s.title}>Giảm 50%</Text>
                        <Text style={s.subtitle}>Cho đơn hàng đầu tiên của bạn!</Text>
                        <View style={s.codeContainer}>
                            <Text style={s.codeLabel}>Mã giảm giá:</Text>
                            <View style={s.codeBox}>
                                <Text style={s.codeText}>WELCOME50</Text>
                            </View>
                        </View>
                        <Text style={s.expiry}>⏰ Hết hạn sau 24 giờ</Text>

                        <TouchableOpacity style={s.ctaButton} onPress={handleClose} activeOpacity={0.85}>
                            <Text style={s.ctaText}>Đặt hàng ngay!</Text>
                            <Ionicons name="arrow-forward" size={18} color="#FF6B35" />
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayTouch: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
    },
    popup: {
        width: width * 0.85,
        maxWidth: 380,
        borderRadius: 24,
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20 },
            android: { elevation: 20 },
        }),
    },
    popupGradient: {
        paddingVertical: 36,
        paddingHorizontal: 28,
        alignItems: 'center',
        overflow: 'hidden',
    },
    closeBtn: {
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center', alignItems: 'center',
    },
    circle1: {
        position: 'absolute', width: 160, height: 160, borderRadius: 80,
        backgroundColor: 'rgba(255,255,255,0.06)', top: -40, left: -40,
    },
    circle2: {
        position: 'absolute', width: 100, height: 100, borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.04)', bottom: -20, right: -20,
    },
    circle3: {
        position: 'absolute', width: 60, height: 60, borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.08)', top: 60, right: 30,
    },
    emoji: { fontSize: 64, marginBottom: 12 },
    badge: {
        fontSize: 12, fontWeight: '800', color: '#fff',
        letterSpacing: 2, marginBottom: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16, paddingVertical: 4, borderRadius: 12,
    },
    title: {
        fontSize: 42, fontWeight: '900', color: '#fff',
        marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 16, color: 'rgba(255,255,255,0.9)',
        fontWeight: '600', marginBottom: 20, textAlign: 'center',
    },
    codeContainer: {
        alignItems: 'center', marginBottom: 12,
    },
    codeLabel: {
        fontSize: 12, color: 'rgba(255,255,255,0.7)',
        fontWeight: '500', marginBottom: 6,
    },
    codeBox: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
        borderStyle: 'dashed', borderRadius: 12,
        paddingHorizontal: 24, paddingVertical: 10,
    },
    codeText: {
        fontSize: 22, fontWeight: '900', color: '#fff',
        letterSpacing: 3,
    },
    expiry: {
        fontSize: 13, color: 'rgba(255,255,255,0.8)',
        fontWeight: '500', marginBottom: 20,
    },
    ctaButton: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#fff', borderRadius: 16,
        paddingHorizontal: 32, paddingVertical: 14,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
            android: { elevation: 6 },
        }),
    },
    ctaText: {
        fontSize: 16, fontWeight: '800', color: '#FF6B35',
    },
});
