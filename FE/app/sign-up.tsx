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

export default function SignUpScreen() {
    const router = useRouter();
    const auth = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });
    const toastAnim = useRef(new Animated.Value(-100)).current;

    const redirectUri = makeRedirectUri({ scheme: 'fe', path: 'sign-up' });

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
        if (googleResponse?.type === 'success' && googleResponse.authentication?.accessToken)
            handleSocialLogin('google', googleResponse.authentication.accessToken);
        else if (googleResponse?.type === 'error') setSocialLoading(null);
    }, [googleResponse]);

    useEffect(() => {
        if (fbResponse?.type === 'success' && fbResponse.authentication?.accessToken)
            handleSocialLogin('facebook', fbResponse.authentication.accessToken);
        else if (fbResponse?.type === 'error') setSocialLoading(null);
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

    const getPasswordStrength = () => {
        if (password.length === 0) return { level: 0, label: '', color: 'transparent' };
        if (password.length < 6) return { level: 1, label: 'Yếu', color: AppColors.error };
        if (password.length < 10) return { level: 2, label: 'Trung bình', color: AppColors.warning };
        return { level: 3, label: 'Mạnh', color: AppColors.success };
    };
    const strength = getPasswordStrength();

    const clearError = (f: string) => { if (errors[f]) setErrors(p => { const u = { ...p }; delete u[f]; return u; }); };

    const validateForm = (): boolean => {
        const e: Record<string, string> = {};
        if (!fullName.trim()) e.fullName = 'Vui lòng nhập họ tên';
        else if (fullName.trim().length < 2) e.fullName = 'Họ tên phải có ít nhất 2 ký tự';
        if (!email.trim()) e.email = 'Vui lòng nhập email';
        else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) e.email = 'Email không hợp lệ';
        if (!password) e.password = 'Vui lòng nhập mật khẩu';
        else if (password.length < 6) e.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        if (!confirmPassword) e.confirmPassword = 'Vui lòng xác nhận mật khẩu';
        else if (password !== confirmPassword) e.confirmPassword = 'Mật khẩu không khớp';
        if (!agreeTerms) e.terms = 'Bạn phải đồng ý với điều khoản';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success', navigateTo?: string) => {
        setToast({ visible: true, message, type });
        Animated.spring(toastAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }).start();
        setTimeout(() => {
            Animated.timing(toastAnim, { toValue: -150, duration: 300, useNativeDriver: true }).start(() => {
                setToast(t => ({ ...t, visible: false }));
                if (navigateTo) router.replace(navigateTo as any);
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
                showToast(`🎉 Chào mừng, ${res.data.user.fullName}!`, 'success', '/(tabs)');
            }
        } catch (error: any) {
            triggerShake();
            showToast(error.message || 'Đăng ký thất bại', 'error');
        } finally { setSocialLoading(null); }
    };

    const handleSignUp = async () => {
        if (!validateForm()) { triggerShake(); return; }
        setIsLoading(true); setErrors({});
        try {
            const res = await authAPI.register({
                fullName: fullName.trim(), email: email.trim().toLowerCase(),
                phone: phone.trim(), password, confirmPassword,
            });
            if (res.success) {
                await auth.login(res.data.user, res.data.token);
                showToast(`🎉 Chào mừng đến FoodieHub, ${res.data.user.fullName}!`, 'success', '/(tabs)');
            }
        } catch (error: any) {
            triggerShake();
            if (error.status === 409) setErrors({ email: error.message || 'Email này đã được đăng ký' });
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
            <LinearGradient colors={['#2D6A4F', '#40916C', '#52B788']} style={s.topGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={s.deco1} /><View style={s.deco2} /><View style={s.deco3} /><View style={s.dot1} /><View style={s.dot2} />
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Animated.View style={[s.logoContainer, { transform: [{ scale: logoScale }] }]}>
                    <Text style={s.logoEmoji}>🍽️</Text>
                    <Text style={s.logoText}>FoodieHub</Text>
                    <Text style={s.logoSub}>Tham gia cộng đồng ẩm thực!</Text>
                </Animated.View>
            </LinearGradient>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.formWrap}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                    <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] }]}>
                        <Text style={s.title}>Tạo Tài Khoản</Text>
                        <Text style={s.subtitle}>Nhập thông tin để bắt đầu</Text>

                        {/* Full Name */}
                        <View style={s.group}>
                            <Text style={s.label}>Họ và tên</Text>
                            <View style={[s.inputBox, focusedInput === 'name' && s.focused, errors.fullName && s.errBox]}>
                                <Ionicons name="person-outline" size={20} color={errors.fullName ? AppColors.error : focusedInput === 'name' ? AppColors.secondary : AppColors.gray} />
                                <TextInput style={s.input} placeholder="Nguyễn Văn A" placeholderTextColor={AppColors.gray} value={fullName}
                                    onChangeText={t => { setFullName(t); clearError('fullName'); }} editable={!isAnyLoading}
                                    onFocus={() => setFocusedInput('name')} onBlur={() => setFocusedInput(null)} />
                            </View>
                            {errors.fullName && <View style={s.errRow}><Ionicons name="alert-circle" size={14} color={AppColors.error} /><Text style={s.errText}>{errors.fullName}</Text></View>}
                        </View>

                        {/* Email */}
                        <View style={s.group}>
                            <Text style={s.label}>Địa chỉ Email</Text>
                            <View style={[s.inputBox, focusedInput === 'email' && s.focused, errors.email && s.errBox]}>
                                <Ionicons name="mail-outline" size={20} color={errors.email ? AppColors.error : focusedInput === 'email' ? AppColors.secondary : AppColors.gray} />
                                <TextInput style={s.input} placeholder="your@email.com" placeholderTextColor={AppColors.gray} value={email}
                                    onChangeText={t => { setEmail(t); clearError('email'); }} keyboardType="email-address" autoCapitalize="none" editable={!isAnyLoading}
                                    onFocus={() => setFocusedInput('email')} onBlur={() => setFocusedInput(null)} />
                            </View>
                            {errors.email && <View style={s.errRow}><Ionicons name="alert-circle" size={14} color={AppColors.error} /><Text style={s.errText}>{errors.email}</Text></View>}
                        </View>

                        {/* Phone */}
                        <View style={s.group}>
                            <Text style={s.label}>Số điện thoại</Text>
                            <View style={[s.inputBox, focusedInput === 'phone' && s.focused]}>
                                <Ionicons name="call-outline" size={20} color={focusedInput === 'phone' ? AppColors.secondary : AppColors.gray} />
                                <TextInput style={s.input} placeholder="+84 xxx xxx xxx" placeholderTextColor={AppColors.gray} value={phone}
                                    onChangeText={setPhone} keyboardType="phone-pad" editable={!isAnyLoading}
                                    onFocus={() => setFocusedInput('phone')} onBlur={() => setFocusedInput(null)} />
                            </View>
                        </View>

                        {/* Password */}
                        <View style={s.group}>
                            <Text style={s.label}>Mật khẩu</Text>
                            <View style={[s.inputBox, focusedInput === 'password' && s.focused, errors.password && s.errBox]}>
                                <Ionicons name="lock-closed-outline" size={20} color={errors.password ? AppColors.error : focusedInput === 'password' ? AppColors.secondary : AppColors.gray} />
                                <TextInput style={s.input} placeholder="Tạo mật khẩu mạnh" placeholderTextColor={AppColors.gray} value={password}
                                    onChangeText={t => { setPassword(t); clearError('password'); }} secureTextEntry={!showPassword} editable={!isAnyLoading}
                                    onFocus={() => setFocusedInput('password')} onBlur={() => setFocusedInput(null)} />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={AppColors.gray} />
                                </TouchableOpacity>
                            </View>
                            {password.length > 0 && (
                                <View style={s.strengthRow}>
                                    <View style={s.strengthBars}>{[1, 2, 3].map(l => <View key={l} style={[s.bar, { backgroundColor: l <= strength.level ? strength.color : '#E5E7EB' }]} />)}</View>
                                    <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                                </View>
                            )}
                            {errors.password && <View style={s.errRow}><Ionicons name="alert-circle" size={14} color={AppColors.error} /><Text style={s.errText}>{errors.password}</Text></View>}
                        </View>

                        {/* Confirm Password */}
                        <View style={s.group}>
                            <Text style={s.label}>Xác nhận mật khẩu</Text>
                            <View style={[s.inputBox, focusedInput === 'confirm' && s.focused, (errors.confirmPassword || (confirmPassword.length > 0 && confirmPassword !== password)) && s.errBox]}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={(confirmPassword.length > 0 && confirmPassword !== password) ? AppColors.error : focusedInput === 'confirm' ? AppColors.secondary : AppColors.gray} />
                                <TextInput style={s.input} placeholder="Nhập lại mật khẩu" placeholderTextColor={AppColors.gray} value={confirmPassword}
                                    onChangeText={t => { setConfirmPassword(t); clearError('confirmPassword'); }} secureTextEntry={!showConfirmPassword} editable={!isAnyLoading}
                                    onFocus={() => setFocusedInput('confirm')} onBlur={() => setFocusedInput(null)} />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={AppColors.gray} />
                                </TouchableOpacity>
                            </View>
                            {confirmPassword.length > 0 && confirmPassword !== password && <View style={s.errRow}><Ionicons name="alert-circle" size={14} color={AppColors.error} /><Text style={s.errText}>Mật khẩu không khớp</Text></View>}
                            {confirmPassword.length > 0 && confirmPassword === password && <View style={s.matchRow}><Ionicons name="checkmark-circle" size={14} color={AppColors.success} /><Text style={s.matchText}>Mật khẩu khớp</Text></View>}
                        </View>

                        {/* Terms */}
                        <TouchableOpacity style={s.termsRow} onPress={() => { setAgreeTerms(!agreeTerms); clearError('terms'); }} activeOpacity={0.7} disabled={isAnyLoading}>
                            <View style={[s.checkbox, agreeTerms && s.checked, errors.terms && s.checkErr]}>
                                {agreeTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
                            </View>
                            <Text style={s.termsText}>Tôi đồng ý với <Text style={s.termsLink}>Điều khoản dịch vụ</Text> và <Text style={s.termsLink}>Chính sách bảo mật</Text></Text>
                        </TouchableOpacity>
                        {errors.terms && <View style={[s.errRow, { marginTop: -16, marginBottom: 16 }]}><Ionicons name="alert-circle" size={14} color={AppColors.error} /><Text style={s.errText}>{errors.terms}</Text></View>}

                        {/* Sign Up Button */}
                        <TouchableOpacity activeOpacity={0.85} onPress={handleSignUp} disabled={isAnyLoading}>
                            <LinearGradient colors={isAnyLoading ? ['#ccc', '#bbb'] : ['#2D6A4F', '#40916C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.primaryBtn}>
                                {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <><Text style={s.primaryBtnText}>Tạo Tài Khoản</Text><Ionicons name="arrow-forward" size={20} color="#fff" /></>}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={s.divider}><View style={s.dividerLine} /><Text style={s.dividerText}>hoặc đăng ký với</Text><View style={s.dividerLine} /></View>

                        {/* Social Buttons */}
                        <View style={s.socialRow}>
                            <TouchableOpacity style={[s.socialBtn, socialLoading === 'google' && s.socialActive]} onPress={() => { setSocialLoading('google'); googlePromptAsync(); }} disabled={isAnyLoading} activeOpacity={0.7}>
                                {socialLoading === 'google' ? <ActivityIndicator size="small" color={AppColors.secondary} /> : <><Text style={s.googleG}>G</Text><Text style={s.socialBtnText}>Google</Text></>}
                            </TouchableOpacity>
                            <TouchableOpacity style={[s.socialBtn, s.fbBtn, socialLoading === 'facebook' && s.socialActive]} onPress={() => { setSocialLoading('facebook'); fbPromptAsync(); }} disabled={isAnyLoading} activeOpacity={0.7}>
                                {socialLoading === 'facebook' ? <ActivityIndicator size="small" color="#fff" /> : <><Ionicons name="logo-facebook" size={22} color="#fff" /><Text style={s.fbBtnText}>Facebook</Text></>}
                            </TouchableOpacity>
                        </View>

                        <View style={s.bottomLink}>
                            <Text style={s.bottomLinkText}>Đã có tài khoản? </Text>
                            <TouchableOpacity onPress={() => router.replace('/sign-in' as any)}><Text style={s.bottomLinkAction}>Đăng nhập</Text></TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppColors.offWhite },
    topGradient: { height: height * 0.28, justifyContent: 'flex-end', paddingBottom: 36, overflow: 'hidden' },
    deco1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.08)', top: -40, right: -40 },
    deco2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.06)', top: 30, left: -30 },
    deco3: { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.1)', bottom: 30, right: 50 },
    dot1: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)', top: 80, right: 100 },
    dot2: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)', bottom: 60, left: 80 },
    backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 56 : 36, left: 20, width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    logoContainer: { alignItems: 'center' },
    logoEmoji: { fontSize: 40, marginBottom: 6 },
    logoText: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 1 },
    logoSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    formWrap: { flex: 1, marginTop: -24 },
    scroll: { flexGrow: 1, paddingBottom: 40 },
    card: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: Spacing.lg, paddingTop: 28, paddingBottom: 20, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12 }, android: { elevation: 8 } }) },
    title: { fontSize: 28, fontWeight: '800', color: AppColors.charcoal, marginBottom: 4 },
    subtitle: { fontSize: 14, color: AppColors.gray, marginBottom: 24 },
    group: { marginBottom: 18 },
    label: { fontSize: 14, fontWeight: '600', color: AppColors.darkGray, marginBottom: 8 },
    inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.lightGray, borderRadius: BorderRadius.md, paddingHorizontal: 16, height: 54, borderWidth: 2, borderColor: 'transparent' },
    focused: { borderColor: AppColors.secondary, backgroundColor: '#F0FFF4' },
    errBox: { borderColor: AppColors.error, backgroundColor: '#FFF5F5' },
    input: { flex: 1, fontSize: 15, color: AppColors.charcoal, marginLeft: 12 },
    errRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    errText: { fontSize: 12, color: AppColors.error, fontWeight: '500' },
    strengthRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
    strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
    bar: { flex: 1, height: 4, borderRadius: 2 },
    strengthLabel: { fontSize: 12, fontWeight: '600' },
    matchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    matchText: { fontSize: 12, color: AppColors.success, fontWeight: '500' },
    termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, gap: 10 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', marginTop: 1 },
    checked: { backgroundColor: AppColors.secondary, borderColor: AppColors.secondary },
    checkErr: { borderColor: AppColors.error },
    termsText: { flex: 1, fontSize: 13, color: AppColors.darkGray, lineHeight: 20 },
    termsLink: { color: AppColors.secondary, fontWeight: '600' },
    primaryBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, height: 56, borderRadius: BorderRadius.md, ...Platform.select({ ios: { shadowColor: AppColors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 6 } }) },
    primaryBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
    dividerText: { marginHorizontal: 16, fontSize: 13, color: AppColors.gray, fontWeight: '500' },
    socialRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
    socialBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, height: 54, borderRadius: BorderRadius.md, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB' },
    socialActive: { borderColor: AppColors.secondary, backgroundColor: '#F0FFF4' },
    fbBtn: { backgroundColor: '#1877F2', borderColor: '#1877F2' },
    googleG: { fontSize: 16, fontWeight: '700', color: '#4285F4' },
    socialBtnText: { fontSize: 15, fontWeight: '600', color: AppColors.charcoal },
    fbBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
    bottomLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    bottomLinkText: { fontSize: 14, color: AppColors.gray },
    bottomLinkAction: { fontSize: 14, fontWeight: '700', color: AppColors.secondary },
    toast: { position: 'absolute', top: 0, left: 20, right: 20, zIndex: 999, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16, ...Platform.select({ ios: { top: 56, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 }, android: { top: 36, elevation: 10 }, default: { top: 20 } }) },
    toastSuccess: { backgroundColor: '#2D6A4F' },
    toastError: { backgroundColor: '#DC2626' },
    toastText: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '600' },
});
