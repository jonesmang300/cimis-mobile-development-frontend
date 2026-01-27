import React from "react";
import {
  IonContent,
  IonPage,
  IonButton,
  IonImg,
} from "@ionic/react";
import { Formik, Form } from "formik";
import { TextInputField } from "./form";
import * as Yup from "yup";
import { useHistory } from "react-router-dom";
import { useNotificationMessage } from "./context/notificationMessageContext";
import { NotificationMessage } from "./notificationMessage";
import "./Login.css";

const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const history = useHistory();
  const { messageState, setMessage } = useNotificationMessage();

  /* ===============================
     VALIDATION SCHEMA
  =============================== */
  const schema = Yup.object().shape({
    username: Yup.string().required("Username is required"),
    pin: Yup.string().required("Password is required"),
  });

  /* ===============================
     LOGIN HANDLER
  =============================== */
  const handleLoginSubmit = async (formData: any) => {
    const { username, pin } = formData;

    /* ===============================
       STATIC ADMIN LOGIN
    =============================== */
    if (username === "admin" && pin === "admin") {
      setMessage("Admin logged in successfully!", "success");

      setTimeout(() => setMessage("", "success"), 2000);

      onLogin();
      history.push("/home");
    } else {
      setMessage("Invalid username or password.", "error");
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding login-content">
        {/* Notification Messages */}
        {messageState.type && (
          <NotificationMessage
            text={messageState.text}
            type={messageState.type}
          />
        )}

        {/* Logo */}
        <IonImg src="/comsip.jpg" className="login-img" />

        {/* Login Form */}
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
                type="text"
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
                Log In
              </IonButton>
            </Form>
          )}
        </Formik>
      </IonContent>
    </IonPage>
  );
};

export default Login;
