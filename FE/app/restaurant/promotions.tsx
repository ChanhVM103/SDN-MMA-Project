import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator, Modal, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/constants/auth-context';
import { promotionAPI, restaurantAPI, productAPI } from '@/constants/api';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function PromotionsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [promotions, setPromotions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [discount, setDiscount] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Cross-platform alert/confirm helpers
    const showAlert = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void) => {
        if (Platform.OS === 'web') {
            if (window.confirm(`${title}\n\n${message}`)) {
                onConfirm();
            }
        } else {
            Alert.alert(title, message, [
                { text: "Hủy", style: "cancel" },
                { text: "Đồng ý", onPress: onConfirm }
            ]);
        }
    };

    const fetchData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const restRes = await restaurantAPI.getMyRestaurant(token);
            if (restRes.success) {
                const rid = restRes.data._id;
                setRestaurantId(rid);
                const [promoRes, prodRes] = await Promise.all([
                    promotionAPI.getPromotions(rid),
                    productAPI.getProductsByRestaurant(rid, { limit: 100 })
                ]);
                if (promoRes.success) setPromotions(promoRes.data);
                if (prodRes.success) setAllProducts(prodRes.data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const resetForm = () => {
        setName('');
        setDiscount('');
        setSelectedProducts([]);
        setEditingId(null);
    };

    const handleSave = async (override = false) => {
        if (!name || !discount || selectedProducts.length === 0) {
            showAlert("Lỗi", "Vui lòng điền đủ thông tin và chọn ít nhất 1 sản phẩm");
            return;
        }

        const discountVal = parseInt(discount);
        if (isNaN(discountVal) || discountVal <= 0 || discountVal > 100) {
            showAlert("Lỗi", "Giảm giá phải từ 1-100%");
            return;
        }

        setSubmitting(true);
        try {
            let res;
            const payload = {
                name,
                discountPercent: discountVal,
                productIds: selectedProducts,
                restaurantId,
                override
            };

            if (editingId) {
                res = await promotionAPI.updatePromotion(token!, editingId, payload);
            } else {
                res = await promotionAPI.createPromotion(token!, payload);
            }

            if (res.success) {
                showAlert("Thành công", editingId ? "Đã cập nhật Flash Sale" : "Đã tạo Flash Sale");
                setShowModal(false);
                resetForm();
                fetchData();
            }
        } catch (error: any) {
            const errorData = error.data || {};
            if (errorData.hasGlobalConflict) {
                showConfirm(
                    "Xung đột chương trình",
                    errorData.message || error.message,
                    () => handleSave(true)
                );
            } else if (errorData.hasConflicts) {
                showConfirm(
                    "Xung đột sản phẩm",
                     errorData.message || error.message || "Một số sản phẩm bạn chọn đang thuộc chương trình Flash Sale khác. Bạn có muốn gỡ chúng khỏi chương trình cũ và áp dụng vào chương trình này không?",
                    () => handleSave(true)
                );
            } else {
                showAlert("Lỗi", error.message || "Không thể thực hiện thao tác");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id: string) => {
        showConfirm(
            "Xác nhận", 
            "Bạn có chắc muốn xóa Flash Sale này?", 
            async () => {
                try {
                    const res = await promotionAPI.deletePromotion(token!, id);
                    if (res.success) fetchData();
                } catch (error: any) {
                    showAlert("Lỗi", error.message || "Không thể xóa");
                }
            }
        );
    };

    const toggleStatus = async (promo: any) => {
        try {
            setLoading(true);
            const res = await promotionAPI.updatePromotion(token!, promo._id, {
                isActive: !promo.isActive
            });
            if (res.success) fetchData();
        } catch (error: any) {
            const errorData = error.data || {};
            if (errorData.hasGlobalConflict) {
                showConfirm(
                    "Xung đột chương trình",
                    errorData.message || error.message,
                    async () => {
                        try {
                            setLoading(true);
                            await promotionAPI.updatePromotion(token!, promo._id, {
                                isActive: true,
                                override: true
                            });
                            fetchData();
                        } catch (e: any) {
                            showAlert("Lỗi", e.message);
                        } finally {
                            setLoading(false);
                        }
                    }
                );
            } else if (errorData.hasConflicts) {
                showConfirm(
                    "Xử lý xung đột sản phẩm",
                    errorData.message || error.message || "Khi kích hoạt mã này, một số sản phẩm sẽ bị trùng khuyến mãi. Bạn có muốn kích hoạt và gỡ sản phẩm đó khỏi khuyến mãi cũ không?",
                    async () => {
                        try {
                            setLoading(true);
                            await promotionAPI.updatePromotion(token!, promo._id, {
                                isActive: true,
                                override: true
                            });
                            fetchData();
                        } catch (e: any) {
                            showAlert("Lỗi", e.message);
                        } finally {
                            setLoading(false);
                        }
                    }
                );
            } else {
                showAlert("Lỗi", error.message || "Không thể cập nhật");
            }
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (promo: any) => {
        setEditingId(promo._id);
        setName(promo.name);
        setDiscount(promo.discountPercent.toString());
        setSelectedProducts(promo.productIds?.map((p: any) => p._id || p) || []);
        setShowModal(true);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[s.card, !item.isActive && s.cardInactive]}>
            <View style={[s.statusLine, { backgroundColor: item.isActive ? AppColors.primary : '#CBD5E1' }]} />
            <View style={s.cardBody}>
                <View style={s.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.cardTitle}>{item.name}</Text>
                        <View style={s.cardMeta}>
                            <View style={[s.statusBadge, { backgroundColor: item.isActive ? '#FFF3ED' : '#F1F5F9' }]}>
                                <Text style={[s.statusBadgeText, { color: item.isActive ? AppColors.primary : '#64748B' }]}>
                                    {item.isActive ? 'Đang chạy' : 'Tạm dừng'}
                                </Text>
                            </View>
                            <Text style={s.productCount}>{item.productIds?.length || 0} sản phẩm</Text>
                        </View>
                    </View>
                    <LinearGradient colors={item.isActive ? ['#FF6B35', '#E55A2B'] : ['#94A3B8', '#64748B']} style={s.discountBox}>
                        <Text style={s.discountText}>-{item.discountPercent}%</Text>
                    </LinearGradient>
                </View>

                <View style={s.cardActions}>
                    <TouchableOpacity style={s.actionBtn} onPress={() => toggleStatus(item)}>
                        <Ionicons name={item.isActive ? "pause-circle-outline" : "play-circle-outline"} size={20} color={item.isActive ? '#64748B' : AppColors.primary} />
                        <Text style={[s.actionText, { color: item.isActive ? '#64748B' : AppColors.primary }]}>
                            {item.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                        </Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <TouchableOpacity style={s.actionBtn} onPress={() => openEdit(item)}>
                            <Ionicons name="pencil-outline" size={18} color="#3B82F6" />
                            <Text style={[s.actionText, { color: '#3B82F6' }]}>Sửa</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.actionBtn} onPress={() => handleDelete(item._id)}>
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            <Text style={[s.actionText, { color: '#EF4444' }]}>Xóa</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <View style={s.container}>
            <Stack.Screen options={{ headerShown: false }} />
            
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.roundBtn}>
                    <Ionicons name="arrow-back" size={24} color={AppColors.charcoal} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Quản lý Flash Sale</Text>
                <TouchableOpacity onPress={() => { resetForm(); setShowModal(true); }} style={s.roundBtn}>
                    <Ionicons name="add" size={28} color={AppColors.primary} />
                </TouchableOpacity>
            </View>

            {loading && !promotions.length ? (
                <View style={s.centered}><ActivityIndicator size="large" color={AppColors.primary} /></View>
            ) : (
                <FlatList
                    data={promotions}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View style={s.emptyState}>
                            <Ionicons name="pricetags-outline" size={80} color="#E2E8F0" />
                            <Text style={s.emptyTitle}>Chưa có Flash Sale nào</Text>
                            <Text style={s.emptySub}>Tạo chương trình khuyến mãi đầu tiên của bạn ngay!</Text>
                            <TouchableOpacity style={s.primaryBtn} onPress={() => { resetForm(); setShowModal(true); }}>
                                <Text style={s.primaryBtnText}>Tạo Flash Sale</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            {/* Create/Edit Modal */}
            <Modal visible={showModal} animationType="slide" transparent={true}>
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>{editingId ? 'Sửa Flash Sale' : 'Tạo Flash Sale mới'}</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color={AppColors.charcoal} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
                            <Text style={s.label}>Tên chương trình</Text>
                            <TextInput 
                                style={s.input} 
                                placeholder="VD: Giảm giá mùa hè" 
                                value={name} 
                                onChangeText={setName}
                            />

                            <Text style={s.label}>Mức giảm giá (%)</Text>
                            <TextInput 
                                style={s.input} 
                                placeholder="1 - 100" 
                                keyboardType="numeric" 
                                value={discount} 
                                onChangeText={setDiscount}
                            />

                            <Text style={s.label}>Sản phẩm áp dụng</Text>
                            <View style={s.productGrid}>
                                {allProducts.map(p => {
                                    const isSelected = selectedProducts.includes(p._id);
                                    return (
                                        <TouchableOpacity 
                                            key={p._id} 
                                            style={[s.productItem, isSelected && s.productItemSelected]}
                                            onPress={() => {
                                                if (isSelected) {
                                                    setSelectedProducts(selectedProducts.filter(id => id !== p._id));
                                                } else {
                                                    setSelectedProducts([...selectedProducts, p._id]);
                                                }
                                            }}
                                        >
                                            <Ionicons 
                                                name={isSelected ? "checkbox" : "square-outline"} 
                                                size={20} 
                                                color={isSelected ? AppColors.primary : '#94A3B8'} 
                                            />
                                            <View style={{ flex: 1, marginLeft: 10 }}>
                                                <Text style={s.productName}>{p.name}</Text>
                                                <Text style={s.productPrice}>{p.price.toLocaleString()}đ</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>

                        <TouchableOpacity 
                            style={[s.submitBtn, submitting && { opacity: 0.7 }]} 
                            onPress={() => handleSave()}
                            disabled={submitting}
                        >
                            <LinearGradient colors={['#FF6B35', '#E55A2B']} style={s.submitGradient}>
                                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>{editingId ? 'Lưu thay đổi' : 'Tạo chương trình'}</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 16, paddingHorizontal: 16,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: AppColors.charcoal },
    roundBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
    card: {
        backgroundColor: '#fff', borderRadius: 16, marginBottom: 16,
        flexDirection: 'row', overflow: 'hidden',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 }, android: { elevation: 3 } })
    },
    cardInactive: { opacity: 0.8 },
    statusLine: { width: 4 },
    cardBody: { flex: 1, padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    cardTitle: { fontSize: 17, fontWeight: '700', color: AppColors.charcoal, marginBottom: 4 },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    statusBadgeText: { fontSize: 11, fontWeight: '700' },
    productCount: { fontSize: 12, color: '#64748B', fontWeight: '500' },
    discountBox: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    discountText: { color: '#fff', fontSize: 16, fontWeight: '900' },
    cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionText: { fontSize: 13, fontWeight: '700' },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: AppColors.charcoal, marginTop: 16 },
    emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8, marginBottom: 24 },
    primaryBtn: { backgroundColor: AppColors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
    primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', height: '90%', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 24, fontWeight: '800', color: AppColors.charcoal },
    modalBody: { flex: 1 },
    label: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0', color: AppColors.charcoal },
    productGrid: { gap: 12, marginTop: 8 },
    productItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    productItemSelected: { borderColor: AppColors.primary, backgroundColor: '#FFF7F5' },
    productName: { fontSize: 15, fontWeight: '600', color: AppColors.charcoal },
    productPrice: { fontSize: 13, color: AppColors.primary, fontWeight: '700', marginTop: 2 },
    submitBtn: { marginTop: 20, borderRadius: 16, overflow: 'hidden' },
    submitGradient: { padding: 16, alignItems: 'center' },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});

