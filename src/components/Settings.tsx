import React from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import { shieldOutline, logOutOutline, helpOutline } from "ionicons/icons";
import { useTranslation } from "react-i18next";
import "./Settings.css";
import { useHistory } from "react-router-dom";
import { useState } from "react";
import { useIonRouter } from "@ionic/react";
import { useAuth } from "./context/AuthContext";

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const ionRouter = useIonRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    logout();
  };

  return (
    <IonPage>
      {/* Header */}
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle className="title-white">{t("settings")}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Account Section */}
        <IonLabel>{t("account")}</IonLabel>
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonItem
                lines="none"
                className="ion-padding-vertical custom-item"
              >
                <IonLabel>
                  <h3>{t("userName")}</h3>
                  <p>{t("phoneNumber")}</p>
                  <p>{t("role")}</p>
                </IonLabel>
              </IonItem>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonLabel>
          <p>{t("groupSettings")}</p>
        </IonLabel>

        {/* Group Settings Section */}
        <IonList>
          <IonItem button routerLink="/group-roles">
            <IonIcon
              icon={shieldOutline}
              slot="start"
              className="custom-icon"
            />
            <IonLabel>{t("groupRoles")}</IonLabel>
          </IonItem>

          <IonItem button routerLink="/support">
            <IonIcon icon={helpOutline} slot="start" className="custom-icon" />
            <IonLabel>{t("support")}</IonLabel>
          </IonItem>
        </IonList>

        {/* Logout Button */}
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonButton
                expand="block"
                color="success"
                className="logout-button ion-margin-top"
                onClick={handleLogout}
              >
                <IonIcon
                  icon={logOutOutline}
                  slot="start"
                  className="custom-icon"
                />
                {t("logout")}
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;
