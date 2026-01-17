import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

function RootLayoutNav() {
  const { currentUser, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const isInAuthGroup = segments[0] === 'auth';
    const isOnLoginScreen = isInAuthGroup && segments[1] === 'login';

    if (!currentUser && !isOnLoginScreen) {
      router.replace('/auth/login');
      return;
    }

  }, [currentUser, segments, isLoading, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#000',
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: true,
      }}
    >
      {/* Auth-экраны */}
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen
        name="auth/accounts"
        options={{
          title: 'Аккаунты',
          headerStyle: { backgroundColor: '#2196F3' },
          headerTintColor: '#fff',
          headerBackTitle: 'Назад',
        }}
      />

      {/* Главная */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* Остальные экраны – как у тебя было */}
      <Stack.Screen
        name="settings"
        options={{
          title: 'Настройки',
          presentation: 'modal',
          headerBackTitle: 'Закрыть',
        }}
      />
      <Stack.Screen
        name="pack/[packId]"
        options={{
          title: 'Уровни',
          headerBackTitle: 'Главная',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="dictionary"
        options={{
          title: 'Словарь',
          headerBackTitle: 'Назад',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="game/run"
        options={{
          headerShown: false,
          gestureEnabled: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="result"
        options={{
          title: 'Результаты',
          headerBackVisible: false,
          gestureEnabled: false,
          headerLeft: () => null,
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
