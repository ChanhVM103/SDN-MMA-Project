import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useState, useEffect } from 'react';
import * as ExpoSplashScreen from 'expo-splash-screen';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/constants/auth-context';
import SplashScreen from '@/components/SplashScreen';

// Giữ native splash screen cho đến khi ta tự ẩn
ExpoSplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    // Ẩn native splash screen để custom splash hiển thị thay thế
    ExpoSplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="restaurant/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ headerShown: false }} />
          <Stack.Screen
            name="search"
            options={{
              headerShown: false,
              animation: 'fade',
              animationDuration: 200,
            }}
          />
        </Stack>
        <StatusBar style="light" />

        {/* Custom Animated Splash Screen - đè lên toàn bộ app */}
        {showCustomSplash && (
          <SplashScreen onFinish={() => setShowCustomSplash(false)} />
        )}
      </ThemeProvider>
    </AuthProvider>
  );
}
