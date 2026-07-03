import type { SQLiteDatabase } from 'expo-sqlite';

export interface WordsetEntry {
  en: string;
  ru: string;
  ipa?: string;
  example?: string;
}

interface BuiltinDeck {
  name: string;
  level: string;
  words: WordsetEntry[];
}

const BUILTIN_DECKS: BuiltinDeck[] = [
  { name: 'Базовые слова (A1)', level: 'A1', words: require('../../assets/wordsets/a1.json') },
  { name: 'Повседневные слова (A2)', level: 'A2', words: require('../../assets/wordsets/a2.json') },
  { name: 'Средний уровень (B1)', level: 'B1', words: require('../../assets/wordsets/b1.json') },
  { name: 'Продвинутые слова (B2)', level: 'B2', words: require('../../assets/wordsets/b2.json') },
];

const SEED_VERSION = '1';

export const CUSTOM_DECK_NAME = 'Мои слова';

export async function seedBuiltinDecks(db: SQLiteDatabase): Promise<void> {
  const done = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key = 'seed_version'`
  );
  if (done?.value === SEED_VERSION) return;

  await db.withTransactionAsync(async () => {
    for (const deck of BUILTIN_DECKS) {
      const res = await db.runAsync(
        `INSERT INTO decks (name, level, is_builtin) VALUES (?, ?, 1)`,
        deck.name,
        deck.level
      );
      const deckId = res.lastInsertRowId;
      for (const w of deck.words) {
        await db.runAsync(
          `INSERT INTO words (deck_id, en, ru, ipa, example, is_custom) VALUES (?, ?, ?, ?, ?, 0)`,
          deckId,
          w.en,
          w.ru,
          w.ipa ?? null,
          w.example ?? null
        );
      }
    }
    await db.runAsync(
      `INSERT INTO decks (name, level, is_builtin) VALUES (?, NULL, 0)`,
      CUSTOM_DECK_NAME
    );
    await db.runAsync(
      `INSERT OR REPLACE INTO meta (key, value) VALUES ('seed_version', ?)`,
      SEED_VERSION
    );
  });
}
