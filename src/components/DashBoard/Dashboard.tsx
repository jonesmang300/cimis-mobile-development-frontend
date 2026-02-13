import React, { useCallback, useState } from "react";
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
  IonBadge,
  IonToast,
  useIonViewWillEnter,
} from "@ionic/react";

import { homeOutline, settingsOutline, peopleOutline } from "ionicons/icons";

import { getDashboardCounts } from "../../services/dashboard.service";

import "./Dashboard.css";
<<<<<<< HEAD
import { useHistory } from "react-router";
=======
>>>>>>> 45238ea98bad67bd645aa7954d5a15be83fdc3f9

const Dashboard: React.FC = () => {
  const [totalVerified, setTotalVerified] = useState<number>(0);
  const [myVerified, setMyVerified] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  /**
   * ✅ Load counts from server
   */
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

  /**
   * ✅ Reload every time you return to dashboard
   */
  useIonViewWillEnter(() => {
    loadCounts();
  });

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

            <IonItem button routerLink="/validation">
              <IonIcon icon={settingsOutline} slot="start" />
              <IonLabel>Validation</IonLabel>
            </IonItem>

            {/* ✅ NEW MENU ITEM */}
            <IonItem button routerLink="/group_members_summary">
              <IonIcon icon={peopleOutline} slot="start" />
              <IonLabel>Group Members Summary</IonLabel>
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
          <IonToast
            isOpen={!!toastMessage}
            message={toastMessage}
            duration={3000}
            onDidDismiss={() => setToastMessage("")}
          />

          <IonGrid>
            <IonRow>
              {/* TOTAL VERIFIED */}
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
                      Total Members Verified
                    </IonCardSubtitle>

                    <IonCardTitle>
                      {loading ? (
                        <IonSpinner name="crescent" />
                      ) : (
                        <IonBadge color="success">
                          {totalVerified.toLocaleString()}
                        </IonBadge>
                      )}
                    </IonCardTitle>
                  </IonCardHeader>
                </IonCard>
              </IonCol>

              {/* MY VERIFIED */}
              <IonCol size="12" sizeMd="6">
                <IonCard
                  className="green-card"
                  routerLink="/verified_members_by_device"
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
                      My Verified Members
                    </IonCardSubtitle>

                    <IonCardTitle>
                      {loading ? (
                        <IonSpinner name="crescent" />
                      ) : (
                        <IonBadge color="warning">
                          {myVerified.toLocaleString()}
                        </IonBadge>
                      )}
                    </IonCardTitle>
                  </IonCardHeader>
                </IonCard>
              </IonCol>

              {/* ✅ NEW CARD: GROUP MEMBERS SUMMARY */}
              <IonCol size="12" sizeMd="6">
                <IonCard
                  className="green-card"
                  routerLink="/group_members_summary"
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
                      Group Members Summary
                    </IonCardSubtitle>

                    <IonCardTitle style={{ color: "#fff" }}>
                      View Summary
                    </IonCardTitle>
                  </IonCardHeader>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
      </IonPage>
    </IonSplitPane>
  );
};

export default Dashboard;
