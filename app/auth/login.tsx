import { useAuth } from '@/contexts/AuthContext';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Image, // ← ДОБАВЬТЕ
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const { login, allUsers, switchUser, currentUser } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Ошибка', 'Введите имя пользователя');
      return;
    }

    setIsLoading(true);
    try {
      await login(username, displayName);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Не удалось войти');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchUser = async (userId: string) => {
    try {
      await switchUser(userId);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Ошибка', 'Не удалось переключиться на аккаунт');
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={{ flex: 1, backgroundColor: '#2196F3' }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
              {/* Кнопка назад */}
              {currentUser && (
                <Pressable
                  onPress={() => router.back()}
                  style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    padding: 8,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    borderRadius: 8,
                    zIndex: 10,
                  }}
                >
                  <Text style={{ fontSize: 24, color: '#fff' }}>←</Text>
                </Pressable>
              )}

              {/* ========== ЛОГОТИП ========== */}
              <View style={{ alignItems: 'center', marginBottom: 48 }}>
                {/* Логотип */}
                <Image
                  source={require('@/assets/images/logo.png')}
                  style={{
                    width: 120,
                    height: 120,
                    marginBottom: 16,
                  }}
                  resizeMode="contain"
                />
                
                {/* Название */}
                <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#fff' }}>
                  Word Rush
                </Text>
                
                {/* Подзаголовок */}
                <Text style={{ fontSize: 16, color: '#E3F2FD', marginTop: 8 }}>
                  {currentUser ? 'Добавить новый аккаунт' : 'Изучай языки играя'}
                </Text>
              </View>

              {/* Остальной код формы без изменений */}
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: 20,
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
                  {currentUser ? 'Новый аккаунт' : 'Вход'}
                </Text>

                <View>
                  <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                    Имя пользователя *
                  </Text>
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="например: ivan123"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#E0E0E0',
                      fontSize: 16,
                      backgroundColor: '#FAFAFA',
                    }}
                  />
                </View>

                <View>
                  <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                    Отображаемое имя (необязательно)
                  </Text>
                  <TextInput
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="например: Иван"
                    autoCapitalize="words"
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#E0E0E0',
                      fontSize: 16,
                      backgroundColor: '#FAFAFA',
                    }}
                  />
                </View>

                <Pressable
                  onPress={handleLogin}
                  disabled={isLoading}
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    backgroundColor: isLoading ? '#BDBDBD' : '#2196F3',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                    {isLoading ? 'Вход...' : currentUser ? 'Создать аккаунт' : 'Войти'}
                  </Text>
                </Pressable>

                <Text style={{ fontSize: 12, color: '#9E9E9E', textAlign: 'center' }}>
                  {currentUser
                    ? 'Будет создан новый аккаунт с отдельным прогрессом'
                    : 'Если аккаунта нет, он будет создан автоматически'}
                </Text>
              </View>

              {/* Существующие аккаунты */}
              {allUsers.length > 0 && !currentUser && (
                <View
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    padding: 20,
                    gap: 12,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
                    Быстрый вход
                  </Text>

                  {allUsers
                    .sort((a, b) => b.lastLoginAt - a.lastLoginAt)
                    .slice(0, 5)
                    .map((user) => (
                      <Pressable
                        key={user.id}
                        onPress={() => handleSwitchUser(user.id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          padding: 12,
                          borderRadius: 8,
                          backgroundColor: '#F5F5F5',
                        }}
                      >
                        <Text style={{ fontSize: 32 }}>{user.avatar}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600' }}>
                            {user.displayName}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#757575' }}>
                            @{user.username}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 18, color: '#2196F3' }}>→</Text>
                      </Pressable>
                    ))}
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
