/**
 * Экран управления аккаунтами
 */

import { useAuth } from '@/contexts/AuthContext';
import { Stack, useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountsScreen() {
  const router = useRouter();
  const { allUsers, currentUser, switchUser, deleteUser, logout } = useAuth();

  const handleSwitchAccount = async (userId: string) => {
    if (userId === currentUser?.id) return;

    try {
      await switchUser(userId);
      router.replace('/');
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось переключиться на аккаунт');
    }
  };

  const handleDeleteAccount = (userId: string, username: string) => {
    Alert.alert(
      'Удалить аккаунт?',
      `Будут удалены все данные пользователя @${username}. Это действие необратимо.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(userId);
              if (userId === currentUser?.id) {
                router.replace('/auth/login');
              }
            } catch (e) {
              Alert.alert('Ошибка', 'Не удалось удалить аккаунт');
            }
          },
        },
      ]
    );
  };

  const handleAddAccount = () => {
    router.push('/auth/login');
  };

  const handleLogout = async () => {
    Alert.alert('Выйти из аккаунта?', 'Вы вернетесь на экран входа', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Аккаунты',
          headerStyle: { backgroundColor: '#2196F3' },
          headerTintColor: '#fff',
          headerBackTitle: 'Назад',
        }}
      />

      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['bottom']}>
        <View style={{ flex: 1 }}>
          <View style={{ padding: 16, backgroundColor: '#E3F2FD' }}>
            <Text style={{ fontSize: 14, color: '#1976D2' }}>
              На этом устройстве: {allUsers.length} аккаунт(ов)
            </Text>
          </View>

          <FlatList
            data={allUsers.sort((a, b) => b.lastLoginAt - a.lastLoginAt)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item }) => (
              <View
                style={{
                  borderRadius: 12,
                  backgroundColor: item.id === currentUser?.id ? '#E3F2FD' : '#F5F5F5',
                  borderWidth: 2,
                  borderColor: item.id === currentUser?.id ? '#2196F3' : 'transparent',
                  overflow: 'hidden',
                }}
              >
                <Pressable
                  onPress={() => handleSwitchAccount(item.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 16,
                  }}
                >
                  <Text style={{ fontSize: 40 }}>{item.avatar}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600' }}>
                      {item.displayName}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#757575', marginTop: 2 }}>
                      @{item.username}
                    </Text>
                    {item.id === currentUser?.id && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: '#2196F3',
                          fontWeight: '600',
                          marginTop: 4,
                        }}
                      >
                        ✓ Активный аккаунт
                      </Text>
                    )}
                  </View>

                  {item.id !== currentUser?.id && (
                    <Text style={{ fontSize: 18, color: '#2196F3' }}>→</Text>
                  )}
                </Pressable>

                <View
                  style={{
                    flexDirection: 'row',
                    borderTopWidth: 1,
                    borderTopColor: '#E0E0E0',
                  }}
                >
                  <Pressable
                    onPress={() => handleDeleteAccount(item.id, item.username)}
                    style={{
                      flex: 1,
                      padding: 12,
                      alignItems: 'center',
                      backgroundColor: '#FFEBEE',
                    }}
                  >
                    <Text style={{ fontSize: 14, color: '#F44336', fontWeight: '600' }}>
                      Удалить
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
            ListFooterComponent={
              <View style={{ gap: 12, marginTop: 12 }}>
                <Pressable
                  onPress={handleAddAccount}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: '#2196F3',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                    + Добавить аккаунт
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleLogout}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#F44336',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#F44336' }}>
                    Выйти из текущего аккаунта
                  </Text>
                </Pressable>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    </>
  );
}
