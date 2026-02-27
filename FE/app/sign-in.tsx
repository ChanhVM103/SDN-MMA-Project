import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ScrollView, Animated,
    Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { authAPI } from '@/constants/api';
import { GOOGLE_CONFIG, FACEBOOK_CONFIG } from '@/constants/auth-config';
import { useAuth } from '@/constants/auth-context';

WebBrowser.maybeCompleteAuthSession();
const { height } = Dimensions.get('window');

export default function SignInScreen() {
    const router = useRouter();
    const auth = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });
    const toastAnim = useRef(new Animated.Value(-100)).current;

    const redirectUri = makeRedirectUri({ scheme: 'fe', path: 'sign-in' });

    const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
        webClientId: GOOGLE_CONFIG.webClientId,
        iosClientId: GOOGLE_CONFIG.iosClientId,
        androidClientId: GOOGLE_CONFIG.androidClientId,
        redirectUri,
    });
    const [, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
        clientId: FACEBOOK_CONFIG.appId,
        redirectUri,
    });

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
            Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        ]).start();
    }, []);

    useEffect(() => {
        if (googleResponse?.type === 'success' && googleResponse.authentication?.accessToken) {
            handleSocialLogin('google', googleResponse.authentication.accessToken);
        } else if (googleResponse?.type === 'error') {
            setSocialLoading(null);
        }
    }, [googleResponse]);

    useEffect(() => {
        if (fbResponse?.type === 'success' && fbResponse.authentication?.accessToken) {
            handleSocialLogin('facebook', fbResponse.authentication.accessToken);
        } else if (fbResponse?.type === 'error') {
            setSocialLoading(null);
        }
    }, [fbResponse]);

    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const validateForm = (): boolean => {
        const e: { email?: string; password?: string } = {};
        if (!email.trim()) e.email = 'Vui lòng nhập email';
        else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) e.email = 'Email không hợp lệ';
        if (!password) e.password = 'Vui lòng nhập mật khẩu';
        else if (password.length < 6) e.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success', autoNavigate = false) => {
        setToast({ visible: true, message, type });
        Animated.spring(toastAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }).start();
        setTimeout(() => {
            Animated.timing(toastAnim, { toValue: -150, duration: 300, useNativeDriver: true }).start(() => {
                setToast(t => ({ ...t, visible: false }));
                if (autoNavigate) router.replace('/(tabs)' as any);
            });
        }, 2000);
    };

    const handleSocialLogin = async (provider: 'google' | 'facebook', accessToken: string) => {
        setSocialLoading(provider);
        try {
            const fn = provider === 'google' ? authAPI.googleLogin : authAPI.facebookLogin;
            const res = await fn(accessToken);
            if (res.success) {
                await auth.login(res.data.user, res.data.token);
                showToast(`🎉 Chào mừng, ${res.data.user.fullName}!`, 'success', true);
            }
        } catch (error: any) {
            triggerShake();
            showToast(error.message || 'Đăng nhập thất bại', 'error');
        } finally {
            setSocialLoading(null);
        }
    };

    const handleSignIn = async () => {
        if (!validateForm()) { triggerShake(); return; }
        setIsLoading(true); setErrors({});
        try {
            const res = await authAPI.login({ email: email.trim().toLowerCase(), password });
            if (res.success) {
                await auth.login(res.data.user, res.data.token);
                showToast(`🎉 Chào mừng trở lại, ${res.data.user.fullName}!`, 'success', true);
            }
        } catch (error: any) {
            triggerShake();
            if (error.status === 401) setErrors({ password: 'Email hoặc mật khẩu không đúng' });
            else showToast(error.message || 'Đã có lỗi xảy ra', 'error');
        } finally { setIsLoading(false); }
    };

    const isAnyLoading = isLoading || socialLoading !== null;

    return (
        <View style={s.container}>
            {/* Toast Notification */}
            {toast.visible && (
                <Animated.View style={[s.toast, toast.type === 'success' ? s.toastSuccess : s.toastError, { transform: [{ translateY: toastAnim }] }]}>
                    <Ionicons name={toast.type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={24} color="#fff" />
                    <Text style={s.toastText}>{toast.message}</Text>
                </Animated.View>
            )}
            <LinearGradient colors={['#FF6B35', '#E55A2B', '#C44A20']} style={s.topGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={s.decorCircle1} /><View style={s.decorCircle2} /><View style={s.decorCircle3} />
                <TouchableOpacity style={s.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Animated.View style={[s.logoContainer, { transform: [{ scale: logoScale }] }]}>
                    <Text style={s.logoEmoji}>🍽️</Text>
                    <Text style={s.logoText}>FoodieHub</Text>
                    <Text style={s.logoSubtext}>Chào mừng trở lại!</Text>
                </Animated.View>
            </LinearGradient>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.formContainer}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
                    <Animated.View style={[s.formCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] }]}>
                        <Text style={s.formTitle}>Đăng Nhập</Text>
                        <Text style={s.formSubtitle}>Nhập thông tin để tiếp tục</Text>

                        <View style={s.inputGroup}>
                            <Text style={s.inputLabel}>Địa chỉ Email</Text>
                            <View style={[s.inputContainer, focusedInput === 'email' && s.inputFocused, errors.email && s.inputErr]}>
                                <Ionicons name="mail-outline" size={20} color={errors.email ? AppColors.error : focusedInput === 'email' ? AppColors.primary : AppColors.gray} />
                                <TextInput style={s.input} placeholder="your@email.com" placeholderTextColor={AppColors.gray} value={email}
                                    onChangeText={t => { setEmail(t); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
                                    keyboardType="email-address" autoCapitalize="none" editable={!isAnyLoading}
                                    onFocus={() => setFocusedInput('email')} onBlur={() => setFocusedInput(null)} />
                            </View>
                            {errors.email && <View style={s.errorRow}><Ionicons name="alert-circle" size={14} color={AppColors.error} /><Text style={s.errorText}>{errors.email}</Text></View>}
                        </View>

                        <View style={s.inputGroup}>
                            <Text style={s.inputLabel}>Mật khẩu</Text>
                            <View style={[s.inputContainer, focusedInput === 'password' && s.inputFocused, errors.password && s.inputErr]}>
                                <Ionicons name="lock-closed-outline" size={20} color={errors.password ? AppColors.error : focusedInput === 'password' ? AppColors.primary : AppColors.gray} />
                                <TextInput style={s.input} placeholder="Nhập mật khẩu" placeholderTextColor={AppColors.gray} value={password}
                                    onChangeText={t => { setPassword(t); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
                                    secureTextEntry={!showPassword} editable={!isAnyLoading}
                                    onFocus={() => setFocusedInput('password')} onBlur={() => setFocusedInput(null)} />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={AppColors.gray} />
                                </TouchableOpacity>
                            </View>
                            {errors.password && <View style={s.errorRow}><Ionicons name="alert-circle" size={14} color={AppColors.error} /><Text style={s.errorText}>{errors.password}</Text></View>}
                        </View>

                        <TouchableOpacity style={s.forgotPassword}><Text style={s.forgotPasswordText}>Quên mật khẩu?</Text></TouchableOpacity>

                        <TouchableOpacity activeOpacity={0.85} onPress={handleSignIn} disabled={isAnyLoading}>
                            <LinearGradient colors={isAnyLoading ? ['#ccc', '#bbb'] : ['#FF6B35', '#E55A2B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.primaryButton}>
                                {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <><Text style={s.primaryButtonText}>Đăng Nhập</Text><Ionicons name="arrow-forward" size={20} color="#fff" /></>}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={s.divider}><View style={s.dividerLine} /><Text style={s.dividerText}>hoặc tiếp tục với</Text><View style={s.dividerLine} /></View>

                        <View style={s.socialRow}>
                            <TouchableOpacity style={[s.socialBtn, socialLoading === 'google' && s.socialActive]} onPress={() => { setSocialLoading('google'); googlePromptAsync(); }} disabled={isAnyLoading} activeOpacity={0.7}>
                                {socialLoading === 'google' ? <ActivityIndicator size="small" color={AppColors.primary} /> : <><Text style={s.googleG}>G</Text><Text style={s.socialBtnText}>Google</Text></>}
                            </TouchableOpacity>
                            <TouchableOpacity style={[s.socialBtn, s.fbBtn, socialLoading === 'facebook' && s.socialActive]} onPress={() => { setSocialLoading('facebook'); fbPromptAsync(); }} disabled={isAnyLoading} activeOpacity={0.7}>
                                {socialLoading === 'facebook' ? <ActivityIndicator size="small" color="#fff" /> : <><Ionicons name="logo-facebook" size={22} color="#fff" /><Text style={s.fbBtnText}>Facebook</Text></>}
                            </TouchableOpacity>
                        </View>

                        <View style={s.bottomLink}>
                            <Text style={s.bottomLinkText}>Chưa có tài khoản? </Text>
                            <TouchableOpacity onPress={() => router.replace('/sign-up' as any)}><Text style={s.bottomLinkAction}>Đăng ký</Text></TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppColors.offWhite },
    topGradient: { height: height * 0.32, justifyContent: 'flex-end', paddingBottom: 40, overflow: 'hidden' },
    decorCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)', top: -50, right: -50 },
    decorCircle2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.05)', top: 40, left: -30 },
    decorCircle3: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.1)', bottom: 20, right: 60 },
    backButton: { position: 'absolute', top: Platform.OS === 'ios' ? 56 : 36, left: 20, width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    logoContainer: { alignItems: 'center' },
    logoEmoji: { fontSize: 48, marginBottom: 8 },
    logoText: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 1 },
    logoSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    formContainer: { flex: 1, marginTop: -24 },
    scrollContent: { flexGrow: 1, paddingBottom: 40 },
    formCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: Spacing.lg, paddingTop: 32, paddingBottom: 20, flex: 1, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12 }, android: { elevation: 8 } }) },
    formTitle: { fontSize: 28, fontWeight: '800', color: AppColors.charcoal, marginBottom: 4 },
    formSubtitle: { fontSize: 14, color: AppColors.gray, marginBottom: 28 },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: AppColors.darkGray, marginBottom: 8 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.lightGray, borderRadius: BorderRadius.md, paddingHorizontal: 16, height: 56, borderWidth: 2, borderColor: 'transparent' },
    inputFocused: { borderColor: AppColors.primary, backgroundColor: '#FFF8F5' },
    inputErr: { borderColor: AppColors.error, backgroundColor: '#FFF5F5' },
    input: { flex: 1, fontSize: 15, color: AppColors.charcoal, marginLeft: 12 },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    errorText: { fontSize: 12, color: AppColors.error, fontWeight: '500' },
    forgotPassword: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 },
    forgotPasswordText: { fontSize: 13, fontWeight: '600', color: AppColors.primary },
    primaryButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, height: 56, borderRadius: BorderRadius.md, ...Platform.select({ ios: { shadowColor: AppColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 6 } }) },
    primaryButtonText: { fontSize: 17, fontWeight: '700', color: '#fff' },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
    dividerText: { marginHorizontal: 16, fontSize: 13, color: AppColors.gray, fontWeight: '500' },
    socialRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
    socialBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, height: 54, borderRadius: BorderRadius.md, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB' },
    socialActive: { borderColor: AppColors.primary, backgroundColor: '#FFF8F5' },
    fbBtn: { backgroundColor: '#1877F2', borderColor: '#1877F2' },
    googleG: { fontSize: 16, fontWeight: '700', color: '#4285F4' },
    socialBtnText: { fontSize: 15, fontWeight: '600', color: AppColors.charcoal },
    fbBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
    bottomLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    bottomLinkText: { fontSize: 14, color: AppColors.gray },
    bottomLinkAction: { fontSize: 14, fontWeight: '700', color: AppColors.primary },
    toast: { position: 'absolute', top: 0, left: 20, right: 20, zIndex: 999, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16, ...Platform.select({ ios: { top: 56, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 }, android: { top: 36, elevation: 10 }, default: { top: 20 } }) },
    toastSuccess: { backgroundColor: '#2D6A4F' },
    toastError: { backgroundColor: '#DC2626' },
    toastText: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '600' },
});
