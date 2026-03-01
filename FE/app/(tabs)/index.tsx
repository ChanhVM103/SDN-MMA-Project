import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/constants/auth-context';
import TopRatedSection from '@/components/home/TopRatedSection';
import NearbySection from '@/components/home/NearbySection';
import MostOrderedSection from '@/components/home/MostOrderedSection';
import FlashSaleSection from '@/components/home/FlashSaleSection';

const { width } = Dimensions.get('window');

// ── Data ──────────────────────────────────────────
const CATEGORIES = [
  { id: '1', name: 'Giảm giá', emoji: '🔥', color: '#FFE8E0' },
  { id: '2', name: 'Pizza', emoji: '🍕', color: '#FFEAA7' },
  { id: '3', name: 'Burger', emoji: '🍔', color: '#DFE6E9' },
  { id: '4', name: 'Sushi', emoji: '🍣', color: '#FAD9D5' },
  { id: '5', name: 'Mì Ý', emoji: '🍝', color: '#C8E6C9' },
  { id: '6', name: 'Tràng miệng', emoji: '🍰', color: '#F3E5F5' },
  { id: '7', name: 'Đồ uống', emoji: '🥤', color: '#E0F7FA' },
  { id: '8', name: 'Salad', emoji: '🥗', color: '#E8F5E9' },
  { id: '9', name: 'Nướng', emoji: '🍖', color: '#FFF3E0' },
  { id: '10', name: 'Hải sản', emoji: '🦐', color: '#E3F2FD' },
  { id: '11', name: 'Mì & Phở', emoji: '🍜', color: '#FFF8E1' },
  { id: '12', name: 'Cà phê', emoji: '☕', color: '#EFEBE9' },
];

const POPULAR_DISHES = [
  {
    id: '1',
    name: 'Burger Bò Wagyu',
    price: '450.000đ',
    rating: 4.9,
    time: '25 phút',
    emoji: '🍔',
    gradient: ['#FF6B35', '#FF8F65'] as const,
  },
  {
    id: '2',
    name: 'Tôm Hùm Nướng',
    price: '980.000đ',
    rating: 4.8,
    time: '35 phút',
    emoji: '🦞',
    gradient: ['#2D6A4F', '#52B788'] as const,
  },
  {
    id: '3',
    name: 'Trà Xanh Tiramisu',
    price: '120.000đ',
    rating: 4.7,
    time: '15 phút',
    emoji: '🍵',
    gradient: ['#6C5CE7', '#A29BFE'] as const,
  },
  {
    id: '4',
    name: 'Sushi Rồng Cuộn',
    price: '350.000đ',
    rating: 4.9,
    time: '20 phút',
    emoji: '🍣',
    gradient: ['#E17055', '#FAB1A0'] as const,
  },
];

const SPECIAL_OFFERS = [
  {
    id: '1',
    title: 'Miễn phí ship',
    subtitle: 'Đơn hàng từ 300.000đ',
    emoji: '🚚',
    gradient: ['#FF6B35', '#FFB627'] as const,
  },
  {
    id: '2',
    title: 'Giảm 30%',
    subtitle: 'Ưu đãi đơn đầu tiên',
    emoji: '🎉',
    gradient: ['#2D6A4F', '#52B788'] as const,
  },
];

const CAROUSEL_BANNERS = [
  {
    id: '1',
    title: 'Món Đặc Biệt',
    subtitle: 'Thực đơn 5 món độc quyền từ đầu bếp hàng đầu',
    emoji: '👨‍🍳',
    badge: 'MỚI',
    gradient: ['#FF6B35', '#E55A2B'] as const,
  },
  {
    id: '2',
    title: 'Brunch Cuối Tuần',
    subtitle: 'Buffet brunch không giới hạn với bếp nấu trực tiếp mỗi thứ Bảy',
    emoji: '🥐',
    badge: 'HOT',
    gradient: ['#2D6A4F', '#52B788'] as const,
  },
  {
    id: '3',
    title: 'Tiệc Gia Đình',
    subtitle: 'Combo cho cả nhà chỉ từ 299.000đ',
    emoji: '🍗',
    badge: 'DEAL',
    gradient: ['#6C5CE7', '#A29BFE'] as const,
  },
  {
    id: '4',
    title: 'Món Lành Mạnh',
    subtitle: 'Poke bowl, açaí bowl và salad bowl tươi mới mỗi ngày',
    emoji: '🥗',
    badge: 'TƯƠI',
    gradient: ['#00B894', '#00CEC9'] as const,
  },
];

