import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import {
  arrowBack,
  callOutline,
  chevronForwardOutline,
  cloudDoneOutline,
  cloudOfflineOutline,
  helpBuoyOutline,
  informationCircleOutline,
  logOutOutline,
  notificationsOutline,
  personCircleOutline,
  phonePortraitOutline,
  shieldCheckmarkOutline,
  syncOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { onNetworkChange } from "../plugins/network";
import {
  getFailedOfflineGroupError,
  subscribeQueueCount,
} from "../data/sync";
import "./Settings.css";

const APP_VERSION = "0.0.1";
const SESSION_TIMEOUT_MINUTES = 30;

const roleLabels: Record<string, string> = {
  "1": "Administrator",
  "2": "Regional Admin",
  "5": "Enumerator",
};

const SettingsPage: React.FC = () => {
  const history = useHistory();
  const { user, logout } = useAuth();
  const [online, setOnline] = useState<boolean | null>(null);
  const [queued, setQueued] = useState(0);
  const [failedSyncCount, setFailedSyncCount] = useState(0);
  const [failedSyncMessage, setFailedSyncMessage] = useState("");

  const refreshSyncState = useCallback(async () => {
    const failed = await getFailedOfflineGroupError();
    setFailedSyncCount(failed.count);
    setFailedSyncMessage(failed.message || "");
  }, []);

  useEffect(() => {
    refreshSyncState().catch(() => null);

    const unsubscribeNet = onNetworkChange((connected) => {
      setOnline(connected);
      refreshSyncState().catch(() => null);
    });

    const unsubscribeQueue = subscribeQueueCount((count) => {
      setQueued(count);
      refreshSyncState().catch(() => null);
    });

    return () => {
      unsubscribeNet();
      unsubscribeQueue();
    };
  }, [refreshSyncState]);

  const fullName = useMemo(() => {
    const name =
      `${String(user?.firstname || "").trim()} ${String(user?.lastname || "").trim()}`.trim();
    return name || String(user?.username || "User");
  }, [user]);

  const roleLabel = roleLabels[String(user?.userRole || "")] || "Field User";
  const selectedGroupID = localStorage.getItem("selectedGroupID") || "";
  const selectedGroupName = localStorage.getItem("selectedGroupName") || "";
  const hasOfflineAccount = !!localStorage.getItem("offline_user");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    logout();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()} color="light">
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="settings-page">
        <section className="settings-hero">
          <div className="settings-hero-top">
            <div className="settings-avatar-shell">
              <IonIcon icon={personCircleOutline} />
            </div>
            <div className="settings-hero-copy">
              <span className="settings-kicker">Account</span>
              <h1>{fullName}</h1>
              <p>{String(user?.username || user?.email || "Signed in")}</p>
            </div>
          </div>

          <div className="settings-badge-row">
            <IonBadge color="light">{roleLabel}</IonBadge>
            <IonBadge color={online === false ? "warning" : "success"}>
              {online === false ? "Offline" : "Online"}
            </IonBadge>
            <IonBadge color={queued > 0 ? "warning" : "success"}>
              {queued > 0 ? `${queued} queued` : "Synced"}
            </IonBadge>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-head">
            <h2>Sync & Offline</h2>
            <p>Track device connectivity, queue state, and offline readiness.</p>
          </div>

          <div className="settings-grid">
            <IonCard className="settings-stat-card">
              <IonCardContent>
                <div className="settings-stat-icon ok">
                  <IonIcon icon={online === false ? cloudOfflineOutline : cloudDoneOutline} />
                </div>
                <span className="settings-stat-label">Network</span>
                <strong>{online === false ? "Offline mode" : "Connected"}</strong>
                <p>
                  {online === false
                    ? "New changes will queue locally until the network returns."
                    : "Server sync is available now."}
                </p>
              </IonCardContent>
            </IonCard>

            <IonCard className="settings-stat-card">
              <IonCardContent>
                <div className="settings-stat-icon warn">
                  <IonIcon icon={syncOutline} />
                </div>
                <span className="settings-stat-label">Queued Changes</span>
                <strong>{queued}</strong>
                <p>
                  {queued > 0
                    ? "Some changes are still waiting to sync."
                    : "All pending changes are cleared."}
                </p>
              </IonCardContent>
            </IonCard>
          </div>

          <IonCard className="settings-panel">
            <IonCardContent>
              <IonList lines="full">
                <IonItem button detail={false} routerLink="/notifications">
                  <IonIcon icon={notificationsOutline} slot="start" className="settings-list-icon" />
                  <IonLabel>
                    <h3>Sync Inbox</h3>
                    <p>Review queued or failed items and sync them manually.</p>
                  </IonLabel>
                  <IonBadge slot="end" color={queued > 0 ? "warning" : "success"}>
                    {queued}
                  </IonBadge>
                  <IonIcon slot="end" icon={chevronForwardOutline} className="settings-chevron" />
                </IonItem>

                <IonItem lines="none">
                  <IonIcon icon={shieldCheckmarkOutline} slot="start" className="settings-list-icon" />
                  <IonLabel>
                    <h3>Offline Login</h3>
                    <p>
                      {hasOfflineAccount
                        ? "This device has a saved offline account for field access."
                        : "No offline account has been cached on this device yet."}
                    </p>
                  </IonLabel>
                  <IonBadge slot="end" color={hasOfflineAccount ? "success" : "medium"}>
                    {hasOfflineAccount ? "Ready" : "Missing"}
                  </IonBadge>
                </IonItem>

                {failedSyncCount > 0 && (
                  <IonItem lines="none" className="settings-danger-item">
                    <IonIcon icon={informationCircleOutline} slot="start" className="settings-list-icon danger" />
                    <IonLabel>
                      <h3>Latest Sync Issue</h3>
                      <p>{failedSyncMessage || "A sync error is still pending."}</p>
                    </IonLabel>
                    <IonBadge slot="end" color="danger">
                      {failedSyncCount}
                    </IonBadge>
                  </IonItem>
                )}
              </IonList>
            </IonCardContent>
          </IonCard>
        </section>

        <section className="settings-section">
          <div className="settings-section-head">
            <h2>Profile & Device</h2>
            <p>Key account and device information used during field operations.</p>
          </div>

          <IonCard className="settings-panel">
            <IonCardContent>
              <IonList lines="full">
                <IonItem>
                  <IonIcon icon={personCircleOutline} slot="start" className="settings-list-icon" />
                  <IonLabel>
                    <h3>Full Name</h3>
                    <p>{fullName}</p>
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonIcon icon={phonePortraitOutline} slot="start" className="settings-list-icon" />
                  <IonLabel>
                    <h3>Username</h3>
                    <p>{String(user?.username || user?.email || "-")}</p>
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonIcon icon={shieldCheckmarkOutline} slot="start" className="settings-list-icon" />
                  <IonLabel>
                    <h3>Access Role</h3>
                    <p>{roleLabel}</p>
                  </IonLabel>
                </IonItem>
                <IonItem lines="none">
                  <IonIcon icon={informationCircleOutline} slot="start" className="settings-list-icon" />
                  <IonLabel>
                    <h3>Selected Group</h3>
                    <p>{selectedGroupName || selectedGroupID || "No group selected"}</p>
                  </IonLabel>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>
        </section>

        <section className="settings-section">
          <div className="settings-section-head">
            <h2>Help & Security</h2>
            <p>Support contacts and session rules for safe field use.</p>
          </div>

          <IonCard className="settings-panel">
            <IonCardContent>
              <IonList lines="full">
                <IonItem button detail={false} routerLink="/support">
                  <IonIcon icon={helpBuoyOutline} slot="start" className="settings-list-icon" />
                  <IonLabel>
                    <h3>Support Contacts</h3>
                    <p>Call the regional support contacts for field assistance.</p>
                  </IonLabel>
                  <IonIcon slot="end" icon={chevronForwardOutline} className="settings-chevron" />
                </IonItem>
                <IonItem>
                  <IonIcon icon={shieldCheckmarkOutline} slot="start" className="settings-list-icon" />
                  <IonLabel>
                    <h3>Auto Logout</h3>
                    <p>Signed-out automatically after {SESSION_TIMEOUT_MINUTES} minutes of inactivity.</p>
                  </IonLabel>
                </IonItem>
                <IonItem lines="none">
                  <IonIcon icon={informationCircleOutline} slot="start" className="settings-list-icon" />
                  <IonLabel>
                    <h3>App Version</h3>
                    <p>{APP_VERSION}</p>
                  </IonLabel>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>
        </section>

        <section className="settings-section settings-actions">
          <IonButton
            expand="block"
            fill="outline"
            color="success"
            routerLink="/support"
          >
            <IonIcon icon={callOutline} slot="start" />
            Contact Support
          </IonButton>

          <IonButton
            expand="block"
            color="danger"
            onClick={handleLogout}
          >
            <IonIcon icon={logOutOutline} slot="start" />
            Log Out
          </IonButton>
        </section>
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;
