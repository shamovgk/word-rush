// frontend/src/screens/game/ResultScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme';
import { progressApi } from '@/lib/api/services/progress.service';
import type { RootStackParamList } from '@/navigation/types';
import { useQueryClient } from '@tanstack/react-query';

type ResultScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Result'>;
type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;

export const ResultScreen: React.FC = () => {
  const navigation = useNavigation<ResultScreenNavigationProp>();
  const route = useRoute<ResultScreenRouteProp>();
  const { levelId, score, stars, correctAnswers, wrongAnswers, duration, isWin } = route.params;

  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Отправляем результат на сервер
    submitResult();
    
    // Анимация появления
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const queryClient = useQueryClient();

const submitResult = async () => {
  try {
    await progressApi.submitResult({
      levelId,
      score,
      stars,
      correctAnswers,
      wrongAnswers,
      duration,
    });
    
    // Инвалидируем кеш чтобы обновить прогресс
    queryClient.invalidateQueries({ queryKey: ['packProgress'] });
    
    console.log('✅ Result submitted successfully');
  } catch (error) {
    console.error('❌ Failed to submit result:', error);
  }
};

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3].map((star) => (
          <Animated.Text
            key={star}
            style={[
              styles.star,
              {
                opacity: star <= stars ? 1 : 0.3,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            ⭐
          </Animated.Text>
        ))}
      </View>
    );
  };

  const handleContinue = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const handleRetry = () => {
    navigation.replace('LevelStart', { levelId });
  };

  return (
    <LinearGradient
      colors={isWin ? ['#E7FFF0', '#FFFFFF'] : ['#FFE5E5', '#FFFFFF']}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <Text style={styles.emoji}>{isWin ? '🎉' : '😢'}</Text>
          <Text style={styles.title}>
            {isWin ? 'Отличная работа!' : 'Попробуй еще раз!'}
          </Text>
          <Text style={styles.subtitle}>
            {isWin 
              ? 'Ты успешно прошел уровень!' 
              : 'Не расстраивайся, с каждым разом будет легче!'}
          </Text>

          {isWin && renderStars()}

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={[...colors.gradient.purple]}
                style={styles.statGradient}
              >
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>Очки</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={[...colors.gradient.green]}
                style={styles.statGradient}
              >
                <Text style={styles.statValue}>{correctAnswers}</Text>
                <Text style={styles.statLabel}>Правильно</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={[...colors.gradient.orange]}
                style={styles.statGradient}
              >
                <Text style={styles.statValue}>{wrongAnswers}</Text>
                <Text style={styles.statLabel}>Ошибок</Text>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.timeContainer}>
            <Text style={styles.timeIcon}>⏱️</Text>
            <Text style={styles.timeText}>
              Время: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
            </Text>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleContinue}
            >
              <LinearGradient
                colors={isWin ? [...colors.gradient.green] : [...colors.gradient.blue]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.primaryButtonText}>
                  {isWin ? 'Продолжить 🚀' : 'Попробовать снова 🔄'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleRetry}
            >
              <Text style={styles.secondaryButtonText}>
                {isWin ? 'Пройти снова 🔄' : 'На главную 🏠'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emoji: {
    fontSize: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 10,
  },
  star: {
    fontSize: 60,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: colors.border || '#E5E5E5',
  },
  timeIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  buttonsContainer: {
    width: '100%',
    gap: 15,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border || '#E5E5E5',
  },
  secondaryButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
});
