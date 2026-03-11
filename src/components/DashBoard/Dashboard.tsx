import React, { useCallback, useMemo, useState } from "react";
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
import {
  barChartOutline,
  cashOutline,
  checkmarkCircleOutline,
  homeOutline,
  peopleOutline,
  pieChartOutline,
  schoolOutline,
  settingsOutline,
  storefrontOutline,
  listOutline,
} from "ionicons/icons";
import { useAuth } from "../context/AuthContext";
import { getDashboardOverview, DashboardOverview } from "../../services/dashboard.service";
import DashboardStatCard from "./DashboardStatCard";
import "./Dashboard.css";

const emptyOverview: DashboardOverview = {
  totalVerified: 0,
  myVerified: 0,
  groupsFormed: 0,
  trainings: 0,
  meetings: 0,
  aggregatedSavings: 0,
  groupIGAs: 0,
  memberIGAs: 0,
};

const formatCurrency = (value: number) => `K ${Number(value || 0).toLocaleString("en-US")}`;

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview>(emptyOverview);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const roleId = Number(user?.userRole || 0);
  const displayName =
    `${String(user?.firstname || "").trim()} ${String(user?.lastname || "").trim()}`.trim() ||
    String(user?.username || "User");

  const groupSummaryLabel =
    roleId === 5 ? "Your groups formed" : "All groups formed";

  const heroCaption = useMemo(() => {
    if (roleId === 5) {
      return "Your dashboard summary for verified members, groups formed, trainings, meetings, savings, and IGAs.";
    }
    if (roleId === 1 || roleId === 2) {
      return "System-wide summary across all groups, trainings, meetings, savings, and IGAs.";
    }
    return "Operational summary for verified members, groups, trainings, meetings, savings, and IGAs.";
  }, [roleId]);

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      const nextOverview = await getDashboardOverview();
      setOverview(nextOverview);
    } catch (error) {
      console.error("Dashboard load failed:", error);
      setToastMessage("Failed to load dashboard summary");
    } finally {
      setLoading(false);
    }
  }, []);

  useIonViewWillEnter(() => {
    loadOverview();
  });

  return (
    <IonSplitPane contentId="main">
      <IonMenu contentId="main">
        <IonHeader>
          <IonToolbar className="dashboard-toolbar">
            <IonTitle>Menu</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonList>
            <IonItem button routerLink="/home">
              <IonIcon icon={homeOutline} slot="start" />
              <IonLabel>Home</IonLabel>
            </IonItem>
            <IonItem button routerLink="/validation">
              <IonIcon icon={checkmarkCircleOutline} slot="start" />
              <IonLabel>Validation</IonLabel>
            </IonItem>
            <IonItem button routerLink="/groups">
              <IonIcon icon={peopleOutline} slot="start" />
              <IonLabel>Groups</IonLabel>
            </IonItem>
            <IonItem button routerLink="/settings">
              <IonIcon icon={settingsOutline} slot="start" />
              <IonLabel>Settings</IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonMenu>

      <IonPage id="main">
        <IonHeader>
          <IonToolbar className="dashboard-toolbar">
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="dashboard-page ion-padding">
          <IonToast
            isOpen={!!toastMessage}
            message={toastMessage}
            duration={3000}
            onDidDismiss={() => setToastMessage("")}
          />

          <section className="dashboard-hero">
            <div className="dashboard-hero-copy">
              <span className="dashboard-kicker">Operational Overview</span>
              <h1>{displayName}</h1>
              <p>{heroCaption}</p>
            </div>
            <div className="dashboard-hero-panel">
              <div className="dashboard-hero-metric">
                <span>Members Verified</span>
                <strong>{overview.totalVerified.toLocaleString()}</strong>
              </div>
              <div className="dashboard-hero-metric">
                <span>{groupSummaryLabel}</span>
                <strong>{overview.groupsFormed.toLocaleString()}</strong>
              </div>
              <div className="dashboard-hero-metric">
                <span>Aggregated Savings</span>
                <strong>{formatCurrency(overview.aggregatedSavings)}</strong>
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-head">
              <h2>Summary Cards</h2>
              <p>Counts are calculated from the groups visible to your account.</p>
            </div>

            <IonGrid className="dashboard-grid">
              <IonRow>
                <IonCol size="12" sizeMd="6" sizeLg="4">
                  <DashboardStatCard
                    title="Members Verified"
                    helper="Selected beneficiaries"
                    icon={checkmarkCircleOutline}
                    routerLink="/verified_members"
                    loading={loading}
                    value={overview.totalVerified}
                    accentClass="accent-verified"
                  />
                </IonCol>

                <IonCol size="12" sizeMd="6" sizeLg="4">
                  <DashboardStatCard
                    title={groupSummaryLabel}
                    helper={roleId === 5 ? "Groups created by you" : "All groups in scope"}
                    icon={peopleOutline}
                    routerLink="/groups"
                    loading={loading}
                    value={overview.groupsFormed}
                    accentClass="accent-groups"
                  />
                </IonCol>

                <IonCol size="12" sizeMd="6" sizeLg="4">
                  <DashboardStatCard
                    title="Group Trainings"
                    helper="Recorded training sessions"
                    icon={schoolOutline}
                    routerLink="/groups"
                    loading={loading}
                    value={overview.trainings}
                    accentClass="accent-trainings"
                  />
                </IonCol>

                <IonCol size="12" sizeMd="6" sizeLg="4">
                  <DashboardStatCard
                    title="Meetings"
                    helper="Recorded group meetings"
                    icon={listOutline}
                    routerLink="/groups"
                    loading={loading}
                    value={overview.meetings}
                    accentClass="accent-meetings"
                  />
                </IonCol>

                <IonCol size="12" sizeMd="6" sizeLg="4">
                  <DashboardStatCard
                    title="Aggregated Savings"
                    helper="Group and member savings combined"
                    icon={cashOutline}
                    routerLink="/groups"
                    loading={loading}
                    value={formatCurrency(overview.aggregatedSavings)}
                    accentClass="accent-savings"
                  />
                </IonCol>

                <IonCol size="12" sizeMd="6" sizeLg="4">
                  <DashboardStatCard
                    title="Group IGAs"
                    helper="Group IGA records"
                    icon={barChartOutline}
                    routerLink="/groups"
                    loading={loading}
                    value={overview.groupIGAs}
                    accentClass="accent-group-iga"
                  />
                </IonCol>

                <IonCol size="12" sizeMd="6" sizeLg="4">
                  <DashboardStatCard
                    title="Member IGAs"
                    helper="Beneficiary IGA records"
                    icon={storefrontOutline}
                    routerLink="/groups/beneficiaries"
                    loading={loading}
                    value={overview.memberIGAs}
                    accentClass="accent-member-iga"
                  />
                </IonCol>

                <IonCol size="12" sizeMd="6" sizeLg="4">
                  <DashboardStatCard
                    title="My Verified Members"
                    helper="Verified on this device"
                    icon={pieChartOutline}
                    routerLink="/verified_members_by_device"
                    loading={loading}
                    value={overview.myVerified}
                    accentClass="accent-device"
                  />
                </IonCol>
              </IonRow>
            </IonGrid>
          </section>
        </IonContent>
      </IonPage>
    </IonSplitPane>
  );
};

export default Dashboard;
