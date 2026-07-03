import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { NewBadge, SessionShell } from '../../components/session-shell';
import { Button, Card, Muted } from '../../components/ui';
import { Rating } from '../../srs/engine';
import { useSession } from '../../srs/use-session';
import { checkSpelling, type SpellingResult } from '../../speech/scoring';
import { speak } from '../../speech/tts';
import { colors, radius, spacing } from '../../theme';

const statusColor = {
  ok: colors.success,
  wrong: colors.error,
  missing: colors.warning,
  extra: colors.error,
} as const;

export default function SpellingScreen() {
  const session = useSession('spelling');
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<SpellingResult | null>(null);
  const word = session.word;

  useEffect(() => {
    setTyped('');
    setResult(null);
    if (word) speak(word.en);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word?.id]);

  const check = () => {
    if (!word || !typed.trim()) return;
    setResult(checkSpelling(word.en, typed));
  };

  const next = async (rating: Rating) => {
    await session.grade(rating);
  };

  return (
    <SessionShell session={session}>
      {word && (
        <View style={styles.container}>
          <NewBadge visible={session.isNew} />
          <Card style={styles.card}>
            <Text style={styles.translation}>{word.ru}</Text>
            {session.isNew && (
              <>
                <Text style={styles.answerPreview}>{word.en}</Text>
                {word.ipa && <Muted>[{word.ipa}]</Muted>}
              </>
            )}
            <Button label="🔊 Послушать ещё раз" variant="secondary" small onPress={() => speak(word.en)} />
          </Card>

          {result === null ? (
            <>
              <TextInput
                style={styles.input}
                value={typed}
                onChangeText={setTyped}
                placeholder="Напечатай слово по-английски"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                onSubmitEditing={check}
              />
              <Button label="Проверить" onPress={check} disabled={!typed.trim()} />
            </>
          ) : (
            <>
              <Card style={styles.resultCard}>
                <Text style={styles.resultTitle}>
                  {result.correct ? '✅ Верно!' : '❌ Есть ошибки'}
                </Text>
                <View style={styles.diffRow}>
                  {result.diff.map((d, i) => (
                    <Text key={i} style={[styles.diffChar, { color: statusColor[d.status] }]}>
                      {d.status === 'missing' ? `[${d.ch}]` : d.ch}
                    </Text>
                  ))}
                </View>
                {!result.correct && (
                  <Text style={styles.correctAnswer}>Правильно: {word.en}</Text>
                )}
              </Card>
              {result.correct ? (
                <View style={styles.gradeRow}>
                  <Button label="Хорошо" variant="primary" onPress={() => next(Rating.Good)} style={{ flex: 1 }} />
                  <Button label="Было легко" variant="success" onPress={() => next(Rating.Easy)} style={{ flex: 1 }} />
                </View>
              ) : (
                <Button
                  label="Дальше (повторим ещё раз)"
                  variant="warning"
                  onPress={() => next(result.score >= 0.8 ? Rating.Hard : Rating.Again)}
                />
              )}
            </>
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
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  translation: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  answerPreview: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    color: colors.text,
    fontSize: 20,
    padding: spacing.md,
    textAlign: 'center',
  },
  resultCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  diffRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  diffChar: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  correctAnswer: {
    color: colors.muted,
    fontSize: 16,
  },
  gradeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
