import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Словарь' }} />
        <Stack.Screen name="decks/index" options={{ title: 'Наборы слов' }} />
        <Stack.Screen name="decks/[id]" options={{ title: 'Слова' }} />
        <Stack.Screen name="decks/add" options={{ title: 'Новое слово' }} />
        <Stack.Screen name="session/flashcards" options={{ title: 'Карточки' }} />
        <Stack.Screen name="session/spelling" options={{ title: 'Правописание' }} />
        <Stack.Screen name="session/shadowing" options={{ title: 'Shadowing' }} />
        <Stack.Screen name="settings" options={{ title: 'Настройки' }} />
      </Stack>
    </>
  );
}
