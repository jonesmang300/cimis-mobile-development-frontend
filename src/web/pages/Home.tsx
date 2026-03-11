import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import "./Home.css";

const WebHome: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle style={{ color: "white" }}>Header Toolbar</IonTitle>
        </IonToolbar>
      </IonHeader>
    </IonPage>
  );
};

export default WebHome;
