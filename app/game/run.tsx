/**
 * Экран игровой сессии (С РЕЖИМАМИ ИГРЫ)
 */

import { Container } from '@/components/ui';
import { getPackById } from '@/lib/content';
import { buildSessionPlan } from '@/lib/game/engine';
import type { HighlightState, LevelConfig, RunSummary } from '@/lib/types';
import { BONUS_PER_SEC, FREEZE_TIME, STARS_BY_LIVES, STARS_THRESHOLDS } from '@/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { AppState, BackHandler, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AnagramInput,
  AnswerOptions,
  ContextSelector,
  GameHud,
  PauseModal,
  QuestionCard,
} from '@/components/game';

import { useGameState } from '@/hooks/useGameState';
import { useGameTimer } from '@/hooks/useGameTimer';
import { useSoundEffects } from '@/hooks/useSoundEffects';

export default function RunScreen() {
  const { packId, levelId, level, seed, mode, repeat, distractorMode } = useLocalSearchParams<{
    packId: string;
    levelId: string;
    level: string;
    seed?: string;
    mode?: 'normal' | 'review';
    repeat?: string;
    distractorMode?: 'easy' | 'normal' | 'hard';
  }>();

  const router = useRouter();

  const levelConfig: LevelConfig = useMemo(() => {
    try {
      return JSON.parse(decodeURIComponent(level ?? '')) as LevelConfig;
    } catch {
      return { lanes: 2, allowedTypes: ['meaning'], lives: 3 };
    }
  }, [level]);

  const pack = getPackById(packId!)!;
  const sessionSeed = seed ?? `${pack.id}-${levelId}-default`;
  const isReviewMode = mode === 'review';

  const repeatSet: string[] | null = useMemo(() => {
    if (!repeat) return null;
    try {
      return JSON.parse(decodeURIComponent(repeat)) as string[];
    } catch {
      return null;
    }
  }, [repeat]);

  const effectiveLevel: LevelConfig = useMemo(() => {
    if (isReviewMode && repeatSet && repeatSet.length > 0) {
      const suggested = Math.min(60, Math.max(15, repeatSet.length * 5));
      return { ...levelConfig, durationSec: suggested };
    }
    return levelConfig;
  }, [isReviewMode, repeatSet, levelConfig]);

  const plan = useMemo(
    () =>
      buildSessionPlan({
        pack,
        level: effectiveLevel,
        seed: sessionSeed,
        restrictLexemes: isReviewMode && repeatSet && repeatSet.length > 0 ? repeatSet : undefined,
        distractorMode: distractorMode ?? 'normal',
      }),
    [pack, effectiveLevel, sessionSeed, isReviewMode, repeatSet, distractorMode]
  );

  // Определяем режим игры
  const gameMode = useMemo(() => {
    const packLevel = pack.levels.find(l => l.id === levelId);
    return packLevel?.gameMode ?? 'lives';
  }, [pack.levels, levelId]);

  const gameState = useGameState(effectiveLevel.lives ?? 3);
  const { playCorrectSound, playIncorrectSound, playVictorySound, playDefeatSound } = useSoundEffects();

  const [isPaused, setPaused] = useState(false);
  const [highlight, setHighlight] = useState<HighlightState | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [usedLetterIndices, setUsedLetterIndices] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [freezeTimeLeft, setFreezeTimeLeft] = useState(0);

  // Таймер только для режима "время"
  const timerDuration = gameMode === 'time' && effectiveLevel.durationSec ? effectiveLevel.durationSec : 9999;
  const { timeLeft } = useGameTimer(timerDuration, isPaused || isFrozen, () => {
    if (!isGameOver && gameMode === 'time') {
      finishSession(0);
    }
  });

  const slot = useMemo(
    () => plan.slots[Math.min(gameState.slotIdx, plan.slots.length - 1)],
    [plan.slots, gameState.slotIdx]
  );

  useEffect(() => {
    setHighlight(null);
    setUserAnswer('');
    setUsedLetterIndices(new Set());
  }, [gameState.slotIdx]);

  // Таймер заморозки
  useEffect(() => {
    if (!isFrozen || freezeTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setFreezeTimeLeft(prev => {
        if (prev <= 1) {
          setIsFrozen(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFrozen, freezeTimeLeft]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if ((s === 'background' || s === 'inactive') && gameState.sessionActiveRef.current && !isGameOver) {
        setPaused(true);
      }
    });
    return () => sub.remove();
  }, [gameState.sessionActiveRef, isGameOver]);

  useEffect(() => {
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!gameState.sessionActiveRef.current || isGameOver) return false;
      setPaused(true);
      return true;
    });
    
    return () => backSub.remove();
  }, [gameState.sessionActiveRef, isGameOver]);

  const finishSession = (extraScore = 0) => {
    if (!gameState.sessionActiveRef.current) return;
    
    gameState.sessionActiveRef.current = false;
    setIsGameOver(true);

    const finalScore = gameState.scoreRef.current.score + extraScore;
    
    const totalSlots = plan.slots.length;
    const uniqueCorrectLexemes = new Set(
      gameState.answersRef.current
        .filter(a => a.isCorrect)
        .map(a => a.lexemeId)
    );
    const uniqueCorrect = uniqueCorrectLexemes.size;
    const accuracy = totalSlots > 0 ? uniqueCorrect / totalSlots : 0;

    let stars = 0;
    if (gameMode === 'lives') {
      stars = STARS_BY_LIVES[gameState.livesRef.current as keyof typeof STARS_BY_LIVES] ?? 0;
      console.log(`⭐ Режим "на жизни": ${gameState.livesRef.current} жизней → ${stars} звезд`);
    } else {
      stars = accuracy >= STARS_THRESHOLDS.THREE ? 3 :
              accuracy >= STARS_THRESHOLDS.TWO ? 2 :
              accuracy >= STARS_THRESHOLDS.ONE ? 1 : 0;
      console.log(`⭐ Режим "на время": ${Math.round(accuracy * 100)}% точность → ${stars} звезд`);
    }

    if (stars === 3) {
    // 🎉 Идеальный результат (3 звезды)
    playVictorySound();
  } else if (stars === 0) {
    // 💔 Поражение (0 звёзд)
    playDefeatSound();
  }

    console.log('📊 Финальная статистика:', {
      gameMode,
      totalSlots,
      uniqueCorrect,
      accuracy: `${Math.round(accuracy * 100)}%`,
      stars,
      livesLeft: gameState.livesRef.current,
      score: finalScore,
      comboMax: gameState.scoreRef.current.comboMax,
    });

    const durationPlayed = gameMode === 'time' && effectiveLevel.durationSec 
      ? effectiveLevel.durationSec - Math.max(0, timeLeft)
      : 0;

    const summary: RunSummary = {
      packId: pack.id,
      levelId: levelId!,
      score: finalScore,
      accuracy,
      stars,
      errors: Array.from(new Set(gameState.scoreRef.current.errors.map((e) => ({ lexemeId: e })))),
      durationPlayedSec: durationPlayed,
      seed: sessionSeed,
      level: effectiveLevel,
      answers: gameState.answersRef.current,
      timeBonus: extraScore > 0 ? extraScore : 0,
      comboMax: gameState.scoreRef.current.comboMax,
      distractorMode: distractorMode ?? 'normal',
      gameMode,
    };

    setTimeout(() => {
      router.replace({ 
        pathname: '/result', 
        params: { summary: encodeURIComponent(JSON.stringify(summary)) } 
      });
    }, 100);
  };

  const handleAnswerPick = async (laneIndex: number) => {
    if (isProcessing || isGameOver || isFrozen) return;
    if (!gameState.sessionActiveRef.current) return;
    if (gameState.slotIdxRef.current >= plan.slots.length) return;

    const currentSlot = plan.slots[gameState.slotIdxRef.current];
    const opt = currentSlot?.options?.[laneIndex];
    if (!currentSlot || !opt) return;

    setIsProcessing(true);

    const isCorrect = !!opt.isCorrect;

    if (isCorrect) {
      await playCorrectSound();
    } else {
      await playIncorrectSound();
      
      if (gameMode === 'time') {
        const freezeDuration = FREEZE_TIME[distractorMode as keyof typeof FREEZE_TIME] ?? FREEZE_TIME.normal;
        setIsFrozen(true);
        setFreezeTimeLeft(freezeDuration);
        console.log(`🧊 Заморожено на ${freezeDuration} сек`);
      }
    }

    gameState.recordAnswer(currentSlot.lexemeId, isCorrect);
    setHighlight({ index: laneIndex, correct: isCorrect });

    if (gameMode === 'lives' && !isCorrect && gameState.livesRef.current <= 0) {
      console.log('💀 GAME OVER - жизни закончились');
      setTimeout(() => {
        finishSession(0);
      }, 500);
      return;
    }

    setTimeout(() => {
      setHighlight(null);
      
      const isLastSlot = gameState.slotIdxRef.current >= plan.slots.length - 1;
      
      gameState.nextSlot();

      if (isLastSlot) {
        console.log('🎉 Все слоты пройдены!');
        const bonus = gameMode === 'time' ? Math.floor(timeLeft * BONUS_PER_SEC) : 0;
        finishSession(bonus);
      } else {
        setIsProcessing(false);
      }
    }, 300);
  };

  const handleSubmitAnswer = async () => {
    if (isProcessing || isGameOver || isFrozen) return;
    if (!gameState.sessionActiveRef.current) return;
    if (gameState.slotIdxRef.current >= plan.slots.length) return;

    const currentSlot = plan.slots[gameState.slotIdxRef.current];
    if (!currentSlot || !currentSlot.correctAnswer) return;

    setIsProcessing(true);

    const isCorrect = userAnswer.toLowerCase().trim() === currentSlot.correctAnswer.toLowerCase();

    if (isCorrect) {
      await playCorrectSound();
    } else {
      await playIncorrectSound();
      
      if (gameMode === 'time') {
        const freezeDuration = FREEZE_TIME[distractorMode as keyof typeof FREEZE_TIME] ?? FREEZE_TIME.normal;
        setIsFrozen(true);
        setFreezeTimeLeft(freezeDuration);
      }
    }

    gameState.recordAnswer(currentSlot.lexemeId, isCorrect);

    if (gameMode === 'lives' && !isCorrect && gameState.livesRef.current <= 0) {
      console.log('💀 GAME OVER - жизни закончились');
      setTimeout(() => {
        finishSession(0);
      }, 500);
      return;
    }

    setTimeout(() => {
      const isLastSlot = gameState.slotIdxRef.current >= plan.slots.length - 1;
      
      gameState.nextSlot();
      setUserAnswer('');
      setUsedLetterIndices(new Set());

      if (isLastSlot) {
        console.log('🎉 Все слоты пройдены!');
        const bonus = gameMode === 'time' ? Math.floor(timeLeft * BONUS_PER_SEC) : 0;
        finishSession(bonus);
      } else {
        setIsProcessing(false);
      }
    }, 300);
  };

  const handleLetterPress = (letter: string, index: number) => {
    if (isGameOver || isFrozen) return;
    setUserAnswer(prev => prev + letter);
    setUsedLetterIndices(prev => new Set([...prev, index]));
  };

  const handleDeleteLetter = () => {
    if (isGameOver || isFrozen) return;
    if (userAnswer.length > 0) {
      setUserAnswer(prev => prev.slice(0, -1));
      const indices = Array.from(usedLetterIndices);
      if (indices.length > 0) {
        indices.pop();
        setUsedLetterIndices(new Set(indices));
      }
    }
  };

  const handleClearAnswer = () => {
    if (isGameOver || isFrozen) return;
    setUserAnswer('');
    setUsedLetterIndices(new Set());
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top', 'left', 'right']}>
      <Container variant="game" style={{ gap: 12 }}>
        <GameHud
          score={gameState.scoreState.score}
          lives={gameState.livesLeft}
          timeLeft={gameMode === 'time' ? timeLeft : null}
          onPause={() => !isGameOver && !isFrozen && setPaused(true)}
          gameMode={gameMode}
        />

        {/* Индикатор заморозки */}
        {isFrozen && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 100, 200, 0.9)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            }}
          >
            <Text style={{ fontSize: 72, marginBottom: 16 }}>❄️</Text>
            <Text style={{ fontSize: 48, color: '#fff', fontWeight: 'bold' }}>
              {freezeTimeLeft}
            </Text>
            <Text style={{ fontSize: 20, color: '#fff', marginTop: 16 }}>
              Заморожено!
            </Text>
          </View>
        )}

        {/* Прогресс-бар только для режима "время" */}
        {gameMode === 'time' && effectiveLevel.durationSec && (
          <View style={{ height: 8, backgroundColor: '#333', borderRadius: 4 }}>
            <View
              style={{
                height: '100%',
                width: `${((effectiveLevel.durationSec - timeLeft) / effectiveLevel.durationSec) * 100}%`,
                backgroundColor: '#27ae60',
                borderRadius: 4,
              }}
            />
          </View>
        )}

        <View style={{ padding: 8, borderRadius: 8, backgroundColor: '#222', alignSelf: 'center' }}>
          <Text style={{ fontSize: 14, color: '#fff' }}>
            {Math.min(gameState.slotIdx + 1, plan.slots.length)}/{plan.slots.length}
          </Text>
        </View>

        <QuestionCard
          type={slot?.type ?? 'meaning'}
          prompt={slot?.prompt ?? ''}
          hint={slot?.type === 'anagram' ? slot.context : undefined}
        />

        {(slot?.type === 'meaning' || slot?.type === 'form') && (
          <AnswerOptions
            options={slot?.options ?? []}
            highlight={highlight}
            onAnswer={handleAnswerPick}
          />
        )}

        {slot?.type === 'anagram' && slot.letters && (
          <AnagramInput
            letters={slot.letters}
            userAnswer={userAnswer}
            usedIndices={usedLetterIndices}
            onLetterPress={handleLetterPress}
            onDelete={handleDeleteLetter}
            onClear={handleClearAnswer}
            onSubmit={handleSubmitAnswer}
          />
        )}

        {slot?.type === 'context' && slot.words && (
          <ContextSelector
            words={slot.words}
            selectedWord={userAnswer}
            onWordSelect={setUserAnswer}
            onSubmit={handleSubmitAnswer}
          />
        )}

        <PauseModal
          visible={isPaused}
          onResume={() => setPaused(false)}
          onExit={() => {
            gameState.sessionActiveRef.current = false;
            router.back();
          }}
        />
      </Container>
    </SafeAreaView>
  );
}
