import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, SectionList, TouchableOpacity,
    Animated, Platform, Dimensions, ScrollView, Image, Modal, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useOrder } from '@/constants/order-context';
import { useAuth } from '@/constants/auth-context';
import { orderAPI, restaurantAPI, productAPI, API_BASE_URL } from '@/constants/api';
import { useFavorites } from '@/constants/favorites-context';
import CreateModalPage from './create.modal';
import ConfirmOrderScreen from '@/components/ConfirmOrderScreen';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = 240;

const resolveImage = (image: string) => {
    if (!image || typeof image !== 'string') return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80';
    if (image.startsWith('http') || image.startsWith('data:image')) return image;
    const base = API_BASE_URL.replace(/\/api$/, '');
    return image.startsWith('/') ? `${base}${image}` : `${base}/${image}`;
};

interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    emoji: string;
    category: string;
    isBestSeller?: boolean;
    isNew?: boolean;
    isCustomizable?: boolean;
    addons?: any[];
    image?: string;
    promotion?: {
        name: string;
        discountPercent: number;
    };
}

interface SectionData {
    title: string;
    data: MenuItem[];
}

function Skeleton() {
    const anim = useRef(new Animated.Value(0.4)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={{ opacity: anim }}>
            <View style={sk.hero} />
            <View style={sk.info}>
                <View style={sk.title} />
                <View style={sk.sub} />
                <View style={sk.statsRow}>
                    {[1, 2, 3].map(i => <View key={i} style={sk.stat} />)}
                </View>
            </View>
            {[1, 2, 3, 4, 5].map(i => (
                <View key={i} style={sk.item}>
                    <View style={sk.itemImg} />
                    <View style={sk.itemRight}>
                        <View style={sk.l1} />
                        <View style={sk.l2} />
                        <View style={sk.l3} />
                    </View>
                </View>
            ))}
        </Animated.View>
    );
}

