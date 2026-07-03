// Native (iOS) speech recognition via SFSpeechRecognizer through @react-native-voice/voice.
// Metro picks recognition.web.ts on web, so this file is only bundled on native.
import Voice, { type SpeechResultsEvent, type SpeechErrorEvent } from '@react-native-voice/voice';

let pending: { resolve: (t: string) => void; reject: (e: Error) => void } | null = null;
let lastTranscript = '';

function settle(err?: Error) {
  const p = pending;
  pending = null;
  if (!p) return;
  if (err) p.reject(err);
  else p.resolve(lastTranscript.trim());
}

Voice.onSpeechResults = (e: SpeechResultsEvent) => {
  lastTranscript = e.value?.[0] ?? lastTranscript;
};
Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
  lastTranscript = e.value?.[0] ?? lastTranscript;
};
Voice.onSpeechEnd = () => {
  settle();
};
Voice.onSpeechError = (e: SpeechErrorEvent) => {
  // "no speech detected" is a normal outcome, not an error
  const code = e.error?.code ?? '';
  if (code === 'recognition_fail' || code === '1110' || code === '203') settle();
  else settle(new Error(e.error?.message || 'Ошибка распознавания'));
};

export async function isRecognitionAvailable(): Promise<boolean> {
  try {
    const res = await Voice.isAvailable();
    return !!res;
  } catch {
    return false;
  }
}

export function startListening(lang = 'en-US'): Promise<string> {
  return new Promise((resolve, reject) => {
    lastTranscript = '';
    pending = { resolve, reject };
    Voice.start(lang).catch((err: Error) => {
      pending = null;
      reject(err);
    });
  });
}

export function stopListening(): void {
  Voice.stop().catch(() => {
    // ignore: stop after session already ended
  });
}
