import { App } from "@capacitor/app";
import { useEffect, useRef } from "react";

const INACTIVITY_LIMIT = 30 * 60 * 1000;
const LAST_ACTIVITY_KEY = "lastActivityAt";
type AppListenerHandle = { remove: () => Promise<void> };

export const useAutoLogout = (isLoggedIn: boolean, onLogout?: () => void) => {
  const timeoutRef = useRef<number | null>(null);
  const logoutStartedRef = useRef(false);
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
    if (logoutStartedRef.current) {
      return;
    }

    logoutStartedRef.current = true;
    clearTimer();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem(LAST_ACTIVITY_KEY);

    onLogout?.();
  };

  const scheduleTimer = () => {
    clearTimer();

    const remaining = Math.max(0, INACTIVITY_LIMIT - getIdleTime());

    timeoutRef.current = window.setTimeout(() => {
      if (getIdleTime() >= INACTIVITY_LIMIT) {
        doLogout();
      } else {
        scheduleTimer();
      }
    }, remaining);
  };

  const resetTimer = () => {
    setLastActivity(Date.now());
    scheduleTimer();
  };

  useEffect(() => {
    if (!isLoggedIn) {
      logoutStartedRef.current = false;
      clearTimer();
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      return;
    }

    logoutStartedRef.current = false;

    const activityEvents = [
      "click",
      "keydown",
      "mousedown",
      "pointerdown",
      "touchstart",
    ] as const;

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
        scheduleTimer();
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LAST_ACTIVITY_KEY) {
        lastActivityRef.current = Number(event.newValue || Date.now());
        scheduleTimer();
        return;
      }

      if (event.key === "token" && !event.newValue) {
        doLogout();
      }
    };

    activityEvents.forEach((event) =>
      window.addEventListener(event, resetTimer),
    );

    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);
    window.addEventListener("storage", handleStorage);

    let appStateListener: AppListenerHandle | undefined;
    App.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) {
        clearTimer();
        return;
      }

      handleResume();
    })
      .then((listener) => {
        appStateListener = listener;
      })
      .catch(() => null);

    handleResume();

    return () => {
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetTimer),
      );
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
      window.removeEventListener("storage", handleStorage);
      appStateListener?.remove().catch(() => null);
      clearTimer();
    };
  }, [isLoggedIn, onLogout]);

  return null;
};
