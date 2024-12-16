import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon } from '@ionic/react';
import { callOutline } from 'ionicons/icons';

const SupportPage: React.FC = () => {
  const phoneNumber = "0994678076"; // Replace with your support phone number

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle>Support</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2>How can we help you?</h2>
        <p>Here you can find help, FAQs, and contact information for support.</p>

        {/* Phone Number Button */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <IonButton
            color="success"
            href={`tel:${phoneNumber}`} // Redirects to the phone keypad
            target="_self"
          >
            <IonIcon icon={callOutline} slot="start" />
            Call Support
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SupportPage;
