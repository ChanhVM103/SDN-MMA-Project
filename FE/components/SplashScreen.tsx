import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    // Animations
    const logoScale = useRef(new Animated.Value(0)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const textSlide = useRef(new Animated.Value(30)).current;
    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const dotsOpacity = useRef(new Animated.Value(0)).current;
    const screenOpacity = useRef(new Animated.Value(1)).current;

    // Dot bounce animations
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Step 1: Logo pop in
        Animated.sequence([
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    friction: 5,
                    tension: 60,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),

            // Step 2: App name slides up
            Animated.parallel([
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(textSlide, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),

            // Step 3: Tagline fades in
            Animated.timing(taglineOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),

            // Step 4: Loading dots appear
            Animated.timing(dotsOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Bounce loading dots
            const bounceDot = (dot: Animated.Value, delay: number) =>
                Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(dot, { toValue: -8, duration: 300, useNativeDriver: true }),
                        Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
                    ])
                );

            Animated.parallel([
                bounceDot(dot1, 0),
                bounceDot(dot2, 150),
                bounceDot(dot3, 300),
            ]).start();

            // After 1.5s, fade out and call onFinish
            setTimeout(() => {
                Animated.timing(screenOpacity, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }).start(() => onFinish());
            }, 1500);
        });
    }, []);

    return (
        <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
            <LinearGradient
                colors={['#FF6B35', '#E55A2B', '#C44A20']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Decorative circles */}
                <View style={styles.circle1} />
                <View style={styles.circle2} />
                <View style={styles.circle3} />
                <View style={styles.circle4} />

                {/* Logo */}
                <Animated.View
                    style={[
                        styles.logoWrapper,
                        {
                            opacity: logoOpacity,
                            transform: [{ scale: logoScale }],
                        },
                    ]}
                >
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoEmoji}>🍽️</Text>
                    </View>
                </Animated.View>

                {/* App Name */}
                <Animated.View
                    style={{
                        opacity: textOpacity,
                        transform: [{ translateY: textSlide }],
                        alignItems: 'center',
                    }}
                >
                    <Text style={styles.appName}>FoodieHub</Text>
                </Animated.View>

                {/* Tagline */}
                <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
                    Khám phá món ngon mỗi ngày
                </Animated.Text>

                {/* Loading Dots */}
                <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
                    {[dot1, dot2, dot3].map((dot, i) => (
                        <Animated.View
                            key={i}
                            style={[styles.dot, { transform: [{ translateY: dot }] }]}
                        />
                    ))}
                </Animated.View>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    // Decorative background circles
    circle1: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(255,255,255,0.06)',
        top: -80,
        right: -80,
    },
    circle2: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.05)',
        top: 60,
        left: -60,
    },
    circle3: {
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(255,255,255,0.04)',
        bottom: -60,
        left: -40,
    },
    circle4: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.06)',
        bottom: 80,
        right: -40,
    },
    // Logo
    logoWrapper: {
        marginBottom: 24,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 20,
            },
            android: { elevation: 12 },
        }),
    },
    logoEmoji: {
        fontSize: 60,
    },
    appName: {
        fontSize: 40,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 1,
        marginBottom: 10,
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '500',
        marginBottom: 60,
    },
    // Loading dots
    dotsRow: {
        flexDirection: 'row',
        gap: 10,
        position: 'absolute',
        bottom: 80,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
});
