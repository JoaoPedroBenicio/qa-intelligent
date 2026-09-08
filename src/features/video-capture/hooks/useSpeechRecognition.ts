import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string }; isFinal: boolean }; length: number };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface UseSpeechRecognition {
  isSupported: boolean;
  isRecording: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

function getSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === 'undefined') return null;
  const W = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

export function useSpeechRecognition(
  onFinal: (transcript: string) => void,
): UseSpeechRecognition {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' && getSpeechRecognition() !== null;

  const cleanup = useCallback(() => {
    const r = recognitionRef.current;
    if (r) {
      r.onstart = null;
      r.onresult = null;
      r.onerror = null;
      r.onend = null;
      try {
        r.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const start = useCallback(() => {
    setError(null);
    cleanup();

    const r = getSpeechRecognition();
    if (!r) {
      setError('Reconhecimento de voz não suportado neste navegador.');
      return;
    }

    r.lang = 'pt-BR';
    r.continuous = false;
    r.interimResults = false;

    r.onstart = () => setIsRecording(true);

    r.onresult = (e) => {
      const result = e.results[0];
      if (!result) return;
      const alt = result[0];
      if (!alt) return;
      if (result.isFinal) {
        onFinalRef.current(alt.transcript);
      }
    };

    r.onerror = (e) => {
      const messages: Record<string, string> = {
        'not-allowed': 'Permissão de microfone negada.',
        'no-speech': 'Nenhuma fala detectada.',
        'audio-capture': 'Microfone indisponível.',
        network: 'Erro de rede no reconhecimento.',
      };
      setError(messages[e.error] ?? `Erro: ${e.error}`);
      setIsRecording(false);
    };

    r.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    try {
      r.start();
      recognitionRef.current = r;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao iniciar reconhecimento.');
      setIsRecording(false);
    }
  }, [cleanup]);

  const stop = useCallback(() => {
    const r = recognitionRef.current;
    if (r) {
      try {
        r.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setIsRecording(false);
  }, []);

  return { isSupported, isRecording, error, start, stop, reset };
}
