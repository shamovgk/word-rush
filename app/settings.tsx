import { Container, Text } from '@/components/ui';
import { BORDER_RADIUS, COLORS, SPACING } from '@/constants/design-system';
import { useAuth } from '@/contexts/AuthContext';
import { resetProgress } from '@/lib/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SETTINGS_SOUND_KEY = 'settings:sound';
const SETTINGS_HAPTICS_KEY = 'settings:haptics';

export default function SettingsScreen() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sound, setSound] = useState(true);
  const [haptics, setHaptics] = useState(true);

  useEffect(() => {
    (async () => {
      const savedSound = await AsyncStorage.getItem(SETTINGS_SOUND_KEY);
      const savedHaptics = await AsyncStorage.getItem(SETTINGS_HAPTICS_KEY);

      if (savedSound !== null) setSound(savedSound === 'true');
      if (savedHaptics !== null) setHaptics(savedHaptics === 'true');
    })();
  }, []);

  const toggleSound = async (value: boolean) => {
    setSound(value);
    await AsyncStorage.setItem(SETTINGS_SOUND_KEY, String(value));
  };

  const toggleHaptics = async (value: boolean) => {
    setHaptics(value);
    await AsyncStorage.setItem(SETTINGS_HAPTICS_KEY, String(value));
  };

  const handleResetProgress = () => {
    Alert.alert(
      '⚠️ Сброс прогресса',
      'Вы уверены? Весь прогресс будет безвозвратно удалён:\n\n• Прогресс изучения слов\n• Прогресс уровней и звёзды\n• История игровых сессий\n\nЭто действие нельзя отменить!',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Сбросить',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetProgress();
              Alert.alert(
                '✓ Прогресс сброшен',
                'Весь прогресс успешно удалён. Приложение перезапустится.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      router.replace('/');
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert('❌ Ошибка', 'Не удалось сбросить прогресс. Попробуйте ещё раз.');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Настройки',
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
          headerTitleAlign: 'center',
        }}
      />

      <Container>
        <ScrollView 
          contentContainerStyle={{ 
            gap: SPACING.lg,
            paddingBottom: insets.bottom + SPACING.xl,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginTop: SPACING.sm }}>
          <Link href="/auth/accounts" asChild>
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.md,
                padding: SPACING.lg,
                borderRadius: BORDER_RADIUS.lg,
                backgroundColor: COLORS.primary,
              }}
            >
              <Text style={{ fontSize: 40 }}>{currentUser?.avatar || '😀'}</Text>
              <View style={{ flex: 1 }}>
                <Text variant="body" weight="semibold" style={{ color: '#fff' }}>
                  {currentUser?.displayName || 'Гость'}
                </Text>
                <Text variant="caption" style={{ color: '#E3F2FD' }}>
                  @{currentUser?.username || 'guest'} • Управление аккаунтами
                </Text>
              </View>
              <Text style={{ fontSize: 20, color: '#fff' }}>→</Text>
            </Pressable>
          </Link>
        </View>
          {/* Заголовок */}
          <View style={{ marginTop: SPACING.sm }}>
            <Text variant="title" weight="bold" align="center">
              Настройки
            </Text>
            <Text variant="caption" color="secondary" align="center" style={{ marginTop: SPACING.xs }}>
              Настройте приложение под себя
            </Text>
          </View>

          {/* Информационная панель */}
          <View
            style={{
              padding: SPACING.md,
              borderRadius: BORDER_RADIUS.lg,
              backgroundColor: COLORS.infoLight,
              borderWidth: 1,
              borderColor: COLORS.info,
            }}
          >
            <Text variant="caption" style={{ color: COLORS.primary }}>
              ℹ️ Управляйте звуковыми эффектами и вибрацией во время игры
            </Text>
          </View>

          {/* Настройки звука и вибрации */}
          <View
            style={{
              padding: SPACING.lg,
              borderRadius: BORDER_RADIUS.lg,
              backgroundColor: COLORS.white,
              borderWidth: 1,
              borderColor: COLORS.gray300,
              gap: SPACING.lg,
            }}
          >
            <Text variant="body" weight="semibold">
              Игра
            </Text>

            {/* Звук */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, paddingRight: SPACING.md }}>
                <Text variant="body" weight="semibold" numberOfLines={1}>
                  Звуковые эффекты
                </Text>
                <Text variant="caption" color="secondary" style={{ marginTop: 2 }} numberOfLines={2}>
                  Звуки при правильных и неправильных ответах
                </Text>
              </View>
              <Switch value={sound} onValueChange={toggleSound} />
            </View>

            {/* Разделитель */}
            <View style={{ height: 1, backgroundColor: COLORS.gray200 }} />

            {/* Вибрация */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, paddingRight: SPACING.md }}>
                <Text variant="body" weight="semibold" numberOfLines={1}>
                  Тактильная обратная связь
                </Text>
                <Text variant="caption" color="secondary" style={{ marginTop: 2 }} numberOfLines={2}>
                  Вибрация при взаимодействии с игрой
                </Text>
              </View>
              <Switch value={haptics} onValueChange={toggleHaptics} />
            </View>
          </View>

          {/* Опасная зона */}
          <View
            style={{
              padding: SPACING.lg,
              borderRadius: BORDER_RADIUS.lg,
              backgroundColor: COLORS.white,
              borderWidth: 2,
              borderColor: COLORS.error,
              gap: SPACING.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Text style={{ fontSize: 20 }}>⚠️</Text>
              <Text variant="body" weight="semibold" color="error">
                Опасная зона
              </Text>
            </View>

            <View style={{ gap: SPACING.sm }}>
              <Text variant="body" weight="semibold">
                Сброс прогресса
              </Text>
              <Text variant="caption" color="secondary" numberOfLines={3}>
                Удалить весь прогресс изучения, звёзды и историю. Это действие нельзя отменить.
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={handleResetProgress}
                style={{
                  padding: SPACING.md,
                  borderRadius: BORDER_RADIUS.lg,
                  backgroundColor: COLORS.error,
                  alignItems: 'center',
                  marginTop: SPACING.sm,
                }}
              >
                <Text variant="button" color="white" weight="semibold">
                  🗑️ Сбросить весь прогресс
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Информация о версии */}
          <View style={{ alignItems: 'center', paddingVertical: SPACING.md }}>
            <Text variant="caption" color="secondary">
              Word Rush v1.0.0
            </Text>
            <Text variant="caption" color="secondary" style={{ marginTop: SPACING.xs }}>
              Настройки сохраняются автоматически
            </Text>
          </View>
        </ScrollView>
      </Container>
    </>
  );
}
