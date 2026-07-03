import type { StudyMode, Word } from '../db/schema';
import {
  getMeta,
  getReview,
  listDueWords,
  listNewWords,
  setMeta,
  upsertReview,
} from '../db/repo';
import { cardToReview, grade, newCard, reviewToCard, Rating } from './engine';

export const DEFAULT_NEW_PER_DAY = 10;

function dateKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function newCountKey(mode: StudyMode, now: Date): string {
  return `newcount:${mode}:${dateKey(now)}`;
}

export async function getNewIntroducedToday(mode: StudyMode, now: Date): Promise<number> {
  const raw = await getMeta(newCountKey(mode, now));
  return raw ? parseInt(raw, 10) || 0 : 0;
}

export async function getNewPerDayLimit(): Promise<number> {
  const raw = await getMeta('new_per_day');
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_NEW_PER_DAY;
}

export interface SessionQueue {
  mode: StudyMode;
  words: Word[];
  /** ids of words that are new (not yet in reviews) for this mode */
  newIds: Set<number>;
}

/** Build today's session: due reviews first, then new words up to the daily limit. */
export async function buildQueue(mode: StudyMode, now = new Date()): Promise<SessionQueue> {
  const due = await listDueWords(mode, now);
  const limit = await getNewPerDayLimit();
  const introduced = await getNewIntroducedToday(mode, now);
  const remaining = Math.max(0, limit - introduced);
  const fresh = remaining > 0 ? await listNewWords(mode, remaining) : [];
  return {
    mode,
    words: [...due, ...fresh],
    newIds: new Set(fresh.map((w) => w.id)),
  };
}

/** Grade a word in a mode; creates the review row on first encounter. */
export async function gradeWord(
  wordId: number,
  mode: StudyMode,
  rating: Rating,
  now = new Date()
): Promise<void> {
  const existing = await getReview(wordId, mode);
  const card = existing ? reviewToCard(existing) : newCard(now);
  const next = grade(card, rating, now);
  await upsertReview(cardToReview(next, wordId, mode));
  if (!existing) {
    const key = newCountKey(mode, now);
    const count = await getNewIntroducedToday(mode, now);
    await setMeta(key, String(count + 1));
  }
  await setMeta(`study:${dateKey(now)}`, '1');
}

/** Consecutive days with at least one graded card, counting back from today. */
export async function getStreak(now = new Date()): Promise<number> {
  let streak = 0;
  const day = new Date(now);
  for (let i = 0; i < 3650; i++) {
    const studied = await getMeta(`study:${dateKey(day)}`);
    if (studied) {
      streak++;
      day.setDate(day.getDate() - 1);
    } else if (i === 0) {
      // today may simply not have started yet — check yesterday
      day.setDate(day.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
