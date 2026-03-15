import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type AuthUser = {
  id?: number | string;
  username?: string;
  email?: string;
  userRole?: string;
  firstname?: string;
  lastname?: string;
};

type AuthContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (token: string, user: AuthUser | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const rawUser = localStorage.getItem("user");

      setIsLoggedIn(!!token);

      if (rawUser) {
        setUser(JSON.parse(rawUser));
      }
    } catch (error) {
      console.error("AuthContext parse error:", error);
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((token: string, nextUser: AuthUser | null) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(nextUser || null));

    setIsLoggedIn(true);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");

    setIsLoggedIn(false);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
    const activityEvents: (keyof DocumentEventMap)[] = [
      "click",
      "keydown",
      "touchstart",
      "mousemove",
    ];

    const resetTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      inactivityTimer = setTimeout(() => {
        logout();
      }, INACTIVITY_LIMIT_MS);
    };

    activityEvents.forEach((eventName) =>
      document.addEventListener(eventName, resetTimer),
    );
    resetTimer();

    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      activityEvents.forEach((eventName) =>
        document.removeEventListener(eventName, resetTimer),
      );
    };
  }, [isLoggedIn, logout]);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
