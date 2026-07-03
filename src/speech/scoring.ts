/** Text comparison for shadowing and spelling exercises. */

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’`]/g, "'")
    .replace(/[^a-z0-9'\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Generic Levenshtein distance over arrays (words) or strings (chars). */
export function levenshtein<T>(a: ArrayLike<T>, b: ArrayLike<T>): number {
  const n = a.length;
  const m = b.length;
  if (n === 0) return m;
  if (m === 0) return n;
  let prev = new Array(m + 1);
  let curr = new Array(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j;
  for (let i = 1; i <= n; i++) {
    curr[0] = i;
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[m];
}

export interface WordMatch {
  word: string;
  hit: boolean;
}

export interface ShadowingScore {
  /** 0..1 similarity between target and spoken */
  score: number;
  /** target words annotated with whether they were heard */
  words: WordMatch[];
  transcript: string;
}

/** Compare recognized speech against the target phrase, word by word. */
export function scoreShadowing(target: string, spoken: string): ShadowingScore {
  const targetWords = normalize(target).split(' ').filter(Boolean);
  const spokenWords = normalize(spoken).split(' ').filter(Boolean);
  if (targetWords.length === 0) return { score: 0, words: [], transcript: spoken };

  const dist = levenshtein(targetWords, spokenWords);
  const score = Math.max(0, 1 - dist / Math.max(targetWords.length, spokenWords.length));

  const spokenSet = new Set(spokenWords);
  const words = targetWords.map((word) => ({
    word,
    // fuzzy per-word hit: exact or 1 edit away from some spoken word
    hit:
      spokenSet.has(word) ||
      spokenWords.some((s) => Math.abs(s.length - word.length) <= 1 && levenshtein(word, s) <= 1),
  }));

  return { score, words, transcript: spoken };
}

export type CharStatus = 'ok' | 'wrong' | 'missing' | 'extra';

export interface CharDiff {
  ch: string;
  status: CharStatus;
}

export interface SpellingResult {
  correct: boolean;
  /** 0..1 similarity */
  score: number;
  /** diff of the typed answer against the target */
  diff: CharDiff[];
}

/** Compare a typed word against the target, char by char with alignment. */
export function checkSpelling(target: string, typed: string): SpellingResult {
  const t = target.trim().toLowerCase();
  const u = typed.trim().toLowerCase();
  const correct = t === u;
  const dist = levenshtein(t, u);
  const score = t.length === 0 ? 0 : Math.max(0, 1 - dist / Math.max(t.length, u.length));

  // Alignment via full DP matrix to mark each typed char ok/wrong/extra and missing target chars
  const n = t.length;
  const m = u.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = t[i - 1] === u[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  const diff: CharDiff[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + (t[i - 1] === u[j - 1] ? 0 : 1)) {
      diff.push({ ch: u[j - 1], status: t[i - 1] === u[j - 1] ? 'ok' : 'wrong' });
      i--;
      j--;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      diff.push({ ch: u[j - 1], status: 'extra' });
      j--;
    } else {
      diff.push({ ch: t[i - 1], status: 'missing' });
      i--;
    }
  }
  diff.reverse();
  return { correct, score, diff };
}
