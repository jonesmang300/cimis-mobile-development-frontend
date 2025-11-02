import React, { useEffect, useState, useCallback } from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonCol,
  IonRow,
  IonMenu,
  IonList,
  IonItem,
  IonLabel,
  IonMenuButton,
  IonButtons,
  IonSplitPane,
  IonSpinner,
  IonButton,
} from "@ionic/react";
import {
  cashOutline,
  homeOutline,
  settingsOutline,
  peopleOutline,
  schoolOutline,
} from "ionicons/icons";

import "./Dashboard.css";
import { useClusters } from "../context/ClustersContext";
import { getData } from "../../services/apiServices";
import { useHistory } from "react-router";

const Dashboard: React.FC = () => {
  const [savings, setSavings] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [totalSavings, setTotalSavings] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const history = useHistory();

  const { selectedCluster } = useClusters();

  // Calculate total savings for the cluster
  const calculateClusterSavings = useCallback(() => {
    if (!selectedCluster?.ClusterID || !savings.length) {
      setTotalSavings(0);
      return;
    }

    const clusterCode = String(selectedCluster.ClusterID).trim();
    const clusterSavings = savings.filter(
      (s: any) =>
        String(s.clusterCode || s.ClusterID || "").trim() === clusterCode
    );

    const total = clusterSavings.reduce(
      (sum, s) => sum + (parseFloat(s.Amount) || 0),
      0
    );

    setTotalSavings(total);
  }, [selectedCluster, savings]);

  // Fetch savings and groups
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCluster?.ClusterID) return;
      try {
        setLoading(true);
        setError(null);

        const encodedClusterID = encodeURIComponent(selectedCluster.ClusterID);

        const [savingsResult, groupsResult] = await Promise.all([
          getData("/api/savings"),
          getData(`/api/groups-cluster/${encodedClusterID}`),
        ]);

        setSavings(
          Array.isArray(savingsResult)
            ? savingsResult
            : savingsResult.data || []
        );
        setGroups(
          Array.isArray(groupsResult) ? groupsResult : groupsResult.data || []
        );
      } catch (err) {
        console.error("❌ Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCluster]);

  // Recalculate total savings whenever data changes
  useEffect(() => {
    calculateClusterSavings();
  }, [savings, selectedCluster, calculateClusterSavings]);

  const totalGroups = groups.length;
  const totalTrainings = 5; // static value, change as needed

  // ✅ handle click to navigate
  const handleTrainingClick = () => {
    history.push("/trainings");
  };

  return (
    <IonSplitPane contentId="main">
      {/* Sidebar */}
      <IonMenu contentId="main">
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Menu</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            <IonItem button routerLink="/dashboard">
              <IonIcon icon={homeOutline} slot="start" size="large" />
              <IonLabel style={{ fontSize: "1.2rem" }}>Home</IonLabel>
            </IonItem>
            <IonItem button routerLink="/settings">
              <IonIcon icon={settingsOutline} slot="start" size="large" />
              <IonLabel style={{ fontSize: "1.2rem" }}>Settings</IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonMenu>

      {/* Main Page */}
      <IonPage id="main">
        <IonHeader>
          <IonToolbar style={{ backgroundColor: "#4CAF50" }}>
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent
          className="ion-padding"
          style={{ backgroundColor: "#f4f7fa" }}
        >
          {loading ? (
            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <IonSpinner name="crescent" />
              <p>Loading data...</p>
            </div>
          ) : error ? (
            <IonCard color="danger">
              <IonCardContent>{error}</IonCardContent>
            </IonCard>
          ) : (
            <IonGrid>
              {/* Cluster Name */}
              <IonItem lines="none">
                <IonLabel>
                  <strong>Cluster:</strong>{" "}
                  {selectedCluster?.ClusterName || "N/A"}
                </IonLabel>
              </IonItem>

              <IonRow>
                {/* Total Trainings Card */}
                <IonCol size="12" sizeMd="6">
                  <IonCard className="custom-card green-card">
                    <IonCardHeader>
                      <IonIcon
                        icon={schoolOutline}
                        size="large"
                        style={{ color: "#ffffff", marginBottom: "10px" }}
                      />
                      <IonCardSubtitle style={{ color: "#ffffff" }}>
                        Total Trainings in Cluster
                      </IonCardSubtitle>
                      <IonCardTitle
                        style={{
                          fontSize: "1.8rem",
                          fontWeight: "bold",
                          color: "#ffffff",
                        }}
                      >
                        {totalTrainings}
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonButton
                        expand="block"
                        color="success"
                        onClick={handleTrainingClick}
                      >
                        Trainings
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                {/* Total Savings Card */}
                <IonCol size="12" sizeMd="6">
                  <IonCard
                    className="custom-card green-card"
                    button
                    routerLink="/savings"
                  >
                    <IonCardHeader>
                      <IonIcon
                        icon={cashOutline}
                        size="large"
                        style={{ color: "#ffffff", marginBottom: "10px" }}
                      />
                      <IonCardSubtitle style={{ color: "#ffffff" }}>
                        Total Savings in Cluster
                      </IonCardSubtitle>
                      <IonCardTitle
                        style={{
                          fontSize: "1.8rem",
                          fontWeight: "bold",
                          color: "#ffffff",
                        }}
                      >
                        K {totalSavings.toLocaleString()}
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent style={{ color: "#ffffff" }}>
                      Combined savings for cluster{" "}
                      {selectedCluster?.ClusterName}.
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                {/* Total Groups Card */}
                <IonCol size="12" sizeMd="6">
                  <IonCard
                    className="custom-card blue-card"
                    button
                    routerLink="/groups"
                  >
                    <IonCardHeader>
                      <IonIcon
                        icon={peopleOutline}
                        size="large"
                        style={{ color: "", marginBottom: "10px" }}
                      />
                      <IonCardSubtitle style={{ color: "" }}>
                        Total Groups in {selectedCluster?.ClusterName} Cluster
                      </IonCardSubtitle>
                      <IonCardTitle
                        style={{
                          fontSize: "1.8rem",
                          fontWeight: "bold",
                          color: "",
                        }}
                      >
                        {totalGroups}
                      </IonCardTitle>
                    </IonCardHeader>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonGrid>
          )}
        </IonContent>
      </IonPage>
    </IonSplitPane>
  );
};

export default Dashboard;
