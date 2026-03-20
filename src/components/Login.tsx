import React, { useState } from "react";
import {
  IonButton,
  IonContent,
  IonImg,
  IonPage,
  IonSpinner,
  IonText,
} from "@ionic/react";
import { Form, Formik } from "formik";
import { useHistory } from "react-router-dom";
import * as Yup from "yup";
import { motion } from "framer-motion";

import { apiPost } from "../services/api";
import { TextInputField } from "./form";
import { NotificationMessage } from "./notificationMessage";
import { useAuth } from "./context/AuthContext";

import "./Login.css";

type MessageType = "success" | "error" | "";

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

  const handleLoginSubmit = async (
    formData: { username: string; pin: string },
    { setSubmitting }: any,
  ) => {
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
      const res = await apiPost("/users/login", {
        username: formData.username,
        password: formData.pin,
      });

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
      setMessageState({
        text: error?.message || "Login failed",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="login-content">
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
          {messageState.type && (
            <NotificationMessage
              text={messageState.text}
              type={messageState.type}
            />
          )}

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
