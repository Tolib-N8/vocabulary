import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RATE_KEY = 'tts_rate';
const VOICE_KEY = 'tts_voice';

export async function getTtsRate(): Promise<number> {
  const raw = await AsyncStorage.getItem(RATE_KEY);
  const n = raw ? parseFloat(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 0.9;
}

export async function setTtsRate(rate: number): Promise<void> {
  await AsyncStorage.setItem(RATE_KEY, String(rate));
}

export async function getTtsVoice(): Promise<string | null> {
  return AsyncStorage.getItem(VOICE_KEY);
}

export async function setTtsVoice(voice: string | null): Promise<void> {
  if (voice) await AsyncStorage.setItem(VOICE_KEY, voice);
  else await AsyncStorage.removeItem(VOICE_KEY);
}

export async function listEnglishVoices(): Promise<Speech.Voice[]> {
  const voices = await Speech.getAvailableVoicesAsync();
  return voices.filter((v) => v.language?.toLowerCase().startsWith('en'));
}

export async function speak(text: string): Promise<void> {
  const [rate, voice] = await Promise.all([getTtsRate(), getTtsVoice()]);
  Speech.stop();
  return new Promise((resolve) => {
    Speech.speak(text, {
      language: 'en-US',
      rate,
      voice: voice ?? undefined,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}
