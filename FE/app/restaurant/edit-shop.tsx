import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    Platform, Alert, ActivityIndicator, KeyboardAvoidingView,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/constants/auth-context';
import { restaurantAPI } from '@/constants/api';
import * as ImagePicker from 'expo-image-picker';

const TAG_SUGGESTIONS = [
    'Cơm', 'Phở', 'Bún', 'Bánh mì', 'Đồ ăn vặt', 'Trà sữa',
    'Cà phê', 'Nước ép', 'Gà rán', 'Pizza', 'Sushi', 'Lẩu',
    'Nướng', 'Chay', 'Hải sản', 'Kem', 'Bánh ngọt', 'Healthy',
];

export default function EditShopScreen() {
    const router = useRouter();
    const { token } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [restaurantId, setRestaurantId] = useState('');

    // Form fields
    const [name, setName] = useState('');
    const [image, setImage] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [type, setType] = useState<'food' | 'drink'>('food');
    const [deliveryTime, setDeliveryTime] = useState('');
    const [deliveryFee, setDeliveryFee] = useState('');
    const [openingHours, setOpeningHours] = useState('');
    const [isOpen, setIsOpen] = useState(true);
    const [newTag, setNewTag] = useState('');
    const [imageBase64, setImageBase64] = useState<string | null>(null);

    useEffect(() => {
        fetchShopData();
    }, [token]);

    const fetchShopData = async () => {
        if (!token) return;
        try {
            const res = await restaurantAPI.getMyRestaurant(token);
            if (res.success && res.data) {
                const d = res.data;
                setRestaurantId(d._id);
                setName(d.name || '');
                setImage(d.image || '');
                setDescription(d.description || '');
                setAddress(d.address || '');
                setPhone(d.phone || '');
                setTags(d.tags || []);
                setType(d.type || 'food');
                setDeliveryTime(String(d.deliveryTime || ''));
                setDeliveryFee(String(d.deliveryFee || ''));
                setOpeningHours(d.openingHours || '');
                setIsOpen(d.isOpen !== false);
            }
        } catch (e) {
            console.error('Failed to load shop data:', e);
            Alert.alert('Lỗi', 'Không thể tải thông tin shop.');
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
            base64: true,
        });
        if (!result.canceled && result.assets[0]) {
            setImage(result.assets[0].uri);
            if (result.assets[0].base64) {
                setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
            }
        }
    };

    const toggleTag = (tag: string) => {
        setTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const addCustomTag = () => {
        const trimmed = newTag.trim();
        if (trimmed && !tags.includes(trimmed)) {
            setTags(prev => [...prev, trimmed]);
            setNewTag('');
        }
    };

    const removeTag = (tag: string) => {
        setTags(prev => prev.filter(t => t !== tag));
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Lỗi', 'Tên shop không được để trống.');
            return;
        }
        if (!token || !restaurantId) return;

        setSaving(true);
        try {
            const updateData: any = {
                name: name.trim(),
                description: description.trim(),
                address: address.trim(),
                phone: phone.trim(),
                tags,
                type,
                deliveryTime: parseInt(deliveryTime) || 0,
                deliveryFee: parseInt(deliveryFee) || 0,
                openingHours: openingHours.trim(),
                isOpen,
            };

            // If image changed (we have a base64 string), pass it; otherwise keep the URL
            if (imageBase64) {
                updateData.image = imageBase64;
            } else if (image) {
                updateData.image = image;
            }

            const res = await restaurantAPI.updateRestaurant(token, restaurantId, updateData);
            if (res.success) {
                Alert.alert('Thành công', 'Thông tin shop đã được cập nhật!', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Lỗi', res.message || 'Không thể cập nhật.');
            }
        } catch (e: any) {
            console.error('Update shop error:', e);
            Alert.alert('Lỗi', e.message || 'Đã xảy ra lỗi khi cập nhật shop.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[st.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={AppColors.primary} />
                <Text style={{ marginTop: 12, color: AppColors.gray }}>Đang tải thông tin shop...</Text>
            </View>
        );
    }

    return (
        <View style={st.container}>
            {/* Header */}
            <View style={st.header}>
                <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={AppColors.charcoal} />
                </TouchableOpacity>
                <Text style={st.headerTitle}>Chỉnh sửa Shop</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={st.saveBtn}>
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={st.saveBtnText}>Lưu</Text>
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Shop Image */}
                    <Text style={st.sectionLabel}>Ảnh bìa Shop</Text>
                    <TouchableOpacity style={st.imagePickerBox} onPress={pickImage} activeOpacity={0.8}>
                        {image ? (
                            <ExpoImage source={{ uri: image }} style={st.coverImage} contentFit="cover" />
                        ) : (
                            <View style={st.imagePlaceholder}>
                                <Ionicons name="camera-outline" size={40} color={AppColors.gray} />
                                <Text style={st.imagePlaceholderText}>Chọn ảnh bìa</Text>
                            </View>
                        )}
                        <View style={st.imageEditBadge}>
                            <Ionicons name="pencil" size={14} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    {/* Basic Info */}
                    <Text style={st.sectionLabel}>Thông tin cơ bản</Text>
                    <View style={st.card}>
                        <View style={st.fieldRow}>
                            <Text style={st.fieldLabel}>Tên Shop *</Text>
                            <TextInput style={st.input} value={name} onChangeText={setName} placeholder="Nhập tên shop" placeholderTextColor="#aaa" />
                        </View>
                        <View style={st.divider} />
                        <View style={st.fieldRow}>
                            <Text style={st.fieldLabel}>Mô tả</Text>
                            <TextInput style={[st.input, st.textArea]} value={description} onChangeText={setDescription}
                                placeholder="Mô tả về shop của bạn" placeholderTextColor="#aaa"
                                multiline numberOfLines={3} textAlignVertical="top" />
                        </View>
                        <View style={st.divider} />
                        <View style={st.fieldRow}>
                            <Text style={st.fieldLabel}>Loại hình</Text>
                            <View style={st.typeRow}>
                                <TouchableOpacity style={[st.typeBtn, type === 'food' && st.typeBtnActive]} onPress={() => setType('food')}>
                                    <Text style={[st.typeBtnText, type === 'food' && st.typeBtnTextActive]}>🍽️ Đồ ăn</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[st.typeBtn, type === 'drink' && st.typeBtnActive]} onPress={() => setType('drink')}>
                                    <Text style={[st.typeBtnText, type === 'drink' && st.typeBtnTextActive]}>🥤 Đồ uống</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Contact & Address */}
                    <Text style={st.sectionLabel}>Liên hệ & Địa chỉ</Text>
                    <View style={st.card}>
                        <View style={st.fieldRow}>
                            <Text style={st.fieldLabel}>Địa chỉ</Text>
                            <TextInput style={st.input} value={address} onChangeText={setAddress}
                                placeholder="Nhập địa chỉ shop" placeholderTextColor="#aaa" />
                        </View>
                        <View style={st.divider} />
                        <View style={st.fieldRow}>
                            <Text style={st.fieldLabel}>Số điện thoại</Text>
                            <TextInput style={st.input} value={phone} onChangeText={setPhone}
                                placeholder="Nhập số điện thoại" placeholderTextColor="#aaa"
                                keyboardType="phone-pad" />
                        </View>
                        <View style={st.divider} />
                        <View style={st.fieldRow}>
                            <Text style={st.fieldLabel}>Giờ mở cửa</Text>
                            <TextInput style={st.input} value={openingHours} onChangeText={setOpeningHours}
                                placeholder="VD: 7:00 - 22:00" placeholderTextColor="#aaa" />
                        </View>
                    </View>

                    {/* Delivery Settings */}
                    <Text style={st.sectionLabel}>Cài đặt giao hàng</Text>
                    <View style={st.card}>
                        <View style={st.fieldRow}>
                            <Text style={st.fieldLabel}>Thời gian giao (phút)</Text>
                            <TextInput style={st.input} value={deliveryTime} onChangeText={setDeliveryTime}
                                placeholder="VD: 30" placeholderTextColor="#aaa" keyboardType="numeric" />
                        </View>
                        <View style={st.divider} />
                        <View style={st.fieldRow}>
                            <Text style={st.fieldLabel}>Phí giao hàng (đ)</Text>
                            <TextInput style={st.input} value={deliveryFee} onChangeText={setDeliveryFee}
                                placeholder="VD: 15000" placeholderTextColor="#aaa" keyboardType="numeric" />
                        </View>
                        <View style={st.divider} />
                        <View style={st.fieldRow}>
                            <Text style={st.fieldLabel}>Trạng thái cửa hàng</Text>
                            <TouchableOpacity
                                style={[st.toggleBtn, isOpen ? st.toggleOn : st.toggleOff]}
                                onPress={() => setIsOpen(!isOpen)}
                            >
                                <Text style={[st.toggleText, isOpen ? st.toggleTextOn : st.toggleTextOff]}>
                                    {isOpen ? '🟢 Đang mở' : '🔴 Đã đóng'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Tags */}
                    <Text style={st.sectionLabel}>Tags (Phân loại)</Text>
                    <View style={st.card}>
                        {/* Selected tags */}
                        {tags.length > 0 && (
                            <View style={st.selectedTagsRow}>
                                {tags.map(tag => (
                                    <TouchableOpacity key={tag} style={st.selectedTag} onPress={() => removeTag(tag)}>
                                        <Text style={st.selectedTagText}>{tag}</Text>
                                        <Ionicons name="close-circle" size={16} color={AppColors.primary} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Custom tag input */}
                        <View style={st.addTagRow}>
                            <TextInput style={[st.input, { flex: 1 }]} value={newTag} onChangeText={setNewTag}
                                placeholder="Thêm tag mới..." placeholderTextColor="#aaa"
                                onSubmitEditing={addCustomTag} returnKeyType="done" />
                            <TouchableOpacity style={st.addTagBtn} onPress={addCustomTag}>
                                <Ionicons name="add" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Suggested tags */}
                        <Text style={st.suggestedLabel}>Gợi ý tags:</Text>
                        <View style={st.suggestedTagsRow}>
                            {TAG_SUGGESTIONS.map(tag => (
                                <TouchableOpacity
                                    key={tag}
                                    style={[st.suggestedTag, tags.includes(tag) && st.suggestedTagActive]}
                                    onPress={() => toggleTag(tag)}
                                >
                                    <Text style={[st.suggestedTagText, tags.includes(tag) && st.suggestedTagTextActive]}>
                                        {tag}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 12, paddingHorizontal: 16,
        backgroundColor: '#fff',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
            android: { elevation: 3 },
        }),
    },
    backBtn: { padding: 4 },
    headerTitle: { flex: 1, marginLeft: 12, fontSize: 18, fontWeight: '700', color: AppColors.charcoal },
    saveBtn: {
        backgroundColor: AppColors.primary, borderRadius: BorderRadius.md,
        paddingHorizontal: 20, paddingVertical: 8,
    },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    scrollContent: { padding: 16 },

    // Image Picker
    sectionLabel: {
        fontSize: 14, fontWeight: '700', color: AppColors.charcoal,
        marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    imagePickerBox: {
        borderRadius: BorderRadius.lg, overflow: 'hidden', position: 'relative',
        backgroundColor: '#fff', marginBottom: 8,
    },
    coverImage: { width: '100%', height: 180, borderRadius: BorderRadius.lg },
    imagePlaceholder: {
        width: '100%', height: 180, justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#E5E7EB',
        borderStyle: 'dashed', borderRadius: BorderRadius.lg,
    },
    imagePlaceholderText: { marginTop: 8, fontSize: 14, color: AppColors.gray },
    imageEditBadge: {
        position: 'absolute', bottom: 12, right: 12, width: 32, height: 32,
        borderRadius: 16, backgroundColor: AppColors.primary,
        justifyContent: 'center', alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
            android: { elevation: 4 },
        }),
    },

    // Cards
    card: {
        backgroundColor: '#fff', borderRadius: BorderRadius.lg, padding: 16,
        marginBottom: 8,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
            android: { elevation: 1 },
        }),
    },
    fieldRow: { marginBottom: 4 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: AppColors.gray, marginBottom: 6 },
    input: {
        fontSize: 15, color: AppColors.charcoal, backgroundColor: '#F9FAFB',
        borderRadius: BorderRadius.sm, paddingHorizontal: 12, paddingVertical: 10,
        borderWidth: 1, borderColor: '#E5E7EB',
    },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

    // Type selector
    typeRow: { flexDirection: 'row', gap: 10 },
    typeBtn: {
        flex: 1, paddingVertical: 10, borderRadius: BorderRadius.md,
        borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center',
    },
    typeBtnActive: { borderColor: AppColors.primary, backgroundColor: '#FFF5F0' },
    typeBtnText: { fontSize: 14, fontWeight: '600', color: AppColors.gray },
    typeBtnTextActive: { color: AppColors.primary },

    // Toggle
    toggleBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: BorderRadius.md, alignSelf: 'flex-start' },
    toggleOn: { backgroundColor: '#ECFDF5' },
    toggleOff: { backgroundColor: '#FEF2F2' },
    toggleText: { fontSize: 14, fontWeight: '600' },
    toggleTextOn: { color: '#059669' },
    toggleTextOff: { color: '#EF4444' },

    // Tags
    selectedTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    selectedTag: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#FFF5F0', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12,
        borderWidth: 1, borderColor: AppColors.primary,
    },
    selectedTagText: { fontSize: 13, fontWeight: '600', color: AppColors.primary },
    addTagRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    addTagBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: AppColors.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    suggestedLabel: { fontSize: 12, color: AppColors.gray, marginBottom: 8 },
    suggestedTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    suggestedTag: {
        paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
        borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
    },
    suggestedTagActive: { borderColor: AppColors.primary, backgroundColor: '#FFF5F0' },
    suggestedTagText: { fontSize: 13, color: AppColors.gray },
    suggestedTagTextActive: { color: AppColors.primary, fontWeight: '600' },
});
