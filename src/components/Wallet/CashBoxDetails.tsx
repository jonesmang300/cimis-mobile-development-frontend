import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import './CashBoxDetails.css';

const CashBoxDetails: React.FC = () => {
  const [segment, setSegment] = React.useState<'summary' | 'cash-in' | 'cash-out'>('summary');

  const cashInData = [
    { label: 'Savings', amount: 112000 },
    { label: 'Welfare Collections', amount: 500 },
    { label: 'Loan Payments', amount: 14400 },
  ];

  const cashOutData = [
    { label: 'Disbursement', amount: 12000 },
  ];

  const totalCashIn = cashInData.reduce((total, item) => total + item.amount, 0);
  const totalCashOut = cashOutData.reduce((total, item) => total + item.amount, 0);
  const availableBalance = totalCashIn - totalCashOut;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle style={{ color: "white" }}>Cashbox</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonSegment
          value={segment}
          onIonChange={(e) => setSegment(e.detail.value as 'summary' | 'cash-in' | 'cash-out')}
        >
          <IonSegmentButton value="summary">
            <IonLabel>Summary</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="cash-in">
            <IonLabel>Cash In</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="cash-out">
            <IonLabel>Cash Out</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {segment === 'summary' && (
          <div>
            <div className="balance-card">
              <h2>Available Cashbox Balance</h2>
              <h1>K {availableBalance.toLocaleString()}</h1>
              <div className="balance-details">
                <p>Cash In: K {totalCashIn.toLocaleString()}</p>
                <p>Cash Out: K {totalCashOut.toLocaleString()}</p>
              </div>
            </div>

            <div className="section">
              <h3>Cash In</h3>
              <IonList>
                {cashInData.map((item, index) => (
                  <IonItem key={index}>
                    <IonLabel>{item.label}</IonLabel>
                    <p>K {item.amount.toLocaleString()}</p>
                  </IonItem>
                ))}
              </IonList>
            </div>

            <div className="section">
              <h3>Cash Out</h3>
              <IonList>
                {cashOutData.map((item, index) => (
                  <IonItem key={index}>
                    <IonLabel>{item.label}</IonLabel>
                    <p>K {item.amount.toLocaleString()}</p>
                  </IonItem>
                ))}
              </IonList>
            </div>
          </div>
        )}

        {segment === 'cash-in' && (
          <div className="section">
            <h3>Cash In</h3>
            <IonList>
              {cashInData.map((item, index) => (
                <IonItem key={index}>
                  <IonLabel>{item.label}</IonLabel>
                  <p>K {item.amount.toLocaleString()}</p>
                </IonItem>
              ))}
            </IonList>
          </div>
        )}

        {segment === 'cash-out' && (
          <div className="section">
            <h3>Cash Out</h3>
            <IonList>
              {cashOutData.map((item, index) => (
                <IonItem key={index}>
                  <IonLabel>{item.label}</IonLabel>
                  <p>K {item.amount.toLocaleString()}</p>
                </IonItem>
              ))}
            </IonList>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default CashBoxDetails;
