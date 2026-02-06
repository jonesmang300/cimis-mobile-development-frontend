import React, { useState, useEffect } from "react";
import { Redirect, Route } from "react-router-dom";
import {
  IonApp,
  IonRouterOutlet,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  setupIonicReact,
  IonLoading,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

/* Core CSS */
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

import "./theme/variables.css";

/* Components */
import { Home } from "./components/Home";
import Transactions from "./components/Validation/Validation";
import Settings from "./components/Settings";
import Wallet from "./components/Wallet/Wallet";
import CashBoxDetails from "./components/Wallet/CashBoxDetails";
import Login from "./components/Login";
import AddTransactionForm from "./components/Validation/AddTransactionsForm";
import SupportPage from "./components/SupportPage";
import VerifiedMembers from "./components/Validation/VerifiedMembers";
import ViewVerifiedMember from "./components/Validation/ViewVerifiedMember";

import { Capacitor } from "@capacitor/core";

/* Icons */
import {
  homeOutline,
  listOutline,
  settingsOutline,
  peopleOutline,
  walletOutline,
} from "ionicons/icons";

import { useAutoLogout } from "./hooks/useAutoLogout";
import { useAuth } from "./components/context/AuthContext";

/* SQLite init */
import { initAndSeed } from "./db/sqlite";

setupIonicReact();

const App: React.FC = () => {
  const [dbReady, setDbReady] = useState(false);

  const isWeb = Capacitor.getPlatform() === "web";

  // ✅ get both isLoggedIn and logout
  const { isLoggedIn, logout } = useAuth();

  // ✅ IMPORTANT: only runs when logged in
  useAutoLogout(isLoggedIn, logout);

  useEffect(() => {
    (async () => {
      try {
        if (Capacitor.getPlatform() !== "web") {
          await initAndSeed();
        }
      } finally {
        setDbReady(true);
      }
    })();
  }, []);

  if (!dbReady) {
    if (isWeb) {
      return null; // 👈 absolutely nothing on web
    }

    return <IonLoading isOpen message="Preparing local database..." />;
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonLoading isOpen={!dbReady} message="Preparing local database..." />

        {isLoggedIn ? (
          <IonTabs>
            <IonRouterOutlet>
              <Route exact path="/home" component={Home} />
              <Route exact path="/validation" component={Transactions} />
              <Route exact path="/settings" component={Settings} />
              <Route exact path="/wallet" component={Wallet} />
              <Route
                exact
                path="/add-transaction"
                component={AddTransactionForm}
              />
              <Route exact path="/cashbox-details" component={CashBoxDetails} />
              <Route exact path="/support" component={SupportPage} />
              <Route
                exact
                path="/verified_members"
                component={VerifiedMembers}
              />
              <Route
                exact
                path="/view_verified_member/:sppCode"
                component={ViewVerifiedMember}
              />

              <Route exact path="/">
                <Redirect to="/home" />
              </Route>
            </IonRouterOutlet>

            <IonTabBar slot="bottom" style={{ backgroundColor: "#4CAF50" }}>
              <IonTabButton tab="home" href="/home">
                <IonIcon icon={homeOutline} />
                <IonLabel>Home</IonLabel>
              </IonTabButton>

              <IonTabButton tab="validation" href="/validation">
                <IonIcon icon={listOutline} />
                <IonLabel>Validation</IonLabel>
              </IonTabButton>

              <IonTabButton tab="groups" href="/groups">
                <IonIcon icon={peopleOutline} />
                <IonLabel>Groups</IonLabel>
              </IonTabButton>

              <IonTabButton tab="transactions" href="/wallet">
                <IonIcon icon={walletOutline} />
                <IonLabel>Transactions</IonLabel>
              </IonTabButton>

              <IonTabButton tab="settings" href="/settings">
                <IonIcon icon={settingsOutline} />
                <IonLabel>Settings</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        ) : (
          <IonRouterOutlet key="guest">
            <Route exact path="/login" component={Login} />
            <Redirect to="/login" />
          </IonRouterOutlet>
        )}
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
