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
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import LocationPicker from '@/components/map/LocationPicker';

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
    const [lat, setLat] = useState<number | undefined>(undefined);
    const [lng, setLng] = useState<number | undefined>(undefined);

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
                setLat(d.latitude);
                setLng(d.longitude);
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
                latitude: lat,
                longitude: lng,
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
            <LinearGradient
                colors={['#FF6B35', '#E55A2B']}
                style={st.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <View style={st.header}>
                    <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={st.headerTitle}>Hồ sơ Cửa hàng</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView
                    style={st.content}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Shop Image Section */}
                    <Text style={st.sectionLabel}>Ảnh bìa shop</Text>
                    <TouchableOpacity style={st.imagePickerBox} onPress={pickImage} activeOpacity={0.9}>
                        {image ? (
                            <ExpoImage source={{ uri: image }} style={st.coverImage} contentFit="cover" />
                        ) : (
                            <View style={st.imagePlaceholder}>
                                <Ionicons name="camera-outline" size={40} color="#94A3B8" />
                                <Text style={st.imagePlaceholderText}>Nhấn để tải ảnh lên</Text>
                            </View>
                        )}
                        <View style={st.imageEditBadge}>
                            <Ionicons name="camera" size={16} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    {/* Basic Info */}
                    <Text style={st.sectionLabel}>Thông tin cơ bản</Text>
                    <View style={st.card}>
                        <View style={st.fieldGroup}>
                            <Text style={st.fieldLabel}>Tên cửa hàng *</Text>
                            <TextInput
                                style={st.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="VD: Bún Chả Obama"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        <View style={st.fieldGroup}>
                            <Text style={st.fieldLabel}>Mô tả ngắn</Text>
                            <TextInput
                                style={[st.input, st.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Giới thiệu về hương vị đặc trưng của shop..."
                                placeholderTextColor="#94A3B8"
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={st.fieldGroup}>
                            <Text style={st.fieldLabel}>Loại hình kinh doanh</Text>
                            <View style={st.typeRow}>
                                <TouchableOpacity
                                    style={[st.typeBtn, type === 'food' && st.typeBtnActive]}
                                    onPress={() => setType('food')}
                                >
                                    <Ionicons name="fast-food" size={18} color={type === 'food' ? '#FF6B35' : '#64748B'} />
                                    <Text style={[st.typeBtnText, type === 'food' && st.typeBtnTextActive]}>Đồ ăn</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[st.typeBtn, type === 'drink' && st.typeBtnActive]}
                                    onPress={() => setType('drink')}
                                >
                                    <Ionicons name="cafe" size={18} color={type === 'drink' ? '#FF6B35' : '#64748B'} />
                                    <Text style={[st.typeBtnText, type === 'drink' && st.typeBtnTextActive]}>Đồ uống</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Contact & Address */}
                    <Text style={st.sectionLabel}>Liên hệ & Vận hành</Text>
                    <View style={st.card}>
                        <View style={st.fieldGroup}>
                            <Text style={st.fieldLabel}>Địa chỉ cửa hàng</Text>
                            <View style={st.inputIconWrapper}>
                                <Ionicons name="location-outline" size={18} color="#94A3B8" style={st.inputIcon} />
                                <TextInput
                                    style={[st.input, { paddingLeft: 45 }]}
                                    value={address}
                                    onChangeText={setAddress}
                                    placeholder="Số nhà, tên đường, quận/huyện..."
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                        </View>

                        <View style={st.fieldGroup}>
                            <Text style={st.fieldLabel}>Vị trí trên bản đồ</Text>
                            <LocationPicker
                                initialLat={lat}
                                initialLng={lng}
                                onLocationChange={(newLat, newLng, newAddr) => {
                                    setLat(newLat);
                                    setLng(newLng);
                                    if (newAddr) setAddress(newAddr);
                                }}
                            />
                        </View>

                        <View style={st.fieldRow}>
                            <View style={[st.fieldGroup, { flex: 1 }]}>
                                <Text style={st.fieldLabel}>Số điện thoại</Text>
                                <TextInput
                                    style={st.input}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="09xx..."
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="phone-pad"
                                />
                            </View>
                            <View style={{ width: 12 }} />
                            <View style={[st.fieldGroup, { flex: 1 }]}>
                                <Text style={st.fieldLabel}>Giờ mở cửa</Text>
                                <TextInput
                                    style={st.input}
                                    value={openingHours}
                                    onChangeText={setOpeningHours}
                                    placeholder="07:00 - 22:00"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                        </View>

                        <View style={st.divider} />

                        <View style={st.fieldGroup}>
                            <Text style={st.fieldLabel}>Cài đặt giao hàng</Text>
                            <View style={st.fieldRow}>
                                <View style={st.settingItem}>
                                    <Text style={st.settingLabel}>Phí ship (đ)</Text>
                                    <TextInput
                                        style={st.settingInput}
                                        value={deliveryFee}
                                        onChangeText={setDeliveryFee}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={st.settingItem}>
                                    <Text style={st.settingLabel}>TG chuẩn bị (phút)</Text>
                                    <TextInput
                                        style={st.settingInput}
                                        value={deliveryTime}
                                        onChangeText={setDeliveryTime}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Store Status */}
                    <View style={st.statusCard}>
                        <View>
                            <Text style={st.statusCardTitle}>Trạng thái cửa hàng</Text>
                            <Text style={st.statusCardSub}>{isOpen ? 'Khách hàng có thể đặt đơn ngay' : 'Tạm thời ngừng nhận đơn mới'}</Text>
                        </View>
                        <TouchableOpacity
                            style={[st.statusToggle, isOpen ? st.statusToggleOn : st.statusToggleOff]}
                            onPress={() => setIsOpen(!isOpen)}
                            activeOpacity={0.8}
                        >
                            <View style={[st.toggleCircle, isOpen ? st.toggleCircleOn : st.toggleCircleOff]} />
                        </TouchableOpacity>
                    </View>

                    {/* Tags */}
                    <Text style={st.sectionLabel}>Phân loại (Tags)</Text>
                    <View style={st.card}>
                        <View style={st.tagsContainer}>
                            {tags.map(tag => (
                                <TouchableOpacity key={tag} style={st.tagItem} onPress={() => removeTag(tag)}>
                                    <Text style={st.tagText}>{tag}</Text>
                                    <Ionicons name="close" size={14} color="#FF6B35" />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={st.addTagContainer}>
                            <TextInput
                                style={st.tagInput}
                                value={newTag}
                                onChangeText={setNewTag}
                                placeholder="Thêm tag tự định nghĩa..."
                                placeholderTextColor="#94A3B8"
                                onSubmitEditing={addCustomTag}
                            />
                            <TouchableOpacity style={st.addTagBtn} onPress={addCustomTag}>
                                <Ionicons name="add" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <Text style={st.suggestedTitle}>Gợi ý phổ biến:</Text>
                        <View style={st.suggestionsGrid}>
                            {TAG_SUGGESTIONS.filter(t => !tags.includes(t)).slice(0, 10).map(tag => (
                                <TouchableOpacity
                                    key={tag}
                                    style={st.suggestedTag}
                                    onPress={() => toggleTag(tag)}
                                >
                                    <Text style={st.suggestedTagText}>{tag}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[st.saveActionBtn, saving && { opacity: 0.8 }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <LinearGradient colors={['#FF6B35', '#E55A2B']} style={st.saveGradient}>
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={st.saveActionText}>Lưu tất cả thay đổi</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 15,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },

    content: { flex: 1, paddingHorizontal: 20 },
    sectionLabel: { fontSize: 13, fontWeight: '800', color: '#64748B', marginTop: 24, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },

    // Image Picker
    imagePickerBox: {
        borderRadius: 24, overflow: 'hidden', position: 'relative',
        backgroundColor: '#fff',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
            android: { elevation: 3 },
        }),
    },
    coverImage: { width: '100%', height: 180 },
    imagePlaceholder: {
        width: '100%', height: 180, justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#F1F5F9', borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1', borderRadius: 24,
    },
    imagePlaceholderText: { marginTop: 10, fontSize: 14, color: '#94A3B8', fontWeight: '600' },
    imageEditBadge: {
        position: 'absolute', bottom: 15, right: 15, width: 36, height: 36,
        borderRadius: 18, backgroundColor: '#FF6B35',
        justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff',
    },

    // Card
    card: {
        backgroundColor: '#fff', borderRadius: 24, padding: 20,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
            android: { elevation: 2 },
        }),
    },
    fieldGroup: { marginBottom: 20 },
    fieldRow: { flexDirection: 'row', alignItems: 'center' },
    fieldLabel: { fontSize: 14, fontWeight: '800', color: '#475569', marginBottom: 8 },
    input: {
        backgroundColor: '#F8FAFC', borderRadius: 16, padding: 14, fontSize: 15,
        borderWidth: 1, borderColor: '#E2E8F0', color: '#1E293B',
    },
    textArea: { minHeight: 90 },
    inputIconWrapper: { position: 'relative' },
    inputIcon: { position: 'absolute', left: 16, top: 16, zIndex: 1 },

    typeRow: { flexDirection: 'row', gap: 12 },
    typeBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#F1F5F9', backgroundColor: '#F8FAFC',
    },
    typeBtnActive: { borderColor: '#FF6B35', backgroundColor: '#FFF7F5' },
    typeBtnText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
    typeBtnTextActive: { color: '#FF6B35' },

    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10, marginBottom: 20 },
    settingItem: { flex: 1 },
    settingLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 6 },
    settingInput: {
        backgroundColor: '#F8FAFC', borderRadius: 12, padding: 10, fontSize: 14,
        fontWeight: '700', color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0',
    },

    // Status Card
    statusCard: {
        backgroundColor: '#1E293B', borderRadius: 24, padding: 20, marginTop: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
    },
    statusCardTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 4 },
    statusCardSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '500' },
    statusToggle: { width: 56, height: 32, borderRadius: 16, padding: 4, justifyContent: 'center' },
    statusToggleOn: { backgroundColor: '#10B981' },
    statusToggleOff: { backgroundColor: '#64748B' },
    toggleCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
    toggleCircleOn: { alignSelf: 'flex-end' },
    toggleCircleOff: { alignSelf: 'flex-start' },

    // Tags
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
    tagItem: {
        flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF7F5',
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#FF6B35'
    },
    tagText: { color: '#FF6B35', fontSize: 13, fontWeight: '800' },
    addTagContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    tagInput: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 15, paddingVertical: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    addTagBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center' },
    suggestedTitle: { fontSize: 12, fontWeight: '800', color: '#94A3B8', marginBottom: 10 },
    suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    suggestedTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
    suggestedTagText: { fontSize: 12, color: '#64748B', fontWeight: '700' },

    // Bottom Action
    saveActionBtn: { marginTop: 40, borderRadius: 20, overflow: 'hidden' },
    saveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
    saveActionText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
