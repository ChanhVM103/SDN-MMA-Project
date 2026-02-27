import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Modal, Platform, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';

interface Ward { name: string; }
interface District { name: string; wards: Ward[]; }

const HCM_DISTRICTS: District[] = [
    { name: 'Quận 1', wards: ['Tân Định', 'Đa Kao', 'Bến Nghé', 'Bến Thành', 'Nguyễn Thái Bình', 'Phạm Ngũ Lão', 'Cầu Ông Lãnh', 'Cô Giang', 'Nguyễn Cư Trinh', 'Cầu Kho'].map(n => ({ name: `Phường ${n}` })) },
    { name: 'Quận 3', wards: ['14', '12', '11', 'Võ Thị Sáu', '9', '4', '5', '3', '2', '1'].map(n => ({ name: `Phường ${n}` })) },
    { name: 'Quận 4', wards: ['13', '9', '8', '18', '4', '3', '16', '2', '15', '1'].map(n => ({ name: `Phường ${n}` })) },
    { name: 'Quận 5', wards: ['4', '9', '2', '12', '7', '1', '11', '14', '5', '13'].map(n => ({ name: `Phường ${n}` })) },
    { name: 'Quận 6', wards: ['14', '13', '9', '12', '2', '11', '8', '1', '7', '10'].map(n => ({ name: `Phường ${n}` })) },
    { name: 'Quận 7', wards: ['Tân Thuận Đông', 'Tân Thuận Tây', 'Tân Kiểng', 'Tân Hưng', 'Bình Thuận', 'Tân Quy', 'Phú Thuận', 'Tân Phú', 'Tân Phong', 'Phú Mỹ'].map(n => ({ name: `Phường ${n}` })) },
    { name: 'Quận 8', wards: ['Rạch Ông', 'Hưng Phú', '4', 'Xóm Củi', '5', '14', '6', '15', '16', '7'].map(n => ({ name: `Phường ${n}` })) },
    { name: 'Quận 10', wards: ['15', '13', '14', '12', '10', '9', '1', '8', '2', '4', '6'].map(n => ({ name: `Phường ${n}` })) },
    { name: 'Quận 11', wards: ['15', '5', '14', '11', '3', '10', '8', '7', '1', '16'].map(n => ({ name: `Phường ${n}` })) },
    { name: 'Quận 12', wards: ['Thạnh Xuân', 'Thạnh Lộc', 'Hiệp Thành', 'Thới An', 'Tân Chánh Hiệp', 'An Phú Đông', 'Tân Thới Hiệp', 'Trung Mỹ Tây', 'Tân Hưng Thuận', 'Đông Hưng Thuận', 'Tân Thới Nhất'].map(n => ({ name: `Phường ${n}` })) },
    { name: 'Quận Gò Vấp', wards: ['15', '17', '6', '16', '12', '14', '10', '5', '1', '8', '11', '3'].map(n => ({ name: `Phường ${n}` })) },
    { name: 'Quận Bình Thạnh', wards: ['13', '11', '27', '26', '12', '25', '5', '7', '14', '2', '1', '17', '22', '19', '28'].map(n => ({ name: `Phường ${n}` })) },
    { name: 'Quận Tân Bình', wards: ['2', '4', '12', '13', '1', '3', '11', '7', '5', '10', '6', '8', '9', '14', '15'].map(n => ({ name: `Phường ${n}` })) },
    { name: 'Quận Tân Phú', wards: ['Tân Sơn Nhì', 'Tây Thạnh', 'Sơn Kỳ', 'Tân Quý', 'Tân Thành', 'Phú Thọ Hòa', 'Phú Thạnh', 'Phú Trung', 'Hòa Thạnh', 'Hiệp Tân', 'Tân Thới Hòa'].map(n => ({ name: `Phường ${n}` })) },
    { name: 'Quận Phú Nhuận', wards: ['4', '5', '9', '7', '1', '2', '8', '15', '10', '11', '13'].map(n => ({ name: `Phường ${n}` })) },
    { name: 'Quận Bình Tân', wards: ['Bình Hưng Hòa', 'Bình Hưng Hoà A', 'Bình Hưng Hoà B', 'Bình Trị Đông', 'Bình Trị Đông A', 'Bình Trị Đông B', 'Tân Tạo', 'Tân Tạo A', 'An Lạc', 'An Lạc A'].map(n => ({ name: `Phường ${n}` })) },
    { name: 'TP. Thủ Đức', wards: ['Linh Xuân', 'Bình Chiểu', 'Linh Trung', 'Tam Bình', 'Tam Phú', 'Hiệp Bình Phước', 'Hiệp Bình Chánh', 'Linh Chiểu', 'Linh Tây', 'Linh Đông', 'Bình Thọ', 'Trường Thọ', 'Long Bình', 'Long Thạnh Mỹ', 'Tân Phú', 'Hiệp Phú', 'Tăng Nhơn Phú A', 'Tăng Nhơn Phú B', 'Phước Long B', 'Phước Long A', 'Trường Thạnh', 'Long Phước', 'Long Trường', 'Phước Bình', 'Phú Hữu', 'Thảo Điền', 'An Phú', 'An Khánh', 'Bình Trưng Đông', 'Bình Trưng Tây', 'Cát Lái', 'Thạnh Mỹ Lợi', 'An Lợi Đông', 'Thủ Thiêm'].map(n => ({ name: `Phường ${n}` })) },
    { name: 'Huyện Củ Chi', wards: ['TT. Củ Chi', 'Phú Mỹ Hưng', 'An Phú', 'Trung Lập Thượng', 'An Nhơn Tây', 'Nhuận Đức', 'Phạm Văn Cội', 'Phú Hòa Đông', 'Trung Lập Hạ', 'Trung An', 'Phước Thạnh', 'Phước Hiệp', 'Tân An Hội', 'Phước Vĩnh An', 'Thái Mỹ', 'Tân Thạnh Tây', 'Hòa Phú', 'Tân Thạnh Đông', 'Bình Mỹ', 'Tân Phú Trung', 'Tân Thông Hội'].map(n => ({ name: n.startsWith('TT.') ? `Thị trấn ${n.slice(4)}` : `Xã ${n}` })) },
    { name: 'Huyện Hóc Môn', wards: ['TT. Hóc Môn', 'Tân Hiệp', 'Nhị Bình', 'Đông Thạnh', 'Tân Thới Nhì', 'Thới Tam Thôn', 'Xuân Thới Sơn', 'Tân Xuân', 'Xuân Thới Đông', 'Trung Chánh', 'Xuân Thới Thượng', 'Bà Điểm'].map(n => ({ name: n.startsWith('TT.') ? `Thị trấn ${n.slice(4)}` : `Xã ${n}` })) },
    { name: 'Huyện Bình Chánh', wards: ['TT. Tân Túc', 'Phạm Văn Hai', 'Vĩnh Lộc A', 'Vĩnh Lộc B', 'Bình Lợi', 'Lê Minh Xuân', 'Tân Nhựt', 'Tân Kiên', 'Bình Hưng', 'Phong Phú', 'An Phú Tây', 'Hưng Long', 'Đa Phước', 'Tân Quý Tây', 'Bình Chánh', 'Quy Đức'].map(n => ({ name: n.startsWith('TT.') ? `Thị trấn ${n.slice(4)}` : `Xã ${n}` })) },
    { name: 'Huyện Nhà Bè', wards: ['TT. Nhà Bè', 'Phước Kiển', 'Phước Lộc', 'Nhơn Đức', 'Phú Xuân', 'Long Thới', 'Hiệp Phước'].map(n => ({ name: n.startsWith('TT.') ? `Thị trấn ${n.slice(4)}` : `Xã ${n}` })) },
    { name: 'Huyện Cần Giờ', wards: ['TT. Cần Thạnh', 'Bình Khánh', 'Tam Thôn Hiệp', 'An Thới Đông', 'Thạnh An', 'Long Hòa', 'Lý Nhơn'].map(n => ({ name: n.startsWith('TT.') ? `Thị trấn ${n.slice(4)}` : `Xã ${n}` })) },
];

