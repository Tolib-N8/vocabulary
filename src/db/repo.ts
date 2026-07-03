import { getDb } from './index';
import { CUSTOM_DECK_NAME } from './seed';
import type { Deck, ReviewRow, StudyMode, Word } from './schema';

export interface DeckWithCount extends Deck {
  word_count: number;
}

export async function listDecks(): Promise<DeckWithCount[]> {
  const db = await getDb();
  return db.getAllAsync<DeckWithCount>(
    `SELECT d.*, COUNT(w.id) AS word_count
     FROM decks d LEFT JOIN words w ON w.deck_id = d.id
     GROUP BY d.id ORDER BY d.id`
  );
}

export async function getDeck(id: number): Promise<Deck | null> {
  const db = await getDb();
  return db.getFirstAsync<Deck>(`SELECT * FROM decks WHERE id = ?`, id);
}

export async function listWords(deckId: number): Promise<Word[]> {
  const db = await getDb();
  return db.getAllAsync<Word>(
    `SELECT * FROM words WHERE deck_id = ? ORDER BY en COLLATE NOCASE`,
    deckId
  );
}

export async function getWord(id: number): Promise<Word | null> {
  const db = await getDb();
  return db.getFirstAsync<Word>(`SELECT * FROM words WHERE id = ?`, id);
}

export async function addCustomWord(w: {
  en: string;
  ru: string;
  ipa?: string;
  example?: string;
}): Promise<number> {
  const db = await getDb();
  const deck = await db.getFirstAsync<Deck>(
    `SELECT * FROM decks WHERE name = ? AND is_builtin = 0`,
    CUSTOM_DECK_NAME
  );
  if (!deck) throw new Error('Колода для своих слов не найдена');
  const res = await db.runAsync(
    `INSERT INTO words (deck_id, en, ru, ipa, example, is_custom) VALUES (?, ?, ?, ?, ?, 1)`,
    deck.id,
    w.en.trim(),
    w.ru.trim(),
    w.ipa?.trim() || null,
    w.example?.trim() || null
  );
  return res.lastInsertRowId;
}

export async function deleteWord(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM reviews WHERE word_id = ?`, id);
  await db.runAsync(`DELETE FROM words WHERE id = ?`, id);
}

export async function getReview(wordId: number, mode: StudyMode): Promise<ReviewRow | null> {
  const db = await getDb();
  return db.getFirstAsync<ReviewRow>(
    `SELECT * FROM reviews WHERE word_id = ? AND mode = ?`,
    wordId,
    mode
  );
}

export async function upsertReview(r: ReviewRow): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO reviews (word_id, mode, due, stability, difficulty, elapsed_days,
       scheduled_days, learning_steps, reps, lapses, state, last_review)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(word_id, mode) DO UPDATE SET
       due = excluded.due, stability = excluded.stability, difficulty = excluded.difficulty,
       elapsed_days = excluded.elapsed_days, scheduled_days = excluded.scheduled_days,
       learning_steps = excluded.learning_steps, reps = excluded.reps,
       lapses = excluded.lapses, state = excluded.state, last_review = excluded.last_review`,
    r.word_id,
    r.mode,
    r.due,
    r.stability,
    r.difficulty,
    r.elapsed_days,
    r.scheduled_days,
    r.learning_steps,
    r.reps,
    r.lapses,
    r.state,
    r.last_review
  );
}

/** Words that are due for review in the given mode (already introduced). */
export async function listDueWords(mode: StudyMode, now: Date): Promise<Word[]> {
  const db = await getDb();
  return db.getAllAsync<Word>(
    `SELECT w.* FROM words w
     JOIN reviews r ON r.word_id = w.id AND r.mode = ?
     WHERE r.due <= ? ORDER BY r.due`,
    mode,
    now.toISOString()
  );
}

/** Words never studied in the given mode. */
export async function listNewWords(mode: StudyMode, limit: number): Promise<Word[]> {
  const db = await getDb();
  return db.getAllAsync<Word>(
    `SELECT w.* FROM words w
     WHERE NOT EXISTS (SELECT 1 FROM reviews r WHERE r.word_id = w.id AND r.mode = ?)
     ORDER BY w.id LIMIT ?`,
    mode,
    limit
  );
}

export async function countDue(mode: StudyMode, now: Date): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM reviews WHERE mode = ? AND due <= ?`,
    mode,
    now.toISOString()
  );
  return row?.n ?? 0;
}

export async function countByState(mode: StudyMode): Promise<{ learning: number; review: number }> {
  const db = await getDb();
  const learning = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM reviews WHERE mode = ? AND state IN (1, 3)`,
    mode
  );
  const review = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM reviews WHERE mode = ? AND state = 2`,
    mode
  );
  return { learning: learning?.n ?? 0, review: review?.n ?? 0 };
}

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key = ?`,
    key
  );
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)`, key, value);
}
