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
import { getData } from "../../services/apiServices";
import { useHistory } from "react-router";

const Dashboard: React.FC = () => {
  const [savings, setSavings] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [totalSavings, setTotalSavings] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const history = useHistory();

  // Calculate total savings for the cluster

  // Fetch savings and groups

  // ✅ handle click to navigate

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
              {/* Cluster Name */}
              <IonItem lines="none">
                <IonLabel>
                  <strong>Cluster:</strong>
                </IonLabel>
              </IonItem>

              <IonRow>
                {/* Total Groups Card */}
                <IonCol size="12" sizeMd="6">
                  <IonCard className="green-card" routerLink="/groups">
                    <IonCardHeader>
                      <IonIcon
                        icon={peopleOutline}
                        size="large"
                        className="card-icon"
                      />
                      <IonCardSubtitle>Total Groups</IonCardSubtitle>
                      <IonCardTitle></IonCardTitle>
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
