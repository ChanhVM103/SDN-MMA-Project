import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Platform, Dimensions, Modal, ActivityIndicator, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { voucherAPI } from '@/constants/api';
import { useAuth } from '@/constants/auth-context';

const { width } = Dimensions.get('window');

interface CartItem {
    id: string;
    name: string;
    price: number;
    emoji: string;
    qty: number;
    size?: string;
    toppings?: string[];
    promotionName?: string;
}

interface Voucher {
    _id: string;
    name: string;
    description: string;
    minOrderAmount: number;
    maxDeliveryFee: number;
    isActive: boolean;
}

interface ConfirmOrderProps {
    cartItems: CartItem[];
    restaurant: any;
    totalPrice: number;
    onConfirm: (voucherId?: string, finalDeliveryFee?: number, paymentMethod?: string, deliveryAddress?: string) => void;
    onCancel: () => void;
}

export default function ConfirmOrderScreen({
    cartItems,
    restaurant,
    totalPrice,
    onConfirm,
    onCancel,
}: ConfirmOrderProps) {
    const { user } = useAuth();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);
    const [loadingVouchers, setLoadingVouchers] = useState(true);
    
    // New states for COD Business Logic
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'vnpay'>('cash');
    const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');

    // Check if user is banned from COD
    const isCodBanned = useMemo(() => {
        if (!user) return false;
        if (user.isVnpayMandatory) return true;
        if (user.codBannedUntil) {
            return new Date(user.codBannedUntil) > new Date();
        }
        return false;
    }, [user]);

    // Auto-switch to VNPay if COD is banned
    useEffect(() => {
        if (isCodBanned) {
            setPaymentMethod('vnpay');
        }
    }, [isCodBanned]);

    const deliveryFee = restaurant?.deliveryFee || 0;

    useEffect(() => {
        (async () => {
            try {
                const res = await voucherAPI.getActiveVouchers();
                setVouchers(res?.data || []);
            } catch (e) {
                console.log('Error fetching vouchers:', e);
            } finally {
                setLoadingVouchers(false);
            }
        })();
    }, []);

    // Filter vouchers eligible for this order
    const eligibleVouchers = vouchers.filter(v => totalPrice >= v.minOrderAmount);
    const selectedVoucher = vouchers.find(v => v._id === selectedVoucherId);

    // Calculate final delivery fee after voucher
    const finalDeliveryFee = selectedVoucher
        ? Math.min(deliveryFee, selectedVoucher.maxDeliveryFee)
        : deliveryFee;
    const deliverySaving = deliveryFee - finalDeliveryFee;
    const grandTotal = totalPrice + finalDeliveryFee;

    const handleConfirm = () => {
        if (!deliveryAddress.trim()) {
            Platform.OS === 'web' ? window.alert('Vui lòng nhập địa chỉ giao hàng') : alert('Vui lòng nhập địa chỉ giao hàng');
            return;
        }
        onConfirm(selectedVoucherId || undefined, finalDeliveryFee, paymentMethod, deliveryAddress);
    };

    const handleCancel = () => {
        onCancel();
    };

    return (
        <Modal
            visible={true}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={handleCancel}
        >
            <View style={s.container}>
                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={handleCancel}>
                        <Ionicons name="arrow-back" size={24} color={AppColors.charcoal} />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Xác nhận đơn hàng</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
                    {/* Địa chỉ giao hàng */}
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>📍 Địa chỉ giao hàng</Text>
                        <View style={s.addressInputContainer}>
                            <Ionicons name="location" size={20} color={AppColors.primary} style={s.addressIcon} />
                            <TextInput
                                style={s.addressInput}
                                placeholder="Nhập địa chỉ giao hàng của bạn..."
                                value={deliveryAddress}
                                onChangeText={setDeliveryAddress}
                                multiline
                            />
                        </View>
                        <Text style={s.restaurantSublabel}>Giao từ: {restaurant?.name}</Text>
                    </View>

                    {/* Danh sách sản phẩm */}
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Sản phẩm đã chọn</Text>
                        <View style={s.itemsList}>
                            {cartItems.map((item: any, idx) => (
                                <View key={item.lineId || item.id || `item-${idx}`} style={s.cartItemContainer}>
                                    <View style={s.cartItem}>
                                        <View style={s.itemHeader}>
                                            <Text style={s.itemQty}>{item.qty}x</Text>
                                            <Text style={s.itemEmoji}>{item.emoji}</Text>
                                            <View style={s.itemDetails}>
                                                <Text style={s.itemName}>{item.name}</Text>
                                                {item.size && (
                                                    <Text style={s.itemMeta}>Size: {item.size}</Text>
                                                )}
                                                {item.toppings && item.toppings.length > 0 && item.toppings[0] && (
                                                    <Text style={s.itemMeta}>+ {item.toppings.join(', ')}</Text>
                                                )}
                                                {item.promotionName && (
                                                    <View style={s.promoTag}>
                                                        <Text style={s.promoTagText}>PROMO: {item.promotionName}</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View style={s.priceBox}>
                                                <Text style={s.itemPrice}>
                                                    {(item.price * item.qty).toLocaleString('vi-VN')}đ
                                                </Text>
                                                {item.originalPrice && item.originalPrice > item.price && (
                                                    <Text style={s.oldPrice}>
                                                        {(item.originalPrice * item.qty).toLocaleString('vi-VN')}đ
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                    {idx < cartItems.length - 1 && <View style={s.divider} />}
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* ── Voucher Section ── */}
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>🎟️ Voucher giảm phí ship</Text>
                        {loadingVouchers ? (
                            <ActivityIndicator color={AppColors.primary} />
                        ) : vouchers.length === 0 ? (
                            <View style={s.noVoucher}>
                                <Ionicons name="ticket-outline" size={20} color={AppColors.gray} />
                                <Text style={s.noVoucherText}>Chưa có voucher nào</Text>
                            </View>
                        ) : (
                            <View style={s.voucherList}>
                                {vouchers.map((v) => {
                                    const isEligible = totalPrice >= v.minOrderAmount;
                                    const isSelected = selectedVoucherId === v._id;
                                    const saving = deliveryFee - Math.min(deliveryFee, v.maxDeliveryFee);
                                    
                                    return (
                                        <TouchableOpacity
                                            key={v._id}
                                            style={[
                                                s.voucherCard, 
                                                isSelected && s.voucherCardSelected,
                                                !isEligible && { opacity: 0.5, backgroundColor: '#f9f9f9', borderColor: '#eee' }
                                            ]}
                                            onPress={() => isEligible && setSelectedVoucherId(isSelected ? null : v._id)}
                                            activeOpacity={isEligible ? 0.7 : 1}
                                        >
                                            <View style={s.voucherLeft}>
                                                <View style={[
                                                    s.voucherIcon, 
                                                    isSelected && s.voucherIconSelected,
                                                    !isEligible && { backgroundColor: '#e5e7eb' }
                                                ]}>
                                                    <Ionicons 
                                                        name="pricetag" 
                                                        size={18} 
                                                        color={isSelected ? '#fff' : (isEligible ? AppColors.primary : '#9ca3af')} 
                                                    />
                                                </View>
                                            </View>
                                            <View style={s.voucherInfo}>
                                                <Text style={[s.voucherName, !isEligible && { color: '#6b7280' }]}>{v.name}</Text>
                                                <Text style={s.voucherDesc}>
                                                    {v.maxDeliveryFee === 0
                                                        ? `🚀 Free ship cho đơn từ ${v.minOrderAmount.toLocaleString('vi-VN')}đ`
                                                        : `Ship chỉ ${v.maxDeliveryFee.toLocaleString('vi-VN')}đ cho đơn từ ${v.minOrderAmount.toLocaleString('vi-VN')}đ`}
                                                </Text>
                                                {!isEligible ? (
                                                    <Text style={[s.voucherSaving, { color: '#ef4444' }]}>
                                                        Còn thiếu {(v.minOrderAmount - totalPrice).toLocaleString('vi-VN')}đ để áp dụng
                                                    </Text>
                                                ) : (
                                                    saving > 0 && <Text style={s.voucherSaving}>Tiết kiệm {saving.toLocaleString('vi-VN')}đ</Text>
                                                )}
                                            </View>
                                            <View style={s.voucherCheck}>
                                                {isEligible ? (
                                                    <Ionicons
                                                        name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                                                        size={24}
                                                        color={isSelected ? AppColors.primary : '#D1D5DB'}
                                                    />
                                                ) : (
                                                    <Ionicons name="lock-closed" size={20} color="#D1D5DB" />
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    {/* Thông tin đơn hàng */}
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Thông tin đơn hàng</Text>
                        <View style={s.orderInfo}>
                            <View style={s.infoRow}>
                                <Text style={s.infoLabel}>Số lượng</Text>
                                <Text style={s.infoValue}>{cartItems.reduce((sum, item) => sum + item.qty, 0)} món</Text>
                            </View>
                            <View style={s.infoRow}>
                                <Text style={s.infoLabel}>Tạm tính</Text>
                                <Text style={s.infoValue}>{totalPrice.toLocaleString('vi-VN')}đ</Text>
                            </View>
                            <View style={s.infoRow}>
                                <Text style={s.infoLabel}>Phí giao hàng</Text>
                                {deliverySaving > 0 ? (
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[s.infoValue, { textDecorationLine: 'line-through', color: AppColors.gray, fontSize: 11 }]}>
                                            {deliveryFee.toLocaleString('vi-VN')}đ
                                        </Text>
                                        <Text style={[s.infoValue, { color: '#16A34A', fontWeight: '700' }]}>
                                            {finalDeliveryFee === 0 ? 'FREE' : `${finalDeliveryFee.toLocaleString('vi-VN')}đ`}
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={s.infoValue}>{deliveryFee.toLocaleString('vi-VN')}đ</Text>
                                )}
                            </View>
                            {deliverySaving > 0 && (
                                <View style={s.savingBanner}>
                                    <Ionicons name="gift-outline" size={14} color="#16A34A" />
                                    <Text style={s.savingText}>Bạn tiết kiệm {deliverySaving.toLocaleString('vi-VN')}đ phí ship!</Text>
                                </View>
                            )}
                            <View style={s.dividerFull} />
                            <View style={s.infoRow}>
                                <Text style={s.totalLabel}>Tổng cộng</Text>
                                <Text style={s.totalValue}>
                                    {grandTotal.toLocaleString('vi-VN')}đ
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Phương thức thanh toán */}
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>💳 Phương thức thanh toán</Text>
                        
                        {/* Option 1: Cash */}
                        <TouchableOpacity 
                            style={[
                                s.paymentOption, 
                                paymentMethod === 'cash' && s.paymentOptionActive,
                                isCodBanned && s.paymentOptionDisabled
                            ]}
                            onPress={() => !isCodBanned && setPaymentMethod('cash')}
                            disabled={isCodBanned}
                        >
                            <View style={s.paymentOptionLeft}>
                                <View style={[s.paymentIconBox, { backgroundColor: '#FFF3ED' }]}>
                                    <MaterialCommunityIcons name="cash" size={24} color="#FF6B35" />
                                </View>
                                <View>
                                    <Text style={s.paymentOptionTitle}>Tiền mặt (COD)</Text>
                                    <Text style={s.paymentOptionSub}>Thanh toán khi nhận hàng</Text>
                                    {isCodBanned && (
                                        <Text style={s.banText}>
                                            ⚠️ {user?.isVnpayMandatory ? 'Bắt buộc VNPay do bùng hàng' : 'Đang bị cấm COD tạm thời'}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <Ionicons 
                                name={paymentMethod === 'cash' ? "checkmark-circle" : "ellipse-outline"} 
                                size={24} 
                                color={paymentMethod === 'cash' ? AppColors.primary : '#D1D5DB'} 
                            />
                        </TouchableOpacity>

                        {/* Option 2: VNPay */}
                        <TouchableOpacity 
                            style={[s.paymentOption, paymentMethod === 'vnpay' && s.paymentOptionActive]}
                            onPress={() => setPaymentMethod('vnpay')}
                        >
                            <View style={s.paymentOptionLeft}>
                                <View style={[s.paymentIconBox, { backgroundColor: '#E0F2FE' }]}>
                                    <MaterialCommunityIcons name="credit-card-outline" size={24} color="#0EA5E9" />
                                </View>
                                <View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={s.paymentOptionTitle}>VNPay</Text>
                                        <View style={s.recomBadge}><Text style={s.recomText}>Khuyên dùng</Text></View>
                                    </View>
                                    <Text style={s.paymentOptionSub}>Thanh toán online an toàn</Text>
                                </View>
                            </View>
                            <Ionicons 
                                name={paymentMethod === 'vnpay' ? "checkmark-circle" : "ellipse-outline"} 
                                size={24} 
                                color={paymentMethod === 'vnpay' ? AppColors.primary : '#D1D5DB'} 
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 30 }} />
                </ScrollView>

                {/* Footer buttons */}
                <View style={s.footer}>
                    <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
                        <Text style={s.cancelBtnText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm}>
                        <LinearGradient
                            colors={['#FF6B35', '#E55A2B']}
                            style={s.confirmBtnGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={s.confirmBtnText}>Tiếp tục</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 56 : 36,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: AppColors.charcoal,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    restaurantCard: {
        backgroundColor: '#FFF3ED',
        borderRadius: BorderRadius.lg,
        padding: 14,
        marginBottom: 20,
    },
    restaurantInfo: {
        gap: 8,
    },
    restaurantName: {
        fontSize: 16,
        fontWeight: '700',
        color: AppColors.charcoal,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
    },
    address: {
        fontSize: 12,
        color: AppColors.gray,
        flex: 1,
        lineHeight: 16,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: AppColors.charcoal,
        marginBottom: 12,
    },
    itemsList: {
        backgroundColor: '#fff',
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    cartItemContainer: {
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    cartItem: {
        gap: 8,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    itemQty: {
        fontSize: 14,
        fontWeight: '800',
        color: AppColors.primary,
        minWidth: 25,
    },
    itemEmoji: {
        fontSize: 24,
    },
    itemDetails: {
        flex: 1,
        gap: 2,
    },
    itemName: {
        fontSize: 13,
        fontWeight: '600',
        color: AppColors.charcoal,
    },
    itemMeta: {
        fontSize: 11,
        color: AppColors.gray,
    },
    itemPrice: {
        fontSize: 13,
        fontWeight: '700',
        color: AppColors.primary,
    },
    priceBox: {
        alignItems: 'flex-end',
        minWidth: 80,
    },
    oldPrice: {
        fontSize: 11,
        color: AppColors.gray,
        textDecorationLine: 'line-through',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginTop: 8,
    },
    // ── Voucher styles ──
    noVoucher: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F9FAFB',
        borderRadius: BorderRadius.md,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    noVoucherText: {
        fontSize: 13,
        color: AppColors.gray,
    },
    voucherList: {
        gap: 10,
    },
    voucherCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: BorderRadius.md,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        padding: 12,
        gap: 12,
    },
    voucherCardSelected: {
        borderColor: AppColors.primary,
        backgroundColor: '#FFF7ED',
    },
    voucherLeft: {},
    voucherIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF3ED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    voucherIconSelected: {
        backgroundColor: AppColors.primary,
    },
    voucherInfo: {
        flex: 1,
        gap: 2,
    },
    voucherName: {
        fontSize: 13,
        fontWeight: '700',
        color: AppColors.charcoal,
    },
    voucherDesc: {
        fontSize: 11,
        color: AppColors.gray,
    },
    voucherSaving: {
        fontSize: 11,
        fontWeight: '700',
        color: '#16A34A',
        marginTop: 2,
    },
    voucherCheck: {},
    savingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F0FDF4',
        borderRadius: 8,
        padding: 8,
        marginTop: 4,
    },
    savingText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#16A34A',
    },
    // ── Order info ──
    orderInfo: {
        backgroundColor: '#fff',
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 14,
        gap: 10,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 13,
        color: AppColors.gray,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        color: AppColors.charcoal,
    },
    dividerFull: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 8,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: AppColors.charcoal,
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '800',
        color: AppColors.primary,
    },
    paymentMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFF3ED',
        borderRadius: BorderRadius.md,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#FFE0CC',
    },
    paymentText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: AppColors.charcoal,
    },
    footer: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    cancelBtn: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: AppColors.primary,
        borderRadius: BorderRadius.md,
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: AppColors.primary,
    },
    confirmBtn: {
        flex: 1.2,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    confirmBtnGradient: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    confirmBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    promoTag: {
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    promoTagText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#EF4444',
    },
    // New styles
    addressInputContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: BorderRadius.md,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        padding: 12,
        alignItems: 'flex-start',
    },
    addressIcon: {
        marginTop: 2,
        marginRight: 10,
    },
    addressInput: {
        flex: 1,
        fontSize: 14,
        color: AppColors.charcoal,
        minHeight: 40,
        textAlignVertical: 'top',
    },
    restaurantSublabel: {
        fontSize: 11,
        color: AppColors.gray,
        marginTop: 6,
        fontStyle: 'italic',
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: BorderRadius.md,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        marginBottom: 12,
    },
    paymentOptionActive: {
        borderColor: AppColors.primary,
        backgroundColor: '#FFF7ED',
    },
    paymentOptionDisabled: {
        opacity: 0.6,
        backgroundColor: '#F9FAFB',
    },
    paymentOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    paymentIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    paymentOptionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: AppColors.charcoal,
    },
    paymentOptionSub: {
        fontSize: 12,
        color: AppColors.gray,
    },
    recomBadge: {
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    recomText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#0369A1',
        textTransform: 'uppercase',
    },
    banText: {
        fontSize: 11,
        color: '#EF4444',
        fontWeight: '600',
        marginTop: 2,
    },
});
