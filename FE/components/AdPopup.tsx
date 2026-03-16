import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal,
    Animated, Dimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

interface AdPopupProps {
    onClose?: () => void;
}

export default function AdPopup({ onClose }: AdPopupProps) {
    const [visible, setVisible] = useState(false);
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const floatingAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Show popup after home screen has fully loaded
        const timer = setTimeout(() => {
            setVisible(true);
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                // Add a subtle floating animation
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(floatingAnim, {
                            toValue: -15,
                            duration: 1500,
                            useNativeDriver: true,
                        }),
                        Animated.timing(floatingAnim, {
                            toValue: 0,
                            duration: 1500,
                            useNativeDriver: true,
                        }),
                    ])
                ).start();

                // Subtle rotation for the star/emoji
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(rotateAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
                        Animated.timing(rotateAnim, { toValue: -1, duration: 2000, useNativeDriver: true }),
                    ])
                ).start();
            });
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 0.8, duration: 250, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start(() => {
            setVisible(false);
            onClose?.();
        });
    };

    const rotation = rotateAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-10deg', '10deg'],
    });

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
            <Animated.View style={[s.overlay, { opacity: opacityAnim }]}>
                <TouchableOpacity style={s.overlayTouch} activeOpacity={1} onPress={handleClose} />
                
                <Animated.View
                    style={[
                        s.popup,
                        {
                            transform: [
                                { scale: scaleAnim },
                                { translateY: floatingAnim }
                            ],
                            opacity: opacityAnim,
                        },
                    ]}
                >
                    {/* Using the original orange gradient theme */}
                    <LinearGradient
                        colors={['#FF6B35', '#E55A2B', '#C44A20']}
                        style={s.popupGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {/* Close Button */}
                        <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
                            <Ionicons name="close" size={22} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>

                        {/* Decorative circles from original style */}
                        <View style={s.circle1} />
                        <View style={s.circle2} />
                        <View style={s.circle3} />

                        {/* Content */}
                        <Animated.Text style={[s.emoji, { transform: [{ translateY: floatingAnim }] }]}>
                            🚚
                        </Animated.Text>

                        <View style={s.contentBox}>
                            <Text style={s.badge}>ƯU ĐÃI ĐẶC BIỆT</Text>
                            <Text style={s.title}>FREE SHIP</Text>
                            <Text style={s.subtitle}>CHO ĐƠN HÀNG TỪ 150K</Text>
                            
                            <View style={s.divider} />
                            
                            <View style={s.infoBox}>
                                <Text style={s.infoText}>Áp dụng cho toàn bộ cửa hàng</Text>
                                <Text style={s.highlightText}>ƯU ĐÃI GIỚI HẠN</Text>
                            </View>
                            
                            <Text style={s.footerText}>Quảng bá chương trình siêu hội thực thần</Text>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
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
    emoji: { fontSize: 72, marginBottom: 12 },
    contentBox: {
        alignItems: 'center',
        width: '100%',
    },
    badge: {
        fontSize: 12, fontWeight: '800', color: '#fff',
        letterSpacing: 2, marginBottom: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16, paddingVertical: 4, borderRadius: 12,
    },
    title: {
        fontSize: 48, fontWeight: '900', color: '#fff',
        marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 18, color: 'rgba(255,255,255,0.9)',
        fontWeight: '800', marginBottom: 20, textAlign: 'center',
    },
    divider: {
        width: 50, height: 4, backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 2, marginBottom: 24,
    },
    infoBox: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 24, paddingVertical: 14,
        borderRadius: 16, borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        borderStyle: 'dashed',
        alignItems: 'center', marginBottom: 24,
    },
    infoText: {
        fontSize: 14, color: 'rgba(255,255,255,0.8)',
        fontWeight: '600', marginBottom: 4,
    },
    highlightText: {
        fontSize: 20, fontWeight: '900', color: '#fff',
        letterSpacing: 1,
    },
    footerText: {
        fontSize: 12, color: 'rgba(255,255,255,0.6)',
        fontWeight: '500', fontStyle: 'italic',
    },
    bottomDots: {
        flexDirection: 'row', gap: 6, marginTop: 24,
    },
    dot: {
        width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff',
    }
});
