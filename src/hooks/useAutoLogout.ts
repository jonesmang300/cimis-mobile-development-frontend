import { App } from "@capacitor/app";
import { useEffect, useRef } from "react";

const INACTIVITY_LIMIT = 30 * 60 * 1000;
const IDLE_CHECK_INTERVAL = 30 * 1000;
const LAST_ACTIVITY_KEY = "lastActivityAt";
type AppListenerHandle = { remove: () => Promise<void> };

export const useAutoLogout = (isLoggedIn: boolean, onLogout?: () => void) => {
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const logoutStartedRef = useRef(false);
  const parseStoredActivity = () => {
    const raw = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || Date.now());

    if (!Number.isFinite(raw) || raw <= 0) {
      return Date.now();
    }

    return raw;
  };
  const lastActivityRef = useRef<number>(parseStoredActivity());

  const clearTimer = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const clearIntervalTimer = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
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
    clearIntervalTimer();
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

  const startIdleWatcher = () => {
    clearIntervalTimer();

    intervalRef.current = window.setInterval(() => {
      if (getIdleTime() >= INACTIVITY_LIMIT) {
        doLogout();
      }
    }, IDLE_CHECK_INTERVAL);
  };

  const resetTimer = () => {
    setLastActivity(Date.now());
    scheduleTimer();
  };

  useEffect(() => {
    if (!isLoggedIn) {
      logoutStartedRef.current = false;
      clearTimer();
      clearIntervalTimer();
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      return;
    }

    logoutStartedRef.current = false;

    const activityEvents = [
      "click",
      "keydown",
      "mousedown",
      "mousemove",
      "pointerdown",
      "scroll",
      "touchstart",
      "touchmove",
      "wheel",
    ] as const;

    const handleResume = () => {
      lastActivityRef.current = parseStoredActivity();

      if (document.visibilityState === "hidden") {
        return;
      }

      if (getIdleTime() >= INACTIVITY_LIMIT) {
        doLogout();
      } else {
        scheduleTimer();
        startIdleWatcher();
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LAST_ACTIVITY_KEY) {
        lastActivityRef.current = parseStoredActivity();
        scheduleTimer();
        startIdleWatcher();
        return;
      }

      if (event.key === "token" && !event.newValue) {
        doLogout();
      }
    };

    activityEvents.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true }),
    );

    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);
    window.addEventListener("storage", handleStorage);

    let appStateListener: AppListenerHandle | undefined;
    App.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) {
        clearTimer();
        clearIntervalTimer();
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
      clearIntervalTimer();
    };
  }, [isLoggedIn, onLogout]);

  return null;
};
