import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SessionState } from '../srs/use-session';
import { colors, spacing } from '../theme';
import { Button, Loading, Muted, ProgressBar, Screen } from './ui';

/** Common chrome for a study session: progress bar, empty and finished states. */
export function SessionShell({
  session,
  children,
}: {
  session: SessionState;
  children: React.ReactNode;
}) {
  const router = useRouter();

  if (session.loading) return <Loading />;

  if (session.finished) {
    const anyDone = session.done > 0;
    return (
      <Screen style={styles.center}>
        <Text style={styles.bigEmoji}>{anyDone ? '🎉' : '😌'}</Text>
        <Text style={styles.doneTitle}>
          {anyDone ? 'Сессия завершена!' : 'На сегодня всё'}
        </Text>
        <Muted center>
          {anyDone
            ? `Пройдено карточек: ${session.done}`
            : 'Новые слова и повторения появятся завтра'}
        </Muted>
        <Button label="На главную" onPress={() => router.back()} style={{ marginTop: spacing.lg, minWidth: 200 }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.progressRow}>
        <View style={{ flex: 1 }}>
          <ProgressBar done={session.done} total={session.total} />
        </View>
        <Muted>
          {session.done} / {session.total}
        </Muted>
      </View>
      <View style={styles.body}>{children}</View>
    </Screen>
  );
}

export function NewBadge({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View style={styles.newBadge}>
      <Text style={styles.newBadgeText}>новое слово</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bigEmoji: {
    fontSize: 56,
  },
  doneTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  body: {
    flex: 1,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  newBadge: {
    alignSelf: 'center',
    backgroundColor: colors.accentDim,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.sm,
  },
  newBadgeText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
});
