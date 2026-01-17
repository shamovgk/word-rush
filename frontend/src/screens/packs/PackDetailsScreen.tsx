import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme';
import { LevelCard } from '@/components/packs/LevelCard/LevelCard';
import { usePackProgress } from '@/hooks/useProgress';
import type { RootStackParamList } from '@/navigation/types';

type PackDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PackDetails'>;
type PackDetailsScreenRouteProp = RouteProp<RootStackParamList, 'PackDetails'>;

export const PackDetailsScreen: React.FC = () => {
  const navigation = useNavigation<PackDetailsScreenNavigationProp>();
  const route = useRoute<PackDetailsScreenRouteProp>();
  const { packId } = route.params;
  const { data: packProgress, isLoading } = usePackProgress(packId);

  const handleLevelPress = (levelId: string) => {
    navigation.navigate('LevelStart', { levelId });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (isLoading || !packProgress) {
    return (
      <LinearGradient colors={['#F0FFF4', '#FFFFFF']} style={styles.container}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loading}>
            <Text style={styles.loadingEmoji}>🎮</Text>
            <Text style={styles.loadingText}>Загрузка...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const progressPercent = (packProgress.totalStars / packProgress.maxStars) * 100;

  return (
    <LinearGradient colors={['#F0FFF4', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Pack Info */}
          <View style={styles.packInfo}>
            <Text style={styles.packIcon}>{packProgress.icon || '📦'}</Text>
            <Text style={styles.packTitle}>{packProgress.title}</Text>
            <Text style={styles.packDescription}>{packProgress.description}</Text>

            {/* Progress Card */}
            <View style={styles.progressCard}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Прогресс</Text>
                <Text style={styles.progressValue}>
                  {packProgress.completedLevels} / {packProgress.totalLevels}
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
              <View style={styles.starsRow}>
                <Text style={styles.starsLabel}>⭐ Звезды</Text>
                <Text style={styles.starsValue}>
                  {packProgress.totalStars} / {packProgress.maxStars}
                </Text>
              </View>
            </View>
          </View>

          {/* Levels Grid */}
          <View style={styles.levelsSection}>
            <Text style={styles.levelsTitle}>Уровни</Text>
            <View style={styles.levelsGrid}>
              {packProgress.levels.map((level: any) => (
                <LevelCard
                  key={level.id}
                  levelNumber={level.levelNumber}
                  stars={level.stars}
                  maxStars={3}
                  isLocked={!level.isUnlocked}
                  isCompleted={level.isCompleted}
                  mode={level.mode}
                  onPress={() => level.isUnlocked && handleLevelPress(level.id)}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backIcon: {
    fontSize: 24,
    color: colors.text.primary,
  },
  content: {
    padding: 20,
  },
  packInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  packIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  packTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  packDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  progressCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F0F0F0', // ИСПРАВЛЕНО: убрана несуществующая colors.background.secondary
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success.main,
    borderRadius: 4,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  starsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  starsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFC800', // ИСПРАВЛЕНО: прямое значение вместо colors.warning
  },
  levelsSection: {
    marginTop: 10,
  },
  levelsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  levelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.secondary,
  },
});
