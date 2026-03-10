import React, { useCallback, useState } from "react";
import {
  IonButtons,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuButton,
  IonPage,
  IonRow,
  IonSplitPane,
  IonTitle,
  IonToast,
  IonToolbar,
  useIonViewWillEnter,
} from "@ionic/react";

import { homeOutline, settingsOutline, peopleOutline, checkmarkCircleOutline } from "ionicons/icons";

import { getDashboardCounts } from "../../services/dashboard.service";
import DashboardStatCard from "./DashboardStatCard";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  const [totalVerified, setTotalVerified] = useState<number>(0);
  const [myVerified, setMyVerified] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const loadCounts = useCallback(async () => {
    try {
      setLoading(true);
      const { totalVerified, myVerified } = await getDashboardCounts();
      setTotalVerified(totalVerified);
      setMyVerified(myVerified);
    } catch (err) {
      console.error("Dashboard load failed:", err);
      setToastMessage("Failed to load dashboard counts");
    } finally {
      setLoading(false);
    }
  }, []);

  useIonViewWillEnter(() => {
    loadCounts();
  });

  return (
    <IonSplitPane contentId="main">
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

            <IonItem button routerLink="/validation">
  <IonIcon icon={checkmarkCircleOutline} slot="start" />
  <IonLabel>Validation</IonLabel>
</IonItem>

            <IonItem button routerLink="/group_members_summary">
              <IonIcon icon={peopleOutline} slot="start" />
              <IonLabel>Group Members Summary</IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonMenu>

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
          <IonToast
            isOpen={!!toastMessage}
            message={toastMessage}
            duration={3000}
            onDidDismiss={() => setToastMessage("")}
          />

          <IonGrid>
            <IonRow>
              <IonCol size="12" sizeMd="6">
                <DashboardStatCard
                  subtitle="Total Members Verified"
                  icon={peopleOutline}
                  routerLink="/verified_members"
                  loading={loading}
                  value={totalVerified}
                  badgeColor="success"
                />
              </IonCol>

              <IonCol size="12" sizeMd="6">
                <DashboardStatCard
                  subtitle="My Verified Members"
                  icon={peopleOutline}
                  routerLink="/verified_members_by_device"
                  loading={loading}
                  value={myVerified}
                  badgeColor="warning"
                />
              </IonCol>

              <IonCol size="12" sizeMd="6">
                <DashboardStatCard
                  subtitle="Group Members Summary"
                  icon={peopleOutline}
                  routerLink="/group_members_summary"
                  value="View Summary"
                />
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
      </IonPage>
    </IonSplitPane>
  );
};

export default Dashboard;
