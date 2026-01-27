import { useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";

const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes

export const useAutoLogout = () => {
  const history = useHistory();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      localStorage.clear();
      history.push("/login"); // ✅ Works for React Router v5
    }, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return null;
};
