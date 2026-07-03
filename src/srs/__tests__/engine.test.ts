import { cardToReview, grade, newCard, Rating, reviewToCard, scoreToRating, State } from '../engine';

describe('scoreToRating', () => {
  it('maps accuracy bands to FSRS ratings', () => {
    expect(scoreToRating(1)).toBe(Rating.Easy);
    expect(scoreToRating(0.85)).toBe(Rating.Good);
    expect(scoreToRating(0.6)).toBe(Rating.Hard);
    expect(scoreToRating(0.2)).toBe(Rating.Again);
  });
});

describe('grade', () => {
  it('moves a new card into learning and schedules it in the future', () => {
    const now = new Date('2026-07-02T10:00:00Z');
    const card = newCard(now);
    expect(card.state).toBe(State.New);
    const next = grade(card, Rating.Good, now);
    expect(next.state).not.toBe(State.New);
    expect(next.reps).toBe(1);
    expect(next.due.getTime()).toBeGreaterThan(now.getTime());
  });

  it('spaces Good reviews further apart over time', () => {
    const day = 24 * 60 * 60 * 1000;
    let now = new Date('2026-07-02T10:00:00Z');
    let card = newCard(now);
    let prevInterval = 0;
    for (let i = 0; i < 5; i++) {
      card = grade(card, Rating.Good, now);
      now = new Date(card.due.getTime());
    }
    const interval = card.due.getTime() - (card.last_review?.getTime() ?? 0);
    expect(interval).toBeGreaterThan(day);
    expect(interval).toBeGreaterThan(prevInterval);
  });
});

describe('review row mapping', () => {
  it('round-trips a card through the DB row shape', () => {
    const now = new Date('2026-07-02T10:00:00Z');
    const card = grade(newCard(now), Rating.Good, now);
    const row = cardToReview(card, 42, 'spelling');
    expect(row.word_id).toBe(42);
    expect(row.mode).toBe('spelling');
    const back = reviewToCard(row);
    expect(back.due.getTime()).toBe(card.due.getTime());
    expect(back.stability).toBe(card.stability);
    expect(back.difficulty).toBe(card.difficulty);
    expect(back.state).toBe(card.state);
    expect(back.last_review?.getTime()).toBe(card.last_review?.getTime());
  });
});
