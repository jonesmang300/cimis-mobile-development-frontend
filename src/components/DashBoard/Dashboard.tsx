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
  IonBadge,
} from "@ionic/react";
import {
  cashOutline,
  homeOutline,
  settingsOutline,
  peopleOutline,
  schoolOutline,
} from "ionicons/icons";

import "./Dashboard.css";
import { useHistory } from "react-router";

const Dashboard: React.FC = () => {
  const [savings, setSavings] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [totalSavings, setTotalSavings] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const BASE_URL = "https://api-development-j6pl.onrender.com/api";

  const history = useHistory();
  const [totalMembers, setTotalMembers] = useState<number>(0);
  const [loadingTotal, setLoadingTotal] = useState(false);

  // Calculate total savings for the cluster

  // Fetch savings and groups

  // ✅ handle click to navigate

  useEffect(() => {
    const loadTotalMembers = async () => {
      try {
        setLoadingTotal(true);
        const res = await fetch(`${BASE_URL}/beneficiaries/count/selected`);
        const data = await res.json();
        setTotalMembers(Number(data.total) || 0);
      } catch (err) {
        console.error("Failed to load total members", err);
      } finally {
        setLoadingTotal(false);
      }
    };

    loadTotalMembers();
  }, []);

  return (
    <IonSplitPane contentId="main">
      {/* SIDE MENU */}
      <IonMenu contentId="main">
        <IonHeader>
          <IonToolbar className="green-toolbar">
            <IonTitle>Menu</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonList>
            <IonItem button routerLink="/dashboard">
              <IonIcon icon={homeOutline} slot="start" />
              <IonLabel>Home</IonLabel>
            </IonItem>

            <IonItem button routerLink="/settings">
              <IonIcon icon={settingsOutline} slot="start" />
              <IonLabel>Settings</IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonMenu>

      {/* MAIN PAGE */}
      <IonPage id="main">
        <IonHeader>
          <IonToolbar className="green-toolbar">
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="dashboard-bg ion-padding">
          {loading ? (
            <div className="loading-container">
              <IonSpinner name="crescent" />
              <p>Loading data...</p>
            </div>
          ) : error ? (
            <IonCard color="danger">
              <IonCardContent>{error}</IonCardContent>
            </IonCard>
          ) : (
            <IonGrid>
              <IonRow>
                {/* Total Groups Card */}
                <IonCol size="12" sizeMd="6">
                  <IonCard
                    className="green-card"
                    routerLink="/verified_members"
                    button
                  >
                    <IonCardHeader>
                      <IonIcon
                        icon={peopleOutline}
                        size="large"
                        className="card-icon"
                        style={{ color: "#fff" }}
                      />

                      <IonCardSubtitle style={{ color: "#fff" }}>
                        Verified Members
                      </IonCardSubtitle>

                      <IonCardTitle>
                        {loadingTotal ? (
                          <IonSpinner name="crescent" />
                        ) : (
                          <IonBadge color="success">
                            {totalMembers.toLocaleString()}
                          </IonBadge>
                        )}
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
