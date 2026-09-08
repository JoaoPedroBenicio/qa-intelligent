import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderState = 'idle' | 'recording' | 'stopping' | 'error';

interface UseMediaRecorder {
  state: RecorderState;
  blob: Blob | null;
  url: string | null;
  durationMs: number;
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<Blob | null>;
  reset: () => void;
}

const MIME_PRIORITY = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4',
];

function pickMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return MIME_PRIORITY.find((m) => MediaRecorder.isTypeSupported(m));
}

export function useMediaRecorder(): UseMediaRecorder {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const stopResolveRef = useRef<((b: Blob | null) => void) | null>(null);
  const urlRef = useRef<string | null>(null);

  const [state, setState] = useState<RecorderState>('idle');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const revokeUrl = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    stopStream();
    recorderRef.current = null;
    revokeUrl();
  }, [revokeUrl, stopStream]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    if (state === 'recording') return;

    if (!navigator.mediaDevices?.getDisplayMedia) {
      const msg = 'Captura de tela não suportada neste navegador.';
      setError(msg);
      setState('error');
      throw new Error(msg);
    }

    try {
      revokeUrl();
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });
      streamRef.current = stream;

      const mimeType = pickMime();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      startedAtRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onerror = (e) => {
        const errMsg =
          (e as unknown as { error?: DOMException }).error?.message ?? 'Erro no MediaRecorder';
        setError(errMsg);
        setState('error');
        stopResolveRef.current?.(null);
        stopResolveRef.current = null;
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, {
          type: mimeType ?? 'video/webm',
        });
        const finalUrl = URL.createObjectURL(finalBlob);
        urlRef.current = finalUrl;
        setBlob(finalBlob);
        setUrl(finalUrl);
        setDurationMs(Date.now() - startedAtRef.current);
        setState('idle');
        stopResolveRef.current?.(finalBlob);
        stopResolveRef.current = null;
        stopStream();
      };

      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (recorderRef.current?.state === 'recording') {
          recorderRef.current.stop();
        }
      });

      recorder.start(1000);
      setState('recording');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao iniciar captura.';
      setError(msg);
      setState('error');
      throw err;
    }
  }, [revokeUrl, state, stopStream]);

  const stop = useCallback(async (): Promise<Blob | null> => {
    if (state !== 'recording') return null;
    setState('stopping');
    return new Promise((resolve) => {
      stopResolveRef.current = resolve;
      const r = recorderRef.current;
      if (r && r.state !== 'inactive') {
        try {
          r.stop();
        } catch {
          stopResolveRef.current?.(null);
          stopResolveRef.current = null;
          resolve(null);
        }
      } else {
        stopResolveRef.current?.(null);
        stopResolveRef.current = null;
        resolve(null);
      }
    });
  }, [state]);

  const reset = useCallback(() => {
    revokeUrl();
    setBlob(null);
    setUrl(null);
    setDurationMs(0);
    setError(null);
    setState('idle');
  }, [revokeUrl]);

  return { state, blob, url, durationMs, error, start, stop, reset };
}
