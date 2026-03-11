import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    Platform, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/constants/auth-context';
import { authAPI } from '@/constants/api';
import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const { token, logout } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors] = useState<{
        currentPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
    }>({});

    const validate = () => {
        const newErrors: typeof errors = {};
        if (!currentPassword) newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
        if (!newPassword) newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
        else if (newPassword.length < 6) newErrors.newPassword = 'Mật khẩu phải ít nhất 6 ký tự';
        if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        if (currentPassword && newPassword && currentPassword === newPassword) {
            newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChangePassword = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            if (!token) {
                if (Platform.OS === 'web') {
                    window.alert('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
                } else {
                    Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
                }
                logout(); // Call logout if token is missing
                return;
            }
            const res = await authAPI.changePassword(token, {
                currentPassword,
                newPassword,
            });
            if (res.success) {
                if (Platform.OS === 'web') {
                    window.alert('Mật khẩu đã được thay đổi');
                    router.back();
                } else {
                    Alert.alert('Thành công', 'Mật khẩu đã được thay đổi', [
                        { text: 'OK', onPress: () => router.back() }
                    ]);
                }
            }
        } catch (error: any) {
            if (error.response?.status === 401) {
                if (Platform.OS === 'web') {
                    window.alert('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
                } else {
                    Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
                }
                logout();
            } else {
                if (Platform.OS === 'web') {
                    window.alert(error.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
                } else {
                    Alert.alert('Lỗi', error.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const renderPasswordField = (
        label: string,
        value: string,
        onChange: (text: string) => void,
        show: boolean,
        toggleShow: () => void,
        placeholder: string,
        error?: string,
    ) => (
        <View style={s.inputGroup}>
            <Text style={s.label}>{label}</Text>
            <View style={[s.inputWrapper, error && s.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color={AppColors.gray} />
                <TextInput
                    style={s.input}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor={AppColors.gray}
                    secureTextEntry={!show}
                />
                <TouchableOpacity onPress={toggleShow}>
                    <Ionicons name={show ? 'eye-outline' : 'eye-off-outline'} size={20} color={AppColors.gray} />
                </TouchableOpacity>
            </View>
            {error && <Text style={s.errorText}>{error}</Text>}
        </View>
    );

    return (
        <View style={s.container}>
            <LinearGradient colors={['#FF6B35', '#E55A2B', '#C44A20']} style={s.header}>
                <View style={s.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Đổi mật khẩu</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <KeyboardAvoidingWrapper>
                <View style={s.formContainer}>
                    {/* Info Card */}
                    <View style={s.infoCard}>
                        <Ionicons name="shield-checkmark" size={24} color="#2D6A4F" />
                        <Text style={s.infoText}>
                            Mật khẩu phải có ít nhất 6 ký tự. Nên kết hợp chữ hoa, chữ thường và số.
                        </Text>
                    </View>

                    {renderPasswordField(
                        'Mật khẩu hiện tại', currentPassword, setCurrentPassword,
                        showCurrent, () => setShowCurrent(!showCurrent),
                        'Nhập mật khẩu hiện tại', errors.currentPassword,
                    )}
                    {renderPasswordField(
                        'Mật khẩu mới', newPassword, setNewPassword,
                        showNew, () => setShowNew(!showNew),
                        'Nhập mật khẩu mới', errors.newPassword,
                    )}
                    {renderPasswordField(
                        'Xác nhận mật khẩu', confirmPassword, setConfirmPassword,
                        showConfirm, () => setShowConfirm(!showConfirm),
                        'Nhập lại mật khẩu mới', errors.confirmPassword,
                    )}

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleChangePassword}
                        disabled={loading}
                        style={{ marginTop: 8 }}
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
                                    <Ionicons name="key-outline" size={20} color="#fff" />
                                    <Text style={s.saveButtonText}>Đổi mật khẩu</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
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
        backgroundColor: '#ECFDF5', borderRadius: BorderRadius.md,
        padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#A7F3D0',
    },
    infoText: { flex: 1, fontSize: 13, color: '#065F46', lineHeight: 18 },
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
});
