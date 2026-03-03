import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/constants/auth-context';
import { authAPI } from '@/constants/api';
import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, token, updateUser } = useAuth();
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [address, setAddress] = useState(user?.address || '');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});

    const validate = () => {
        const newErrors: typeof errors = {};
        if (!fullName.trim()) newErrors.fullName = 'Họ tên không được để trống';
        else if (fullName.trim().length < 2) newErrors.fullName = 'Họ tên ít nhất 2 ký tự';
        if (phone && !/^[0-9]{9,11}$/.test(phone)) newErrors.phone = 'Số điện thoại không hợp lệ';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            if (token) {
                const res = await authAPI.updateProfile(token, {
                    fullName: fullName.trim(),
                    phone: phone.trim(),
                    address: address.trim(),
                });
                if (res.success && user) {
                    await updateUser({
                        ...user,
                        fullName: fullName.trim(),
                        phone: phone.trim(),
                        address: address.trim(),
                    });
                    Alert.alert('Thành công', 'Thông tin đã được cập nhật', [
                        { text: 'OK', onPress: () => router.back() },
                    ]);
                }
            }
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể cập nhật thông tin');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={s.container}>
            {/* Header */}
            <LinearGradient colors={['#FF6B35', '#E55A2B', '#C44A20']} style={s.header}>
                <View style={s.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Chỉnh sửa hồ sơ</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <KeyboardAvoidingWrapper>
                <View style={s.formContainer}>
                    {/* Full Name */}
                    <View style={s.inputGroup}>
                        <Text style={s.label}>Họ và tên</Text>
                        <View style={[s.inputWrapper, errors.fullName && s.inputError]}>
                            <Ionicons name="person-outline" size={20} color={AppColors.gray} />
                            <TextInput
                                style={s.input}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Nhập họ và tên"
                                placeholderTextColor={AppColors.gray}
                            />
                        </View>
                        {errors.fullName && <Text style={s.errorText}>{errors.fullName}</Text>}
                    </View>

                    {/* Email (readonly) */}
                    <View style={s.inputGroup}>
                        <Text style={s.label}>Email</Text>
                        <View style={[s.inputWrapper, s.inputDisabled]}>
                            <Ionicons name="mail-outline" size={20} color={AppColors.gray} />
                            <TextInput
                                style={[s.input, { color: AppColors.gray }]}
                                value={user?.email || ''}
                                editable={false}
                            />
                            <Ionicons name="lock-closed-outline" size={16} color={AppColors.gray} />
                        </View>
                        <Text style={s.hintText}>Email không thể thay đổi</Text>
                    </View>

                    {/* Phone */}
                    <View style={s.inputGroup}>
                        <Text style={s.label}>Số điện thoại</Text>
                        <View style={[s.inputWrapper, errors.phone && s.inputError]}>
                            <Ionicons name="call-outline" size={20} color={AppColors.gray} />
                            <TextInput
                                style={s.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Nhập số điện thoại"
                                placeholderTextColor={AppColors.gray}
                                keyboardType="phone-pad"
                            />
                        </View>
                        {errors.phone && <Text style={s.errorText}>{errors.phone}</Text>}
                    </View>

                    {/* Address */}
                    <View style={s.inputGroup}>
                        <Text style={s.label}>Địa chỉ</Text>
                        <View style={s.inputWrapper}>
                            <Ionicons name="location-outline" size={20} color={AppColors.gray} />
                            <TextInput
                                style={[s.input, { minHeight: 60, textAlignVertical: 'top' }]}
                                value={address}
                                onChangeText={setAddress}
                                placeholder="Nhập địa chỉ giao hàng"
                                placeholderTextColor={AppColors.gray}
                                multiline
                                numberOfLines={2}
                            />
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleSave}
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
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                                    <Text style={s.saveButtonText}>Lưu thay đổi</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    formContainer: { padding: Spacing.lg, paddingTop: 24 },
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
    inputDisabled: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
    input: { flex: 1, fontSize: 15, color: AppColors.charcoal },
    errorText: { fontSize: 12, color: '#EF4444', marginTop: 4, marginLeft: 4 },
    hintText: { fontSize: 12, color: AppColors.gray, marginTop: 4, marginLeft: 4 },
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
