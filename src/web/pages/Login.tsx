import React, { FormEvent, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { IonIcon, IonSpinner } from "@ionic/react";
import { lockClosedOutline, personOutline } from "ionicons/icons";

import { apiPost } from "../../services/api";
import { useAuth } from "../../components/context/AuthContext";

type MessageState = {
  text: string;
  type: "error" | "success" | "";
};

const LOGIN_TIMEOUT_MS = 15000;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number) => {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error("Login request timed out. Please try again."));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

const WebLogin: React.FC = () => {
  const history = useHistory();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<MessageState>({ text: "", type: "" });

  const canSubmit = useMemo(
    () => username.trim() !== "" && password.trim() !== "" && !submitting,
    [password, submitting, username],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setMessage({ text: "", type: "" });

    try {
      if (!navigator.onLine) {
        const saved = localStorage.getItem("offline_user");
        if (!saved) {
          throw new Error("No offline account found");
        }

        const parsed = JSON.parse(saved);
        if (parsed.username !== username || parsed.password !== password) {
          throw new Error("Invalid offline credentials");
        }

        login(parsed.token, parsed.user);
        setMessage({ text: "Offline login successful", type: "success" });
        history.replace("/home");
        return;
      }

      const res = await withTimeout(
        apiPost("/users/login", {
          username: username.trim(),
          password,
        }),
        LOGIN_TIMEOUT_MS,
      );

      if (!res?.token) {
        throw new Error("Login failed");
      }

      login(res.token, res.user || null);
      localStorage.setItem(
        "offline_user",
        JSON.stringify({
          username: username.trim(),
          password,
          token: res.token,
          user: res.user,
        }),
      );

      setMessage({ text: "Login successful", type: "success" });
      history.replace("/home");
    } catch (error: any) {
      const rawMessage = String(error?.message || "Login failed").trim();
      setMessage({
        text:
          rawMessage.toLowerCase() === "invalid credentials"
            ? "Incorrect username or password."
            : rawMessage,
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="web-login">
      <div className="web-login__backdrop" />
      <div className="web-login__shell">
        <section className="web-login__hero">
          <span className="web-login__eyebrow">COMSIP Web</span>
          <h1>Sign in to the browser workspace</h1>
          <p>
            Use the web portal for formation, group management, beneficiary assignment, and admin
            tasks with a layout designed for desktop and tablet screens.
          </p>

          <div className="web-login__highlights">
            <div className="web-login__highlight">
              <strong>Formation</strong>
              <span>Create groups and allocate beneficiaries from the web.</span>
            </div>
            <div className="web-login__highlight">
              <strong>Operations</strong>
              <span>Move through groups, trainings, savings, meetings, and IGAs faster.</span>
            </div>
            <div className="web-login__highlight">
              <strong>Responsive</strong>
              <span>Optimized for wide screens, tablets, and smaller browser windows.</span>
            </div>
          </div>
        </section>

        <section className="web-login__panel">
          <div className="web-login__panel-head">
            <img src="/comsip.jpg" alt="COMSIP" className="web-login__logo" />
            <div>
              <h2>Web Login</h2>
              <p>Enter your account details to continue.</p>
            </div>
          </div>

          {message.text ? (
            <div className={`alert-banner ${message.type === "error" ? "alert-error" : "alert-success"}`}>
              {message.text}
            </div>
          ) : null}

          <form className="web-login__form" onSubmit={handleSubmit}>
            <label className="web-login__field">
              <span>Username</span>
              <div className="web-login__input-wrap">
                <IonIcon icon={personOutline} />
                <input
                  className="input web-login__input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                />
              </div>
            </label>

            <label className="web-login__field">
              <span>Password</span>
              <div className="web-login__input-wrap">
                <IonIcon icon={lockClosedOutline} />
                <input
                  className="input web-login__input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </div>
            </label>

            <button className="btn web-login__submit" type="submit" disabled={!canSubmit}>
              {submitting ? (
                <span className="web-login__submit-content">
                  <IonSpinner name="crescent" />
                  <span>Signing in...</span>
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="web-login__footnote">
            Need access help? Contact your system administrator or regional admin.
          </p>
        </section>
      </div>
    </div>
  );
};

export default WebLogin;
