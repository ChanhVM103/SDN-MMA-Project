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
        <View style={s.promoCard}>
            <View style={s.cardTop}>
                <View style={s.promoInfo}>
                    <Text style={s.promoName}>{item.name}</Text>
                    <View style={s.discountRow}>
                        <Ionicons name="flash" size={14} color="#FF6B35" />
                        <Text style={s.discountText}>Giảm {item.discountPercent}% cho {item.productIds?.length || 0} sản phẩm</Text>
                    </View>
                </View>
                <View style={[s.statusTag, { backgroundColor: item.isActive ? '#10B98115' : '#F1F5F9' }]}>
                    <View style={[s.statusDot, { backgroundColor: item.isActive ? '#10B981' : '#94A3B8' }]} />
                    <Text style={[s.statusTagText, { color: item.isActive ? '#10B981' : '#64748B' }]}>
                        {item.isActive ? 'Đang chạy' : 'Đang tạm dừng'}
                    </Text>
                </View>
            </View>

            <View style={s.cardDivider} />

            <View style={s.cardBottom}>
                <Text style={s.dateRange}>
                    ID: {item._id.slice(-6).toUpperCase()}
                </Text>
                <View style={s.actionRow}>
                    <TouchableOpacity 
                        style={s.iconActionBtn} 
                        onPress={() => handleDelete(item._id)}
                    >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={s.iconActionBtn} 
                        onPress={() => openEdit(item)}
                    >
                        <Ionicons name="pencil-outline" size={20} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[s.toggleBtn, item.isActive ? s.toggleBtnPause : s.toggleBtnActive]}
                        onPress={() => toggleStatus(item)}
                    >
                        <Ionicons 
                            name={item.isActive ? "pause" : "play"} 
                            size={16} 
                            color="#fff" 
                        />
                        <Text style={s.toggleBtnText}>
                            {item.isActive ? 'Dừng' : 'Chạy'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={s.container}>
            <Stack.Screen options={{ headerShown: false }} />
            
            <LinearGradient
                colors={['#FF6B35', '#E55A2B']}
                style={s.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Chương trình Flash Sale</Text>
                    <View style={s.headerStats}>
                        <Text style={s.statText}>{promotions.filter(p => p.isActive).length} Đang chạy</Text>
                    </View>
                </View>
            </LinearGradient>

            {loading && !promotions.length ? (
                <View style={s.centered}><ActivityIndicator size="large" color="#FF6B35" /></View>
            ) : (
                <FlatList
                    data={promotions}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={s.emptyState}>
                            <View style={s.emptyIconCircle}>
                                <Ionicons name="megaphone-outline" size={60} color="#E2E8F0" />
                            </View>
                            <Text style={s.emptyTitle}>Chưa có Flash Sale nào</Text>
                            <Text style={s.emptySub}>Tạo chương trình khuyến mãi đầu tiên của bạn ngay!</Text>
                            <TouchableOpacity style={s.emptyActionBtn} onPress={() => { resetForm(); setShowModal(true); }}>
                                <Text style={s.emptyActionBtnText}>+ Tạo Flash Sale ngay</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            {/* Floating Action Button */}
            {promotions.length > 0 && (
                <TouchableOpacity 
                    style={s.fab} 
                    onPress={() => { resetForm(); setShowModal(true); }}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#FF6B35', '#E55A2B']}
                        style={s.fabGradient}
                    >
                        <Ionicons name="add" size={30} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* Create/Edit Modal */}
            <Modal visible={showModal} animationType="slide" transparent={true}>
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>{editingId ? 'Sửa Flash Sale' : 'Tạo Flash Sale mới'}</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color="#94A3B8" />
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
                                                size={22} 
                                                color={isSelected ? "#FF6B35" : '#CBD5E1'} 
                                            />
                                            <View style={{ flex: 1, marginLeft: 12 }}>
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
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', flex: 1, marginLeft: 15 },
    headerStats: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    statText: { color: '#fff', fontSize: 11, fontWeight: '800' },

    promoCard: {
        backgroundColor: '#fff', borderRadius: 24, marginBottom: 16, padding: 20,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 12 },
            android: { elevation: 3 },
        }),
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    promoInfo: { flex: 1 },
    promoName: { fontSize: 17, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
    discountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    discountText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    statusTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusTagText: { fontSize: 11, fontWeight: '800' },

    cardDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
    
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateRange: { fontSize: 12, color: '#94A3B8', fontWeight: '700' },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconActionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    toggleBtn: { 
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, 
        borderRadius: 14, gap: 6, minWidth: 100, justifyContent: 'center' 
    },
    toggleBtnActive: { backgroundColor: '#10B981' },
    toggleBtnPause: { backgroundColor: '#FF6B35' },
    toggleBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },

    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
    emptySub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 10, marginBottom: 30, lineHeight: 20 },
    emptyActionBtn: { backgroundColor: '#FF6B35', paddingHorizontal: 24, paddingVertical: 15, borderRadius: 16 },
    emptyActionBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

    fab: {
        position: 'absolute', bottom: 30, right: 20,
        width: 60, height: 60, borderRadius: 30,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15 },
            android: { elevation: 8 },
        }),
    },
    fabGradient: { flex: 1, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', height: '90%', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
    modalBody: { flex: 1 },
    label: { fontSize: 14, fontWeight: '800', color: '#64748B', marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0', color: '#1E293B' },
    productGrid: { gap: 12, marginTop: 8 },
    productItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
    productItemSelected: { borderColor: '#FF6B35', backgroundColor: '#FFF7F5' },
    productName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    productPrice: { fontSize: 13, color: '#FF6B35', fontWeight: '800', marginTop: 2 },
    submitBtn: { marginTop: 20, borderRadius: 18, overflow: 'hidden' },
    submitGradient: { padding: 16, alignItems: 'center' },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});

