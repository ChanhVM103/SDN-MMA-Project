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
    addons?: any[];
    promotion?: {
        name: string;
        discountPercent: number;
    };
}

interface CreateModalProps {
    visible: boolean;
    item: MenuItem | null;
    onClose: () => void;
    onConfirm: (selectedOptions: Record<string, string[]>, qty: number) => void;
}

export default function CreateModalPage({ visible, item, onClose, onConfirm }: CreateModalProps) {
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
    const [qty, setQty] = useState(1);

    // Reset default selections when modal opens
    React.useEffect(() => {
        if (visible && item && item.addons) {
            const defaults: Record<string, string[]> = {};
            item.addons.forEach(group => {
                // Pre-select first option if required
                if (group.isRequired && group.options && group.options.length > 0) {
                    defaults[group.name] = [group.options[0].name];
                } else {
                    defaults[group.name] = [];
                }
            });
            setSelectedOptions(defaults);
            setQty(1); // Reset quantity when modal opens
        }
    }, [visible, item]);

    const handleOptionToggle = (groupName: string, optionName: string, isSingleChoice: boolean) => {
        setSelectedOptions(prev => {
            const currentSelected = prev[groupName] || [];

            if (isSingleChoice) {
                // If single choice, replace the current selection
                return { ...prev, [groupName]: [optionName] };
            } else {
                // Multi-select: toggle
                const isSelected = currentSelected.includes(optionName);
                if (isSelected) {
                    return { ...prev, [groupName]: currentSelected.filter(n => n !== optionName) };
                } else {
                    return { ...prev, [groupName]: [...currentSelected, optionName] };
                }
            }
        });
    };

    const handleConfirm = () => {
        // Validate required groups
        if (item?.addons) {
            for (const group of item.addons) {
                if (group.isRequired) {
                    const selected = selectedOptions[group.name] || [];
                    if (selected.length === 0) {
                        alert(`Vui lòng chọn ${group.name}`);
                        return;
                    }
                }
            }
        }

        onConfirm(selectedOptions, qty);
        setSelectedOptions({});
        setQty(1);
    };

    const handleClose = () => {
        setSelectedOptions({});
        setQty(1);
        onClose();
    };

    let addonsPrice = 0;
    if (item?.addons) {
        item.addons.forEach(group => {
            const selected = selectedOptions[group.name] || [];
            selected.forEach(optName => {
                const optDef = group.options.find((o: any) => o.name === optName);
                if (optDef && optDef.price) addonsPrice += optDef.price;
            });
        });
    }

    const basePrice = item?.promotion
        ? (item.price * (1 - item.promotion.discountPercent / 100))
        : (item?.price || 0);
    const totalPrice = (basePrice + addonsPrice) * qty;
    const originalTotalPrice = ((item?.price || 0) + addonsPrice) * qty;

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
                        <Text style={s.headerTitle}>Tùy chỉnh món</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
                        {/* Product Card */}
                        <View style={s.productCard}>
                            <View style={s.productEmoji}>
                                <Text style={s.emoji}>{item.emoji}</Text>
                            </View>
                            <Text style={s.productName}>{item.name}</Text>
                            {!!item.description && (
                                <Text style={s.productDesc}>{item.description}</Text>
                            )}
                            <View style={s.modalPriceRow}>
                                {item.promotion ? (
                                    <>
                                        <Text style={s.productPrice}>{(item.price * (1 - item.promotion.discountPercent / 100)).toLocaleString('vi-VN')}đ</Text>
                                        <Text style={s.modalOldPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
                                    </>
                                ) : (
                                    <Text style={s.productPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
                                )}
                            </View>
                        </View>

                        {/* Custom Addons */}
                        {(item.addons || []).map((group: any, idx: number) => {
                            const isSingleChoice = group.isRequired || group.maxOptions === 1;
                            const isRequired = group.isRequired;

                            return (
                                <View key={idx} style={s.section}>
                                    <View style={s.sectionHeader}>
                                        <Text style={s.sectionTitle}>{group.name}</Text>
                                        <Text style={s.sectionSubtext}>
                                            {isRequired ? '(Bắt buộc)' : isSingleChoice ? '(Chọn 1)' : '(Tùy chọn)'}
                                        </Text>
                                    </View>

                                    <View style={isSingleChoice ? s.optionsGroup : s.toppingsGrid}>
                                        {(group.options || []).map((opt: any, optIdx: number) => {
                                            const isSelected = (selectedOptions[group.name] || []).includes(opt.name);

                                            if (isSingleChoice) {
                                                return (
                                                    <TouchableOpacity
                                                        key={optIdx}
                                                        style={[s.option, isSelected && s.optionSelected]}
                                                        onPress={() => handleOptionToggle(group.name, opt.name, true)}
                                                    >
                                                        <View style={s.optionLeftContent}>
                                                            <Text style={[s.optionLabel, isSelected && s.optionLabelSelected]}>
                                                                {opt.name}
                                                            </Text>
                                                        </View>
                                                        <Text style={[s.optionPrice, isSelected && s.optionPriceSelected]}>
                                                            {opt.price ? `+${opt.price.toLocaleString('vi-VN')}đ` : 'Miễn phí'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            } else {
                                                // Checkbox style
                                                return (
                                                    <TouchableOpacity
                                                        key={optIdx}
                                                        style={[s.toppingItem, isSelected && s.toppingItemSelected]}
                                                        onPress={() => handleOptionToggle(group.name, opt.name, false)}
                                                    >
                                                        <View style={s.checkbox}>
                                                            {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                                                        </View>
                                                        <Text style={s.toppingLabel}>{opt.name}</Text>
                                                        <Text style={s.toppingPrice}>
                                                            {opt.price ? `+${opt.price.toLocaleString('vi-VN')}đ` : 'Miễn phí'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            }
                                        })}
                                    </View>
                                </View>
                            );
                        })}

                        <View style={{ height: 20 }} />
                    </ScrollView>

                        {/* Quantity Selector */}
                        <View style={s.qtySection}>
                            <Text style={s.qtyLabel}>Số lượng</Text>
                            <View style={s.qtyControls}>
                                <TouchableOpacity
                                    style={[s.qtyBtn, qty <= 1 && s.qtyBtnDisabled]}
                                    onPress={() => setQty(Math.max(1, qty - 1))}
                                    disabled={qty <= 1}
                                >
                                    <Ionicons name="remove" size={18} color={qty <= 1 ? '#ccc' : AppColors.primary} />
                                </TouchableOpacity>
                                <Text style={s.qtyText}>{qty}</Text>
                                <TouchableOpacity
                                    style={s.qtyBtn}
                                    onPress={() => setQty(qty + 1)}
                                >
                                    <Ionicons name="add" size={18} color={AppColors.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                    {/* Footer */}
                    <View style={s.footer}>
                        <View style={s.totalBox}>
                            <Text style={s.totalLabel}>Tổng cộng</Text>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={s.totalPrice}>{totalPrice.toLocaleString('vi-VN')}đ</Text>
                                {item.promotion && (
                                    <Text style={s.totalOldPrice}>{originalTotalPrice.toLocaleString('vi-VN')}đ</Text>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm}>
                            <LinearGradient colors={['#FF6B35', '#E55A2B']} style={s.confirmBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                <Text style={s.confirmBtnText}>Thêm {qty} vào giỏ hàng</Text>
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
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: AppColors.charcoal,
    },
    sectionSubtext: {
        fontSize: 12,
        color: AppColors.gray,
        fontWeight: '500',
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
    qtySection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderRadius: BorderRadius.md,
        padding: 14,
        marginBottom: 16,
    },
    qtyLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: AppColors.charcoal,
    },
    qtyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    qtyBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF3ED',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: AppColors.primary,
    },
    qtyBtnDisabled: {
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    qtyText: {
        fontSize: 18,
        fontWeight: '800',
        color: AppColors.charcoal,
        minWidth: 28,
        textAlign: 'center',
    },
    modalPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    modalOldPrice: { fontSize: 13, color: AppColors.gray, textDecorationLine: 'line-through' },
    totalOldPrice: { fontSize: 12, color: AppColors.gray, textDecorationLine: 'line-through' },
});