import React from "react";
import {
  IonContent,
  IonPage,
  IonGrid,
  IonHeader,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import "./Wallet.css";

const Wallet: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle style={{ color: "white" }}>Transactions</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid></IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Wallet;
