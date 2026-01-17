// frontend/src/screens/game/GameScreen.tsx
import React, { useReducer, useEffect, useState } from 'react';
import { View, StyleSheet, BackHandler, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme';
import { GameHUD } from '@/components/game/GameHUD/GameHUD';
import { MeaningQuestion } from '@/components/game/QuestionCard/MeaningQuestion';
import { FormQuestion } from '@/components/game/QuestionCard/FormQuestion';
import { ContextQuestion } from '@/components/game/QuestionCard/ContextQuestion';
import { AnagramQuestion } from '@/components/game/QuestionCard/AnagramQuestion';
import { useLevel } from '@/hooks/useContentFetch';
import { gameReducer, initialGameState } from '@/lib/reducers/gameReducer';
import { useTimer } from '@/hooks/useTimer';
import type { RootStackParamList } from '@/navigation/types';

type GameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Game'>;
type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;

export const GameScreen: React.FC = () => {
  const navigation = useNavigation<GameScreenNavigationProp>();
  const route = useRoute<GameScreenRouteProp>();
  const { levelId } = route.params;
  
  const { data: levelData, isLoading, error: fetchError } = useLevel(levelId);
  
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [startTime] = useState(Date.now());
  const { timeLeft, startTimer, pauseTimer } = useTimer(levelData?.timeLimit || 0);
  
  // Анимация для вопросов
  const [questionAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (levelData?.lives) {
      dispatch({ type: 'SET_LIVES', payload: levelData.lives });
    }
  }, [levelData?.lives]);

  // Анимация появления вопроса
  useEffect(() => {
    questionAnim.setValue(0);
    Animated.spring(questionAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [state.currentQuestionIndex]);

  const calculateStars = (isWin: boolean): number => {
    if (!isWin) return 0;
    
    const totalQuestions = levelData?.questions?.length || 1;
    const accuracy = state.correctAnswers / totalQuestions;
    
    if (accuracy >= 0.9) return 3;
    if (accuracy >= 0.7) return 2;
    return 1;
  };

  const handleGameEnd = (isWin: boolean) => {
    pauseTimer();
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const stars = calculateStars(isWin);

    navigation.reset({
      index: 1,
      routes: [
        { name: 'Main' },
        {
          name: 'Result',
          params: {
            levelId,
            score: state.score,
            stars,
            correctAnswers: state.correctAnswers,
            wrongAnswers: state.wrongAnswers,
            duration,
            isWin,
          },
        },
      ],
    });
  };

  useEffect(() => {
    if (levelData?.timeLimit && levelData.timeLimit > 0) {
      startTimer();
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      pauseTimer();
      return true;
    });

    return () => {
      backHandler.remove();
      pauseTimer();
    };
  }, [levelData]);

  useEffect(() => {
    if (levelData?.timeLimit && levelData.timeLimit > 0 && timeLeft === 0) {
      handleGameEnd(false);
    }
  }, [timeLeft, levelData?.timeLimit]);

  useEffect(() => {
    if (state.lives === 0) {
      handleGameEnd(false);
    }
  }, [state.lives]);

  useEffect(() => {
    if (levelData?.questions && state.currentQuestionIndex >= levelData.questions.length) {
      handleGameEnd(true);
    }
  }, [state.currentQuestionIndex, levelData?.questions]);

  const handleAnswer = (isCorrect: boolean, lexemeId: string) => {
    dispatch({ type: 'ANSWER', payload: { lexemeId, isCorrect } });

    if (!isCorrect && levelData?.lives) {
      dispatch({ type: 'LOSE_LIFE' });
    }

    setTimeout(() => {
      dispatch({ type: 'NEXT_QUESTION' });
    }, 1500);
  };

  const renderQuestion = () => {
    if (!levelData?.questions || levelData.questions.length === 0) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>🤔</Text>
          <Text style={styles.errorText}>Нет доступных вопросов</Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={[...colors.gradient.blue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.errorButtonText}>Вернуться назад</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    const question = levelData.questions[state.currentQuestionIndex];
    if (!question) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>❓</Text>
          <Text style={styles.errorText}>Вопрос не найден</Text>
        </View>
      );
    }

    const commonProps = {
      onAnswer: (isCorrect: boolean) => handleAnswer(isCorrect, question.lexemeId),
      disabled: state.gameStatus !== 'playing',
    };

    const questionScale = questionAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.9, 1],
    });

    const questionOpacity = questionAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View 
        style={[
          styles.questionWrapper,
          {
            transform: [{ scale: questionScale }],
            opacity: questionOpacity,
          }
        ]}
      >
        {question.type === 'meaning' && (
          <MeaningQuestion
            prompt={question.prompt}
            options={question.options || []}
            correctAnswer={question.correctAnswer}
            {...commonProps}
          />
        )}
        
        {question.type === 'form' && (
          <FormQuestion
            prompt={question.prompt}
            options={question.options || []}
            correctAnswer={question.correctAnswer}
            {...commonProps}
          />
        )}
        
        {question.type === 'context' && (
          <ContextQuestion
            prompt={question.prompt}
            context={question.context || ''}
            correctAnswer={question.correctAnswer}
            {...commonProps}
          />
        )}
        
        {question.type === 'anagram' && (
          <AnagramQuestion
            prompt={question.prompt}
            correctAnswer={question.correctAnswer}
            {...commonProps}
          />
        )}
      </Animated.View>
    );
  };

  if (fetchError) {
    return (
      <LinearGradient
        colors={['#FFE5E5', '#FFFFFF']}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorEmoji}>😢</Text>
            <Text style={styles.errorTitle}>Ошибка загрузки</Text>
            <Text style={styles.errorText}>
              {fetchError instanceof Error ? fetchError.message : 'Не удалось загрузить уровень'}
            </Text>
            <TouchableOpacity 
              style={styles.errorButton}
              onPress={() => navigation.goBack()}
            >
              <LinearGradient
                colors={[...colors.gradient.orange]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.errorButtonText}>Попробовать снова</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (isLoading || !levelData) {
    return (
      <LinearGradient
        colors={['#E7F9FF', '#FFFFFF']}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loading}>
            <Text style={styles.loadingEmoji}>🎮</Text>
            <Text style={styles.loadingText}>Загрузка уровня...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#F0FFF4', '#FFFFFF']}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <GameHUD
          score={state.score}
          lives={state.lives}
          maxLives={levelData.lives || 3}
          timeLeft={timeLeft}
          totalTime={levelData.timeLimit || undefined}
          combo={state.combo}
          questionNumber={state.currentQuestionIndex + 1}
          totalQuestions={levelData.questions?.length || 0}
        />

        <View style={styles.questionContainer}>
          {renderQuestion()}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  questionContainer: {
    flex: 1,
    padding: 20,
  },
  questionWrapper: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 18,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  errorButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 18,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
