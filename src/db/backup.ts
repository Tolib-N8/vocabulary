import { getDb } from './index';
import type { Deck, ReviewRow, Word } from './schema';

export interface BackupData {
  version: 1;
  exportedAt: string;
  decks: Deck[];
  words: Word[];
  reviews: ReviewRow[];
  meta: { key: string; value: string }[];
}

export async function exportData(): Promise<string> {
  const db = await getDb();
  const [decks, words, reviews, meta] = await Promise.all([
    db.getAllAsync<Deck>(`SELECT * FROM decks`),
    db.getAllAsync<Word>(`SELECT * FROM words`),
    db.getAllAsync<ReviewRow>(`SELECT * FROM reviews`),
    db.getAllAsync<{ key: string; value: string }>(`SELECT * FROM meta`),
  ]);
  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    decks,
    words,
    reviews,
    meta,
  };
  return JSON.stringify(data);
}

/** Replace the entire database contents with the backup. */
export async function importData(json: string): Promise<void> {
  let data: BackupData;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Файл повреждён: это не JSON');
  }
  if (data.version !== 1 || !Array.isArray(data.decks) || !Array.isArray(data.words)) {
    throw new Error('Неподдерживаемый формат резервной копии');
  }

  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM reviews`);
    await db.runAsync(`DELETE FROM words`);
    await db.runAsync(`DELETE FROM decks`);
    await db.runAsync(`DELETE FROM meta`);
    for (const d of data.decks) {
      await db.runAsync(
        `INSERT INTO decks (id, name, level, is_builtin) VALUES (?, ?, ?, ?)`,
        d.id,
        d.name,
        d.level,
        d.is_builtin
      );
    }
    for (const w of data.words) {
      await db.runAsync(
        `INSERT INTO words (id, deck_id, en, ru, ipa, example, is_custom) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        w.id,
        w.deck_id,
        w.en,
        w.ru,
        w.ipa,
        w.example,
        w.is_custom
      );
    }
    for (const r of data.reviews ?? []) {
      await db.runAsync(
        `INSERT INTO reviews (word_id, mode, due, stability, difficulty, elapsed_days,
           scheduled_days, learning_steps, reps, lapses, state, last_review)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        r.word_id,
        r.mode,
        r.due,
        r.stability,
        r.difficulty,
        r.elapsed_days,
        r.scheduled_days,
        r.learning_steps ?? 0,
        r.reps,
        r.lapses,
        r.state,
        r.last_review
      );
    }
    for (const m of data.meta ?? []) {
      await db.runAsync(`INSERT INTO meta (key, value) VALUES (?, ?)`, m.key, m.value);
    }
  });
}
