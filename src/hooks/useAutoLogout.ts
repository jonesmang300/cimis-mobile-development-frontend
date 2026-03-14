import { useEffect, useRef } from "react";

const INACTIVITY_LIMIT = 30 * 60 * 1000;
const LAST_ACTIVITY_KEY = "lastActivityAt";

export const useAutoLogout = (isLoggedIn: boolean, onLogout?: () => void) => {
  const timeoutRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(
    Number(localStorage.getItem(LAST_ACTIVITY_KEY) || Date.now()),
  );

  const clearTimer = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const setLastActivity = (timestamp: number) => {
    lastActivityRef.current = timestamp;
    localStorage.setItem(LAST_ACTIVITY_KEY, String(timestamp));
  };

  const getIdleTime = () => Date.now() - lastActivityRef.current;

  const doLogout = () => {
    clearTimer();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem(LAST_ACTIVITY_KEY);

    onLogout?.();
    window.location.replace("/login");
  };

  const resetTimer = () => {
    setLastActivity(Date.now());
    clearTimer();

    timeoutRef.current = window.setTimeout(() => {
      if (getIdleTime() >= INACTIVITY_LIMIT) {
        doLogout();
      } else {
        resetTimer();
      }
    }, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    if (!isLoggedIn) {
      clearTimer();
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      return;
    }

    const activityEvents = ["click", "touchstart", "touchmove", "keydown"];

    const handleResume = () => {
      const storedActivity = Number(
        localStorage.getItem(LAST_ACTIVITY_KEY) || Date.now(),
      );
      lastActivityRef.current = storedActivity;

      if (document.visibilityState === "hidden") {
        return;
      }

      if (getIdleTime() >= INACTIVITY_LIMIT) {
        doLogout();
      } else {
        resetTimer();
      }
    };

    activityEvents.forEach((event) =>
      window.addEventListener(event, resetTimer),
    );

    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);

    handleResume();

    return () => {
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetTimer),
      );
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
      clearTimer();
    };
  }, [isLoggedIn, onLogout]);

  return null;
};
