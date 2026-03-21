import React, { useEffect, useState } from "react";
import {
  IonButton,
  IonContent,
  IonImg,
  IonPage,
  IonSpinner,
  IonText,
  IonToast,
} from "@ionic/react";
import { App as CapacitorApp } from "@capacitor/app";
import { Form, Formik } from "formik";
import { useHistory } from "react-router-dom";
import * as Yup from "yup";
import { motion } from "framer-motion";

import { apiPost } from "../services/api";
import { TextInputField } from "./form";
import { useAuth } from "./context/AuthContext";

import "./Login.css";

type MessageType = "success" | "error" | "";

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

const Login: React.FC = () => {
  const history = useHistory();
  const { login } = useAuth();

  const [messageState, setMessageState] = useState({
    text: "",
    type: "" as MessageType,
  });

  const schema = Yup.object().shape({
    username: Yup.string().required("Username is required"),
    pin: Yup.string().required("Password is required"),
  });

  useEffect(() => {
    const listener = CapacitorApp.addListener("backButton", () => {
      history.replace("/login");
    });

    return () => {
      listener.then((handle) => handle.remove()).catch(() => null);
    };
  }, [history]);

  const handleLoginSubmit = async (
    formData: { username: string; pin: string },
    { setSubmitting }: any,
  ) => {
    setMessageState({ text: "", type: "" });

    try {
      // 🌍 OFFLINE LOGIN
      if (!navigator.onLine) {
        const saved = localStorage.getItem("offline_user");
        if (!saved) throw new Error("No offline account found");

        const parsed = JSON.parse(saved);

        if (
          parsed.username === formData.username &&
          parsed.password === formData.pin
        ) {
          login(parsed.token, parsed.user);

          setMessageState({
            text: "Offline login successful",
            type: "success",
          });

          history.replace("/home");
          return;
        } else {
          throw new Error("Invalid offline credentials");
        }
      }

      // 🌐 ONLINE LOGIN
      const res = await withTimeout(
        apiPost("/users/login", {
          username: formData.username,
          password: formData.pin,
        }),
        LOGIN_TIMEOUT_MS,
      );

      if (!res?.token) throw new Error("Login failed");

      login(res.token, res.user || null);

      // SAVE FOR OFFLINE USE
      localStorage.setItem(
        "offline_user",
        JSON.stringify({
          username: formData.username,
          password: formData.pin,
          token: res.token,
          user: res.user,
        }),
      );

      setMessageState({
        text: "Login successful",
        type: "success",
      });

      history.replace("/home");
    } catch (error: any) {
      const rawMessage = String(error?.message || "Login failed").trim();
      setMessageState({
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
    <IonPage>
      <IonContent fullscreen className="login-content">
        <IonToast
          isOpen={!!messageState.type}
          message={messageState.text}
          color={messageState.type === "success" ? "success" : "danger"}
          duration={2500}
          position="top"
          onDidDismiss={() => setMessageState({ text: "", type: "" })}
        />

        {/* HERO */}
        <motion.div
          className="login-hero"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <IonImg src="/comsip.jpg" className="login-img" />
          <div className="brand-stack-inline">
            <IonText className="brand-kicker">CIMISMOB</IonText>
            <h1 className="brand-title">Welcome</h1>
          </div>
        </motion.div>

        {/* CARD */}
        <motion.div
          className="login-card"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Formik
            initialValues={{ username: "", pin: "" }}
            validationSchema={schema}
            onSubmit={handleLoginSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="login-form">
                <TextInputField
                  id="username"
                  name="username"
                  label="Username"
                  placeholder="Enter username"
                />

                <TextInputField
                  id="pin"
                  name="pin"
                  label="Password"
                  type="password"
                  placeholder="Enter password"
                />

                <motion.div whileTap={{ scale: 0.97 }}>
                  <IonButton
                    expand="block"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="login-button-content">
                        <IonSpinner
                          name="crescent"
                          className="login-button-spinner"
                        />
                        <span>Logging in...</span>
                      </span>
                    ) : (
                      "LOG IN"
                    )}
                  </IonButton>
                </motion.div>

                <p className="login-footnote">
                  Problems signing in? Contact your regional admin.
                </p>
              </Form>
            )}
          </Formik>
        </motion.div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
