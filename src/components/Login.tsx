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

  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<boolean>(false);

  // Yup validation schema
  const schema = Yup.object().shape({
    clusterCode: Yup.string()
      .matches(
        /^\d{4}\/[A-Z]{3}\/\d{6}$/,
        "Invalid format. Expected format like 2025/CLS/000001"
      )
      .min(15, "Cluster Code must be exactly 15 characters")
      .max(15, "Cluster Code must be exactly 15 characters")
      .required("Cluster Code is required"),
    pin: Yup.string()
      .min(4, "PIN must be exactly 4 digits")
      .max(4, "PIN must be exactly 4 digits")
      .required("PIN is required"),
  });

  // Fetch clusters once on mount
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

  const handleLoginSubmit = async (formData: any) => {
    const { clusterCode, pin } = formData;

    // If data failed to load, show message here (after clicking login)
    if (fetchError || clusters.length === 0) {
      setMessage(
        "Failed to fetch clusters. Please check your connection or refresh.",
        "error"
      );
      return;
    }

    try {
      const cluster = clusters.filter(
        (m: any) => m.clusterCode === clusterCode && m.pin === pin
      );

      if (cluster.length !== 0) {
        setTheSelectedCluster(cluster);
        setMessage(
          `${cluster[0]?.name} Cluster logged in successfully!`,
          "success"
        );

        // Automatically clear the message after 2 seconds
        setTimeout(() => setMessage("", "success"), 2000);

        onLogin();
        history.push("/home");
      } else {
        setMessage(
          "Failed to login. Please check Cluster Code or PIN and try again.",
          "error"
        );
      }
    } catch (error) {
      console.error(error);
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

        {/* Show loading spinner while fetching clusters */}
        {loading && (
          <div className="loading-container">
            <IonSpinner name="bubbles" />
            <p>Loading cluster data...</p>
          </div>
        )}

        {/* Always show login form, regardless of fetch status */}
        <IonImg src="/comsip.jpg" className="login-img" />

        <Formik
          initialValues={{ clusterCode: "", pin: "" }}
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
                id="clusterCode"
                name="clusterCode"
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

              {/* Optional refresh button */}
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
