import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonPage,
  IonButton,
  IonImg,
  IonSpinner,
} from "@ionic/react";
import { Formik, Form } from "formik";
import { TextInputField } from "./form";
import * as Yup from "yup";
import { useHistory } from "react-router-dom";
import { getData } from "../services/apiServices";
import { useClusters } from "./context/ClustersContext";
import { useNotificationMessage } from "./context/notificationMessageContext";
import { NotificationMessage } from "./notificationMessage";
import "./Login.css";

const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const history = useHistory();

  const { messageState, setMessage } = useNotificationMessage();
  const { clusters, returnClusters, setTheSelectedCluster } = useClusters();

  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  /* ===============================
     VALIDATION SCHEMA
     (Allows admin + cluster users)
  =============================== */
  const schema = Yup.object().shape({
    clusterID: Yup.string().required("Username is required"),
    pin: Yup.string().required("Password is required"),
  });

  /* ===============================
     FETCH CLUSTERS
  =============================== */
  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getData("/api/cluster");
      returnClusters(result);
      setFetchError(false);
    } catch (error) {
      console.error("Cluster fetch failed:", error);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ===============================
     LOGIN HANDLER
  =============================== */
  const handleLoginSubmit = async (formData: any) => {
    const { clusterID, pin } = formData;

    /* ===============================
       STATIC ADMIN LOGIN
    =============================== */
    if (clusterID === "admin" && pin === "admin") {
      setMessage("Admin logged in successfully!", "success");

      setTimeout(() => setMessage("", "success"), 2000);

      onLogin();
      history.push("/home");
      return;
    }

    /* ===============================
       CLUSTER LOGIN
    =============================== */
    if (fetchError || clusters.length === 0) {
      setMessage("Failed to Login. Please check your credentials.", "error");
      return;
    }

    try {
      const cluster = clusters.find(
        (m: any) => m.ClusterID === clusterID && m.pin === pin,
      );

      if (cluster) {
        setTheSelectedCluster(cluster);
        setMessage(`${cluster.ClusterName} Logged in successfully!`, "success");

        setTimeout(() => setMessage("", "success"), 2000);

        onLogin();
        history.push("/home");
      } else {
        setMessage("Invalid username or password.", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Login failed. Please try again.", "error");
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

        {/* Loading */}
        {loading && (
          <div className="loading-container">
            <IonSpinner name="bubbles" />
            <p>Loading cluster data...</p>
          </div>
        )}

        {/* Logo */}
        <IonImg src="/comsip.jpg" className="login-img" />

        {/* Login Form */}
        <Formik
          initialValues={{ clusterID: "", pin: "" }}
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
                id="clusterID"
                name="clusterID"
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
