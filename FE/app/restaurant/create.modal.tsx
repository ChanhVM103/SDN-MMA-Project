import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Modal, Platform, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    emoji: string;
    category: string;
    isBestSeller?: boolean;
    isNew?: boolean;
}

interface CreateModalProps {
    visible: boolean;
    item: MenuItem | null;
    onClose: () => void;
    onConfirm: (selectedSize: string, selectedToppings: string[]) => void;
}

const SIZES = [
    { id: 'S', label: 'Nhỏ (Small)', price: 0 },
    { id: 'M', label: 'Vừa (Medium)', price: 5000 },
    { id: 'L', label: 'Lớn (Large)', price: 10000 },
];

const TOPPINGS = [
    { id: 'sugar', label: 'Đường', price: 2000 },
    { id: 'boba', label: 'Trân Châu', price: 5000 },
    { id: 'jelly', label: 'Thạch', price: 3000 },
    { id: 'pudding', label: 'Pudding', price: 4000 },
    { id: 'coconut', label: 'Nước Cốt Dừa', price: 3000 },
    { id: 'aloe', label: 'Nha Đam', price: 2000 },
];

export default function CreateModalPage({ visible, item, onClose, onConfirm }: CreateModalProps) {
    const [selectedSize, setSelectedSize] = useState('M');
    const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

    const handleToppingToggle = (toppingId: string) => {
        setSelectedToppings(prev =>
            prev.includes(toppingId)
                ? prev.filter(id => id !== toppingId)
                : [...prev, toppingId]
        );
    };

    const handleConfirm = () => {
        onConfirm(selectedSize, selectedToppings);
        setSelectedSize('M');
        setSelectedToppings([]);
    };

    const handleClose = () => {
        setSelectedSize('M');
        setSelectedToppings([]);
        onClose();
    };

    const sizePrice = SIZES.find(s => s.id === selectedSize)?.price || 0;
    const toppingPrice = selectedToppings.reduce((total, toppingId) => {
        const topping = TOPPINGS.find(t => t.id === toppingId);
        return total + (topping?.price || 0);
    }, 0);
    const totalPrice = (item?.price || 0) + sizePrice + toppingPrice;

    if (!item) return null;

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={s.overlay}>
                <View style={s.container}>
                    {/* Header */}
                    <View style={s.header}>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color={AppColors.charcoal} />
                        </TouchableOpacity>
                        <Text style={s.headerTitle}>Tùy chỉnh đơn hàng</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
                        {/* Product Card */}
                        <View style={s.productCard}>
                            <View style={s.productEmoji}>
                                <Text style={s.emoji}>{item.emoji}</Text>
                            </View>
                            <Text style={s.productName}>{item.name}</Text>
                            <Text style={s.productDesc}>{item.description}</Text>
                            <Text style={s.productPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
                        </View>

                        {/* Size Selection */}
                        <View style={s.section}>
                            <Text style={s.sectionTitle}>Chọn Size</Text>
                            <View style={s.optionsGroup}>
                                {SIZES.map(size => (
                                    <TouchableOpacity
                                        key={size.id}
                                        style={[
                                            s.option,
                                            selectedSize === size.id && s.optionSelected,
                                        ]}
                                        onPress={() => setSelectedSize(size.id)}
                                    >
                                        <View style={s.optionLeftContent}>
                                            <Text style={[
                                                s.optionLabel,
                                                selectedSize === size.id && s.optionLabelSelected,
                                            ]}>
                                                {size.label}
                                            </Text>
                                        </View>
                                        <Text style={[
                                            s.optionPrice,
                                            selectedSize === size.id && s.optionPriceSelected,
                                        ]}>
                                            +{size.price.toLocaleString('vi-VN')}đ
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Toppings Selection */}
                        <View style={s.section}>
                            <Text style={s.sectionTitle}>Topping (Tùy chọn)</Text>
                            <View style={s.toppingsGrid}>
                                {TOPPINGS.map(topping => (
                                    <TouchableOpacity
                                        key={topping.id}
                                        style={[
                                            s.toppingItem,
                                            selectedToppings.includes(topping.id) && s.toppingItemSelected,
                                        ]}
                                        onPress={() => handleToppingToggle(topping.id)}
                                    >
                                        <View style={s.checkbox}>
                                            {selectedToppings.includes(topping.id) && (
                                                <Ionicons name="checkmark" size={14} color="#fff" />
                                            )}
                                        </View>
                                        <Text style={s.toppingLabel}>{topping.label}</Text>
                                        <Text style={s.toppingPrice}>+{topping.price.toLocaleString('vi-VN')}đ</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={{ height: 20 }} />
                    </ScrollView>

                    {/* Footer */}
                    <View style={s.footer}>
                        <View style={s.totalBox}>
                            <Text style={s.totalLabel}>Tổng cộng</Text>
                            <Text style={s.totalPrice}>{totalPrice.toLocaleString('vi-VN')}đ</Text>
                        </View>
                        <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm}>
                            <LinearGradient
                                colors={['#FF6B35', '#E55A2B']}
                                style={s.confirmBtnGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={s.confirmBtnText}>Thêm vào giỏ hàng</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 12 },
            android: { elevation: 8 },
        }),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
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
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    productCard: {
        backgroundColor: '#FFF3ED',
        borderRadius: BorderRadius.lg,
        padding: 16,
        alignItems: 'center',
        marginBottom: 24,
    },
    productEmoji: {
        fontSize: 48,
        marginBottom: 8,
    },
    emoji: {
        fontSize: 48,
    },
    productName: {
        fontSize: 16,
        fontWeight: '700',
        color: AppColors.charcoal,
        marginBottom: 4,
    },
    productDesc: {
        fontSize: 12,
        color: AppColors.gray,
        marginBottom: 8,
        textAlign: 'center',
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: AppColors.primary,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: AppColors.charcoal,
        marginBottom: 12,
    },
    optionsGroup: {
        gap: 10,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: BorderRadius.md,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    optionSelected: {
        borderColor: AppColors.primary,
        backgroundColor: '#FFF3ED',
    },
    optionLeftContent: {
        flex: 1,
    },
    optionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: AppColors.charcoal,
    },
    optionLabelSelected: {
        color: AppColors.primary,
        fontWeight: '700',
    },
    optionPrice: {
        fontSize: 12,
        fontWeight: '600',
        color: AppColors.gray,
    },
    optionPriceSelected: {
        color: AppColors.primary,
        fontWeight: '700',
    },
    toppingsGrid: {
        gap: 10,
    },
    toppingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: BorderRadius.md,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    toppingItemSelected: {
        borderColor: AppColors.primary,
        backgroundColor: '#FFF3ED',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    toppingLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: AppColors.charcoal,
    },
    toppingPrice: {
        fontSize: 12,
        fontWeight: '600',
        color: AppColors.gray,
    },
    footer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    },
    totalBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: AppColors.gray,
    },
    totalPrice: {
        fontSize: 18,
        fontWeight: '800',
        color: AppColors.primary,
    },
    confirmBtn: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    confirmBtnGradient: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        alignItems: 'center',
    },
    confirmBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});