function MenuCard({ item, qty, onAdd, onRemove }: { item: MenuItem; qty: number; onAdd: () => void; onRemove: () => void }) {
    return (
        <View style={s.menuItem}>
            <View style={s.menuImgBox}>
                {item.image ? (
                    <Image
                        source={{ uri: resolveImage(item.image) }}
                        style={s.menuImg}
                        resizeMode="cover"
                    />
                ) : (
                    <Text style={s.menuEmoji}>{item.emoji}</Text>
                )}
                {item.isBestSeller && (
                    <View style={s.bestTag}>
                        <Text style={s.bestTagText}>🔥 Bán chạy</Text>
                    </View>
                )}
                {item.isNew && (
                    <View style={s.newTag}>
                        <Text style={s.newTagText}>Mới</Text>
                    </View>
                )}
                {item.promotion && (
                    <LinearGradient
                        colors={['#EF4444', '#E11D48']}
                        style={s.promoBadge}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={s.promoBadgeText}>-{item.promotion.discountPercent}%</Text>
                    </LinearGradient>
                )}
            </View>
            <View style={s.menuInfo}>
                <Text style={s.menuName}>{item.name}</Text>
                {!!item.description && (
                    <Text style={s.menuDesc} numberOfLines={2}>{item.description}</Text>
                )}
                <View style={s.priceRow}>
                    {item.promotion ? (
                        <>
                            <Text style={s.menuPrice}>{(item.price * (1 - item.promotion.discountPercent / 100)).toLocaleString('vi-VN')}đ</Text>
                            <Text style={s.oldPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
                        </>
                    ) : (
                        <Text style={s.menuPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
                    )}
                </View>
            </View>

            {qty === 0 ? (
                <TouchableOpacity style={s.addBtn} onPress={onAdd}>
                    <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
            ) : (
                <View style={s.qtyControls}>
                    <TouchableOpacity style={s.qtyBtnRemove} onPress={onRemove}>
                        <Ionicons name="remove" size={18} color={AppColors.primary} />
                    </TouchableOpacity>
                    <Text style={s.qtyText}>{qty}</Text>
                    <TouchableOpacity style={s.qtyBtnAdd} onPress={onAdd}>
                        <Ionicons name="add" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

export default function RestaurantDetailScreen() {
    const { id, data, highlightProduct } = useLocalSearchParams<{ id: string; data: string; highlightProduct: string }>();
    const router = useRouter();
    const { addOrder } = useOrder();
    const { user, token } = useAuth();
    const { isFavorite, toggleFavorite } = useFavorites();

    const [restaurant, setRestaurant] = useState<any>(null);
    const [sections, setSections] = useState<SectionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Tất cả');
    const [cartLines, setCartLines] = useState<{
        lineId: string;
        itemId: string;
        qty: number;
        selectedOptions: Record<string, string[]>;
    }[]>([]);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [showConfirmOrder, setShowConfirmOrder] = useState(false);
    const [showCartDrawer, setShowCartDrawer] = useState(false);

    const scrollY = useRef(new Animated.Value(0)).current;
    const sectionListRef = useRef<SectionList>(null);
    const tabScrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        const loadRestaurantAndProducts = async () => {
            try {
                let fetchId = id;

                // Fallback: try to extract ID from passed data if not in URL
                if (!fetchId) {
                    try {
                        const parsed = JSON.parse(data || '{}');
                        fetchId = parsed?._id || parsed?.id;
                    } catch { }
                }

                if (!fetchId) {
                    setLoading(false);
                    return;
                }

                // Always fetch fresh restaurant info from the API
                try {
                    const restRes = await restaurantAPI.getRestaurantById(fetchId);
                    if (restRes.success) {
                        setRestaurant(restRes.data);
                    }
                } catch (err) {
                    console.error("Failed to fetch restaurant info", err);
                    // Fallback to passed data if API fails
                    try {
                        setRestaurant(JSON.parse(data || '{}'));
                    } catch { }
                }

                const res = await productAPI.getProductsByRestaurant(fetchId, { limit: 100 });
                // Correct mapping: res.data is the array of products
                const products = Array.isArray(res.data) ? res.data : (res.data?.data || []);

                const grouped: Record<string, MenuItem[]> = {};
                products.forEach((product: any) => {
                    if (product.isAvailable === false) return;

                    const category = product.category || 'Thực đơn';
                    if (!grouped[category]) grouped[category] = [];
                    grouped[category].push({
                        id: product._id,
                        name: product.name,
                        description: product.description || '',
                        price: product.price || 0,
                        emoji: product.emoji || '🍽️',
                        image: product.image, // Keep raw image for resolution later
                        category: category,
                        addons: product.addons || [],
                        isCustomizable: product.addons && product.addons.length > 0,
                        promotion: product.promotion
                    });
                });

                const secs = Object.keys(grouped).map(cat => ({ title: cat, data: grouped[cat] }));
                setSections(secs);
                setActiveTab('Tất cả');

                // Auto-highlight/open product if requested
                if (highlightProduct) {
                    const productToHighlight = products.find((p: any) => p._id === highlightProduct);
                    if (productToHighlight) {
                        const menuItemToHighlight: MenuItem = {
                            id: productToHighlight._id,
                            name: productToHighlight.name,
                            description: productToHighlight.description || '',
                            price: productToHighlight.price || 0,
                            emoji: productToHighlight.emoji || '🍽️',
                            image: productToHighlight.image,
                            category: productToHighlight.category || 'Thực đơn',
                            addons: productToHighlight.addons || [],
                            isCustomizable: productToHighlight.addons && productToHighlight.addons.length > 0
                        };

                        if (menuItemToHighlight.isCustomizable) {
                            setSelectedItem(menuItemToHighlight);
                            setModalVisible(true);
                        } else {
                            setCartLines(prev => [...prev, {
                                lineId: `${menuItemToHighlight.id}_${Date.now()}`,
                                itemId: menuItemToHighlight.id,
                                qty: 1,
                                selectedOptions: {},
                            }]);
                        }
                    }
                }

            } catch (e) {
                console.error("Fetch products failed", e);
            } finally {
                setLoading(false);
            }
        };

        loadRestaurantAndProducts();
    }, [id, data]);

    const navBg = scrollY.interpolate({ inputRange: [HERO_HEIGHT - 80, HERO_HEIGHT - 40], outputRange: [0, 1], extrapolate: 'clamp' });
    const heroOpacity = scrollY.interpolate({ inputRange: [0, HERO_HEIGHT - 60], outputRange: [1, 0], extrapolate: 'clamp' });

    // Calculate price for a single cart line
    const calculateAddonsPrice = (line: typeof cartLines[0], item: MenuItem | undefined): number => {
        if (!line.selectedOptions || !item?.addons) return 0;
        let addonsPrice = 0;
        item.addons.forEach(addonGroup => {
            const selectedInGroup = line.selectedOptions[addonGroup.name] || [];
            selectedInGroup.forEach(optName => {
                const optionDef = addonGroup.options.find((o: any) => o.name === optName);
                if (optionDef) addonsPrice += (optionDef.price || 0);
            });
        });
        return addonsPrice;
    };

    const calculateLinePrice = (line: typeof cartLines[0]): number => {
        const item = sections.flatMap(s => s.data).find(i => i.id === line.itemId);
        let basePrice = item?.price || 0;
        
        // Apply promotion discount
        if (item?.promotion) {
            basePrice = basePrice * (1 - item.promotion.discountPercent / 100);
        }

        const addonsPrice = calculateAddonsPrice(line, item);
        return basePrice + addonsPrice;
    };

    const calculateOriginalLinePrice = (line: typeof cartLines[0]): number => {
        const item = sections.flatMap(s => s.data).find(i => i.id === line.itemId);
        const basePrice = item?.price || 0;
        const addonsPrice = calculateAddonsPrice(line, item);
        return basePrice + addonsPrice;
    };

    // Get total qty for a specific product (across all lines)
    const getItemQty = (itemId: string): number => {
        return cartLines.filter(l => l.itemId === itemId).reduce((sum, l) => sum + l.qty, 0);
    };

    const cartTotal = cartLines.reduce((sum, l) => sum + l.qty, 0);
    const cartTotalPrice = cartLines.reduce((total, line) => {
        return total + calculateLinePrice(line) * line.qty;
    }, 0);

    const handleTabPress = (title: string, idx: number) => {
        setActiveTab(title);
        // Scroll to top when switching categories or to the specific section if displaying all
        if (title === 'Tất cả') {
            sectionListRef.current?.scrollToLocation({
                sectionIndex: 0, itemIndex: 0,
                animated: true, viewOffset: 0,
            });
        } else {
            // Since we filter the list, the selected category will always be at index 0
            sectionListRef.current?.scrollToLocation({
                sectionIndex: 0, itemIndex: 0,
                animated: true, viewOffset: 100,
            });
        }
    };

    const handleAdd = (itemId: string, item: MenuItem) => {
        if (item.isCustomizable) {
            // Always open modal for customizable items
            setSelectedItem(item);
            setModalVisible(true);
        } else {
            // For non-customizable items, merge into existing line or create new
            setCartLines(prev => {
                const existing = prev.find(l => l.itemId === itemId && Object.keys(l.selectedOptions).length === 0);
                if (existing) {
                    return prev.map(l => l.lineId === existing.lineId ? { ...l, qty: l.qty + 1 } : l);
                }
                return [...prev, {
                    lineId: `${itemId}_${Date.now()}`,
                    itemId,
                    qty: 1,
                    selectedOptions: {},
                }];
            });
        }
    };

    const handleModalConfirm = (selectedOptions: Record<string, any[]>, qty: number = 1) => {
        if (selectedItem) {
            setCartLines(prev => [...prev, {
                lineId: `${selectedItem.id}_${Date.now()}`,
                itemId: selectedItem.id,
                qty,
                selectedOptions,
            }]);
            setModalVisible(false);
            setSelectedItem(null);
        }
    };

    const handleRemove = (itemId: string) => {
        setCartLines(prev => {
            // Find the last line for this product
            const idx = [...prev].reverse().findIndex(l => l.itemId === itemId);
            if (idx === -1) return prev;
            const realIdx = prev.length - 1 - idx;
            const line = prev[realIdx];

            if (line.qty > 1) {
                return prev.map((l, i) => i === realIdx ? { ...l, qty: l.qty - 1 } : l);
            } else {
                return prev.filter((_, i) => i !== realIdx);
            }
        });
    };

    const getCartItems = () => {
        return cartLines.map(line => {
            const item = sections.flatMap(s => s.data).find(i => i.id === line.itemId);

            // Format toppings string for backend
            let toppingsStr = '';
            if (line.selectedOptions) {
                const optionNames = Object.values(line.selectedOptions).flat();
                toppingsStr = optionNames.join(', ');
            }

            return {
                id: line.itemId,
                lineId: line.lineId,
                name: item?.name || '',
                price: calculateLinePrice(line),
                originalPrice: calculateOriginalLinePrice(line),
                emoji: item?.emoji || '',
                qty: line.qty,
                toppings: toppingsStr ? [toppingsStr] : [],
                promotionName: item?.promotion?.name,
            };
        });
    };

    // Cart line manipulation for cart drawer
    const handleLineQtyChange = (lineId: string, delta: number) => {
        setCartLines(prev => prev.map(l => {
            if (l.lineId !== lineId) return l;
            const newQty = l.qty + delta;
            return newQty >= 1 ? { ...l, qty: newQty } : l;
        }));
    };

    const handleLineRemove = (lineId: string) => {
        setCartLines(prev => prev.filter(l => l.lineId !== lineId));
    };

    const getLineToppingsStr = (line: typeof cartLines[0]): string => {
        if (!line.selectedOptions) return '';
        return Object.values(line.selectedOptions).flat().join(', ');
    };

    const handleDeliveryClick = () => {
        setShowConfirmOrder(true);
    };

    const handleConfirmOrder = async (voucherId?: string, finalDeliveryFeeArg?: number) => {
        try {
            const originalDeliveryFee = restaurant?.deliveryFee || 0;
            const deliveryFee = finalDeliveryFeeArg !== undefined ? finalDeliveryFeeArg : originalDeliveryFee;
            const items = getCartItems();

            const order = {
                id: `${Date.now()}`,
                restaurantName: restaurant?.name || 'Nhà hàng',
                restaurantAddress: restaurant?.address || 'Quận 11, TP. HCM',
                totalPrice: cartTotalPrice + deliveryFee,
                itemCount: cartTotal,
                status: 'ORDERED' as const,
                createdAt: new Date().toISOString(),
                items: items,
            };

            if (token) {
                // Use the restaurant ID from this page - this is the restaurant we're ordering FROM
                const realRestId = restaurant?._id || restaurant?.id || id;

                if (realRestId) {
                    const apiItems = items.map(item => ({
                        productId: item.id,
                        name: item.name,
                        price: item.price,
                        originalPrice: item.originalPrice || item.price,
                        quantity: item.qty,
                        emoji: item.emoji,
                        note: item.toppings?.join(', ') || ''
                    }));

                    await orderAPI.createOrder(token, {
                        restaurantId: realRestId,
                        items: apiItems,
                        deliveryFee: originalDeliveryFee, // Backend recalculates based on voucherId
                        voucherId,
                        deliveryAddress: '123 Test Street'
                    });
                }
            }

            // Fallback: still save in local App context just in case
            addOrder(order);
            setShowConfirmOrder(false);
            setCartLines([]);
            router.replace({ pathname: '/', params: { orderSuccess: '1' } } as any);
        } catch (error: any) {
            console.error("Error creating order detail:", error);
            const errorMsg = error.message || (error.data?.message) || "Lỗi tạo đơn hàng!";
            Platform.OS === 'web' ? window.alert(errorMsg) : alert(errorMsg);
        }
    };

    if (loading) {
        return (
            <View style={s.container}>
                <TouchableOpacity style={s.fabBack} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <ScrollView><Skeleton /></ScrollView>
            </View>
        );
    }

    if (!restaurant) return null;

    return (
        <View style={s.container}>
            <Animated.View style={[s.navBar, { opacity: navBg }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={AppColors.charcoal} />
                </TouchableOpacity>
                <Text style={s.navTitle} numberOfLines={1}>{restaurant.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={() => toggleFavorite(restaurant._id || restaurant.id)}>
                        <Ionicons 
                            name={isFavorite(restaurant._id || restaurant.id) ? "heart" : "heart-outline"} 
                            size={22} 
                            color={isFavorite(restaurant._id || restaurant.id) ? "#EF4444" : AppColors.charcoal} 
                        />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Ionicons name="share-outline" size={22} color={AppColors.charcoal} />
                    </TouchableOpacity>
                </View>
            </Animated.View>


            <Animated.View style={[s.fabBack, { opacity: heroOpacity }]}>
                <TouchableOpacity onPress={() => router.back()} style={s.fabBackBtn}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
            </Animated.View>
            
            <SectionList
                ref={sectionListRef}
                sections={activeTab === 'Tất cả' ? sections : sections.filter(s => s.title === activeTab)}
                keyExtractor={(item, index) => item._id || item.id || `hlist-${index}`}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                ListHeaderComponent={
                    <View>
                        <View style={s.hero}>
                            <Image source={{ uri: resolveImage(restaurant.image) }} style={s.heroImg} resizeMode="cover" />
                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={s.heroOverlay} />
                        </View>

                        <View style={s.infoCard}>
                            <View style={s.infoTop}>
                                <Text style={s.restName}>{restaurant.name}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <TouchableOpacity 
                                        style={s.favBtnInfo} 
                                        onPress={() => toggleFavorite(restaurant._id || restaurant.id)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons 
                                            name={isFavorite(restaurant._id || restaurant.id) ? "heart" : "heart-outline"} 
                                            size={24} 
                                            color={isFavorite(restaurant._id || restaurant.id) ? "#EF4444" : AppColors.gray} 
                                        />
                                    </TouchableOpacity>
                                    <View style={[s.statusChip, { backgroundColor: restaurant.isOpen !== false ? '#D1FAE5' : '#FEE2E2' }]}>
                                        <View style={[s.statusDot, { backgroundColor: restaurant.isOpen !== false ? '#10B981' : '#EF4444' }]} />
                                        <Text style={[s.statusText, { color: restaurant.isOpen !== false ? '#065F46' : '#991B1B' }]}>
                                            {restaurant.isOpen !== false ? 'Đang mở' : 'Đóng cửa'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                                <View style={s.tagsRow}>
                                    {(restaurant.tags || []).map((tag: string, idx: number) => (
                                        <View key={`${tag}-${idx}`} style={s.tag}>
                                            <Text style={s.tagText}>{tag}</Text>
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>

                            <View style={s.statsBox}>
                                <View style={s.statItem}>
                                    <Ionicons name="star" size={18} color="#FFB627" />
                                    <Text style={s.statVal}>{restaurant.rating || '4.5'}</Text>
                                    <Text style={s.statSub}>Đánh giá</Text>
                                </View>
                                <View style={s.statDivider} />
                                <View style={s.statItem}>
                                    <Ionicons name="time-outline" size={18} color={AppColors.primary} />
                                    <Text style={s.statVal}>{restaurant.deliveryTime || '20'}p</Text>
                                    <Text style={s.statSub}>Dặt hàng</Text>
                                </View>
                                <View style={s.statDivider} />
                                <View style={s.statItem}>
                                    <Ionicons name="bicycle-outline" size={18} color={AppColors.primary} />
                                    <Text style={s.statVal}>
                                        {(restaurant.deliveryFee === 0 || !restaurant.deliveryFee) ? 'Free' : `${(restaurant.deliveryFee / 1000).toFixed(0)}k`}
                                    </Text>
                                    <Text style={s.statSub}>Phí ship</Text>
                                </View>
                            </View>

                            {(restaurant.isFlashSale && Number(restaurant.discountPercent) > 0) && (
                                <LinearGradient
                                    colors={['rgba(239, 68, 68, 0.1)', 'rgba(225, 29, 72, 0.1)']}
                                    style={s.flashBanner}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={s.flashBannerText}>⚡ Flash Sale - Giảm {restaurant.discountPercent}% hôm nay!</Text>
                                </LinearGradient>
                            )}
                        </View>

                        <View style={s.tabsWrapper}>
                            <ScrollView ref={tabScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsList}>
                                <TouchableOpacity
                                    style={[s.tab, activeTab === 'Tất cả' && s.tabActive]}
                                    onPress={() => handleTabPress('Tất cả', -1)}
                                >
                                    <Text style={[s.tabText, activeTab === 'Tất cả' && s.tabTextActive]}>Tất cả</Text>
                                    {activeTab === 'Tất cả' && <View style={s.tabLine} />}
                                </TouchableOpacity>
                                {sections.map((sec, idx) => (
                                    <TouchableOpacity
                                        key={sec.title}
                                        style={[s.tab, activeTab === sec.title && s.tabActive]}
                                        onPress={() => handleTabPress(sec.title, idx)}
                                    >
                                        <Text style={[s.tabText, activeTab === sec.title && s.tabTextActive]}>{sec.title}</Text>
                                        {activeTab === sec.title && <View style={s.tabLine} />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                }
                renderSectionHeader={({ section }) => (
                    <View style={s.secHeader}>
                        <Text style={s.secTitle}>{section.title}</Text>
                    </View>
                )}
                renderItem={({ item }) => (
                    <MenuCard
                        item={item}
                        qty={getItemQty(item.id)}
                        onAdd={() => handleAdd(item.id, item)}
                        onRemove={() => handleRemove(item.id)}
                    />
                )}
                ItemSeparatorComponent={() => <View style={s.separator} />}
                ListFooterComponent={<View style={{ height: 120 }} />}
            />

            {cartTotal > 0 && (
                <View style={s.footer}>
                    <TouchableOpacity style={s.footerCartSection} onPress={() => setShowCartDrawer(true)}>
                        <Ionicons name="cart-outline" size={24} color={AppColors.primary} />
                        <View>
                            <Text style={s.footerLabel}>Giỏ hàng</Text>
                            <Text style={s.footerCartCount}>{cartTotal} món</Text>
                        </View>
                        <View style={s.cartBadge}>
                            <Text style={s.cartBadgeText}>{cartTotal}</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={s.footerDivider} />

                    <View style={s.footerTotalSection}>
                        <Text style={s.footerLabel}>Tổng tiền</Text>
                        <Text style={s.footerTotal}>{cartTotalPrice.toLocaleString('vi-VN')}đ</Text>
                    </View>

                    <TouchableOpacity style={s.deliveryBtn} activeOpacity={0.8} onPress={handleDeliveryClick}>
                        <LinearGradient colors={['#FF6B35', '#E55A2B']} style={s.deliveryBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Ionicons name="bicycle" size={20} color="#fff" />
                            <Text style={s.deliveryBtnText}>Giao hàng</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── Cart Drawer Modal ── */}
            <Modal visible={showCartDrawer} transparent animationType="slide">
                <View style={cd.overlay}>
                    <TouchableOpacity style={cd.overlayBg} activeOpacity={1} onPress={() => setShowCartDrawer(false)} />
                    <View style={cd.container}>
                        <View style={cd.header}>
                            <Text style={cd.headerTitle}>🛒 Giỏ hàng ({cartTotal} món)</Text>
                            <TouchableOpacity onPress={() => setShowCartDrawer(false)}>
                                <Ionicons name="close" size={24} color={AppColors.charcoal} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={cd.content} showsVerticalScrollIndicator={false}>
                            {cartLines.length === 0 ? (
                                <View style={cd.emptyBox}>
                                    <Text style={{ fontSize: 48 }}>🛒</Text>
                                    <Text style={cd.emptyText}>Giỏ hàng trống</Text>
                                </View>
                            ) : (
                                cartLines.map((line, idx) => {
                                    const item = sections.flatMap(sec => sec.data).find(i => i.id === line.itemId);
                                    const toppings = getLineToppingsStr(line);
                                    const linePrice = calculateLinePrice(line);
                                    return (
                                        <View key={line.lineId} style={cd.lineItem}>
                                            <View style={cd.lineTop}>
                                                <View style={cd.lineEmojiBox}>
                                                    {item?.image ? (
                                                        <Image source={{ uri: resolveImage(item.image) }} style={cd.lineImg} resizeMode="cover" />
                                                    ) : (
                                                        <Text style={{ fontSize: 28 }}>{item?.emoji || '🍽️'}</Text>
                                                    )}
                                                </View>
                                                <View style={cd.lineInfo}>
                                                    <Text style={cd.lineName} numberOfLines={1}>{item?.name || 'Món'}</Text>
                                                    {!!toppings && (
                                                        <Text style={cd.lineToppings} numberOfLines={2}>+ {toppings}</Text>
                                                    )}
                                                    <Text style={cd.linePrice}>{linePrice.toLocaleString('vi-VN')}đ</Text>
                                                </View>
                                                <TouchableOpacity style={cd.lineDeleteBtn} onPress={() => handleLineRemove(line.lineId)}>
                                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={cd.lineBottom}>
                                                <View style={cd.lineQtyControls}>
                                                    <TouchableOpacity
                                                        style={[cd.lineQtyBtn, line.qty <= 1 && cd.lineQtyBtnDisabled]}
                                                        onPress={() => handleLineQtyChange(line.lineId, -1)}
                                                        disabled={line.qty <= 1}
                                                    >
                                                        <Ionicons name="remove" size={16} color={line.qty <= 1 ? '#ccc' : AppColors.primary} />
                                                    </TouchableOpacity>
                                                    <Text style={cd.lineQtyText}>{line.qty}</Text>
                                                    <TouchableOpacity style={cd.lineQtyBtn} onPress={() => handleLineQtyChange(line.lineId, 1)}>
                                                        <Ionicons name="add" size={16} color={AppColors.primary} />
                                                    </TouchableOpacity>
                                                </View>
                                                <Text style={cd.lineSubtotal}>{(linePrice * line.qty).toLocaleString('vi-VN')}đ</Text>
                                            </View>
                                            {idx < cartLines.length - 1 && <View style={cd.lineDivider} />}
                                        </View>
                                    );
                                })
                            )}
                        </ScrollView>

                        {cartLines.length > 0 && (
                            <View style={cd.footer}>
                                <View style={cd.footerRow}>
                                    <Text style={cd.footerLabel}>Tổng ({cartTotal} món)</Text>
                                    <Text style={cd.footerTotal}>{cartTotalPrice.toLocaleString('vi-VN')}đ</Text>
                                </View>
                                <TouchableOpacity
                                    style={cd.orderBtn}
                                    activeOpacity={0.8}
                                    onPress={() => { setShowCartDrawer(false); handleDeliveryClick(); }}
                                >
                                    <LinearGradient colors={['#FF6B35', '#E55A2B']} style={cd.orderBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                        <Ionicons name="bicycle" size={20} color="#fff" />
                                        <Text style={cd.orderBtnText}>Đặt hàng</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            <CreateModalPage
                visible={modalVisible}
                item={selectedItem}
                onClose={() => {
                    setModalVisible(false);
                    setSelectedItem(null);
                }}
                onConfirm={handleModalConfirm}
            />

            {showConfirmOrder && (
                <ConfirmOrderScreen
                    cartItems={getCartItems()}
                    restaurant={restaurant}
                    totalPrice={cartTotalPrice}
                    onConfirm={handleConfirmOrder}
                    onCancel={() => setShowConfirmOrder(false)}
                />
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    navBar: {
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'ios' ? 56 : 36,
        paddingBottom: 12, paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    navTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: AppColors.charcoal, marginHorizontal: 12 },
    fabBack: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 56 : 36,
        left: 16, zIndex: 99,
    },
    fabBackBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center', alignItems: 'center',
    },
    hero: { width, height: HERO_HEIGHT, position: 'relative' },
    heroImg: { width: '100%', height: '100%' },
    heroOverlay: { ...StyleSheet.absoluteFillObject },
    favBtnInfo: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#F3F4F6',
    },
    infoCard: {
        backgroundColor: '#fff',
        marginTop: -20,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: Spacing.lg,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 10 },
            android: { elevation: 4 },
        }),
    },
    infoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    restName: { flex: 1, fontSize: 22, fontWeight: '800', color: AppColors.charcoal, marginRight: 10 },
    statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    statusText: { fontSize: 12, fontWeight: '700' },
    tagsRow: { flexDirection: 'row', gap: 8 },
    tag: { backgroundColor: '#FFF3ED', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    tagText: { fontSize: 12, color: AppColors.primary, fontWeight: '600' },
    statsBox: {
        flexDirection: 'row', backgroundColor: '#FFF8F5',
        borderRadius: BorderRadius.md, padding: 14, marginBottom: 12,
    },
    statItem: { flex: 1, alignItems: 'center', gap: 4 },
    statVal: { fontSize: 14, fontWeight: '800', color: AppColors.charcoal },
    statSub: { fontSize: 11, color: AppColors.gray },
    statDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 8 },
    flashBanner: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        marginTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    flashBannerText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '800',
    },
    tabsWrapper: {
        backgroundColor: '#fff',
        borderBottomWidth: 1.5, borderBottomColor: '#F3F4F6',
    },
    tabsList: { paddingHorizontal: Spacing.lg },
    tab: { paddingHorizontal: 14, paddingVertical: 12, position: 'relative' },
    tabActive: {},
    tabText: { fontSize: 14, fontWeight: '600', color: AppColors.gray },
    tabTextActive: { color: AppColors.primary },
    tabLine: { position: 'absolute', bottom: 0, left: 14, right: 14, height: 2.5, backgroundColor: AppColors.primary, borderRadius: 2 },
    secHeader: {
        backgroundColor: '#F9FAFB',
        paddingHorizontal: Spacing.lg, paddingVertical: 10,
        borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F3F4F6',
    },
    secTitle: { fontSize: 14, fontWeight: '800', color: AppColors.charcoal },
    menuItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingVertical: 14,
        backgroundColor: '#fff',
    },
    separator: { height: 1, backgroundColor: '#F9FAFB', marginLeft: Spacing.lg + 76 + 14 },
    menuImgBox: {
        width: 80, height: 80, borderRadius: 12,
        backgroundColor: '#FFF3ED',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 14, position: 'relative',
        overflow: 'hidden',
    },
    menuImg: { width: '100%', height: '100%' },
    menuEmoji: { fontSize: 40 },
    bestTag: {
        position: 'absolute', bottom: -6, left: -4,
        backgroundColor: '#FFF3ED', borderRadius: 8, borderWidth: 1, borderColor: '#FFE0CC',
        paddingHorizontal: 5, paddingVertical: 2,
    },
    bestTagText: { fontSize: 9, fontWeight: '700', color: AppColors.primary },
    newTag: {
        position: 'absolute', top: -4, right: -4,
        backgroundColor: '#10B981', borderRadius: 6,
        paddingHorizontal: 5, paddingVertical: 2,
    },
    newTagText: { fontSize: 9, fontWeight: '800', color: '#fff' },
    menuInfo: { flex: 1 },
    menuName: { fontSize: 14, fontWeight: '700', color: AppColors.charcoal, marginBottom: 2 },
    menuDesc: { fontSize: 12, color: AppColors.gray, lineHeight: 16, marginBottom: 4 },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    menuPrice: { fontSize: 15, fontWeight: '800', color: AppColors.primary },
    oldPrice: { fontSize: 12, color: AppColors.gray, textDecorationLine: 'line-through' },
    promoBadge: {
        position: 'absolute', top: 0, left: 0,
        backgroundColor: '#E63946', paddingHorizontal: 6, paddingVertical: 2,
        borderBottomRightRadius: 8
    },
    promoBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    addBtn: {
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: AppColors.primary,
        justifyContent: 'center', alignItems: 'center',
        marginLeft: 10,
    },
    qtyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 10,
    },
    qtyBtnRemove: {
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: '#FFF3ED',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFE0CC',
    },
    qtyBtnAdd: {
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: AppColors.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    qtyText: {
        fontSize: 15,
        fontWeight: '700',
        color: AppColors.charcoal,
        minWidth: 24,
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8 },
            android: { elevation: 8 },
        }),
    },
    footerCartSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    footerLabel: {
        fontSize: 11,
        color: AppColors.gray,
        fontWeight: '500',
    },
    footerCartCount: {
        fontSize: 14,
        fontWeight: '700',
        color: AppColors.charcoal,
    },
    cartBadge: {
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: AppColors.primary,
        justifyContent: 'center', alignItems: 'center',
        marginLeft: 4,
    },
    cartBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
    footerDivider: {
        width: 1,
        height: 36,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 12,
    },
    footerTotalSection: {
        alignItems: 'flex-end',
        marginRight: 12,
    },
    footerTotal: {
        fontSize: 16,
        fontWeight: '800',
        color: AppColors.primary,
    },
    deliveryBtn: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    deliveryBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    deliveryBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
});

const sk = StyleSheet.create({
    hero: { width, height: HERO_HEIGHT, backgroundColor: '#E5E7EB' },
    info: { backgroundColor: '#fff', padding: Spacing.lg, marginTop: -20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    title: { height: 22, backgroundColor: '#E5E7EB', borderRadius: 11, width: '60%', marginBottom: 10 },
    sub: { height: 14, backgroundColor: '#F3F4F6', borderRadius: 7, width: '80%', marginBottom: 16 },
    statsRow: { flexDirection: 'row', gap: 10 },
    stat: { flex: 1, height: 56, backgroundColor: '#F3F4F6', borderRadius: 12 },
    item: { flexDirection: 'row', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
    itemImg: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#E5E7EB', marginRight: 14 },
    itemRight: { flex: 1, gap: 8, justifyContent: 'center' },
    l1: { height: 14, backgroundColor: '#E5E7EB', borderRadius: 7, width: '70%' },
    l2: { height: 11, backgroundColor: '#F3F4F6', borderRadius: 6, width: '90%' },
    l3: { height: 16, backgroundColor: '#FFF3ED', borderRadius: 8, width: '30%' },
});

// Cart Drawer styles
const cd = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: '80%',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12 },
            android: { elevation: 10 },
        }),
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14,
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: AppColors.charcoal },
    content: { paddingHorizontal: 16, paddingTop: 12 },
    emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    emptyText: { fontSize: 15, color: AppColors.gray, fontWeight: '600' },
    lineItem: { paddingVertical: 12 },
    lineTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    lineEmojiBox: {
        width: 52, height: 52, borderRadius: 12,
        backgroundColor: '#FFF3ED', justifyContent: 'center', alignItems: 'center',
        overflow: 'hidden',
    },
    lineImg: { width: '100%', height: '100%' },
    lineInfo: { flex: 1, gap: 2 },
    lineName: { fontSize: 14, fontWeight: '700', color: AppColors.charcoal },
    lineToppings: { fontSize: 11, color: AppColors.primary, fontWeight: '500' },
    linePrice: { fontSize: 13, fontWeight: '600', color: AppColors.gray },
    lineDeleteBtn: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center',
    },
    lineBottom: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 10, paddingLeft: 64,
    },
    lineQtyControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    lineQtyBtn: {
        width: 30, height: 30, borderRadius: 8,
        backgroundColor: '#FFF3ED', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1.5, borderColor: AppColors.primary,
    },
    lineQtyBtnDisabled: { borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
    lineQtyText: { fontSize: 16, fontWeight: '800', color: AppColors.charcoal, minWidth: 24, textAlign: 'center' as const },
    lineSubtotal: { fontSize: 15, fontWeight: '800', color: AppColors.primary },
    lineDivider: { height: 1, backgroundColor: '#F3F4F6', marginTop: 12 },
    footer: {
        paddingHorizontal: 20, paddingVertical: 14,
        paddingBottom: Platform.OS === 'ios' ? 30 : 14,
        borderTopWidth: 1, borderTopColor: '#F3F4F6',
    },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    footerLabel: { fontSize: 14, fontWeight: '600', color: AppColors.gray },
    footerTotal: { fontSize: 18, fontWeight: '800', color: AppColors.primary },
    orderBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' as const },
    orderBtnGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 14,
    },
    orderBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
