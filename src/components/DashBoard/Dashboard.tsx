import React, { useEffect, useState } from "react";
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
  IonRow,
  IonCol,
  IonMenu,
  IonList,
  IonItem,
  IonLabel,
  IonMenuButton,
  IonButtons,
  IonSplitPane,
  IonText,
} from "@ionic/react";
import {
  cashOutline,
  trendingUpOutline,
  homeOutline,
  settingsOutline,
} from "ionicons/icons";

import "./Dashboard.css"; // Include custom CSS for styling
import { useClusters } from "../context/ClustersContext";

const Dashboard: React.FC = () => {
  // State for dynamic numbers
  const [totalSavings, setTotalSavings] = useState<number>(233500);
  const [totalLoans, setTotalLoans] = useState<number>(400200);
  const [loanStatuses, setLoanStatuses] = useState({
    pendingApprovals: 0,
    pendingDisbursements: 0,
    outstandingLoans: 0,
    cleared: 0,
    writtenOff: 0,
    rejected: 0,
  });
  const { clusters, returnClusters, selectedCluster, setTheSelectedCluster } =
    useClusters();

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
            {/* Dashboard */}
            <IonItem button routerLink="/dashboard">
              <IonIcon icon={homeOutline} slot="start" size="large" />
              <IonLabel style={{ fontSize: "1.2rem" }}>Home</IonLabel>
            </IonItem>
            {/* Settings */}
            <IonItem button routerLink="/settings">
              <IonIcon icon={settingsOutline} slot="start" size="large" />
              <IonLabel style={{ fontSize: "1.2rem" }}>Settings</IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonMenu>

      {/* Main Content */}
      <IonPage id="main">
        {/* Header */}
        <IonHeader>
          <IonToolbar style={{ backgroundColor: "#4CAF50" }}>
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Content */}
        <IonContent
          className="ion-padding"
          style={{ backgroundColor: "#f4f7fa" }}
        >
          <IonGrid>
            {/* Total Savings */}
            <IonCol size="12" sizeMd="6">
              <IonItem>
                <p>{selectedCluster.ClusterName}</p>
                <p style={{ marginLeft: "10px" }}></p>
                Cluster
              </IonItem>

              <IonCard
                className="custom-card green-card"
                button
                routerLink="/savings" // Navigate to savings page
              >
                <IonCardHeader>
                  <IonIcon
                    icon={cashOutline}
                    size="large"
                    style={{ color: "#ffffff", marginBottom: "10px" }}
                  />
                  <IonCardSubtitle style={{ color: "#ffffff" }}>
                    Total Savings
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
                  Contributions made by all group members.
                </IonCardContent>
              </IonCard>
            </IonCol>

            {/* Total Loans */}
            <IonCol size="12" sizeMd="6">
              <IonCard
                className="custom-card green-card"
                button
                routerLink="/loans" // Navigate to loans page
              >
                <IonCardHeader>
                  <IonIcon
                    icon={trendingUpOutline}
                    size="large"
                    style={{ color: "#ffffff", marginBottom: "10px" }}
                  />
                  <IonCardSubtitle style={{ color: "#ffffff" }}>
                    Total Loans
                  </IonCardSubtitle>
                  <IonCardTitle
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: "bold",
                      color: "#ffffff",
                    }}
                  >
                    K {totalLoans.toLocaleString()}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent style={{ color: "#ffffff" }}>
                  Amount loaned out to members.
                </IonCardContent>
              </IonCard>
            </IonCol>
            {/* Loan Status Card */}
            <IonRow>
              <IonCol size="12">
                <IonCard className="group-loans-card">
                  <IonCardHeader>
                    <IonCardSubtitle style={{ color: "#4CAF50" }}>
                      Group Loans
                    </IonCardSubtitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonGrid>
                      {Object.entries(loanStatuses).map(([status, count]) => (
                        <IonRow className="loan-row" key={status}>
                          <IonCol size="9">
                            {status
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </IonCol>
                          <IonCol
                            size="3"
                            style={{
                              textAlign: "right",
                              fontWeight: "bold",
                              color: "#555",
                            }}
                          >
                            {count}
                          </IonCol>
                        </IonRow>
                      ))}
                    </IonGrid>
                  </IonCardContent>
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
