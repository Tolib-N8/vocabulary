import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { Button, Muted } from '../../components/ui';
import { addCustomWord } from '../../db/repo';
import { colors, radius, spacing } from '../../theme';

export default function AddWordScreen() {
  const router = useRouter();
  const [en, setEn] = useState('');
  const [ru, setRu] = useState('');
  const [ipa, setIpa] = useState('');
  const [example, setExample] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!en.trim() || !ru.trim()) {
      setError('Слово и перевод обязательны');
      return;
    }
    setSaving(true);
    try {
      await addCustomWord({ en, ru, ipa, example });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.container}>
      <Text style={styles.label}>Слово (английский) *</Text>
      <TextInput
        style={styles.input}
        value={en}
        onChangeText={setEn}
        placeholder="serendipity"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoFocus
      />
      <Text style={styles.label}>Перевод (русский) *</Text>
      <TextInput
        style={styles.input}
        value={ru}
        onChangeText={setRu}
        placeholder="счастливая случайность"
        placeholderTextColor={colors.muted}
      />
      <Text style={styles.label}>Транскрипция</Text>
      <TextInput
        style={styles.input}
        value={ipa}
        onChangeText={setIpa}
        placeholder="ˌserənˈdɪpəti"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
      />
      <Text style={styles.label}>Пример (для shadowing)</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={example}
        onChangeText={setExample}
        placeholder="Meeting you here was pure serendipity."
        placeholderTextColor={colors.muted}
        multiline
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button label="Сохранить" onPress={save} loading={saving} style={{ marginTop: spacing.md }} />
      <Muted center>Слово попадёт в набор «Мои слова»</Muted>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.sm,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    color: colors.text,
    fontSize: 16,
    padding: spacing.md,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    color: colors.error,
    textAlign: 'center',
  },
});
