import { Text } from '@/components/ui';
import { BORDER_RADIUS, COLORS, SPACING } from '@/constants/design-system';
import { useAuth } from '@/contexts/AuthContext';
import { packsMeta } from '@/data/packs';
import { getPackById } from '@/lib/content';
import { getPackProgressSummary } from '@/lib/storage';
import { useFocusEffect } from '@react-navigation/native';
import { Link, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Image as RNImage, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { currentUser } = useAuth();
  const [progress, setProgress] = useState<Record<string, any>>({});
  const insets = useSafeAreaInsets();

  const loadProgress = useCallback(async () => {
    if (!currentUser) return;

    const progressData: Record<string, any> = {};
    for (const meta of packsMeta) {
      const pack = getPackById(meta.id);
      if (pack) {
        const summary = await getPackProgressSummary(pack);
        progressData[meta.id] = summary;
      }
    }
    setProgress(progressData);
  }, [currentUser]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }} edges={['top']}>
        {/* Шапка */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.md,
            backgroundColor: COLORS.primary,
          }}
        >
          {/* Аватар */}
          <Link href="/auth/accounts" asChild>
            <Pressable style={{ padding: 4 }}>
              <Text style={{ fontSize: 28 }}>{currentUser?.avatar || '😀'}</Text>
            </Pressable>
          </Link>

          {/* Логотип + Название */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <RNImage
              source={require('@/assets/images/logo.png')}
              style={{ width: 32, height: 32 }}
              resizeMode="contain"
            />
            <Text variant="title" color="white" weight="bold">
              Word Rush
            </Text>
          </View>

          {/* Настройки */}
          <Link href="/settings" asChild>
            <Pressable style={{ padding: 8 }}>
              <Text style={{ fontSize: 24 }}>⚙️</Text>
            </Pressable>
          </Link>
        </View>

        {/* Остальной код без изменений */}
        <View style={{ flex: 1, backgroundColor: COLORS.white }}>
          <FlatList
            data={packsMeta}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              padding: SPACING.lg,
              gap: SPACING.md,
              paddingBottom: insets.bottom + SPACING.lg,
            }}
            ListHeaderComponent={
              <View style={{ marginBottom: SPACING.md }}>
                <Text variant="title" weight="bold" align="center">
                  Выберите пак
                </Text>
                <Text
                  variant="caption"
                  color="secondary"
                  align="center"
                  style={{ marginTop: SPACING.xs }}
                >
                  для изучения языка
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const packProgress = progress[item.id];
              const progressPct =
                packProgress && packProgress.total > 0
                  ? Math.round((packProgress.mastered / packProgress.total) * 100)
                  : 0;

              return (
                <Link
                  href={{ pathname: '/pack/[packId]', params: { packId: item.id } }}
                  asChild
                >
                  <Pressable
                    style={{
                      padding: SPACING.lg,
                      borderRadius: BORDER_RADIUS.lg,
                      backgroundColor: COLORS.white,
                      borderWidth: 1,
                      borderColor: COLORS.gray300,
                    }}
                  >
                    <View style={{ gap: SPACING.sm }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1, paddingRight: SPACING.md }}>
                          <Text variant="body" weight="semibold" numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text
                            variant="caption"
                            color="secondary"
                            style={{ marginTop: SPACING.xs }}
                            numberOfLines={1}
                          >
                            {item.cefr} • {item.lexemeCount} слов • {item.levelsCount} уровней
                          </Text>
                        </View>
                      </View>

                      {packProgress && (
                        <View style={{ gap: SPACING.xs }}>
                          <View
                            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
                          >
                            <Text variant="caption" color="secondary">
                              Прогресс
                            </Text>
                            <Text variant="caption" weight="semibold">
                              {progressPct}%
                            </Text>
                          </View>
                          <View
                            style={{
                              height: 6,
                              backgroundColor: COLORS.gray200,
                              borderRadius: BORDER_RADIUS.sm,
                              overflow: 'hidden',
                            }}
                          >
                            <View
                              style={{
                                height: '100%',
                                width: `${progressPct}%`,
                                backgroundColor: COLORS.success,
                                borderRadius: BORDER_RADIUS.sm,
                              }}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  </Pressable>
                </Link>
              );
            }}
          />
        </View>
      </SafeAreaView>
    </>
  );
}
