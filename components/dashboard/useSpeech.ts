"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Free, in-browser voice: speech-to-text with the Web Speech API (Chrome, Edge, Safari) and
// text-to-speech with speechSynthesis. Nothing to pay for and no extra service to sign up to.

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
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const recRef = useRef<Recognition | null>(null);

  useEffect(() => {
    setSupported(Boolean(getRecognition()));
    return () => {
      recRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
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
          if (e.error === "not-allowed" || e.error === "service-not-allowed")
            setError("Microphone access is blocked. Allow it from the icon in your browser's address bar.");
          else if (e.error !== "no-speech" && e.error !== "aborted") setError("I couldn't hear that clearly. Try again.");
        };
        rec.onend = () => {
          setListening(false);
          setInterim("");
          recRef.current = null;
          resolve(final.trim());
        };
        try {
          rec.start();
        } catch {
          setListening(false);
          resolve("");
        }
      }),
    [lang],
  );

  const stopListening = useCallback(() => recRef.current?.stop(), []);
  const abortListening = useCallback(() => recRef.current?.abort(), []);

  /** Speak text aloud; resolves when it has finished (or immediately if speech isn't available). */
  const speak = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
        if (!synth || !text) return resolve();
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        const voices = synth.getVoices();
        const voice = voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
        if (voice) u.voice = voice;
        let finished = false;
        const done = () => {
          if (finished) return;
          finished = true;
          clearTimeout(safety);
          setSpeaking(false);
          resolve();
        };
        // Some browsers never fire onend (no voices, or a long utterance); don't let a call hang on it.
        const safety = setTimeout(done, 2500 + text.length * 90);
        u.onend = done;
        u.onerror = done;
        setSpeaking(true);
        synth.speak(u);
      }),
    [lang],
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { supported, listening, speaking, interim, error, listen, stopListening, abortListening, speak, stopSpeaking };
}
