import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NewBadge, SessionShell } from '../../components/session-shell';
import { Button, Card, Muted } from '../../components/ui';
import { Rating } from '../../srs/engine';
import { useSession } from '../../srs/use-session';
import { speak } from '../../speech/tts';
import { colors, spacing } from '../../theme';

export default function FlashcardsScreen() {
  const session = useSession('flashcard');
  const [flipped, setFlipped] = useState(false);
  // alternate direction: EN→RU on even cards, RU→EN on odd
  const [counter, setCounter] = useState(0);
  const enFirst = counter % 2 === 0 || session.isNew;

  const word = session.word;

  useEffect(() => {
    setFlipped(false);
  }, [word?.id, counter]);

  const grade = async (rating: Rating) => {
    setCounter((c) => c + 1);
    await session.grade(rating);
  };

  return (
    <SessionShell session={session}>
      {word && (
        <View style={styles.container}>
          <NewBadge visible={session.isNew} />
          <Pressable onPress={() => setFlipped(true)} style={{ flex: 1 }}>
            <Card style={styles.card}>
              <Text style={styles.front}>{enFirst ? word.en : word.ru}</Text>
              {enFirst && word.ipa && <Muted>[{word.ipa}]</Muted>}
              {flipped ? (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.back}>{enFirst ? word.ru : word.en}</Text>
                  {!enFirst && word.ipa && <Muted>[{word.ipa}]</Muted>}
                  {word.example && <Text style={styles.example}>{word.example}</Text>}
                </>
              ) : (
                <Muted center>нажми, чтобы увидеть ответ</Muted>
              )}
              <Button label="🔊 Озвучить" variant="secondary" small onPress={() => speak(word.en)} style={styles.speakBtn} />
            </Card>
          </Pressable>

          {flipped ? (
            <View style={styles.gradeRow}>
              <Button label="Снова" variant="danger" onPress={() => grade(Rating.Again)} style={styles.gradeBtn} />
              <Button label="Трудно" variant="warning" onPress={() => grade(Rating.Hard)} style={styles.gradeBtn} />
              <Button label="Хорошо" variant="primary" onPress={() => grade(Rating.Good)} style={styles.gradeBtn} />
              <Button label="Легко" variant="success" onPress={() => grade(Rating.Easy)} style={styles.gradeBtn} />
            </View>
          ) : (
            <Button label="Показать ответ" onPress={() => setFlipped(true)} />
          )}
        </View>
      )}
    </SessionShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.md,
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  front: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'center',
  },
  back: {
    color: colors.accent,
    fontSize: 26,
    fontWeight: '600',
    textAlign: 'center',
  },
  example: {
    color: colors.muted,
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: spacing.sm,
  },
  speakBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  gradeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gradeBtn: {
    flex: 1,
  },
});
