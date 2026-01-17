/**
 * Звуковые эффекты игры
 * 
 * Файлы звуков должны находиться в папке assets/sounds/:
 * - correct.mp3 (правильный ответ)
 * - wrong.mp3 (неправильный ответ)
 * - victory.mp3 (победа)
 * - defeat.mp3 (поражение)
 */

import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as Haptics from 'expo-haptics';

// Звуковые объекты
let ok: Audio.Sound | null = null;
let fail: Audio.Sound | null = null;
let victory: Audio.Sound | null = null;
let defeat: Audio.Sound | null = null;
let loaded = false;

/**
 * Инициализация звуковой системы
 * Загружает все звуковые файлы
 */
export async function sfxInit() {
  if (loaded) return;

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    const okAsset = require('../assets/sounds/correct.mp3');
    const failAsset = require('../assets/sounds/wrong.mp3');
    const victoryAsset = require('../assets/sounds/victory.mp3');
    const defeatAsset = require('../assets/sounds/defeat.mp3');

    const [s1, s2, s3, s4] = await Promise.all([
      Audio.Sound.createAsync(okAsset, { volume: 0.5, shouldPlay: false }),
      Audio.Sound.createAsync(failAsset, { volume: 0.5, shouldPlay: false }),
      Audio.Sound.createAsync(victoryAsset, { volume: 0.7, shouldPlay: false }),
      Audio.Sound.createAsync(defeatAsset, { volume: 0.6, shouldPlay: false }),
    ]);

    ok = s1.sound;
    fail = s2.sound;
    victory = s3.sound;
    defeat = s4.sound;
    
    loaded = true;
  } catch (e) {
    console.log('Ошибка загрузки звуков:', e);
    loaded = true;
  }
}

/**
 * Воспроизводит звук правильного ответа
 * @param haptic - включить вибрацию
 */
export async function sfxOk(haptic = true) {
  if (haptic) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  try {
    await ok?.replayAsync();
  } catch (e) {
    // Игнорируем ошибку
  }
}

/**
 * Воспроизводит звук неправильного ответа
 * @param haptic - включить вибрацию
 */
export async function sfxFail(haptic = true) {
  if (haptic) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
  try {
    await fail?.replayAsync();
  } catch (e) {
    // Игнорируем ошибку
  }
}

/**
 * Воспроизводит звук победы (идеальный результат)
 * @param haptic - включить вибрацию
 */
export async function sfxVictory(haptic = true) {
  if (haptic) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
  try {
    await victory?.replayAsync();
  } catch (e) {
    console.log('Ошибка воспроизведения звука победы:', e);
  }
}

/**
 * Воспроизводит звук поражения (game over)
 * @param haptic - включить вибрацию
 */
export async function sfxDefeat(haptic = true) {
  if (haptic) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
  try {
    await defeat?.replayAsync();
  } catch (e) {
    console.log('Ошибка воспроизведения звука поражения:', e);
  }
}

/**
 * Освобождает ресурсы звуков
 */
export async function sfxDispose() {
  try {
    await ok?.unloadAsync();
  } catch (e) {
    // Игнорируем
  }
  try {
    await fail?.unloadAsync();
  } catch (e) {
    // Игнорируем
  }
  try {
    await victory?.unloadAsync();
  } catch (e) {
    // Игнорируем
  }
  try {
    await defeat?.unloadAsync();
  } catch (e) {
    // Игнорируем
  }
  
  ok = null;
  fail = null;
  victory = null;
  defeat = null;
  loaded = false;
}
