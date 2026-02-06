import { useEffect, useRef } from "react";
import { useIonRouter } from "@ionic/react";

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

export const useAutoLogout = (isLoggedIn: boolean, onLogout?: () => void) => {
  const ionRouter = useIonRouter(); // ✅ ADD THIS
  const timeoutRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const doLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");

    if (onLogout) onLogout();

    ionRouter.push("/login", "root");
  };

  const resetTimer = () => {
    lastActivityRef.current = Date.now();

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      const idleTime = Date.now() - lastActivityRef.current;

      if (idleTime >= INACTIVITY_LIMIT) {
        doLogout();
      } else {
        resetTimer();
      }
    }, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    // ✅ IMPORTANT: do nothing if not logged in
    if (!isLoggedIn) return;

    const events = ["click", "touchstart", "touchmove", "keydown"];

    events.forEach((event) => window.addEventListener(event, resetTimer));

    const onResume = () => {
      const idleTime = Date.now() - lastActivityRef.current;

      if (idleTime >= INACTIVITY_LIMIT) {
        doLogout();
      } else {
        resetTimer();
      }
    };

    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("focus", onResume);

    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));

      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("focus", onResume);

      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoggedIn]);

  return null;
};
