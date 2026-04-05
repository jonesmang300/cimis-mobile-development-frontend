import React, { useEffect, useRef, useState } from "react";
import { Redirect, Route } from "react-router-dom";
import {
  IonApp,
  IonRouterOutlet,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonToast,
  IonChip,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

import "./theme/variables.css";

import { Home } from "./components/Home";
import Transactions from "./components/Validation/Validation";
import Group from "./components/Groups";
import Settings from "./components/Settings";
import Wallet from "./components/Wallet/Wallet";
import Login from "./components/Login";
import NotificationsPage from "./components/NotificationsPage";
import GroupBeneficiaries from "./components/GroupBeneficiaries";
import GroupSavings from "./components/Savings";
import Trainings from "./components/Trainings";
import Attendance from "./components/Attendance";
import TrainingParticipants from "./components/TrainingParticipants";
import GroupIGA from "./components/GroupIGA";
import MemberSavings from "./components/MemberSavings";
import MemberIGA from "./components/MemberIGA";
import VerifiedMembers from "./components/Validation/VerifiedMembers";
import VerifiedMembersByDevice from "./components/Validation/VerifiedMembersByDevice";
import ViewVerifiedMember from "./components/Validation/ViewVerifiedMember";
import GroupMembersSummary from "./components/Validation/GroupMembersSummary";
import ViewMeeting from "./components/ViewMeeting";
import SupportPage from "./components/SupportPage";
import DashboardSummaryDetails from "./components/DashBoard/DashboardSummaryDetails";

import {
  homeOutline,
  listOutline,
  settingsOutline,
  peopleOutline,
} from "ionicons/icons";

import { useAuth, AuthProvider } from "./components/context/AuthContext";
import { isOnline, onNetworkChange } from "./plugins/network";
import {
  getFailedOfflineGroupError,
  startSyncService,
  subscribeQueueCount,
} from "./data/sync";

setupIonicReact();

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const [online, setOnline] = useState<boolean | null>(null);
  const [queued, setQueued] = useState<number>(0);
  const [showToast, setShowToast] = useState(false);
  const [failedSyncCount, setFailedSyncCount] = useState<number>(0);
  const [failedSyncMessage, setFailedSyncMessage] = useState("");
  const [failedSyncGroupId, setFailedSyncGroupId] = useState("");
  const [routeReloadKey, setRouteReloadKey] = useState(0);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    const refreshSyncError = async () => {
      const failed = await getFailedOfflineGroupError();
      setFailedSyncCount(failed.count);
      setFailedSyncMessage(failed.message);
      setFailedSyncGroupId(failed.groupId);
    };

    const unsubscribeNet = onNetworkChange((connected) => {
      if (connected && wasOfflineRef.current) {
        setRouteReloadKey((current) => current + 1);
      }
      wasOfflineRef.current = !connected;
      setOnline(connected);
      setShowToast(!connected);
      refreshSyncError().catch(() => null);
    });

    const unsubscribeQueue = subscribeQueueCount((count) => {
      setQueued(count);
      refreshSyncError().catch(() => null);
    });

    refreshSyncError().catch(() => null);
    isOnline()
      .then((connected) => {
        setOnline(connected);
        wasOfflineRef.current = !connected;
      })
      .catch(() => {
        wasOfflineRef.current = false;
      });
    startSyncService();

    return () => {
      unsubscribeNet();
      unsubscribeQueue();
    };
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        {/* LOGIN ROUTE */}
        <Route exact path="/login">
          {isLoggedIn ? <Redirect to="/home" /> : <Login />}
        </Route>

        {/* PROTECTED ROUTES */}
        {isLoggedIn && (
          <IonTabs>
            {(queued > 0 || failedSyncCount > 0) && (
              <div className="app-sync-status">
                {queued > 0 && (
                  <IonChip color="warning" mode="md" className="app-sync-chip">
                    {`Queued: ${queued} (auto-sync)`}
                  </IonChip>
                )}
              </div>
            )}
            <IonRouterOutlet key={routeReloadKey}>
              {/* MAIN TABS */}
              <Route exact path="/home" component={Home} />
              <Route exact path="/validation" component={Transactions} />
              <Route exact path="/groups" component={Group} />
              <Route exact path="/settings" component={Settings} />
              <Route exact path="/wallet" component={Wallet} />
              <Route exact path="/notifications" component={NotificationsPage} />
              <Route
                exact
                path="/dashboard/summary/:metricKey"
                component={DashboardSummaryDetails}
              />

              {/* GROUP SUB‑ROUTES */}
              <Route
                exact
                path="/groups/beneficiaries"
                component={GroupBeneficiaries}
              />
              <Route exact path="/groups/savings" component={GroupSavings} />
              <Route exact path="/groups/trainings" component={Trainings} />
              <Route
                exact
                path="/groups/trainings/attendance/:trainingID"
                component={TrainingParticipants}
              />
              <Route exact path="/groups/attendance" component={Attendance} />
              <Route exact path="/groups/group-iga" component={GroupIGA} />
              <Route
                exact
                path="/groups/savings/member/:sppCode"
                component={MemberSavings}
              />
              <Route
                exact
                path="/groups/member-iga/:sppCode"
                component={MemberIGA}
              />
              <Route
                exact
                path="/groups/attendance/view/:meetingID"
                component={ViewMeeting}
              />

              {/* VERIFIED MEMBERS & SUMMARY */}
              <Route
                exact
                path="/verified_members"
                component={VerifiedMembers}
              />
              <Route
                exact
                path="/verified_members_by_device"
                component={VerifiedMembersByDevice}
              />
              <Route
                exact
                path="/view_verified_member/:sppCode"
                component={ViewVerifiedMember}
              />
              <Route
                exact
                path="/group_members_summary"
                component={GroupMembersSummary}
              />

              {/* SETTINGS SUB‑ROUTES */}
              <Route exact path="/support" component={SupportPage} />

              {/* FALLBACK INSIDE TABS */}
              <Route exact path="/">
                <Redirect to="/home" />
              </Route>
            </IonRouterOutlet>

            <IonTabBar slot="bottom">
              <IonTabButton tab="home" href="/home">
                <IonIcon icon={homeOutline} />
                <IonLabel>Home</IonLabel>
              </IonTabButton>

              <IonTabButton tab="validation" href="/validation">
                <IonIcon icon={listOutline} />
                <IonLabel>Formation</IonLabel>
              </IonTabButton>

              <IonTabButton tab="groups" href="/groups">
                <IonIcon icon={peopleOutline} />
                <IonLabel>Groups</IonLabel>
              </IonTabButton>

              <IonTabButton tab="settings" href="/settings">
                <IonIcon icon={settingsOutline} />
                <IonLabel>Settings</IonLabel>
              </IonTabButton>
            </IonTabBar>

            <IonToast
              isOpen={showToast}
              onDidDismiss={() => setShowToast(false)}
              message={
                online === false
                  ? `Offline mode. ${queued} change${queued === 1 ? "" : "s"} queued.`
                  : failedSyncCount > 0
                  ? failedSyncGroupId
                    ? `Sync failed for ${failedSyncGroupId}: ${failedSyncMessage || "Unknown error"}`
                    : `Sync failed: ${failedSyncMessage || "Unknown error"}`
                  : "Back online, syncing..."
              }
              color={online === false ? "warning" : failedSyncCount > 0 ? "danger" : "success"}
              duration={online === false ? 3000 : failedSyncCount > 0 ? 4000 : 1500}
              position="top"
            />
          </IonTabs>
        )}

        {/* DEFAULT ROUTE */}
        <Route exact path="/">
          <Redirect to={isLoggedIn ? "/home" : "/login"} />
        </Route>

        {/* CATCH-ALL: prevent blank screen on restricted paths */}
        <Route path="*">
          <Redirect to={isLoggedIn ? "/home" : "/login"} />
        </Route>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