const CAROUSEL_WIDTH = width - 48;

// ── Animated Component ────────────────────────────
function FadeInView({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {children}
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { orderSuccess } = useLocalSearchParams<{ orderSuccess?: string }>();
  const { user } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [activeSlide, setActiveSlide] = useState(0);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const carouselRef = useRef<FlatList>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll carousel
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % CAROUSEL_BANNERS.length;
        carouselRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3500);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, []);

  useEffect(() => {
    if (orderSuccess === '1') {
      setShowOrderSuccess(true);

      const t = setTimeout(() => {
        setShowOrderSuccess(false);

      
        router.setParams({ orderSuccess: undefined });
      }, 2200);

      return () => clearTimeout(t);
    }
  }, [orderSuccess]);

  const onCarouselScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / CAROUSEL_WIDTH);
    if (index !== activeSlide && index >= 0 && index < CAROUSEL_BANNERS.length) {
      setActiveSlide(index);
    }
  }, [activeSlide]);

  const resetAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % CAROUSEL_BANNERS.length;
        carouselRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3500);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* ── Hero Section ────────────────── */}
        <LinearGradient colors={['#FF6B35', '#E55A2B', '#C44A20']} style={styles.heroSection}>
          <View style={styles.heroOverlay}>
            {/* Delivery Address Bar */}
            <TouchableOpacity style={styles.addressBar} activeOpacity={0.8} onPress={() => router.push(user ? '/(tabs)/profile' as any : '/sign-in' as any)}>
              <Text style={styles.addressLabel}>Giao đến:</Text>
              <Ionicons name="location" size={14} color="#FFB627" />
              <Text style={styles.addressText} numberOfLines={1}>
                {user?.address ? user.address : 'Thêm địa chỉ giao hàng'}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>

            {/* Top bar */}
            <View style={styles.topBar}>
              <View>
                <Text style={styles.greeting}>Xin chào 👋</Text>
                <Text style={styles.userName}>{user ? user.fullName : 'Thực khách'}</Text>
              </View>
              <TouchableOpacity style={styles.profileButton} onPress={() => router.push(user ? '/(tabs)/profile' as any : '/sign-in' as any)}>
                <Ionicons name="person-circle-outline" size={40} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Hero Content */}
            <FadeInView delay={200}>
              <Text style={styles.heroTitle}>Khám Phá{'\n'}Món Ngon</Text>
              <Text style={styles.heroSubtitle}>
                Nguyên liệu tươi, công thức đặc sắc, giao tận nơi
              </Text>
            </FadeInView>

            {/* Search Bar */}
            <FadeInView delay={400}>
              <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/search' as any)} activeOpacity={0.8}>
                <Ionicons name="search" size={20} color={AppColors.gray} />
                <Text style={styles.searchText}>Tìm món ăn, nhà hàng...</Text>
                <View style={styles.filterButton}>
                  <Ionicons name="options-outline" size={18} color={AppColors.primary} />
                </View>
              </TouchableOpacity>
            </FadeInView>
          </View>
        </LinearGradient>

        {/* ── Featured Carousel ────────────── */}
        <FadeInView delay={250} style={styles.carouselSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✨ Nổi bật</Text>
            <View style={styles.carouselDots}>
              {CAROUSEL_BANNERS.map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.dot,
                    i === activeSlide && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          </View>
          <FlatList
            ref={carouselRef}
            data={CAROUSEL_BANNERS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={CAROUSEL_WIDTH + 12}
            decelerationRate="fast"
            contentContainerStyle={{ gap: 12 }}
            onScroll={onCarouselScroll}
            onScrollBeginDrag={resetAutoPlay}
            scrollEventThrottle={16}
            getItemLayout={(_, index) => ({
              length: CAROUSEL_WIDTH + 12,
              offset: (CAROUSEL_WIDTH + 12) * index,
              index,
            })}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={0.9} style={{ width: CAROUSEL_WIDTH }}>
                <LinearGradient
                  colors={item.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.carouselCard}
                >
                  <View style={styles.carouselDecor1} />
                  <View style={styles.carouselDecor2} />
                  <View style={styles.carouselDecor3} />
                  <View style={styles.carouselContent}>
                    <View style={styles.carouselBadge}>
                      <Text style={styles.carouselBadgeText}>{item.badge}</Text>
                    </View>
                    <Text style={styles.carouselTitle}>{item.title}</Text>
                    <Text style={styles.carouselSubtitle}>{item.subtitle}</Text>
                    <View style={styles.carouselBtn}>
                      <Text style={styles.carouselBtnText}>Đặt ngay</Text>
                      <Ionicons name="arrow-forward" size={14} color={AppColors.primary} />
                    </View>
                  </View>
                  <Text style={styles.carouselEmoji}>{item.emoji}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          />
        </FadeInView>

        {/* ── Special Offers ──────────────── */}
        <FadeInView delay={300} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Ưu Đãi</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.offersScroll}>
            {SPECIAL_OFFERS.map((offer) => (
              <TouchableOpacity key={offer.id} activeOpacity={0.85}>
                <LinearGradient
                  colors={offer.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.offerCard}
                >
                  <View style={styles.offerContent}>
                    <Text style={styles.offerEmoji}>{offer.emoji}</Text>
                    <Text style={styles.offerTitle}>{offer.title}</Text>
                    <Text style={styles.offerSubtitle}>{offer.subtitle}</Text>
                  </View>
                  <View style={styles.offerDecor}>
                    <View style={styles.offerCircle1} />
                    <View style={styles.offerCircle2} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </FadeInView>

        {/* ── Categories ─────────────────── */}
        <FadeInView delay={400} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🍽️ Danh mục</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            <View style={styles.catGrid}>
              {/* Row 1 */}
              <View style={styles.catRow}>
                {CATEGORIES.slice(0, 6).map((cat) => (
                  <TouchableOpacity key={cat.id} style={styles.catItem} activeOpacity={0.7}>
                    <View style={[styles.catCircle, { backgroundColor: cat.color }]}>
                      <Text style={styles.catEmoji}>{cat.emoji}</Text>
                    </View>
                    <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Row 2 */}
              <View style={styles.catRow}>
                {CATEGORIES.slice(6, 12).map((cat) => (
                  <TouchableOpacity key={cat.id} style={styles.catItem} activeOpacity={0.7}>
                    <View style={[styles.catCircle, { backgroundColor: cat.color }]}>
                      <Text style={styles.catEmoji}>{cat.emoji}</Text>
                    </View>
                    <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </FadeInView>

        {/* ── Popular Dishes ─────────────── */}
        <FadeInView delay={500} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐ Món Phổ Biến</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dishesScroll}>
            {POPULAR_DISHES.map((dish) => (
              <TouchableOpacity key={dish.id} style={styles.dishCard} activeOpacity={0.85}>
                <LinearGradient
                  colors={dish.gradient}
                  style={styles.dishImageContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.dishEmoji}>{dish.emoji}</Text>
                </LinearGradient>
                <View style={styles.dishInfo}>
                  <Text style={styles.dishName} numberOfLines={1}>{dish.name}</Text>
                  <View style={styles.dishMeta}>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#FFB627" />
                      <Text style={styles.ratingText}>{dish.rating}</Text>
                    </View>
                    <View style={styles.timeBadge}>
                      <Ionicons name="time-outline" size={12} color={AppColors.gray} />
                      <Text style={styles.timeText}>{dish.time}</Text>
                    </View>
                  </View>
                  <View style={styles.dishBottom}>
                    <Text style={styles.dishPrice}>{dish.price}</Text>
                    <TouchableOpacity style={styles.addButton}>
                      <Ionicons name="add" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </FadeInView>

        {/* ── New Sections (separate components) ── */}
        <FlashSaleSection />
        <TopRatedSection />
        <NearbySection />
        <MostOrderedSection />

        {/* ── Chef Recommendation ────────── */}
        <FadeInView delay={600} style={styles.section}>
          <TouchableOpacity activeOpacity={0.9}>
            <LinearGradient
              colors={['#1F2937', '#111827']}
              style={styles.chefCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.chefContent}>
                <Text style={styles.chefBadge}>👨‍🍳 Đầu Bếp Chọn</Text>
                <Text style={styles.chefTitle}>Thực Đơn{'\n'}Đặc Sắc</Text>
                <Text style={styles.chefSubtitle}>
                  Hành trình 5 món độc đáo từ đầu bếp tài năng
                </Text>
                <View style={styles.chefButton}>
                  <Text style={styles.chefButtonText}>Xem thực đơn</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </View>
              </View>
              <Text style={styles.chefEmoji}>🍷</Text>
            </LinearGradient>
          </TouchableOpacity>
        </FadeInView>

        {/* ── Bottom CTA ─────────────────── */}
        <FadeInView delay={700} style={[styles.section, { marginBottom: 100 }]}>
          <LinearGradient
            colors={['#FF6B35', '#FFB627']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaCard}
          >
            <Text style={styles.ctaEmoji}>🎁</Text>
            <Text style={styles.ctaTitle}>Gia nhập FoodieHub!</Text>
            <Text style={styles.ctaSubtitle}>
              Đăng ký ngay để nhận ưu đãi, công thức và phần thưởng độc quyền
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/sign-up' as any)}
            >
              <Text style={styles.ctaButtonText}>Bắt đầu miễn phí</Text>
              <Ionicons name="arrow-forward" size={18} color={AppColors.primary} />
            </TouchableOpacity>
          </LinearGradient>
        </FadeInView>
      </Animated.ScrollView>

      {showOrderSuccess && (
        <View style={styles.successToastWrap} pointerEvents="none">
          <View style={styles.successToast}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.successToastText}>Đặt hàng thành công</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.offWhite,
  },

  // Carousel
  carouselSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  carouselDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    width: 24,
    backgroundColor: AppColors.primary,
    borderRadius: 4,
  },
  carouselCard: {
    height: 180,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  carouselDecor1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)', top: -40, right: -40,
  },
  carouselDecor2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)', bottom: -30, left: -20,
  },
  carouselDecor3: {
    position: 'absolute', width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)', top: 20, right: 80,
  },
  carouselContent: {
    flex: 1,
    zIndex: 1,
  },
  carouselBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  carouselBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  carouselTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  carouselSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 17,
    marginBottom: 14,
    maxWidth: '85%',
  },
  carouselBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  carouselBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
  },
  carouselEmoji: {
    fontSize: 72,
    marginLeft: -10,
    zIndex: 1,
  },

  // Hero
  heroSection: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroOverlay: {
    paddingHorizontal: Spacing.lg,
  },
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingVertical: 6,
  },
  addressLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
    marginTop: 2,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 42,
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  searchText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 15,
    color: AppColors.gray,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFF3ED',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sections
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.charcoal,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.primary,
  },

  // Offers
  offersScroll: {
    gap: 12,
  },
  offerCard: {
    width: width * 0.7,
    height: 140,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  offerContent: {
    flex: 1,
    zIndex: 1,
  },
  offerEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  offerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  offerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  offerDecor: {
    position: 'absolute',
    right: -20,
    top: -20,
  },
  offerCircle1: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  offerCircle2: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
    position: 'absolute',
    right: 10,
    bottom: -30,
  },

  // Categories (2-row horizontal scroll)
  catScroll: {
    paddingRight: Spacing.lg,
  },
  catGrid: {
    gap: 14,
  },
  catRow: {
    flexDirection: 'row',
    gap: 18,
  },
  catItem: {
    alignItems: 'center',
    width: 68,
  },
  catCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  catEmoji: {
    fontSize: 28,
  },
  catName: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.charcoal,
    textAlign: 'center',
  },

  // Dishes
  dishesScroll: {
    gap: 16,
    paddingRight: Spacing.lg,
  },
  dishCard: {
    width: 180,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  dishImageContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishEmoji: {
    fontSize: 56,
  },
  dishInfo: {
    padding: 12,
  },
  dishName: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.charcoal,
    marginBottom: 6,
  },
  dishMeta: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.darkGray,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 12,
    color: AppColors.gray,
  },
  dishBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dishPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: AppColors.primary,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Chef Card
  chefCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 180,
  },
  chefContent: {
    flex: 1,
  },
  chefBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.accent,
    marginBottom: 8,
  },
  chefTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 30,
    marginBottom: 8,
  },
  chefSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    marginBottom: 16,
  },
  chefButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  chefButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  chefEmoji: {
    fontSize: 72,
    marginLeft: 8,
  },

  // CTA
  ctaCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  ctaEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.primary,
  },

  successToastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 90 : 78,
    alignItems: 'center',
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  successToastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
