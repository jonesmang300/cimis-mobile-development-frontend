import { useEffect, useRef } from "react";

const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes

export const useAutoLogout = () => {
  const timeoutRef = useRef<number | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      localStorage.clear();

      // ✅ SAFE in Capacitor / WebView
      window.location.replace("/login");
    }, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];

    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));

      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return null;
};
