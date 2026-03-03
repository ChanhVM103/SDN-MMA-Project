import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    Platform, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { authAPI } from '@/constants/api';
import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const validate = () => {
        if (!email.trim()) {
            setError('Vui lòng nhập email');
            return false;
        }
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            setError('Email không hợp lệ');
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            await authAPI.forgotPassword(email.trim());
            setSent(true);
        } catch (err: any) {
            // Even if BE returns error, show success for security (don't reveal if email exists)
            setSent(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={s.container}>
            <LinearGradient colors={['#FF6B35', '#E55A2B', '#C44A20']} style={s.header}>
                <View style={s.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Quên mật khẩu</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <KeyboardAvoidingWrapper>
                <View style={s.formContainer}>
                    {sent ? (
                        /* Success State */
                        <View style={s.successContainer}>
                            <View style={s.successIcon}>
                                <Ionicons name="mail" size={48} color="#FF6B35" />
                            </View>
                            <Text style={s.successTitle}>Kiểm tra email!</Text>
                            <Text style={s.successText}>
                                Nếu tài khoản với email <Text style={{ fontWeight: '700' }}>{email}</Text> tồn tại,
                                bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong vài phút.
                            </Text>
                            <Text style={s.successHint}>
                                Không nhận được email? Kiểm tra thư mục spam hoặc thử lại.
                            </Text>
                            <TouchableOpacity
                                onPress={() => { setSent(false); setEmail(''); }}
                                style={s.retryLink}
                            >
                                <Ionicons name="refresh-outline" size={16} color={AppColors.primary} />
                                <Text style={s.retryText}>Thử lại với email khác</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => router.back()}
                                style={{ marginTop: 20, width: '100%' }}
                            >
                                <LinearGradient
                                    colors={['#FF6B35', '#E55A2B']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={s.saveButton}
                                >
                                    <Ionicons name="arrow-back-outline" size={20} color="#fff" />
                                    <Text style={s.saveButtonText}>Quay lại đăng nhập</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* Form State */
                        <>
                            <View style={s.infoCard}>
                                <Ionicons name="information-circle" size={24} color="#2563EB" />
                                <Text style={s.infoText}>
                                    Nhập email đã đăng ký. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu về email của bạn.
                                </Text>
                            </View>

                            <View style={s.inputGroup}>
                                <Text style={s.label}>Email</Text>
                                <View style={[s.inputWrapper, error && s.inputError]}>
                                    <Ionicons name="mail-outline" size={20} color={AppColors.gray} />
                                    <TextInput
                                        style={s.input}
                                        value={email}
                                        onChangeText={(t) => { setEmail(t); setError(''); }}
                                        placeholder="Nhập email của bạn"
                                        placeholderTextColor={AppColors.gray}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>
                                {error ? <Text style={s.errorText}>{error}</Text> : null}
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#FF6B35', '#E55A2B']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={s.saveButton}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="send-outline" size={20} color="#fff" />
                                            <Text style={s.saveButtonText}>Gửi yêu cầu</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </KeyboardAvoidingWrapper>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppColors.offWhite },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        paddingHorizontal: Spacing.lg,
    },
    headerRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    formContainer: { padding: Spacing.lg, paddingTop: 24 },
    infoCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#EFF6FF', borderRadius: BorderRadius.md,
        padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#BFDBFE',
    },
    infoText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 18 },
    inputGroup: { marginBottom: 20 },
    label: {
        fontSize: 14, fontWeight: '600',
        color: AppColors.charcoal, marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#fff', borderRadius: BorderRadius.md,
        borderWidth: 1.5, borderColor: '#E5E7EB',
        paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
            android: { elevation: 1 },
        }),
    },
    inputError: { borderColor: '#EF4444' },
    input: { flex: 1, fontSize: 15, color: AppColors.charcoal },
    errorText: { fontSize: 12, color: '#EF4444', marginTop: 4, marginLeft: 4 },
    saveButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 16, borderRadius: BorderRadius.md,
        ...Platform.select({
            ios: { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
            android: { elevation: 6 },
        }),
    },
    saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    // Success state
    successContainer: { alignItems: 'center', paddingVertical: 20 },
    successIcon: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#FFF3ED', justifyContent: 'center', alignItems: 'center',
        marginBottom: 24,
    },
    successTitle: { fontSize: 22, fontWeight: '800', color: AppColors.charcoal, marginBottom: 12 },
    successText: { fontSize: 14, color: AppColors.gray, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
    successHint: { fontSize: 12, color: AppColors.gray, textAlign: 'center', fontStyle: 'italic' },
    retryLink: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginTop: 16, paddingVertical: 8,
    },
    retryText: { fontSize: 14, fontWeight: '600', color: AppColors.primary },
});
