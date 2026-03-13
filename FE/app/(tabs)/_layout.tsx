import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { AppColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/constants/auth-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const isShipper = user?.role === 'shipper';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.primary,
        tabBarInactiveTintColor: AppColors.gray,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
            },
            android: { elevation: 8 },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          href: isShipper ? null : undefined, // Hide for shippers
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIcon : undefined}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn hàng',
          href: isShipper ? null : undefined, // Hide for shippers
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIcon : undefined}>
              <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Đã thích',
          href: isShipper ? null : undefined, // Hide for shippers
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIcon : undefined}>
              <Ionicons name={focused ? 'heart' : 'heart-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      {/* Shipper Dashboard Tab */}
      <Tabs.Screen
        name="shipper-dashboard"
        options={{
          title: 'Giao hàng',
          href: isShipper ? undefined : null, // Only show for shippers
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIcon : undefined}>
              <MaterialIcons name="two-wheeler" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tôi',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIcon : undefined}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      {/* Hide explore tab from bottom bar */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIcon: {
    backgroundColor: '#FFF3ED',
    borderRadius: 12,
    padding: 4,
  },
});
