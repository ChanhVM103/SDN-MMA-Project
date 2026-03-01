import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Platform, Dimensions, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface CartItem {
    id: string;
    name: string;
    price: number;
    emoji: string;
    qty: number;
    size?: string;
    toppings?: string[];
}

interface ConfirmOrderProps {
    cartItems: CartItem[];
    restaurant: any;
    totalPrice: number;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmOrderScreen({
    cartItems,
    restaurant,
    totalPrice,
    onConfirm,
    onCancel,
}: ConfirmOrderProps) {
    const handleConfirm = () => {
        onConfirm();
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
                {/* Thông tin nhà hàng */}
                <View style={s.restaurantCard}>
                    <View style={s.restaurantInfo}>
                        <Text style={s.restaurantName}>{restaurant?.name}</Text>
                        <View style={s.addressRow}>
                            <Ionicons name="location-outline" size={16} color={AppColors.gray} />
                            <Text style={s.address}>{restaurant?.address || '666 Hoàn Kiếm, Hà Nội'}</Text>
                        </View>
                    </View>
                </View>

                {/* Danh sách sản phẩm */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Sản phẩm đã chọn</Text>
                    <View style={s.itemsList}>
                        {cartItems.map((item, idx) => (
                            <View key={item.id} style={s.cartItemContainer}>
                                <View style={s.cartItem}>
                                    <View style={s.itemHeader}>
                                        <Text style={s.itemQty}>{item.qty}x</Text>
                                        <Text style={s.itemEmoji}>{item.emoji}</Text>
                                        <View style={s.itemDetails}>
                                            <Text style={s.itemName}>{item.name}</Text>
                                            {item.size && (
                                                <Text style={s.itemMeta}>Size: {item.size}</Text>
                                            )}
                                            {item.toppings && item.toppings.length > 0 && (
                                                <Text style={s.itemMeta}>+{item.toppings.length} topping</Text>
                                            )}
                                        </View>
                                        <Text style={s.itemPrice}>
                                            {(item.price * item.qty).toLocaleString('vi-VN')}đ
                                        </Text>
                                    </View>
                                </View>
                                {idx < cartItems.length - 1 && <View style={s.divider} />}
                            </View>
                        ))}
                    </View>
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
                            <Text style={s.infoValue}>{(restaurant?.deliveryFee || 0).toLocaleString('vi-VN')}đ</Text>
                        </View>
                        <View style={s.dividerFull} />
                        <View style={s.infoRow}>
                            <Text style={s.totalLabel}>Tổng cộng</Text>
                            <Text style={s.totalValue}>
                                {(totalPrice + (restaurant?.deliveryFee || 0)).toLocaleString('vi-VN')}đ
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Phương thức thanh toán */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Phương thức thanh toán</Text>
                    <TouchableOpacity style={s.paymentMethod}>
                        <Ionicons name="wallet-outline" size={20} color={AppColors.primary} />
                        <Text style={s.paymentText}>Thanh toán khi nhận hàng</Text>
                        <Ionicons name="checkmark-circle" size={20} color={AppColors.primary} />
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
        minWidth: 80,
        textAlign: 'right',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginTop: 8,
    },
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
});
