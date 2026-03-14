import React from "react";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { callOutline, arrowBack } from "ionicons/icons";
import { useHistory } from "react-router-dom";

const supportContacts = [
  { region: "Centre", phoneNumber: "0994678076" },
  { region: "North", phoneNumber: "0991444000" },
  { region: "South", phoneNumber: "0882115989" },
];

const SupportPage: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()} color="light">
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Support</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <h2 style={{ paddingLeft: 8 }}>How can we help you?</h2>
        <p style={{ paddingLeft: 8 }}>Call the support contact for your region.</p>

        <IonCard>
          <IonCardContent>
            <IonList>
              {supportContacts.map((contact) => (
                <IonItem key={contact.phoneNumber}>
                  <IonLabel>
                    <h3>{contact.region}</h3>
                    <p>{contact.phoneNumber}</p>
                  </IonLabel>
                  <IonButton
                    slot="end"
                    color="success"
                    href={`tel:${contact.phoneNumber}`}
                    target="_self"
                  >
                    <IonIcon icon={callOutline} slot="start" />
                    Call
                  </IonButton>
                </IonItem>
              ))}
            </IonList>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default SupportPage;
