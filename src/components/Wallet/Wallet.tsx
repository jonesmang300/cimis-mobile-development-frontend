import React from 'react';
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
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { add, cashOutline } from 'ionicons/icons';
import './Wallet.css';


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
          <IonTitle>Wallet</IonTitle>
        </IonToolbar>
      </IonHeader>
        <IonGrid>
          <IonRow>
            <IonCol className="text-center">
              <h1 className="main-header">/Digi_Training_Center_Uchizi</h1>
              <p className="sub-header">Your cash as a group</p>
            </IonCol>
          </IonRow>

          {/* Cashbox Card */}
          <IonRow>
            <IonCol>
              <IonCard
                className="custom-green-card"
                button
                onClick={() => navigateTo('/cashbox-details')} // Navigate to the Cashbox details page
              >
                <IonCardHeader>
                  <IonCardSubtitle className="ion-card-subtitle-custom">
                    <IonIcon icon={cashOutline} className="icon-subtitle" />
                    Cashbox
                  </IonCardSubtitle>
                </IonCardHeader>
                <IonCardContent>
                  This is the cash you have saved as a group and kept in your lockbox.
                </IonCardContent>
                <div className="balance-section">
                  <p className="balance-text">Available Cashbox Balance</p>
                  <IonCardTitle className="balance-amount">K 500,000</IonCardTitle>
                </div>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Wallet;
