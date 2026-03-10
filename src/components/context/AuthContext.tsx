import React, { createContext, useContext, useEffect, useState } from "react";

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
  user: AuthUser | null;
  login: (token: string, user: AuthUser | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");
    setIsLoggedIn(!!token);
    setUser(rawUser ? (JSON.parse(rawUser) as AuthUser) : null);
  }, []);

  const login = (token: string, nextUser: AuthUser | null) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(nextUser || null));
    setIsLoggedIn(true);
    setUser(nextUser || null);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
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
