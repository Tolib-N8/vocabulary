export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS decks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  level TEXT,
  is_builtin INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  en TEXT NOT NULL,
  ru TEXT NOT NULL,
  ipa TEXT,
  example TEXT,
  is_custom INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reviews (
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  due TEXT NOT NULL,
  stability REAL NOT NULL DEFAULT 0,
  difficulty REAL NOT NULL DEFAULT 0,
  elapsed_days INTEGER NOT NULL DEFAULT 0,
  scheduled_days INTEGER NOT NULL DEFAULT 0,
  learning_steps INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  state INTEGER NOT NULL DEFAULT 0,
  last_review TEXT,
  PRIMARY KEY (word_id, mode)
);

CREATE INDEX IF NOT EXISTS idx_reviews_mode_due ON reviews(mode, due);
CREATE INDEX IF NOT EXISTS idx_words_deck ON words(deck_id);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export type StudyMode = 'flashcard' | 'spelling' | 'shadowing';

export const STUDY_MODES: StudyMode[] = ['flashcard', 'spelling', 'shadowing'];

export interface Deck {
  id: number;
  name: string;
  level: string | null;
  is_builtin: number;
}

export interface Word {
  id: number;
  deck_id: number;
  en: string;
  ru: string;
  ipa: string | null;
  example: string | null;
  is_custom: number;
}

export interface ReviewRow {
  word_id: number;
  mode: StudyMode;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
}
