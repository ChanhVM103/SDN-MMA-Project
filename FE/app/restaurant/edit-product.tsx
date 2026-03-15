import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, SafeAreaView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { launchImageLibraryAsync, requestMediaLibraryPermissionsAsync } from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import { useAuth } from '@/constants/auth-context';
import { productAPI, restaurantAPI } from '@/constants/api';
import { ActivityIndicator, Alert } from 'react-native';

interface AddonOption {
    name: string;
    price: string;
}

interface AddonGroup {
    id: string;
    name: string;
    isRequired: boolean;
    multiple: boolean;
    options: AddonOption[];
}

export default function RestaurantEditProduct() {
    const router = useRouter();
    const { id: productId } = useLocalSearchParams();
    const { user, token } = useAuth();
    const [images, setImages] = useState<{ uri: string; base64?: string }[]>([]);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [category, setCategory] = useState('');
    const [type, setType] = useState<'food' | 'drink'>('food');
    const [addons, setAddons] = useState<AddonGroup[]>([]);
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('0');
    const [isBestSeller, setIsBestSeller] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    React.useEffect(() => {
        if (productId) {
            fetchProductDetails();
        } else {
            setInitialLoading(false);
        }
    }, [productId]);

    const fetchProductDetails = async () => {
        try {
            const res = await productAPI.getProductById(productId as string);
            if (res.success && res.data) {
                const p = res.data;
                setName(p.name || '');
                setDesc(p.description || '');
                setPrice(p.price?.toString() || '');
                setStock(p.stock?.toString() || '0');
                setCategory(p.category || '');
                setType(p.type || 'food');
                setIsBestSeller(p.isBestSeller || false);
                if (p.image) setImages([{ uri: p.image }]);

                if (p.addons && Array.isArray(p.addons)) {
                    // Make sure addons have IDs for state management
                    const mappedAddons = p.addons.map((a: any) => ({
                        id: Math.random().toString(),
                        name: a.name || '',
                        options: a.options?.map((o: any) => ({ name: o.name || '', price: o.price?.toString() || '0' })) || [],
                        isRequired: a.isRequired || false,
                        multiple: a.multiple || false,
                    }));
                    setAddons(mappedAddons);
                }
            }
        } catch (error) {
            console.error(error);
            const msg = 'Không thể tải thông tin sản phẩm';
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Lỗi', msg);
            router.back();
        } finally {
            setInitialLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <SafeAreaView style={[s.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={AppColors.primary} />
            </SafeAreaView>
        );
    }

    const handlePickImage = async () => {
        const { status } = await requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            if (Platform.OS === 'web') {
                window.alert('Cần quyền truy cập thư viện ảnh!');
            } else {
                alert('Cần quyền truy cập thư viện ảnh!');
            }
            return;
        }

        const result = await launchImageLibraryAsync({
            mediaTypes: ['images'] as any,
            allowsMultipleSelection: true,
            selectionLimit: 5 - images.length,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled) {
            const newImages = result.assets.map(asset => ({
                uri: asset.uri,
                base64: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : undefined
            }));
            setImages([...images, ...newImages].slice(0, 5));
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleAddGroup = () => {
        setAddons([
            ...addons,
            { id: Date.now().toString(), name: '', isRequired: false, multiple: false, options: [{ name: '', price: '0' }] }
        ]);
    };

    const handleRemoveGroup = (groupId: string) => {
        setAddons(addons.filter(g => g.id !== groupId));
    };

    const handleGroupChange = (groupId: string, field: keyof AddonGroup, value: any) => {
        setAddons(addons.map(g => g.id === groupId ? { ...g, [field]: value } : g));
    };

    const handleAddOption = (groupId: string) => {
        setAddons(addons.map(g => {
            if (g.id === groupId) {
                return { ...g, options: [...g.options, { name: '', price: '0' }] };
            }
            return g;
        }));
    };

    const handleRemoveOption = (groupId: string, optionIndex: number) => {
        setAddons(addons.map(g => {
            if (g.id === groupId) {
                return { ...g, options: g.options.filter((_, idx) => idx !== optionIndex) };
            }
            return g;
        }));
    };

    const handleOptionChange = (groupId: string, optionIndex: number, field: keyof AddonOption, value: string) => {
        setAddons(addons.map(g => {
            if (g.id === groupId) {
                const newOptions = [...g.options];
                newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };
                return { ...g, options: newOptions };
            }
            return g;
        }));
    };

    const handleSave = async () => {
        if (!name.trim() || !desc.trim() || !price) {
            const msg = 'Vui lòng điền đầy đủ các trường bắt buộc (*)';
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Lỗi', msg);
            return;
        }

        // Validate Addons
        for (const group of addons) {
            if (!group.name.trim()) {
                const msg = 'Vui lòng nhập tên cho tất cả nhóm tuỳ chọn';
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Lỗi', msg);
                return;
            }
            if (group.options.length === 0) {
                const msg = `Nhóm "${group.name}" phải có ít nhất 1 tuỳ chọn`;
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Lỗi', msg);
                return;
            }
            for (const opt of group.options) {
                if (!opt.name.trim()) {
                    const msg = `Vui lòng nhập tên cho tất cả tuỳ chọn trong nhóm "${group.name}"`;
                    Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Lỗi', msg);
                    return;
                }
            }
        }

        if (!user?.id || !token) {
            const msg = 'Lỗi xác thực, vui lòng đăng nhập lại';
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Lỗi', msg);
            return;
        }

        try {
            setLoading(true);

            // TODO: In a real app, upload images to Cloudinary/AWS S3 and get URLs first.
            // For now, we'll try to use the first local URI, but it might fail if backend specifically requires a remote URL.
            // Clean up addon data before sending
            const formattedAddons = addons.map(g => ({
                name: g.name.trim(),
                isRequired: g.isRequired,
                multiple: g.multiple,
                options: g.options.map(o => ({
                    name: o.name.trim(),
                    price: Number(o.price) || 0
                }))
            }));

            const productData = {
                name: name.trim(),
                description: desc.trim(),
                price: Number(price),
                category: category.trim(),
                stock: Number(stock),
                image: images[0]?.base64 || images[0]?.uri || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80',
                type: type,
                addons: formattedAddons,
                isBestSeller: isBestSeller,
                isAvailable: true,
            };

            const restRes = await restaurantAPI.getMyRestaurant(token).catch(() => null);
            const restId = restRes?.data?._id || user.id;

            const res = await productAPI.updateProduct(token, restId, productId as string, productData);
            if (res.success) {
                const msg = 'Cập nhật sản phẩm thành công!';
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Thành công', msg);
                router.back();
            } else {
                throw new Error(res.message || 'Lưu thất bại');
            }
        } catch (error: any) {
            console.error('Lỗi khi cập nhật SP:', error);
            const msg = error.message || 'Có lỗi xảy ra khi lưu sản phẩm';
            Platform.OS === 'web' ? window.alert(msg) : alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = name.trim() && desc.trim() && price && stock;

    return (
        <SafeAreaView style={s.safeArea}>
            <View style={s.container}>
                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={AppColors.primary} />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Sửa sản phẩm</Text>
                    <View style={{ width: 24, paddingRight: 8 }} />
                </View>

                {/* Removed Info Banner */}
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* Image Picker Section */}
                    <View style={s.imageSection}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.imageScroll}>
                            {images.length < 5 && (
                                <TouchableOpacity style={s.addImageBox} onPress={handlePickImage}>
                                    <View style={s.dashedBorder}>
                                        <Text style={s.addImageText}>Thêm ảnh</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            {images.map((item, idx) => (
                                <View key={idx} style={s.imageWrapper}>
                                    <ExpoImage source={{ uri: item.uri }} style={s.pickedImage} />
                                    <TouchableOpacity style={s.removeImageBtn} onPress={() => removeImage(idx)}>
                                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                        <Text style={s.imageLimitText}>{images.length}/5 ảnh</Text>
                    </View>

                    {/* Inputs */}
                    <View style={s.inputSection}>
                        <View style={s.inputGroup}>
                            <View style={s.inputHeader}>
                                <Text style={s.inputLabel}>Tên sản phẩm <Text style={s.required}>*</Text></Text>
                                <Text style={s.charCount}>{name.length}/120</Text>
                            </View>
                            <TextInput
                                style={s.textInput}
                                placeholder="Nhập tên sản phẩm"
                                placeholderTextColor={AppColors.gray}
                                maxLength={120}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={s.inputGroup}>
                            <View style={s.inputHeader}>
                                <Text style={s.inputLabel}>Mô tả sản phẩm <Text style={s.required}>*</Text></Text>
                                <Text style={s.charCount}>{desc.length}/3000</Text>
                            </View>
                            <TextInput
                                style={[s.textInput, s.textArea]}
                                placeholder="Nhập mô tả sản phẩm"
                                placeholderTextColor={AppColors.gray}
                                multiline
                                textAlignVertical="top"
                                maxLength={3000}
                                value={desc}
                                onChangeText={setDesc}
                            />
                        </View>
                    </View>

                    <View style={s.menuList}>
                        <TouchableOpacity style={s.menuItem}>
                            <View style={s.menuItemLeft}>
                                <Ionicons name="list-outline" size={20} color={AppColors.gray} />
                                <Text style={s.menuItemLabel}>Danh mục <Text style={s.optional}>(Tuỳ chọn)</Text></Text>
                            </View>
                            <TextInput
                                style={s.inlineInput}
                                placeholder="Khác"
                                placeholderTextColor={AppColors.gray}
                                value={category}
                                onChangeText={setCategory}
                            />
                        </TouchableOpacity>
                        <View style={s.divider} />

                        {/* Type Selection (Food/Drink) */}
                        <View style={s.inputRow}>
                            <View style={s.menuItemLeft}>
                                <Ionicons name="fast-food-outline" size={20} color={AppColors.gray} />
                                <Text style={s.menuItemLabel}>Loại sản phẩm</Text>
                            </View>
                            <View style={s.typeSelector}>
                                <TouchableOpacity
                                    style={[s.typeBtn, type === 'food' && s.typeBtnActive]}
                                    onPress={() => setType('food')}
                                >
                                    <Text style={[s.typeBtnText, type === 'food' && s.typeBtnTextActive]}>Đồ ăn</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[s.typeBtn, type === 'drink' && s.typeBtnActive]}
                                    onPress={() => setType('drink')}
                                >
                                    <Text style={[s.typeBtnText, type === 'drink' && s.typeBtnTextActive]}>Nước uống</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={s.divider} />

                        <View style={s.inputRow}>
                            <View style={s.menuItemLeft}>
                                <Ionicons name="flame-outline" size={20} color={AppColors.gray} />
                                <Text style={s.menuItemLabel}>Sản phẩm bán chạy (Best Seller)</Text>
                            </View>
                            <Switch
                                value={isBestSeller}
                                onValueChange={setIsBestSeller}
                                trackColor={{ false: '#E5E7EB', true: AppColors.primary }}
                            />
                        </View>
                        <View style={s.divider} />

                        {/* Dynamic Addons Form */}
                        <View style={s.addonSection}>
                            <View style={s.addonHeader}>
                                <View>
                                    <Text style={s.addonSectionTitle}>Nhóm tuỳ chọn (Toppings, Size...)</Text>
                                    <Text style={s.optional}>Giúp khách hàng cá nhân hoá món ăn</Text>
                                </View>
                                <TouchableOpacity onPress={handleAddGroup} style={s.addBtn}>
                                    <Ionicons name="add" size={18} color="#fff" />
                                    <Text style={s.addBtnText}>Thêm nhóm</Text>
                                </TouchableOpacity>
                            </View>

                            {addons.map((group) => (
                                <View key={group.id} style={s.addonGroupCard}>
                                    <View style={s.addonGroupHeader}>
                                        <TextInput
                                            style={s.addonGroupNameInput}
                                            placeholder="Tên nhóm (VD: Chọn size)"
                                            value={group.name}
                                            onChangeText={(val) => handleGroupChange(group.id, 'name', val)}
                                        />
                                        <TouchableOpacity onPress={() => handleRemoveGroup(group.id)}>
                                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={s.addonGroupToggles}>
                                        <View style={s.toggleRow}>
                                            <Switch
                                                value={group.isRequired}
                                                onValueChange={(val) => handleGroupChange(group.id, 'isRequired', val)}
                                                trackColor={{ false: '#E5E7EB', true: AppColors.primary }}
                                            />
                                            <Text style={s.toggleLabel}>Bắt buộc chọn</Text>
                                        </View>
                                        <View style={s.toggleRow}>
                                            <Switch
                                                value={group.multiple}
                                                onValueChange={(val) => handleGroupChange(group.id, 'multiple', val)}
                                                trackColor={{ false: '#E5E7EB', true: AppColors.primary }}
                                            />
                                            <Text style={s.toggleLabel}>Chọn nhiều (Topping)</Text>
                                        </View>
                                    </View>

                                    <View style={s.addonOptionsList}>
                                        {group.options.map((opt, optIdx) => (
                                            <View key={optIdx} style={s.addonOptionRow}>
                                                <TextInput
                                                    style={s.addonOptionInput}
                                                    placeholder="Tên tuỳ chọn (VD: Size L)"
                                                    value={opt.name}
                                                    onChangeText={(val) => handleOptionChange(group.id, optIdx, 'name', val)}
                                                />
                                                <TextInput
                                                    style={s.addonPriceInput}
                                                    placeholder="Giá (+ đ)"
                                                    keyboardType="numeric"
                                                    value={opt.price}
                                                    onChangeText={(val) => handleOptionChange(group.id, optIdx, 'price', val)}
                                                />
                                                {group.options.length > 1 && (
                                                    <TouchableOpacity onPress={() => handleRemoveOption(group.id, optIdx)} style={s.removeOptBtn}>
                                                        <Ionicons name="remove-circle-outline" size={20} color="#EF4444" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ))}
                                        <TouchableOpacity onPress={() => handleAddOption(group.id)} style={s.addOptBtn}>
                                            <Text style={s.addOptText}>+ Thêm tuỳ chọn</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                        <View style={s.divider} />

                        <View style={s.inputRow}>
                            <View style={s.menuItemLeft}>
                                <Ionicons name="pricetag-outline" size={20} color={AppColors.gray} />
                                <Text style={s.menuItemLabel}>Giá <Text style={s.required}>*</Text></Text>
                            </View>
                            <TextInput
                                style={s.inlineInput}
                                placeholder="Đặt"
                                placeholderTextColor={AppColors.gray}
                                keyboardType="numeric"
                                value={price}
                                onChangeText={setPrice}
                            />
                        </View>
                        <View style={s.divider} />
                    </View>
                </ScrollView>

                {/* Bottom Buttons */}
                <View style={s.bottomContainer}>
                    <TouchableOpacity
                        style={[s.saveBtn, loading && { opacity: 0.5 }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={s.saveBtnText}>Lưu</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[s.showBtn, isFormValid ? s.showBtnActive : null, loading && { opacity: 0.5 }]}
                        onPress={handleSave}
                        disabled={!isFormValid || loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={[s.showBtnText, isFormValid ? s.showBtnTextActive : null]}>Hiển thị</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 10 : 30,
        paddingBottom: 12, paddingHorizontal: Spacing.lg,
        backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.charcoal },

    imageSection: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
    imageScroll: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    addImageBox: { width: 80, height: 80 },
    dashedBorder: {
        flex: 1, borderWidth: 1, borderColor: '#FF6B35', borderStyle: 'dashed',
        borderRadius: 4, justifyContent: 'center', alignItems: 'center',
    },
    addImageText: { color: '#FF6B35', fontSize: 12, fontWeight: '500' },
    imageWrapper: { width: 80, height: 80, position: 'relative' },
    pickedImage: { width: '100%', height: '100%', borderRadius: 4 },
    removeImageBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 10 },
    imageLimitText: { textAlign: 'right', fontSize: 12, color: AppColors.gray, marginTop: 8 },

    inputSection: { backgroundColor: '#fff', marginBottom: 8 },
    inputGroup: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    inputHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    inputLabel: { fontSize: 15, fontWeight: '600', color: AppColors.charcoal },
    required: { color: AppColors.primary },
    charCount: { fontSize: 12, color: AppColors.gray },
    textInput: {
        fontSize: 15, color: AppColors.charcoal,
        padding: 0, // Reset default padding
    },
    textArea: { height: 80, marginTop: 4 },

    menuList: { backgroundColor: '#fff', marginBottom: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    menuItemLabel: { fontSize: 15, fontWeight: '600', color: AppColors.charcoal },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 48 },

    inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    inlineInput: { flex: 1, textAlign: 'right', fontSize: 15, color: AppColors.charcoal, padding: 0 },

    typeSelector: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 6, padding: 2 },
    typeBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 4 },
    typeBtnActive: {
        backgroundColor: '#fff', ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
            android: { elevation: 1 },
        })
    },
    typeBtnText: { fontSize: 13, color: AppColors.gray, fontWeight: '500' },
    typeBtnTextActive: { color: AppColors.primary, fontWeight: '600' },

    bottomContainer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', paddingHorizontal: 16,
        paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        flexDirection: 'row', gap: 12,
        borderTopWidth: 1, borderTopColor: '#E5E7EB',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 4 },
            android: { elevation: 4 },
        }),
    },
    saveBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 4,
        borderWidth: 1, borderColor: '#E5E7EB',
        alignItems: 'center', justifyContent: 'center',
    },
    saveBtnText: { fontSize: 15, fontWeight: '600', color: AppColors.charcoal },
    showBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 4,
        backgroundColor: '#E5E7EB',
        alignItems: 'center', justifyContent: 'center',
    },
    showBtnActive: { backgroundColor: AppColors.primary },
    showBtnText: { fontSize: 15, fontWeight: '600', color: AppColors.gray },
    showBtnTextActive: { color: '#fff' },

    // Addon Styles
    addonSection: { padding: 16 },
    addonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    addonSectionTitle: { fontSize: 15, fontWeight: '600', color: AppColors.charcoal },
    addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 4 },
    addonGroupCard: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    addonGroupHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 8, marginBottom: 12 },
    addonGroupNameInput: { flex: 1, fontSize: 15, fontWeight: '600', color: AppColors.charcoal, padding: 0 },
    addonGroupToggles: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    toggleLabel: { fontSize: 13, color: AppColors.charcoal },
    addonOptionsList: { gap: 8 },
    addonOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addonOptionInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 6, fontSize: 14, minWidth: 100 },
    addonPriceInput: { width: 100, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 6, fontSize: 14, textAlign: 'right' },
    removeOptBtn: { padding: 4 },
    addOptBtn: { alignSelf: 'flex-start', marginTop: 8 },
    addOptText: { color: AppColors.primary, fontSize: 13, fontWeight: '500' },
    optional: { fontSize: 12, color: AppColors.gray, fontWeight: '400' },
});
