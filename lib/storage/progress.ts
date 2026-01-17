/**
 * Хранение прогресса с поддержкой множественных пользователей
 * Каждый пользователь имеет изолированные данные
 */

import {
  MASTERY_DECREASE_ON_ERROR,
  MASTERY_MAX,
  MASTERY_MULTIPLIERS,
  MAX_RECENT_MISTAKES,
  MAX_SESSIONS_HISTORY,
  MISTAKES_RETENTION_DAYS,
} from '@/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  LevelProgress,
  LexemeProgress,
  Pack,
  PackLevel,
  ProgressState,
  RunSummary,
} from '../types';

// ============ УПРАВЛЕНИЕ ТЕКУЩИМ ПОЛЬЗОВАТЕЛЕМ ============

let currentUserId: string | null = null;

/**
 * Устанавливает ID текущего пользователя
 * Должна вызываться после успешного логина
 */
export function setCurrentUserId(userId: string) {
  currentUserId = userId;
  console.log(`✅ Storage: установлен userId = ${userId}`);
}

/**
 * Очищает ID текущего пользователя
 * Должна вызываться при выходе
 */
export function clearCurrentUserId() {
  currentUserId = null;
  console.log('🔒 Storage: userId очищен');
}

/**
 * Получает ключ хранилища с префиксом пользователя
 */
function getUserKey(key: string): string | null {
  if (!currentUserId) {
    console.warn('⚠️ Storage: попытка доступа без userId');
    return null;
  }
  return `user:${currentUserId}:${key}`;
}

// ============ ФУНКЦИИ РАБОТЫ С ПРОГРЕССОМ ============

const PROGRESS_KEY = 'progress:v1';

/**
 * Загружает прогресс текущего пользователя
 */
export async function loadProgress(): Promise<ProgressState> {
  try {
    const key = getUserKey(PROGRESS_KEY);
    
    // Если нет userId, возвращаем пустой прогресс
    if (!key) {
      return { packs: {} };
    }
    
    const raw = await AsyncStorage.getItem(key);
    
    if (!raw) {
      return { packs: {} };
    }
    
    return JSON.parse(raw) as ProgressState;
  } catch (e) {
    console.error('Ошибка загрузки прогресса:', e);
    return { packs: {} };
  }
}

/**
 * Сохраняет прогресс текущего пользователя
 */
export async function saveProgress(state: ProgressState): Promise<void> {
  try {
    const key = getUserKey(PROGRESS_KEY);
    
    // Если нет userId, не сохраняем
    if (!key) {
      console.warn('⚠️ Storage: попытка сохранения без userId');
      return;
    }
    
    await AsyncStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.error('Ошибка сохранения прогресса:', e);
  }
}

/**
 * Сбрасывает прогресс текущего пользователя
 */
export async function resetProgress(): Promise<void> {
  try {
    const key = getUserKey(PROGRESS_KEY);
    
    if (!key) {
      console.warn('⚠️ Storage: попытка сброса без userId');
      return;
    }
    
    await AsyncStorage.removeItem(key);
    console.log('🗑️ Прогресс сброшен');
  } catch (e) {
    console.error('Ошибка сброса прогресса:', e);
  }
}

/**
 * Обновляет прогресс изучения слова
 */
export async function updateLexemeProgress(
  packId: string,
  lexemeId: string,
  wasCorrect: boolean,
  levelDifficulty: 'easy' | 'normal' | 'hard'
): Promise<void> {
  const state = await loadProgress();

  if (!state.packs[packId]) {
    state.packs[packId] = {};
  }

  const current: LexemeProgress = state.packs[packId][lexemeId] ?? {
    mastery: 0,
    recentMistakes: [],
  };

  const multiplier = MASTERY_MULTIPLIERS[levelDifficulty] ?? MASTERY_MULTIPLIERS.normal;
  let newMastery = current.mastery;

  if (wasCorrect) {
    newMastery = Math.min(MASTERY_MAX, current.mastery + multiplier);
  } else {
    newMastery = Math.max(0, current.mastery - MASTERY_DECREASE_ON_ERROR);
  }

  const newMistakes = wasCorrect
    ? current.recentMistakes
    : [...current.recentMistakes, new Date().toISOString()].slice(-MAX_RECENT_MISTAKES);

  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() - MISTAKES_RETENTION_DAYS);
  const retentionTimestamp = retentionDate.toISOString();

  const filteredMistakes = newMistakes.filter((d) => d >= retentionTimestamp);

  state.packs[packId][lexemeId] = {
    mastery: newMastery,
    recentMistakes: filteredMistakes,
  };

  await saveProgress(state);
}

/**
 * Обновляет прогресс уровня
 */
