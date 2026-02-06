import React from "react";
import {
  IonContent,
  IonPage,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonButton,
  IonButtons,
  IonHeader,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { add, cashOutline } from "ionicons/icons";
import "./Wallet.css";

const Wallet: React.FC = () => {
  const history = useHistory();

  const navigateTo = (path: string) => {
    history.push(path);
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        {/* Header Text */}
        <IonHeader>
          <IonToolbar style={{ backgroundColor: "#4CAF50" }}>
            <IonTitle>Transactions</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonGrid></IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Wallet;
