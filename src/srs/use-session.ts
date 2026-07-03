import { useCallback, useEffect, useRef, useState } from 'react';
import type { StudyMode, Word } from '../db/schema';
import { Rating } from './engine';
import { buildQueue, gradeWord } from './queue';

export interface SessionState {
  loading: boolean;
  word: Word | null;
  isNew: boolean;
  done: number;
  total: number;
  finished: boolean;
  grade: (rating: Rating) => Promise<void>;
}

/** Drives one study session: serves words from today's queue and applies grades.
 *  Words graded "Again" come back at the end of the same session. */
export function useSession(mode: StudyMode): SessionState {
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<Word[]>([]);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(0);
  const totalRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const q = await buildQueue(mode);
      if (cancelled) return;
      totalRef.current = q.words.length;
      setQueue(q.words);
      setNewIds(q.newIds);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const word = index < queue.length ? queue[index] : null;

  const grade = useCallback(
    async (rating: Rating) => {
      if (!word) return;
      await gradeWord(word.id, mode, rating);
      if (rating === Rating.Again) {
        // repeat within this session
        setQueue((q) => [...q, word]);
      } else {
        setDone((d) => d + 1);
      }
      setIndex((i) => i + 1);
    },
    [word, mode]
  );

  return {
    loading,
    word,
    isNew: word ? newIds.has(word.id) : false,
    done,
    total: totalRef.current,
    finished: !loading && word === null,
    grade,
  };
}