export async function updateLevelProgress(
  packId: string,
  levelId: string,
  score: number,
  accuracy: number,
  stars: number
): Promise<void> {
  const st = await loadProgress();

  if (!st.levelProgress) {
    st.levelProgress = {};
  }
  if (!st.levelProgress[packId]) {
    st.levelProgress[packId] = {};
  }

  const current: LevelProgress = st.levelProgress[packId][levelId] ?? {
    levelId,
    stars: 0,
    bestScore: 0,
    bestAccuracy: 0,
    completed: false,
    attempts: 0,
  };

  const updatedProgress: LevelProgress = {
    ...current,
    stars: Math.max(current.stars, stars) as 0 | 1 | 2 | 3,
    bestScore: Math.max(current.bestScore, score),
    bestAccuracy: Math.max(current.bestAccuracy, accuracy),
    completed: current.completed || stars > 0,
    attempts: current.attempts + 1,
    lastPlayedAt: new Date().toISOString(),
  };

  st.levelProgress[packId][levelId] = updatedProgress;
  await saveProgress(st);
}

/**
 * Получает прогресс уровня
 */
export async function getLevelProgress(
  packId: string,
  levelId: string
): Promise<LevelProgress> {
  const st = await loadProgress();
  return (
    st.levelProgress?.[packId]?.[levelId] ?? {
      levelId,
      stars: 0,
      bestScore: 0,
      bestAccuracy: 0,
      completed: false,
      attempts: 0,
    }
  );
}

/**
 * Проверяет, открыт ли уровень
 */
export function isLevelUnlocked(
  pack: Pack,
  level: PackLevel,
  progressMap: Record<string, LevelProgress>
): boolean {
  if (!level.unlockRequirement.previousLevel) {
    return true;
  }

  const prevProgress = progressMap[level.unlockRequirement.previousLevel];
  if (!prevProgress) {
    return false;
  }

  return prevProgress.stars >= level.unlockRequirement.minStars;
}

/**
 * Применяет результаты игровой сессии
 */
export async function applySessionSummary(
  pack: Pack,
  summary: RunSummary
): Promise<void> {
  const levelDifficulty = summary.distractorMode ?? 'normal';
  const errorSet = new Set(summary.errors.map((e) => e.lexemeId));

  if (summary.answers && summary.answers.length > 0) {
    const lexemeResults = new Map<string, boolean>();

    for (const answer of summary.answers) {
      const wasCorrect = !errorSet.has(answer.lexemeId);
      const existingResult = lexemeResults.get(answer.lexemeId);

      if (existingResult === undefined || (wasCorrect && !existingResult)) {
        lexemeResults.set(answer.lexemeId, wasCorrect);
      }
    }

    for (const [lexemeId, wasCorrect] of lexemeResults.entries()) {
      await updateLexemeProgress(pack.id, lexemeId, wasCorrect, levelDifficulty);
    }
  }

  const { stars } = summary;
  await updateLevelProgress(
    pack.id,
    summary.levelId,
    summary.score,
    summary.accuracy,
    summary.stars
  );

  const state = await loadProgress();
  if (!state.sessions) {
    state.sessions = [];
  }
  state.sessions.push({ ...summary, timestamp: new Date().toISOString() } as any);
  state.sessions = state.sessions.slice(-MAX_SESSIONS_HISTORY);
  await saveProgress(state);
}

/**
 * Получает сводку прогресса по паку
 */
export async function getPackProgressSummary(pack: Pack): Promise<{
  mastered: number;
  total: number;
  completedLevels: number;
  totalLevels: number;
}> {
  const state = await loadProgress();
  const packProgress = state.packs[pack.id] ?? {};

  let mastered = 0;
  for (const lex of pack.lexemes) {
    const p = packProgress[lex.id];
    if (p && p.mastery >= 4) {
      mastered++;
    }
  }

  let completedLevels = 0;
  const levelProgressMap = state.levelProgress?.[pack.id] ?? {};
  for (const level of pack.levels) {
    const lp = levelProgressMap[level.id];
    if (lp && lp.completed) {
      completedLevels++;
    }
  }

  return {
    mastered,
    total: pack.lexemes.length,
    completedLevels,
    totalLevels: pack.levels.length,
  };
}

/**
 * Получает список слов пака с прогрессом
 */
export async function getPackLexemesWithProgress(
  pack: Pack
): Promise<
  Array<{
    id: string;
    base: string;
    translation: string;
    mastery: number;
    recentMistakes: string[];
  }>
> {
  const state = await loadProgress();
  const packProgress = state.packs[pack.id] ?? {};

  return pack.lexemes.map((lex) => {
    const p = packProgress[lex.id] ?? { mastery: 0, recentMistakes: [] };
    return {
      id: lex.id,
      base: lex.base,
      translation: lex.translations[0] ?? '',
      mastery: p.mastery,
      recentMistakes: p.recentMistakes,
    };
  });
}
