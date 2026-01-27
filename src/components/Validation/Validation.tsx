import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
} from "@ionic/react";
import { add, cashOutline, removeOutline, trendingUpOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";

const SimplifiedTransactionsPage: React.FC = () => {
  // Example data
  const transactions = [
    { type: "Deposit", name: "John Banda", amount: "K10,000", date: "2024-11-20" },
    { type: "Withdrawal", name: "Mary Nkhoma", amount: "K5,000", date: "2024-11-19" },
    { type: "Loan", name: "Peter Phiri", amount: "K50,000", date: "2024-11-18" },
    { type: "Repayment", name: "Lucy Banda", amount: "K15,000", date: "2024-11-17" },
  ];

  const history = useHistory(); // Used for navigation

  const handleAddTransaction = () => {
     history.push("/add-transaction")
  };

  return (
    <IonPage>
      {/* Header */}
      <IonHeader>
        <IonToolbar style={{ backgroundColor: "#4CAF50" }}>
          <IonTitle>Transactions</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleAddTransaction}>
              <IonIcon icon={add} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* Content */}
      <IonContent className="ion-padding" style={{ backgroundColor: "#f4f7fa" }}>
        <IonList>
          {transactions.map((transaction, index) => (
            <IonItem key={index}>
              <IonIcon
                icon={
                  transaction.type === "Deposit"
                    ? cashOutline
                    : transaction.type === "Withdrawal"
                    ? removeOutline
                    : transaction.type === "Loan"
                    ? trendingUpOutline
                    : cashOutline
                }
                slot="start"
                style={{ color: transaction.type === "Withdrawal" ? "red" : "#4CAF50" }}
              />
              <IonLabel>
                <h3 style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                  {transaction.type}: {transaction.name}
                </h3>
                <p>Amount: {transaction.amount}</p>
                <p>Date: {transaction.date}</p>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default SimplifiedTransactionsPage;
