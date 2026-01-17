import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme';

interface LevelCardProps {
  levelNumber: number;
  stars: number;
  maxStars: number;
  isLocked: boolean;
  isCompleted: boolean;
  mode: 'lives' | 'timed';
  onPress: () => void;
}

export const LevelCard: React.FC<LevelCardProps> = ({
  levelNumber,
  stars,
  maxStars,
  isLocked,
  isCompleted,
  mode,
  onPress,
}) => {
  const getGradientColors = (): readonly [string, string, ...string[]] => {
    if (isLocked) return ['#E0E0E0', '#BDBDBD'];
    if (isCompleted) return [...colors.gradient.green];
    return [...colors.gradient.blue];
  };

  const getModeIcon = () => {
    if (isLocked) return '🔒';
    return mode === 'timed' ? '⏱️' : '❤️';
  };

  return (
    <TouchableOpacity
      disabled={isLocked}
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.container}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Номер уровня */}
          <View style={styles.header}>
            <Text style={styles.levelNumber}>{levelNumber}</Text>
            <Text style={styles.modeIcon}>{getModeIcon()}</Text>
          </View>

          {/* Звезды */}
          {!isLocked && (
            <View style={styles.starsContainer}>
              {[...Array(maxStars)].map((_, index) => (
                <Text key={index} style={styles.star}>
                  {index < stars ? '⭐' : '☆'}
                </Text>
              ))}
            </View>
          )}

          {/* Статус */}
          <Text style={styles.status}>
            {isLocked ? 'Заблокировано' : isCompleted ? 'Завершено' : 'Начать'}
          </Text>
        </View>

        {/* Pulse анимация для активного уровня */}
        {!isLocked && !isCompleted && (
          <View style={styles.pulseOuter}>
            <View style={styles.pulseInner} />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 140,
    height: 160,
    marginBottom: 20,
    marginHorizontal: 10,
  },
  gradient: {
    flex: 1,
    borderRadius: 20,
    padding: 2,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  levelNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  modeIcon: {
    fontSize: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  star: {
    fontSize: 24,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  pulseOuter: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success.main,
  },
  pulseInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success.main,
    opacity: 0.6,
  },
});
