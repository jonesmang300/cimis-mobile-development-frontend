import { IonPage, IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle, IonContent, IonLabel } from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

const Attendance: React.FC = () => {
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
          <IonTitle style={{color: 'white'}}>Attendance Register</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonLabel>This is the Attendance Register page</IonLabel>
      </IonContent>
    </IonPage>
  );
};

export default Attendance;