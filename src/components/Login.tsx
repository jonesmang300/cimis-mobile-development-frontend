import React, { useState } from "react";
import { IonButton, IonContent, IonImg, IonPage, IonText } from "@ionic/react";
import { Form, Formik } from "formik";
import { useHistory } from "react-router-dom";
import * as Yup from "yup";

import { apiPost } from "../services/api";
import { TextInputField } from "./form";
import { NotificationMessage } from "./notificationMessage";
import { useAuth } from "./context/AuthContext";

import "./Login.css";

type MessageType = "success" | "error" | "";

type LoginResponse = {
  token: string;
  user: {
    id: number | string;
    username?: string;
    email?: string;
    userRole?: string;
    firstname?: string;
    lastname?: string;
  };
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

  const handleLoginSubmit = async (
    formData: { username: string; pin: string },
    { setSubmitting }: any,
  ) => {
    try {
      const res = await apiPost<LoginResponse>("/users/login", {
        username: formData.username,
        password: formData.pin,
      });

      if (!res?.token) {
        throw new Error("Login failed");
      }

      login(res.token, res.user || null);

      setMessageState({
        text: "Login successful",
        type: "success",
      });

      history.replace("/home");
    } catch (error: any) {
      setMessageState({
        text: error?.message || "Invalid username or password",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding login-content">
        <IonText style={{ color: "white", marginBottom: "20px" }}>
          Login Page Loaded
        </IonText>

        {messageState.type && (
          <NotificationMessage
            text={messageState.text}
            type={messageState.type}
          />
        )}

        <IonImg src="/comsip.jpg" className="login-img" />

        <Formik
          initialValues={{ username: "", pin: "" }}
          validationSchema={schema}
          onSubmit={handleLoginSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="login-header">
                <h2>Welcome Back</h2>
                <p>Please log in to continue</p>
              </div>

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

              <IonButton
                expand="block"
                color="success"
                type="submit"
                style={{ marginTop: "1em" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Log In"}
              </IonButton>
            </Form>
          )}
        </Formik>
      </IonContent>
    </IonPage>
  );
};

export default Login;
