import React, { useCallback, useMemo, useState } from "react";
import {
  IonBadge,
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
  IonMenuToggle,
  IonPage,
  IonRow,
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
  storefrontOutline,
  listOutline,
  notificationsOutline,
  settingsOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardOverview, DashboardOverview } from "../../services/dashboard.service";
import DashboardStatCard from "./DashboardStatCard";
import { subscribeQueueCount, subscribeSyncUpdates } from "../../data/sync";
import { onNetworkChange } from "../../plugins/network";
import "./Dashboard.css";

const emptyOverview: DashboardOverview = {
  totalVerified: 0,
  myVerified: 0,
  groupsFormed: 0,
  trainings: 0,
  meetings: 0,
  aggregatedGroupSavings: 0,
  aggregatedMemberSavings: 0,
  aggregatedSavings: 0,
  groupIGAs: 0,
  memberIGAs: 0,
};

const formatCurrency = (value: number) => `K ${Number(value || 0).toLocaleString("en-US")}`;

const Dashboard: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview>(emptyOverview);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [queued, setQueued] = useState(0);
  const [online, setOnline] = useState<boolean | null>(null);
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
    if (roleId === 2) {
      return "Regional summary across your assigned regions for verified members, groups, trainings, meetings, savings, and IGAs.";
    }
    if (roleId === 1) {
      return "System-wide summary across all groups, trainings, meetings, savings, and IGAs.";
    }
    return "Operational summary for verified members, groups, trainings, meetings, savings, and IGAs.";
  }, [roleId]);

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      const nextOverview = await getDashboardOverview(roleId);
      setOverview(nextOverview);
    } catch (error) {
      console.error("Dashboard load failed:", error);
      setToastMessage("Failed to load dashboard summary");
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  useIonViewWillEnter(() => {
    loadOverview();
  });

  React.useEffect(() => {
    const unsubscribeQueue = subscribeQueueCount((count) => setQueued(count));
    const unsubscribeSync = subscribeSyncUpdates(() => {
      loadOverview();
    });
    const unsubscribeNet = onNetworkChange((connected) => setOnline(connected));
    return () => {
      unsubscribeQueue();
      unsubscribeSync();
      unsubscribeNet();
    };
  }, [loadOverview]);

  const openSummary = useCallback(
    (
      key:
        | "verified"
        | "groups"
        | "trainings"
        | "meetings"
        | "savingsGroup"
        | "savingsMember"
        | "groupIGAs"
        | "memberIGAs"
        | "myVerified",
    ) => {
      history.push(`/dashboard/summary/${key}`);
    },
    [history],
  );

  return (
    <>
      <IonMenu contentId="dashboard-content" side="start">
        <IonHeader>
          <IonToolbar>
            <IonTitle>Menu</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            <IonMenuToggle autoHide>
              <IonItem routerLink="/home" lines="none">
                <IonIcon icon={homeOutline} slot="start" />
                <IonLabel>Home</IonLabel>
              </IonItem>
            </IonMenuToggle>
            <IonMenuToggle autoHide>
              <IonItem routerLink="/validation" lines="none">
                <IonIcon icon={listOutline} slot="start" />
                <IonLabel>Formation</IonLabel>
              </IonItem>
            </IonMenuToggle>
            <IonMenuToggle autoHide>
              <IonItem routerLink="/groups" lines="none">
                <IonIcon icon={peopleOutline} slot="start" />
                <IonLabel>Groups</IonLabel>
              </IonItem>
            </IonMenuToggle>
            <IonMenuToggle autoHide>
              <IonItem routerLink="/settings" lines="none">
                <IonIcon icon={settingsOutline} slot="start" />
                <IonLabel>Settings</IonLabel>
              </IonItem>
            </IonMenuToggle>
            <IonMenuToggle autoHide>
              <IonItem routerLink="/notifications" lines="none">
                <IonIcon icon={notificationsOutline} slot="start" />
                <IonLabel>Notifications</IonLabel>
              </IonItem>
            </IonMenuToggle>
          </IonList>
        </IonContent>
      </IonMenu>

      <IonPage id="dashboard-content">
        <IonHeader>
          <IonToolbar className="dashboard-toolbar">
            <IonButtons slot="start">
              <IonMenuButton color="light" className="dashboard-menu-button" />
            </IonButtons>
            <IonTitle>Dashboard</IonTitle>
            <div className="dashboard-sync-pill" slot="end">
              {queued > 0 ? (
                <span className="pill-warning">
                  {queued} change{queued === 1 ? "" : "s"} queued
                  {online === false ? " (offline)" : ""}
                </span>
              ) : (
                <span className="pill-ok">
                  {online === false ? "Offline" : "All changes synced"}
                </span>
              )}
            </div>
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
              <span>Allocated to Groups</span>
              <strong>{overview.totalVerified.toLocaleString()}</strong>
            </div>
            <div className="dashboard-hero-metric">
              <span>{groupSummaryLabel}</span>
              <strong>{overview.groupsFormed.toLocaleString()}</strong>
            </div>
            <div className="dashboard-hero-metric">
              <span>Group Savings</span>
              <strong>{formatCurrency(overview.aggregatedGroupSavings)}</strong>
            </div>
            <div className="dashboard-hero-metric">
              <span>Member Savings</span>
              <strong>{formatCurrency(overview.aggregatedMemberSavings)}</strong>
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
                  title="Allocated to Groups"
                  helper="Selected beneficiaries"
                  icon={checkmarkCircleOutline}
                  loading={loading}
                  value={overview.totalVerified}
                  accentClass="accent-verified"
                  onClick={() => openSummary("verified")}
                />
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="4">
                <DashboardStatCard
                  title={groupSummaryLabel}
                  helper={roleId === 5 ? "Groups created by you" : "All groups in scope"}
                  icon={peopleOutline}
                  loading={loading}
                  value={overview.groupsFormed}
                  accentClass="accent-groups"
                  onClick={() => openSummary("groups")}
                />
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="4">
                <DashboardStatCard
                  title="Group Trainings"
                  helper="Recorded training sessions"
                  icon={schoolOutline}
                  loading={loading}
                  value={overview.trainings}
                  accentClass="accent-trainings"
                  onClick={() => openSummary("trainings")}
                />
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="4">
                <DashboardStatCard
                  title="Meetings"
                  helper="Recorded group meetings"
                  icon={listOutline}
                  loading={loading}
                  value={overview.meetings}
                  accentClass="accent-meetings"
                  onClick={() => openSummary("meetings")}
                />
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="4">
                <DashboardStatCard
                  title="Aggregated Group Savings"
                  helper="All visible group savings"
                  icon={cashOutline}
                  loading={loading}
                  value={formatCurrency(overview.aggregatedGroupSavings)}
                  accentClass="accent-savings"
                  onClick={() => openSummary("savingsGroup")}
                />
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="4">
                <DashboardStatCard
                  title="Aggregated Member Savings"
                  helper="All visible member savings"
                  icon={cashOutline}
                  loading={loading}
                  value={formatCurrency(overview.aggregatedMemberSavings)}
                  accentClass="accent-savings"
                  onClick={() => openSummary("savingsMember")}
                />
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="4">
                <DashboardStatCard
                  title="Group IGAs"
                  helper="Group IGA records"
                  icon={barChartOutline}
                  loading={loading}
                  value={overview.groupIGAs}
                  accentClass="accent-group-iga"
                  onClick={() => openSummary("groupIGAs")}
                />
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="4">
                <DashboardStatCard
                  title="Member IGAs"
                  helper="Beneficiary IGA records"
                  icon={storefrontOutline}
                  loading={loading}
                  value={overview.memberIGAs}
                  accentClass="accent-member-iga"
                  onClick={() => openSummary("memberIGAs")}
                />
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="4">
                <DashboardStatCard
                  title="My Verified Members"
                  helper="Verified on this device"
                  icon={pieChartOutline}
                  loading={loading}
                  value={overview.myVerified}
                  accentClass="accent-device"
                  onClick={() => openSummary("myVerified")}
                />
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>
      </IonContent>
      </IonPage>
    </>
  );
};

export default Dashboard;
