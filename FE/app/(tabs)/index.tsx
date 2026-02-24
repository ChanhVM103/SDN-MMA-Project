import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

// ── Data ──────────────────────────────────────────
const CATEGORIES = [
  { id: '1', name: 'Pizza', emoji: '🍕', color: '#FFEAA7' },
  { id: '2', name: 'Burger', emoji: '🍔', color: '#DFE6E9' },
  { id: '3', name: 'Sushi', emoji: '🍣', color: '#FAD9D5' },
  { id: '4', name: 'Pasta', emoji: '🍝', color: '#C8E6C9' },
  { id: '5', name: 'Dessert', emoji: '🍰', color: '#F3E5F5' },
  { id: '6', name: 'Drinks', emoji: '🥤', color: '#E0F7FA' },
];

const POPULAR_DISHES = [
  {
    id: '1',
    name: 'Truffle Wagyu Burger',
    price: '$18.99',
    rating: 4.9,
    time: '25 min',
    emoji: '🍔',
    gradient: ['#FF6B35', '#FF8F65'] as const,
  },
  {
    id: '2',
    name: 'Lobster Thermidor',
    price: '$42.50',
    rating: 4.8,
    time: '35 min',
    emoji: '🦞',
    gradient: ['#2D6A4F', '#52B788'] as const,
  },
  {
    id: '3',
    name: 'Matcha Tiramisu',
    price: '$12.99',
    rating: 4.7,
    time: '15 min',
    emoji: '🍵',
    gradient: ['#6C5CE7', '#A29BFE'] as const,
  },
  {
    id: '4',
    name: 'Dragon Roll Sushi',
    price: '$24.00',
    rating: 4.9,
    time: '20 min',
    emoji: '🍣',
    gradient: ['#E17055', '#FAB1A0'] as const,
  },
];

const SPECIAL_OFFERS = [
  {
    id: '1',
    title: 'Free Delivery',
    subtitle: 'On orders above $30',
    emoji: '🚚',
    gradient: ['#FF6B35', '#FFB627'] as const,
  },
  {
    id: '2',
    title: '30% OFF',
    subtitle: 'First order discount',
    emoji: '🎉',
    gradient: ['#2D6A4F', '#52B788'] as const,
  },
];

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
  const scrollY = useRef(new Animated.Value(0)).current;

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
            {/* Top bar */}
            <View style={styles.topBar}>
              <View>
                <Text style={styles.greeting}>Good afternoon 👋</Text>
                <Text style={styles.userName}>Food Lover</Text>
              </View>
              <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/sign-in' as any)}>
                <Ionicons name="person-circle-outline" size={40} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Hero Content */}
            <FadeInView delay={200}>
              <Text style={styles.heroTitle}>Discover{'\n'}Delicious Food</Text>
              <Text style={styles.heroSubtitle}>
                Fresh ingredients, curated recipes, delivered to your door
              </Text>
            </FadeInView>

            {/* Search Bar */}
            <FadeInView delay={400}>
              <TouchableOpacity style={styles.searchBar}>
                <Ionicons name="search" size={20} color={AppColors.gray} />
                <Text style={styles.searchText}>Search for dishes, restaurants...</Text>
                <View style={styles.filterButton}>
                  <Ionicons name="options-outline" size={18} color={AppColors.primary} />
                </View>
              </TouchableOpacity>
            </FadeInView>
          </View>
        </LinearGradient>

        {/* ── Special Offers ──────────────── */}
        <FadeInView delay={300} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Special Offers</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
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
            <Text style={styles.sectionTitle}>🍽️ Categories</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.id} style={[styles.categoryCard, { backgroundColor: cat.color }]} activeOpacity={0.7}>
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeInView>

        {/* ── Popular Dishes ─────────────── */}
        <FadeInView delay={500} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐ Popular Dishes</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
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
                <Text style={styles.chefBadge}>👨‍🍳 Chef's Pick</Text>
                <Text style={styles.chefTitle}>Signature{'\n'}Tasting Menu</Text>
                <Text style={styles.chefSubtitle}>
                  A 5-course culinary journey crafted by our award-winning chefs
                </Text>
                <View style={styles.chefButton}>
                  <Text style={styles.chefButtonText}>Explore Menu</Text>
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
            <Text style={styles.ctaTitle}>Join Our Food Family!</Text>
            <Text style={styles.ctaSubtitle}>
              Sign up now and get exclusive deals, recipes, and rewards
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/sign-up' as any)}
            >
              <Text style={styles.ctaButtonText}>Get Started Free</Text>
              <Ionicons name="arrow-forward" size={18} color={AppColors.primary} />
            </TouchableOpacity>
          </LinearGradient>
        </FadeInView>
      </Animated.ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.offWhite,
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

  // Categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 48 - 24) / 3,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.charcoal,
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
});
