import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NewBadge, SessionShell } from '../../components/session-shell';
import { Button, Card, Muted } from '../../components/ui';
import { Rating, scoreToRating } from '../../srs/engine';
import { useSession } from '../../srs/use-session';
import { isRecognitionAvailable, startListening, stopListening } from '../../speech/recognition';
import { scoreShadowing, type ShadowingScore } from '../../speech/scoring';
import { speak, stopSpeaking } from '../../speech/tts';
import { colors, spacing } from '../../theme';

type Phase = 'idle' | 'listening' | 'result';

export default function ShadowingScreen() {
  const session = useSession('shadowing');
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<ShadowingScore | null>(null);
  const [recAvailable, setRecAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const word = session.word;
  const target = word ? (word.example ?? word.en) : '';

  useEffect(() => {
    isRecognitionAvailable().then(setRecAvailable);
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    setPhase('idle');
    setResult(null);
    setError(null);
    if (word) speak(word.example ? `${word.en}. ${word.example}` : word.en);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word?.id]);

  const listen = async () => {
    setError(null);
    setPhase('listening');
    try {
      const transcript = await startListening('en-US');
      setResult(scoreShadowing(target, transcript));
      setPhase('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось распознать речь');
      setPhase('idle');
    }
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
            <Text style={styles.word}>{word.en}</Text>
            {word.ipa && <Muted>[{word.ipa}]</Muted>}
            <Text style={styles.translation}>{word.ru}</Text>
            {word.example && <Text style={styles.example}>{word.example}</Text>}
            <Button
              label="🔊 Послушать"
              variant="secondary"
              small
              onPress={() => speak(word.example ? `${word.en}. ${word.example}` : word.en)}
            />
          </Card>

          {error && <Text style={styles.error}>{error}</Text>}

          {phase === 'idle' && recAvailable && (
            <Button label="🎙 Повторить в микрофон" onPress={listen} />
          )}

          {phase === 'listening' && (
            <>
              <Card style={styles.listeningCard}>
                <Text style={styles.listeningText}>🎙 Говорите…</Text>
                <Muted center>Повторите: «{target}»</Muted>
              </Card>
              <Button label="Стоп" variant="secondary" onPress={() => stopListening()} />
            </>
          )}

          {phase === 'result' && result && (
            <>
              <Card style={styles.resultCard}>
                <Text style={[styles.score, { color: scoreColor(result.score) }]}>
                  {Math.round(result.score * 100)}%
                </Text>
                <View style={styles.wordsRow}>
                  {result.words.map((w, i) => (
                    <Text
                      key={i}
                      style={[styles.targetWord, { color: w.hit ? colors.success : colors.error }]}
                    >
                      {w.word}
                    </Text>
                  ))}
                </View>
                <Muted center>
                  {result.transcript ? `Услышано: «${result.transcript}»` : 'Ничего не распознано'}
                </Muted>
              </Card>
              <View style={styles.gradeRow}>
                <Button label="🔁 Ещё раз" variant="secondary" onPress={listen} style={{ flex: 1 }} />
                <Button
                  label="Дальше"
                  onPress={() => next(scoreToRating(result.score))}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          )}

          {(recAvailable === false || (phase === 'idle' && !recAvailable)) && recAvailable !== null && (
            <>
              <Muted center>
                Распознавание речи недоступно — повтори вслух и оцени себя сам
              </Muted>
              <View style={styles.gradeRow}>
                <Button label="Снова" variant="danger" onPress={() => next(Rating.Again)} style={{ flex: 1 }} />
                <Button label="Трудно" variant="warning" onPress={() => next(Rating.Hard)} style={{ flex: 1 }} />
                <Button label="Хорошо" variant="primary" onPress={() => next(Rating.Good)} style={{ flex: 1 }} />
                <Button label="Легко" variant="success" onPress={() => next(Rating.Easy)} style={{ flex: 1 }} />
              </View>
            </>
          )}
        </View>
      )}
    </SessionShell>
  );
}

function scoreColor(score: number): string {
  if (score >= 0.8) return colors.success;
  if (score >= 0.5) return colors.warning;
  return colors.error;
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
  word: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
  },
  translation: {
    color: colors.muted,
    fontSize: 18,
  },
  example: {
    color: colors.accent,
    fontSize: 17,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  listeningCard: {
    alignItems: 'center',
    gap: spacing.sm,
    borderColor: colors.accent,
  },
  listeningText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  resultCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  score: {
    fontSize: 40,
    fontWeight: '800',
  },
  wordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  targetWord: {
    fontSize: 18,
    fontWeight: '600',
  },
  error: {
    color: colors.error,
    textAlign: 'center',
  },
  gradeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
