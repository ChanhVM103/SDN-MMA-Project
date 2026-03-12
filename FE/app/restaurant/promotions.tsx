import React, { useState, useEffect } from 'react';
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
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Create form state
    const [name, setName] = useState('');
    const [discount, setDiscount] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<any | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        if (!token) return;
        try {
            const res = await restaurantAPI.getMyRestaurant(token);
            if (res.success) {
                setRestaurantId(res.data._id);
                fetchPromotions(res.data._id);
            }
        } catch (error) {
            console.error("Error fetching restaurant:", error);
            setLoading(false);
        }
    };

    const fetchPromotions = async (rid: string) => {
        try {
            const res = await promotionAPI.getPromotions(rid);
            if (res.success) {
                setPromotions(res.data);
            }
        } catch (error) {
            console.error("Error fetching promotions:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        if (!restaurantId) return;
        setLoadingProducts(true);
        try {
            const res = await productAPI.getProductsByRestaurant(restaurantId, { limit: 100 });
            if (res.success) {
                setAllProducts(res.data);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleCreate = async () => {
        if (!name || !discount || selectedProducts.length === 0) {
            Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin và chọn ít nhất 1 sản phẩm");
            return;
        }

        const discountValue = parseInt(discount);
        if (isNaN(discountValue) || discountValue <= 0 || discountValue > 100) {
            Alert.alert("Lỗi", "Phần trăm giảm giá không hợp lệ (1-100)");
            return;
        }

        try {
            const res = await promotionAPI.createPromotion(token!, {
                name,
                discountPercent: discountValue,
                restaurantId,
                productIds: selectedProducts
            });
            
            if (res.success) {
                Alert.alert("Thành công", "Đã tạo chương trình khuyến mãi");
                setShowCreateModal(false);
                resetForm();
                fetchPromotions(restaurantId!);
            }
        } catch (error: any) {
            Alert.alert("Lỗi", error.message || "Không thể tạo khuyến mãi");
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Xác nhận",
            "Bạn có chắc muốn xóa khuyến mãi này?",
            [
                { text: "Hủy", style: "cancel" },
                { 
                    text: "Xóa", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const res = await promotionAPI.deletePromotion(token!, id);
                            if (res.success) {
                                fetchPromotions(restaurantId!);
                            }
                        } catch (error) {
                            Alert.alert("Lỗi", "Không thể xóa khuyến mãi");
                        }
                    }
                }
            ]
        );
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await promotionAPI.toggleStatus(token!, id, !currentStatus);
            if (res.success) {
                fetchPromotions(restaurantId!);
            }
        } catch (error) {
            Alert.alert("Lỗi", "Không thể cập nhật trạng thái");
        }
    };

    const resetForm = () => {
        setName('');
        setDiscount('');
        setSelectedProducts([]);
        setEditingPromotion(null);
    };

    const openCreateModal = () => {
        resetForm();
        fetchProducts();
        setShowCreateModal(true);
    };

    const openEditModal = (promo: any) => {
        setEditingPromotion(promo);
        setName(promo.name);
        setDiscount(promo.discountPercent.toString());
        setSelectedProducts(promo.productIds?.map((p: any) => p._id || p) || []);
        fetchProducts();
        setShowCreateModal(true);
    };

    const handleSave = async () => {
        if (!name || !discount || selectedProducts.length === 0) {
            Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin và chọn ít nhất 1 sản phẩm");
            return;
        }

        const discountValue = parseInt(discount);
        if (isNaN(discountValue) || discountValue <= 0 || discountValue > 100) {
            Alert.alert("Lỗi", "Phần trăm giảm giá không hợp lệ (1-100)");
            return;
        }

        try {
            if (editingPromotion) {
                const res = await promotionAPI.updatePromotion(token!, editingPromotion._id, {
                    name,
                    discountPercent: discountValue,
                    productIds: selectedProducts
                });
                if (res.success) {
                    Alert.alert("Thành công", "Đã cập nhật chương trình khuyến mãi");
                }
            } else {
                const res = await promotionAPI.createPromotion(token!, {
                    name,
                    discountPercent: discountValue,
                    restaurantId,
                    productIds: selectedProducts
                });
                if (res.success) {
                    Alert.alert("Thành công", "Đã tạo chương trình khuyến mãi");
                }
            }
            
            setShowCreateModal(false);
            resetForm();
            fetchPromotions(restaurantId!);
        } catch (error: any) {
            Alert.alert("Lỗi", error.message || "Không thể lưu khuyến mãi");
        }
    };

    const renderPromotionItem = ({ item }: { item: any }) => (
        <View style={[styles.card, !item.isActive && styles.cardInactive]}>
            <View style={[styles.statusIndicator, { backgroundColor: item.isActive ? AppColors.primary : AppColors.gray }]} />
            <View style={styles.cardMain}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.promoName}>{item.name}</Text>
                        <View style={styles.badgeRow}>
                            <View style={[styles.miniBadge, { backgroundColor: item.isActive ? '#FFF3ED' : '#F3F4F6' }]}>
                                <Text style={[styles.miniBadgeText, { color: item.isActive ? AppColors.primary : AppColors.gray }]}>
                                    {item.isActive ? "Đang chạy" : "Đã tạm dừng"}
                                </Text>
                            </View>
                            <Text style={styles.productCount}>{item.productIds?.length || 0} sản phẩm</Text>
                        </View>
                    </View>
                    <LinearGradient 
                        colors={item.isActive ? ['#FF6B35', '#E55A2B'] : ['#9CA3AF', '#6B7280']} 
                        style={styles.discountBadge}
                    >
                        <Text style={styles.promoDiscount}>-{item.discountPercent}%</Text>
                    </LinearGradient>
                </View>
                
                <View style={styles.cardActions}>
                    <TouchableOpacity 
                        style={styles.actionBtn} 
                        onPress={() => toggleStatus(item._id, item.isActive)}
                    >
                        <Ionicons 
                            name={item.isActive ? "stop-circle-outline" : "play-circle-outline"} 
                            size={18} 
                            color={item.isActive ? AppColors.gray : AppColors.primary} 
                        />
                        <Text style={[styles.actionBtnText, { color: item.isActive ? AppColors.gray : AppColors.primary }]}>
                            {item.isActive ? "Tạm dừng" : "Kích hoạt"}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.rightActions}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
                            <Ionicons name="create-outline" size={18} color="#3B82F6" />
                            <Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>Sửa</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item._id)}>
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Xóa</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderHeader = () => {
        const activeCount = promotions.filter(p => p.isActive).length;
        const totalProducts = Array.from(new Set(promotions.flatMap(p => p.productIds))).length;

        return (
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statVal}>{activeCount}</Text>
                    <Text style={styles.statLabel}>Đang chạy</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statVal}>{promotions.length}</Text>
                    <Text style={styles.statLabel}>Tổng chương trình</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statVal}>{totalProducts}</Text>
                    <Text style={styles.statLabel}>Món được giảm</Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color={AppColors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={AppColors.charcoal} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chương trình khuyến mãi</Text>
                <TouchableOpacity onPress={openCreateModal} style={styles.addBtn}>
                    <Ionicons name="add" size={28} color={AppColors.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={promotions}
                renderItem={renderPromotionItem}
                ListHeaderComponent={promotions.length > 0 ? renderHeader : null}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="pricetags-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyText}>Chưa có chương trình khuyến mãi nào</Text>
                        <TouchableOpacity style={styles.createBtn} onPress={openCreateModal}>
                            <Text style={styles.createBtnText}>Tạo ngay</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            <Modal visible={showCreateModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingPromotion ? 'Sửa khuyến mãi' : 'Tạo khuyến mãi mới'}</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <Ionicons name="close" size={24} color={AppColors.charcoal} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.label}>Tên chương trình</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Ví dụ: Giảm giá hè 2024"
                                value={name}
                                onChangeText={setName}
                            />

                            <Text style={styles.label}>Phần trăm giảm (%)</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Nhập từ 1-100"
                                keyboardType="numeric"
                                value={discount}
                                onChangeText={setDiscount}
                            />

                            <Text style={styles.label}>Chọn sản phẩm áp dụng</Text>
                            {loadingProducts ? (
                                <ActivityIndicator color={AppColors.primary} />
                            ) : (
                                allProducts.map(p => (
                                    <TouchableOpacity 
                                        key={p._id} 
                                        style={styles.productSelectItem}
                                        onPress={() => {
                                            if (selectedProducts.includes(p._id)) {
                                                setSelectedProducts(selectedProducts.filter(id => id !== p._id));
                                            } else {
                                                setSelectedProducts([...selectedProducts, p._id]);
                                            }
                                        }}
                                    >
                                        <Ionicons 
                                            name={selectedProducts.includes(p._id) ? "checkbox" : "square-outline"} 
                                            size={20} 
                                            color={selectedProducts.includes(p._id) ? AppColors.primary : AppColors.gray} 
                                        />
                                        <Text style={styles.productSelectName}>{p.name}</Text>
                                        <Text style={styles.productSelectPrice}>{p.price.toLocaleString()}đ</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>

                        <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                            <LinearGradient colors={['#FF6B35', '#E55A2B']} style={styles.submitGradient}>
                                <Text style={styles.submitBtnText}>
                                    {editingPromotion ? 'Lưu thay đổi' : 'Tạo khuyến mãi'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 16, paddingHorizontal: 20,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: AppColors.charcoal },
    addBtn: { padding: 4 },
    listContent: { padding: 16, paddingTop: 8 },
    
    // Stats
    statsContainer: { 
        flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, 
        padding: 16, marginBottom: 20, 
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8
    },
    statBox: { flex: 1, alignItems: 'center' },
    statVal: { fontSize: 20, fontWeight: '800', color: AppColors.primary, marginBottom: 2 },
    statLabel: { fontSize: 11, color: AppColors.gray, fontWeight: '600' },
    statDivider: { width: 1, height: '70%', backgroundColor: '#F3F4F6', alignSelf: 'center' },

    card: {
        backgroundColor: '#fff', borderRadius: 16, marginBottom: 16,
        flexDirection: 'row', overflow: 'hidden',
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08, shadowRadius: 10
    },
    cardInactive: { opacity: 0.8 },
    statusIndicator: { width: 4, height: '100%' },
    cardMain: { flex: 1, padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    promoName: { fontSize: 17, fontWeight: '700', color: AppColors.charcoal, marginBottom: 6 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    miniBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    miniBadgeText: { fontSize: 10, fontWeight: '700' },
    discountBadge: { 
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 5
    },
    promoDiscount: { fontSize: 20, fontWeight: '900', color: '#fff' },
    productCount: { fontSize: 12, color: AppColors.gray, fontWeight: '500' },
    
    cardActions: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F9FAFB' 
    },
    rightActions: { flexDirection: 'row', gap: 16 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionBtnText: { fontSize: 13, fontWeight: '600' },

    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
    emptyText: { fontSize: 16, color: AppColors.gray, marginTop: 12, marginBottom: 24, fontWeight: '500' },
    createBtn: { backgroundColor: AppColors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
    createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', height: '90%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontWeight: '800', color: AppColors.charcoal },
    modalBody: { flex: 1 },
    label: { fontSize: 15, fontWeight: '700', color: AppColors.charcoal, marginBottom: 10, marginTop: 16 },
    input: { 
        backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, 
        fontSize: 16, borderWidth: 1, borderColor: '#F3F4F6', color: AppColors.charcoal
    },
    productSelectItem: { 
        flexDirection: 'row', alignItems: 'center', paddingVertical: 14, 
        borderBottomWidth: 1, borderBottomColor: '#F9FAFB' 
    },
    productSelectName: { flex: 1, marginLeft: 12, fontSize: 15, color: AppColors.charcoal, fontWeight: '500' },
    productSelectPrice: { fontSize: 14, color: AppColors.primary, fontWeight: '600' },
    submitBtn: { marginTop: 20, borderRadius: 14, overflow: 'hidden' },
    submitGradient: { padding: 16, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' }
});
