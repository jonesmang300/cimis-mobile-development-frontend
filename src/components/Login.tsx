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

  // ✅ Validation Schema
  const schema = Yup.object().shape({
    clusterID: Yup.string()
      .matches(
        /^\d{4}\/[A-Z]{3}\/\d{6}$/,
        "Invalid format. Expected format like 2025/CLS/000001"
      )
      .required("Cluster Code is required"),
    pin: Yup.string()
      .length(4, "PIN must be exactly 4 digits")
      .required("PIN is required"),
  });

  // ✅ Fetch clusters once
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

  // ✅ Handle Login Submit
  const handleLoginSubmit = async (formData: any) => {
    const { clusterID, pin } = formData;

    // Handle empty data
    if (fetchError || clusters.length === 0) {
      setMessage(
        "Failed to fetch clusters. Please check your connection or refresh.",
        "error"
      );
      return;
    }

    try {
      // ✅ Match clusterID & pin from DB
      const cluster = clusters.find(
        (m: any) => m.ClusterID === clusterID && m.pin === pin
      );

      if (cluster) {
        setTheSelectedCluster(cluster);
        setMessage(
          `${cluster.ClusterName} Cluster logged in successfully!`,
          "success"
        );

        // Clear success message after 2s
        setTimeout(() => setMessage("", "success"), 2000);

        onLogin();
        history.push("/home");
      } else {
        setMessage("Invalid Cluster Code or PIN. Please try again.", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Failed to login. Please try again.", "error");
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding login-content">
        {/* Notification messages */}
        {messageState.type && (
          <NotificationMessage
            text={messageState.text}
            type={messageState.type}
          />
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="loading-container">
            <IonSpinner name="bubbles" />
            <p>Loading cluster data...</p>
          </div>
        )}

        {/* Login Form */}
        <IonImg src="/comsip.jpg" className="login-img" />

        <Formik
          initialValues={{ clusterID: "", pin: "" }}
          validationSchema={schema}
          onSubmit={handleLoginSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="login-header">
                <h2>Welcome Back!</h2>
                <p>Please log in to continue.</p>
              </div>

              <TextInputField
                id="clusterID"
                name="clusterID"
                label="Cluster Code"
                placeholder="Enter Cluster Code"
                type="text"
              />
              <TextInputField
                id="pin"
                name="pin"
                label="PIN"
                type="password"
                placeholder="Enter PIN"
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

              <IonButton
                expand="block"
                fill="clear"
                color="medium"
                onClick={fetchData}
                style={{ marginTop: "0.5em" }}
              >
                Refresh Clusters
              </IonButton>
            </Form>
          )}
        </Formik>
      </IonContent>
    </IonPage>
  );
};

export default Login;
