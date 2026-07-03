import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Loading, Muted } from '../components/ui';
import { countDue, countByState } from '../db/repo';
import { STUDY_MODES, type StudyMode } from '../db/schema';
import { getNewIntroducedToday, getNewPerDayLimit, getStreak } from '../srs/queue';
import { colors, spacing } from '../theme';

interface ModeStats {
  due: number;
  newLeft: number;
  learning: number;
  review: number;
}

const MODE_INFO: Record<StudyMode, { title: string; subtitle: string; route: string }> = {
  flashcard: { title: '🃏 Карточки', subtitle: 'Слово ↔ перевод', route: '/session/flashcards' },
  spelling: { title: '✍️ Правописание', subtitle: 'Напечатай слово на слух', route: '/session/spelling' },
  shadowing: { title: '🎙 Shadowing', subtitle: 'Повторяй за диктором', route: '/session/shadowing' },
};

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Record<StudyMode, ModeStats> | null>(null);
  const [streak, setStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const now = new Date();
        const limit = await getNewPerDayLimit();
        const entries = await Promise.all(
          STUDY_MODES.map(async (mode) => {
            const [due, introduced, states] = await Promise.all([
              countDue(mode, now),
              getNewIntroducedToday(mode, now),
              countByState(mode),
            ]);
            return [mode, { due, newLeft: Math.max(0, limit - introduced), ...states }] as const;
          })
        );
        const s = await getStreak(now);
        if (cancelled) return;
        setStats(Object.fromEntries(entries) as Record<StudyMode, ModeStats>);
        setStreak(s);
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  if (!stats) return <Loading />;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.container}>
      <Card style={styles.streakCard}>
        <Text style={styles.streakText}>🔥 {streak}</Text>
        <Muted>{streakLabel(streak)} подряд</Muted>
      </Card>

      {STUDY_MODES.map((mode) => {
        const info = MODE_INFO[mode];
        const st = stats[mode];
        const todo = st.due + st.newLeft;
        return (
          <Card key={mode} style={styles.modeCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modeTitle}>{info.title}</Text>
              <Muted>{info.subtitle}</Muted>
              <Text style={styles.modeStats}>
                {st.due > 0 && <Text style={{ color: colors.warning }}>повторить: {st.due}  </Text>}
                {st.newLeft > 0 && <Text style={{ color: colors.accent }}>новых: {st.newLeft}  </Text>}
                <Text style={{ color: colors.muted }}>изучается: {st.learning + st.review}</Text>
              </Text>
            </View>
            <Button
              label={todo > 0 ? 'Учить' : 'Готово ✓'}
              variant={todo > 0 ? 'primary' : 'secondary'}
              disabled={todo === 0}
              onPress={() => router.push(info.route as any)}
              small
            />
          </Card>
        );
      })}

      <View style={styles.footer}>
        <Button label="📚 Наборы слов" variant="secondary" onPress={() => router.push('/decks')} style={{ flex: 1 }} />
        <Button label="⚙️ Настройки" variant="secondary" onPress={() => router.push('/settings')} style={{ flex: 1 }} />
      </View>
    </ScrollView>
  );
}

function streakLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
  return 'дней';
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  streakCard: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakText: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  modeTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  modeStats: {
    marginTop: spacing.sm,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
