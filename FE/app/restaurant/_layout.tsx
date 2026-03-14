import { Stack, useSegments } from 'expo-router';
import { useAuth } from '@/constants/auth-context';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function RestaurantLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Define which routes require management permissions
  const managementRoutes = [
    'dashboard',
    'products',
    'add-product',
    'edit-product',
    'edit-shop',
    'orders',
    'finance',
    'performance',
    'promotions',
    'create.modal'
  ];

  const isManagementRoute = segments.some(segment => managementRoutes.includes(segment));

  useEffect(() => {
    if (!isLoading && isManagementRoute) {
      // If it's a management route, check for brand/restaurant role
      if (!user || (user.role !== 'brand' && user.role !== 'restaurant')) {
        // Not authorized for management, redirect to sign-in
        router.replace('/sign-in' as any);
      }
    }
  }, [user, isLoading, segments, isManagementRoute]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  // If role is correct, allow rendering children
  return <Stack screenOptions={{ headerShown: false }} />;
}