interface AddressPickerProps {
    visible: boolean;
    onClose: () => void;
    onSave: (address: string) => void;
    initialAddress?: string;
}

export default function AddressPicker({ visible, onClose, onSave }: AddressPickerProps) {
    const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
    const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
    const [detail, setDetail] = useState('');
    const [activeStep, setActiveStep] = useState<'district' | 'ward' | 'detail'>('district');
    const [searchText, setSearchText] = useState('');

    const reset = () => {
        setSelectedDistrict(null);
        setSelectedWard(null);
        setDetail('');
        setActiveStep('district');
        setSearchText('');
    };

    const handleClose = () => { reset(); onClose(); };

    const selectDistrict = (d: District) => {
        setSelectedDistrict(d);
        setSelectedWard(null);
        setActiveStep('ward');
        setSearchText('');
    };

    const selectWard = (w: Ward) => {
        setSelectedWard(w);
        setActiveStep('detail');
        setSearchText('');
    };

    const handleSave = () => {
        const parts = [];
        if (detail.trim()) parts.push(detail.trim());
        if (selectedWard) parts.push(selectedWard.name);
        if (selectedDistrict) parts.push(selectedDistrict.name);
        parts.push('TP. Hồ Chí Minh');
        onSave(parts.join(', '));
        reset();
    };

    const goBack = () => {
        setSearchText('');
        if (activeStep === 'ward') { setActiveStep('district'); setSelectedDistrict(null); }
        else if (activeStep === 'detail') { setActiveStep('ward'); setSelectedWard(null); }
    };

    const getStepTitle = () => {
        if (activeStep === 'district') return 'Chọn Quận/Huyện';
        if (activeStep === 'ward') return 'Chọn Phường/Xã';
        return 'Địa chỉ chi tiết';
    };

    const getFilteredList = (): { name: string }[] => {
        const data = activeStep === 'district'
            ? HCM_DISTRICTS
            : (selectedDistrict?.wards || []);
        if (!searchText.trim()) return data;
        return data.filter(i => i.name.toLowerCase().includes(searchText.toLowerCase()));
    };

    const steps = ['district', 'ward', 'detail'] as const;
    const stepIdx = steps.indexOf(activeStep);

    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
            <View style={s.container}>
                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={activeStep !== 'district' ? goBack : handleClose} style={s.headerBtn}>
                        <Ionicons name={activeStep !== 'district' ? 'arrow-back' : 'close'} size={22} color={AppColors.charcoal} />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>{getStepTitle()}</Text>
                    <View style={s.headerBtn} />
                </View>

                {/* Progress */}
                <View style={s.progress}>
                    {steps.map((step, idx) => (
                        <View key={step} style={s.progressRow}>
                            <View style={[s.dot, idx === stepIdx && s.dotActive, idx < stepIdx && s.dotDone]}>
                                {idx < stepIdx
                                    ? <Ionicons name="checkmark" size={12} color="#fff" />
                                    : <Text style={[s.dotText, idx === stepIdx && s.dotTextActive]}>{idx + 1}</Text>
                                }
                            </View>
                            {idx < 2 && <View style={[s.line, idx < stepIdx && s.lineDone]} />}
                        </View>
                    ))}
                </View>

                {/* City label */}
                <View style={s.cityBar}>
                    <Ionicons name="location" size={14} color={AppColors.primary} />
                    <Text style={s.cityText}>
                        TP. Hồ Chí Minh
                        {selectedDistrict ? ` › ${selectedDistrict.name}` : ''}
                        {selectedWard ? ` › ${selectedWard.name}` : ''}
                    </Text>
                </View>

                {activeStep === 'detail' ? (
                    <View style={s.detailSection}>
                        <Text style={s.detailLabel}>Số nhà, tên đường, tòa nhà...</Text>
                        <TextInput
                            style={s.detailInput}
                            placeholder="VD: 123 Nguyễn Huệ, Tòa nhà ABC"
                            placeholderTextColor={AppColors.gray}
                            value={detail}
                            onChangeText={setDetail}
                            multiline
                            autoFocus
                        />
                        <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={s.saveBtnText}>Lưu địa chỉ</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={s.searchBox}>
                            <Ionicons name="search" size={18} color={AppColors.gray} />
                            <TextInput
                                style={s.searchInput}
                                placeholder={activeStep === 'district' ? 'Tìm quận/huyện...' : 'Tìm phường/xã...'}
                                placeholderTextColor={AppColors.gray}
                                value={searchText}
                                onChangeText={setSearchText}
                            />
                            {searchText.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchText('')}>
                                    <Ionicons name="close-circle" size={18} color={AppColors.gray} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <ScrollView style={s.list} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {getFilteredList().map((item, i) => (
                                <TouchableOpacity
                                    key={`${item.name}-${i}`}
                                    style={s.listItem}
                                    onPress={() => {
                                        if (activeStep === 'district') selectDistrict(item as District);
                                        else selectWard(item);
                                    }}
                                    activeOpacity={0.6}
                                >
                                    <Text style={s.listItemText}>{item.name}</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                                </TouchableOpacity>
                            ))}
                            {getFilteredList().length === 0 && (
                                <View style={s.emptyBox}>
                                    <Ionicons name="search-outline" size={40} color="#D1D5DB" />
                                    <Text style={s.emptyText}>Không tìm thấy kết quả</Text>
                                </View>
                            )}
                        </ScrollView>
                    </>
                )}
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 56 : 36 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    headerBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: AppColors.charcoal, textAlign: 'center' },
    progress: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 60 },
    progressRow: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    dotActive: { backgroundColor: AppColors.primary },
    dotDone: { backgroundColor: '#2D6A4F' },
    dotText: { fontSize: 12, fontWeight: '700', color: AppColors.gray },
    dotTextActive: { color: '#fff' },
    line: { width: 40, height: 2, backgroundColor: '#F3F4F6', marginHorizontal: 6 },
    lineDone: { backgroundColor: '#2D6A4F' },
    cityBar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, marginBottom: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#FFF3ED', borderRadius: 10 },
    cityText: { flex: 1, fontSize: 13, fontWeight: '600', color: AppColors.primary },
    searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14, height: 44, backgroundColor: '#F5F5F5', borderRadius: BorderRadius.md, gap: 10 },
    searchInput: { flex: 1, fontSize: 14, color: AppColors.charcoal },
    list: { flex: 1, paddingHorizontal: 16 },
    listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    listItemText: { fontSize: 15, color: AppColors.charcoal, fontWeight: '500' },
    detailSection: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
    detailLabel: { fontSize: 14, fontWeight: '600', color: AppColors.darkGray, marginBottom: 10 },
    detailInput: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: BorderRadius.md, padding: 14, fontSize: 15, color: AppColors.charcoal, minHeight: 80, textAlignVertical: 'top' },
    saveBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24, backgroundColor: AppColors.primary, height: 52, borderRadius: BorderRadius.md, ...Platform.select({ ios: { shadowColor: AppColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 6 } }) },
    saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    emptyBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
    emptyText: { fontSize: 14, color: AppColors.gray },
});
