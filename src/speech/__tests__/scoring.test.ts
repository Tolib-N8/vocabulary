import { checkSpelling, levenshtein, normalize, scoreShadowing } from '../scoring';

describe('normalize', () => {
  it('lowercases, strips punctuation and collapses spaces', () => {
    expect(normalize('  Hello,   World! ')).toBe('hello world');
    expect(normalize("Don't stop.")).toBe("don't stop");
  });
});

describe('levenshtein', () => {
  it('handles identical and empty inputs', () => {
    expect(levenshtein('cat', 'cat')).toBe(0);
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abc', '')).toBe(3);
  });

  it('computes edit distance over strings and arrays', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein(['i', 'eat', 'apples'], ['i', 'ate', 'apples'])).toBe(1);
  });
});

describe('scoreShadowing', () => {
  it('gives a perfect score for an exact repeat', () => {
    const r = scoreShadowing('I eat an apple every day.', 'i eat an apple every day');
    expect(r.score).toBe(1);
    expect(r.words.every((w) => w.hit)).toBe(true);
  });

  it('penalizes missing words and marks them', () => {
    const r = scoreShadowing('I eat an apple every day.', 'I eat every day');
    expect(r.score).toBeGreaterThan(0.5);
    expect(r.score).toBeLessThan(1);
    const missed = r.words.filter((w) => !w.hit).map((w) => w.word);
    expect(missed).toContain('apple');
  });

  it('is forgiving to one-letter recognition slips', () => {
    const r = scoreShadowing('cat', 'cats');
    expect(r.words[0].hit).toBe(true);
  });

  it('scores zero for empty speech', () => {
    const r = scoreShadowing('hello world', '');
    expect(r.score).toBe(0);
  });
});

describe('checkSpelling', () => {
  it('accepts an exact answer ignoring case and spaces', () => {
    const r = checkSpelling('Apple', ' apple ');
    expect(r.correct).toBe(true);
    expect(r.score).toBe(1);
    expect(r.diff.every((d) => d.status === 'ok')).toBe(true);
  });

  it('marks a wrong char', () => {
    const r = checkSpelling('apple', 'aplle');
    expect(r.correct).toBe(false);
    expect(r.diff.some((d) => d.status !== 'ok')).toBe(true);
  });

  it('marks missing chars from the target', () => {
    const r = checkSpelling('apple', 'aple');
    expect(r.correct).toBe(false);
    expect(r.diff.filter((d) => d.status === 'missing')).toHaveLength(1);
  });

  it('marks extra typed chars', () => {
    const r = checkSpelling('cat', 'caat');
    expect(r.diff.filter((d) => d.status === 'extra')).toHaveLength(1);
  });
});
