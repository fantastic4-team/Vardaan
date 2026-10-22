"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Free, in-browser voice: speech-to-text with the Web Speech API (Chrome, Edge, Safari) and
// text-to-speech with speechSynthesis. No audio leaves the browser except through the
// browser's own recognition service.

export const LANGUAGES = [
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "हिन्दी Hindi" },
  { code: "bn-IN", label: "বাংলা Bengali" },
  { code: "ta-IN", label: "தமிழ் Tamil" },
  { code: "te-IN", label: "తెలుగు Telugu" },
  { code: "mr-IN", label: "मराठी Marathi" },
  { code: "gu-IN", label: "ગુજરાતી Gujarati" },
  { code: "kn-IN", label: "ಕನ್ನಡ Kannada" },
  { code: "ml-IN", label: "മലയാളം Malayalam" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ Punjabi" },
  { code: "ur-IN", label: "اردو Urdu" },
  { code: "en-US", label: "English (US)" },
];

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeech(lang: string) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const recRef = useRef<Recognition | null>(null);

  useEffect(() => {
    setSupported(Boolean(getRecognition()));
    return () => recRef.current?.abort();
  }, []);

  /** Listen once; resolves with the final transcript (empty if nothing was heard). */
  const listen = useCallback(
    () =>
      new Promise<string>((resolve) => {
        const Ctor = getRecognition();
        if (!Ctor) {
          setSupported(false);
          resolve("");
          return;
        }
        window.speechSynthesis?.cancel();
        const rec = new Ctor();
        recRef.current = rec;
        rec.lang = lang;
        rec.interimResults = true;
        rec.continuous = false;
        let final = "";
        setError("");
        setInterim("");
        setListening(true);
        rec.onresult = (e) => {
          let partial = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) final += r[0].transcript;
            else partial += r[0].transcript;
          }
          setInterim((final + " " + partial).trim());
        };
        rec.onerror = (e) => {
          if (e.error === "not-allowed") setError("Microphone access is blocked. Allow it in your browser's address bar.");
          else if (e.error !== "no-speech" && e.error !== "aborted") setError("I couldn't hear that clearly. Try again.");
        };
        rec.onend = () => {
          setListening(false);
          setInterim("");
          recRef.current = null;
          resolve(final.trim());
        };
        rec.start();
      }),
    [lang],
  );

  const stop = useCallback(() => recRef.current?.stop(), []);

  const speak = useCallback(
    (text: string) => {
      const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
      if (!synth || !text) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      const voice = synth.getVoices().find((v) => v.lang === lang) ?? synth.getVoices().find((v) => v.lang.startsWith(lang.slice(0, 2)));
      if (voice) u.voice = voice;
      synth.speak(u);
    },
    [lang],
  );

  return { supported, listening, interim, error, listen, stop, speak };
}
