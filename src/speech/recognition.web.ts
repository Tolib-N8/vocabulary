// Web speech recognition via the (webkit-prefixed) Web Speech API.
// Reliably available in Chrome; other browsers fall back to self-assessment.

type AnyRecognition = any;

function getCtor(): (new () => AnyRecognition) | null {
  const w = globalThis as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

let active: AnyRecognition | null = null;

export async function isRecognitionAvailable(): Promise<boolean> {
  return getCtor() !== null;
}

/**
 * Listen once and resolve with the final transcript ('' if nothing recognized).
 * Rejects only on hard errors (no mic permission, no support).
 */
export function startListening(lang = 'en-US'): Promise<string> {
  const Ctor = getCtor();
  if (!Ctor) return Promise.reject(new Error('Распознавание речи не поддерживается'));
  stopListening();

  return new Promise((resolve, reject) => {
    const rec = new Ctor();
    active = rec;
    let transcript = '';
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) transcript += e.results[i][0].transcript + ' ';
      }
    };
    rec.onerror = (e: any) => {
      active = null;
      if (e.error === 'no-speech' || e.error === 'aborted') resolve('');
      else reject(new Error(e.error || 'Ошибка распознавания'));
    };
    rec.onend = () => {
      active = null;
      resolve(transcript.trim());
    };
    rec.start();
  });
}

export function stopListening(): void {
  if (active) {
    try {
      active.stop();
    } catch {
      // already stopped
    }
    active = null;
  }
}
