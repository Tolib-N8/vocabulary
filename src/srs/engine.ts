import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card } from 'ts-fsrs';
import type { ReviewRow, StudyMode } from '../db/schema';

export { Rating, State };

const scheduler = fsrs(
  generatorParameters({ enable_fuzz: true, enable_short_term: true })
);

export function newCard(now: Date): Card {
  return createEmptyCard(now);
}

export function reviewToCard(r: ReviewRow): Card {
  return {
    due: new Date(r.due),
    stability: r.stability,
    difficulty: r.difficulty,
    elapsed_days: r.elapsed_days,
    scheduled_days: r.scheduled_days,
    learning_steps: r.learning_steps,
    reps: r.reps,
    lapses: r.lapses,
    state: r.state as State,
    last_review: r.last_review ? new Date(r.last_review) : undefined,
  };
}

export function cardToReview(card: Card, wordId: number, mode: StudyMode): ReviewRow {
  return {
    word_id: wordId,
    mode,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? card.last_review.toISOString() : null,
  };
}

/** Apply a grade to a card and return the rescheduled card. */
export function grade(card: Card, rating: Rating, now: Date): Card {
  const result = scheduler.repeat(card, now);
  return result[rating as Exclude<Rating, Rating.Manual>].card;
}

/** Map a 0..1 accuracy score (spelling/shadowing) to an FSRS rating. */
export function scoreToRating(score: number): Rating {
  if (score >= 0.95) return Rating.Easy;
  if (score >= 0.8) return Rating.Good;
  if (score >= 0.5) return Rating.Hard;
  return Rating.Again;
}
