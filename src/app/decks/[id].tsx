import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import { Button, Loading, Muted, Screen } from '../../components/ui';
import { deleteWord, getDeck, listWords } from '../../db/repo';
import type { Deck, Word } from '../../db/schema';
import { speak } from '../../speech/tts';
import { colors, radius, spacing } from '../../theme';

export default function DeckScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deckId = Number(id);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [words, setWords] = useState<Word[] | null>(null);

  const reload = useCallback(async () => {
    const [d, w] = await Promise.all([getDeck(deckId), listWords(deckId)]);
    setDeck(d);
    setWords(w);
  }, [deckId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const confirmDelete = (word: Word) => {
    const doDelete = async () => {
      await deleteWord(word.id);
      reload();
    };
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`Удалить слово «${word.en}»?`)) doDelete();
    } else {
      Alert.alert('Удалить слово', `Удалить «${word.en}» и его прогресс?`, [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  if (!words) return <Loading />;

  return (
    <Screen>
      <Stack.Screen options={{ title: deck?.name ?? 'Слова' }} />
      {words.length === 0 ? (
        <Muted center>В этом наборе пока нет слов</Muted>
      ) : (
        <FlatList
          data={words}
          keyExtractor={(w) => String(w.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.en}>
                  {item.en} {item.ipa ? <Text style={styles.ipa}>[{item.ipa}]</Text> : null}
                </Text>
                <Muted>{item.ru}</Muted>
              </View>
              <Button label="🔊" variant="secondary" small onPress={() => speak(item.en)} />
              {item.is_custom === 1 && (
                <Button label="🗑" variant="secondary" small onPress={() => confirmDelete(item)} />
              )}
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  en: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  ipa: {
    color: colors.muted,
    fontWeight: '400',
    fontSize: 14,
  },
});
