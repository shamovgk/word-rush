/**
 * Контекст авторизации
 * Управление пользователями и текущим аккаунтом
 */

import { clearCurrentUserId, setCurrentUserId } from '@/lib/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string; // эмодзи
  createdAt: number;
  lastLoginAt: number;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  isLoading: boolean;
  login: (username: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'auth:currentUserId',
  ALL_USERS: 'auth:allUsers',
};

// Список доступных аватаров (эмодзи)
export const AVATARS = [
  '😀', '😎', '🤓', '😇', '🥳', '🤩', '🥰', '😺',
  '🐶', '🐱', '🦊', '🐼', '🐨', '🦁', '🐯', '🦄',
  '🚀', '⭐', '🎮', '🎯', '🏆', '💎', '🔥', '⚡',
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Загружаем данные при старте
  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const [currentUserIdStr, allUsersStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID),
        AsyncStorage.getItem(STORAGE_KEYS.ALL_USERS),
      ]);

      const users: UserProfile[] = allUsersStr ? JSON.parse(allUsersStr) : [];
      setAllUsers(users);

      if (currentUserIdStr && users.length > 0) {
        const user = users.find((u) => u.id === currentUserIdStr);
        if (user) {
          setCurrentUser(user);
          setCurrentUserId(user.id);
        }
      }
    } catch (e) {
      console.log('Ошибка загрузки auth данных:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Вход / регистрация
  const login = async (username: string, displayName: string) => {
    try {
      const trimmedUsername = username.trim().toLowerCase();
      
      // Проверяем, существует ли пользователь
      let user = allUsers.find((u) => u.username === trimmedUsername);

      if (!user) {
        // Создаем нового пользователя
        user = {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          username: trimmedUsername,
          displayName: displayName.trim() || trimmedUsername,
          avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        };

        const updatedUsers = [...allUsers, user];
        await AsyncStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(updatedUsers));
        setAllUsers(updatedUsers);
      } else {
        // Обновляем время последнего входа
        user.lastLoginAt = Date.now();
        const updatedUsers = allUsers.map((u) => (u.id === user!.id ? user! : u));
        await AsyncStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(updatedUsers));
        setAllUsers(updatedUsers);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
      setCurrentUser(user);
      setCurrentUserId(user.id);
      
    } catch (e) {
      console.log('Ошибка входа:', e);
      throw e;
    }
  };

  // Выход из аккаунта
  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      setCurrentUser(null);
      clearCurrentUserId();
    } catch (e) {
      console.log('Ошибка выхода:', e);
    }
  };

  // Переключение на другой аккаунт
  const switchUser = async (userId: string) => {
    try {
      const user = allUsers.find((u) => u.id === userId);
      if (!user) {
        throw new Error('Пользователь не найден');
      }

      // Обновляем время последнего входа
      user.lastLoginAt = Date.now();
      const updatedUsers = allUsers.map((u) => (u.id === userId ? user : u));
      await AsyncStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(updatedUsers));
      setAllUsers(updatedUsers);

      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
      setCurrentUser(user);
      setCurrentUserId(userId);
    } catch (e) {
      console.log('Ошибка переключения аккаунта:', e);
      throw e;
    }
  };

  // Удаление аккаунта
  const deleteUser = async (userId: string) => {
    try {
      const updatedUsers = allUsers.filter((u) => u.id !== userId);
      await AsyncStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(updatedUsers));
      setAllUsers(updatedUsers);

      // Если удаляем текущего пользователя, выходим
      if (currentUser?.id === userId) {
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
        setCurrentUser(null);
        clearCurrentUserId();
      }

      // Удаляем данные прогресса пользователя
      const progressKey = `progress:${userId}`;
      await AsyncStorage.removeItem(progressKey);
    } catch (e) {
      console.log('Ошибка удаления пользователя:', e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isLoading,
        login,
        logout,
        switchUser,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
