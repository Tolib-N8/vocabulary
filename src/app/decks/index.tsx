import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Loading, Muted, Screen } from '../../components/ui';
import { listDecks, type DeckWithCount } from '../../db/repo';
import { colors, radius, spacing } from '../../theme';

export default function DecksScreen() {
  const router = useRouter();
  const [decks, setDecks] = useState<DeckWithCount[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listDecks().then((d) => {
        if (!cancelled) setDecks(d);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  if (!decks) return <Loading />;

  return (
    <Screen>
      <FlatList
        data={decks}
        keyExtractor={(d) => String(d.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/decks/[id]', params: { id: item.id } })}
            style={({ pressed }) => [styles.deck, pressed && { opacity: 0.7 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.deckName}>
                {item.is_builtin ? '📗' : '⭐'} {item.name}
              </Text>
              <Muted>
                {item.word_count} слов{item.level ? ` · уровень ${item.level}` : ''}
              </Muted>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
      <Button label="＋ Добавить своё слово" onPress={() => router.push('/decks/add')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  deck: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  deckName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  chevron: {
    color: colors.muted,
    fontSize: 24,
  },
});
