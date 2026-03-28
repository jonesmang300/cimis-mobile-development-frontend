import React, { useEffect, useMemo, useState } from "react";
import { Redirect, Route, Switch, NavLink, useHistory, useLocation } from "react-router-dom";
import { IonApp, IonChip, IonIcon, IonLabel, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import {
  checkmarkCircleOutline,
  closeOutline,
  listOutline,
  logOutOutline,
  menuOutline,
  notificationsOutline,
  peopleOutline,
  personCircleOutline,
  settingsOutline,
  shieldCheckmarkOutline,
} from "ionicons/icons";

import { AuthProvider, useAuth } from "../components/context/AuthContext";
import Transactions from "../components/Validation/Validation";
import Group from "../components/Groups";
import GroupBeneficiaries from "../components/GroupBeneficiaries";
import GroupSavings from "../components/Savings";
import Trainings from "../components/Trainings";
import TrainingParticipants from "../components/TrainingParticipants";
import Attendance from "../components/Attendance";
import GroupIGA from "../components/GroupIGA";
import MemberSavings from "../components/MemberSavings";
import MemberIGA from "../components/MemberIGA";
import ViewMeeting from "../components/ViewMeeting";
import Settings from "../components/Settings";
import NotificationsPage from "../components/NotificationsPage";
import SupportPage from "../components/SupportPage";
import { onNetworkChange } from "../plugins/network";
import {
  getFailedOfflineGroupError,
  startSyncService,
  subscribeQueueCount,
} from "../data/sync";
import Home from "./pages/Home";
import Login from "./pages/Login";
import UserList from "./pages/UserList";
import UserDetails from "./pages/UserDetails";
import ResetPassword from "./pages/ResetPassword";
import "./web.css";
import DashboardSummaryDetails from "../components/DashBoard/DashboardSummaryDetails";

setupIonicReact();

type NavItem = {
  label: string;
  to: string;
  icon: string;
  exact?: boolean;
};

const navItems: NavItem[] = [
  { label: "Overview", to: "/home", icon: shieldCheckmarkOutline, exact: true },
  { label: "Formation", to: "/validation", icon: listOutline, exact: true },
  { label: "Groups", to: "/groups", icon: peopleOutline },
  { label: "Users", to: "/users", icon: personCircleOutline },
  { label: "Notifications", to: "/notifications", icon: notificationsOutline },
  { label: "Settings", to: "/settings", icon: settingsOutline },
];

const ProtectedShell: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { isLoggedIn, isLoading, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [queued, setQueued] = useState(0);
  const [failedSyncCount, setFailedSyncCount] = useState(0);

  useEffect(() => {
    const refreshSyncError = async () => {
      const failed = await getFailedOfflineGroupError();
      setFailedSyncCount(failed.count);
    };

    const unsubscribeNet = onNetworkChange((connected) => {
      setOnline(connected);
      refreshSyncError().catch(() => null);
    });

    const unsubscribeQueue = subscribeQueueCount((count) => {
      setQueued(count);
      refreshSyncError().catch(() => null);
    });

    startSyncService();
    refreshSyncError().catch(() => null);

    return () => {
      unsubscribeNet();
      unsubscribeQueue();
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const syncLabel = useMemo(() => {
    if (failedSyncCount > 0) {
      return `${failedSyncCount} sync issue${failedSyncCount === 1 ? "" : "s"}`;
    }
    if (queued > 0) {
      return `${queued} queued change${queued === 1 ? "" : "s"}`;
    }
    if (online === false) {
      return "Offline mode";
    }
    return "All changes synced";
  }, [failedSyncCount, online, queued]);

  const syncClassName = useMemo(() => {
    if (failedSyncCount > 0) return "is-danger";
    if (queued > 0 || online === false) return "is-warning";
    return "is-success";
  }, [failedSyncCount, online, queued]);

  const displayName =
    `${String(user?.firstname || "").trim()} ${String(user?.lastname || "").trim()}`.trim() ||
    String(user?.username || "CIMIS User");

  if (isLoading) {
    return <div className="web-loading-screen">Loading...</div>;
  }

  if (!isLoggedIn) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="web-layout">
      <button
        type="button"
        className={`web-sidebar-overlay ${menuOpen ? "is-open" : ""}`}
        aria-label="Close navigation"
        onClick={() => setMenuOpen(false)}
      />

      <aside className={`web-sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="web-sidebar__brand">
          <div className="web-sidebar__logo">
            <img src="/comsip.jpg" alt="COMSIP logo" className="web-sidebar__logo-image" />
          </div>
          <div>
            <div className="web-sidebar__title">COMSIP Mobile</div>
            <p className="web-sidebar__subtitle">Web operations workspace</p>
          </div>
          <button
            type="button"
            className="web-sidebar__close"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          >
            <IonIcon icon={closeOutline} />
          </button>
        </div>

        <nav className="web-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              exact={item.exact}
              className="web-nav__link"
              activeClassName="is-active"
            >
              <IonIcon icon={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="web-sidebar__footer">
          <div className="web-user-card">
            <IonIcon icon={personCircleOutline} className="web-user-card__icon" />
            <div>
              <strong>{displayName}</strong>
              <p>{String(user?.username || user?.email || "Signed in")}</p>
            </div>
          </div>
          <button
            type="button"
            className="web-logout-button"
            onClick={() => {
              logout();
              history.replace("/login");
            }}
          >
            <IonIcon icon={logOutOutline} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="web-main">
        <header className="web-topbar">
          <div className="web-topbar__left">
            <button
              type="button"
              className="web-menu-toggle"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <IonIcon icon={menuOutline} />
            </button>
            <div>
              <p className="web-topbar__eyebrow">Browser Workspace</p>
              <h1 className="web-topbar__title">Operations & Administration</h1>
            </div>
          </div>

          <div className="web-topbar__right">
            <IonChip className={`web-sync-chip ${syncClassName}`}>
              <IonIcon icon={checkmarkCircleOutline} />
              <IonLabel>{syncLabel}</IonLabel>
            </IonChip>
          </div>
        </header>

        <main className="web-content">
          <Switch>
            <Route exact path="/home" component={Home} />
            <Route
              exact
              path="/dashboard/summary/:metricKey"
              component={DashboardSummaryDetails}
            />
            <Route exact path="/validation" component={Transactions} />
            <Route exact path="/formation">
              <Redirect to="/validation" />
            </Route>
            <Route exact path="/groups" component={Group} />
            <Route exact path="/groups/beneficiaries" component={GroupBeneficiaries} />
            <Route exact path="/groups/savings" component={GroupSavings} />
            <Route exact path="/groups/trainings" component={Trainings} />
            <Route
              exact
              path="/groups/trainings/attendance/:trainingID"
              component={TrainingParticipants}
            />
            <Route exact path="/groups/attendance" component={Attendance} />
            <Route exact path="/groups/group-iga" component={GroupIGA} />
            <Route exact path="/groups/savings/member/:sppCode" component={MemberSavings} />
            <Route exact path="/groups/member-iga/:sppCode" component={MemberIGA} />
            <Route exact path="/groups/attendance/view/:meetingID" component={ViewMeeting} />
            <Route exact path="/settings" component={Settings} />
            <Route exact path="/notifications" component={NotificationsPage} />
            <Route exact path="/support" component={SupportPage} />
            <Route exact path="/users" component={UserList} />
            <Route exact path="/users/:id" component={UserDetails} />
            <Route exact path="/">
              <Redirect to="/home" />
            </Route>
            <Redirect to="/home" />
          </Switch>
        </main>
      </div>
    </div>
  );
};

const WebAppContent: React.FC = () => {
  const { isLoggedIn } = useAuth();

  return (
    <IonReactRouter>
      <Switch>
        <Route exact path="/login">
          {isLoggedIn ? <Redirect to="/home" /> : <Login />}
        </Route>
        <Route exact path="/reset-password" component={ResetPassword} />
        <Route path="/">
          <ProtectedShell />
        </Route>
      </Switch>
    </IonReactRouter>
  );
};

const WebApp: React.FC = () => {
  return (
    <IonApp className="web-app-root">
      <AuthProvider>
        <WebAppContent />
      </AuthProvider>
    </IonApp>
  );
};

export default WebApp;
