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
import {
  shieldOutline,
  walletOutline,
  cashOutline,
  logOutOutline,
  helpOutline,
} from "ionicons/icons";
import { useTranslation } from "react-i18next";
import "./Settings.css";
import { useHistory } from "react-router";

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const handleLogout = () => {
    history.push("/login");
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

          <IonItem button routerLink="/loan-products">
            <IonIcon
              icon={walletOutline}
              slot="start"
              className="custom-icon"
            />
            <IonLabel>{t("loanProducts")}</IonLabel>
          </IonItem>

          <IonItem button routerLink="/savings-products">
            <IonIcon icon={cashOutline} slot="start" className="custom-icon" />
            <IonLabel>{t("savingsProducts")}</IonLabel>
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
