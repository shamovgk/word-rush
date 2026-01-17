import { sfxDefeat, sfxDispose, sfxFail, sfxInit, sfxOk, sfxVictory } from '@/lib/sfx';
import { STORAGE_KEYS } from '@/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export function useSoundEffects() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // Загружаем настройки из хранилища
  useEffect(() => {
    (async () => {
      const sound = await AsyncStorage.getItem(STORAGE_KEYS.SOUND);
      const haptics = await AsyncStorage.getItem(STORAGE_KEYS.HAPTICS);

      if (sound !== null) setSoundEnabled(sound === 'true');
      if (haptics !== null) setHapticsEnabled(haptics === 'true');
    })();
  }, []);

  // Инициализируем звуки при монтировании
  useEffect(() => {
    (async () => {
      await sfxInit();
    })();
    
    return () => {
      sfxDispose();
    };
  }, []);

  const playCorrectSound = async () => {
    if (soundEnabled || hapticsEnabled) {
      await sfxOk(hapticsEnabled);
    }
  };

  const playIncorrectSound = async () => {
    if (soundEnabled || hapticsEnabled) {
      await sfxFail(hapticsEnabled);
    }
  };

  const playVictorySound = async () => {
    if (soundEnabled || hapticsEnabled) {
      await sfxVictory(hapticsEnabled);
    }
  };

  const playDefeatSound = async () => {
    if (soundEnabled || hapticsEnabled) {
      await sfxDefeat(hapticsEnabled);
    }
  };

  return {
    playCorrectSound,
    playIncorrectSound,
    playVictorySound,
    playDefeatSound,
  };
}
