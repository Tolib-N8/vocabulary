import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Voice } from 'expo-speech';
import { Button, Card, Muted } from '../components/ui';
import { exportData, importData } from '../db/backup';
import { pickBackupFile, saveBackupFile } from '../db/backup-io';
import { getMeta, setMeta } from '../db/repo';
import { DEFAULT_NEW_PER_DAY } from '../srs/queue';
import {
  getTtsRate,
  getTtsVoice,
  listEnglishVoices,
  setTtsRate,
  setTtsVoice,
  speak,
} from '../speech/tts';
import { colors, radius, spacing } from '../theme';

export default function SettingsScreen() {
  const [newPerDay, setNewPerDay] = useState(DEFAULT_NEW_PER_DAY);
  const [rate, setRate] = useState(0.9);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voice, setVoice] = useState<string | null>(null);
  const [showVoices, setShowVoices] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const raw = await getMeta('new_per_day');
      if (raw) setNewPerDay(parseInt(raw, 10) || DEFAULT_NEW_PER_DAY);
      setRate(await getTtsRate());
      setVoice(await getTtsVoice());
      setVoices(await listEnglishVoices());
    })();
  }, []);

  const changeNewPerDay = async (delta: number) => {
    const next = Math.max(0, Math.min(100, newPerDay + delta));
    setNewPerDay(next);
    await setMeta('new_per_day', String(next));
  };

  const changeRate = async (delta: number) => {
    const next = Math.round(Math.max(0.5, Math.min(1.5, rate + delta)) * 10) / 10;
    setRate(next);
    await setTtsRate(next);
  };

  const chooseVoice = async (id: string | null) => {
    setVoice(id);
    await setTtsVoice(id);
    speak('Hello! This is my voice.');
  };

  const doExport = async () => {
    try {
      const json = await exportData();
      const date = new Date().toISOString().slice(0, 10);
      await saveBackupFile(json, `vocabulary-backup-${date}.json`);
      setStatus('✅ Резервная копия сохранена');
    } catch (e) {
      setStatus(`❌ ${e instanceof Error ? e.message : 'Ошибка экспорта'}`);
    }
  };

  const doImport = async () => {
    try {
      const json = await pickBackupFile();
      if (!json) return;
      const ok =
        Platform.OS === 'web'
          ? // eslint-disable-next-line no-alert
            window.confirm('Импорт заменит все текущие слова и прогресс. Продолжить?')
          : true;
      if (!ok) return;
      await importData(json);
      setStatus('✅ Данные восстановлены из копии');
    } catch (e) {
      setStatus(`❌ ${e instanceof Error ? e.message : 'Ошибка импорта'}`);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.container}>
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Новые слова в день</Text>
        <View style={styles.stepper}>
          <Button label="−" variant="secondary" small onPress={() => changeNewPerDay(-5)} />
          <Text style={styles.stepperValue}>{newPerDay}</Text>
          <Button label="＋" variant="secondary" small onPress={() => changeNewPerDay(5)} />
        </View>
        <Muted>На каждый режим отдельно</Muted>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Скорость озвучки</Text>
        <View style={styles.stepper}>
          <Button label="−" variant="secondary" small onPress={() => changeRate(-0.1)} />
          <Text style={styles.stepperValue}>{rate.toFixed(1)}×</Text>
          <Button label="＋" variant="secondary" small onPress={() => changeRate(0.1)} />
        </View>
        <Button label="🔊 Проверить" variant="secondary" small onPress={() => speak('Hello! How are you today?')} />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Голос диктора</Text>
        <Muted>
          {voice ? voices.find((v) => v.identifier === voice)?.name ?? voice : 'Системный (по умолчанию)'}
        </Muted>
        <Button
          label={showVoices ? 'Скрыть голоса' : `Выбрать голос (${voices.length})`}
          variant="secondary"
          small
          onPress={() => setShowVoices((s) => !s)}
        />
        {showVoices && (
          <View style={styles.voiceList}>
            <Button label="Системный (по умолчанию)" variant={voice ? 'secondary' : 'primary'} small onPress={() => chooseVoice(null)} />
            {voices.map((v) => (
              <Button
                key={v.identifier}
                label={`${v.name} (${v.language})`}
                variant={voice === v.identifier ? 'primary' : 'secondary'}
                small
                onPress={() => chooseVoice(v.identifier)}
              />
            ))}
          </View>
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Резервная копия</Text>
        <Muted>Слова и весь прогресс в одном JSON-файле</Muted>
        <View style={styles.row}>
          <Button label="⬇️ Экспорт" variant="secondary" onPress={doExport} style={{ flex: 1 }} />
          <Button label="⬆️ Импорт" variant="secondary" onPress={doImport} style={{ flex: 1 }} />
        </View>
        {status && <Text style={styles.status}>{status}</Text>}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepperValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    minWidth: 56,
    textAlign: 'center',
  },
  voiceList: {
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.sm,
    borderRadius: radius.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  status: {
    color: colors.text,
    textAlign: 'center',
  },
});
