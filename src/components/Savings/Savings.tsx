import React, { useEffect, useState, useCallback } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonCardSubtitle,
  IonButtons,
  IonButton,
  IonSpinner,
} from "@ionic/react";
import { add, search } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { getData } from "../../services/apiServices";
import { useClusters } from "../context/ClustersContext";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";
import { useGroups } from "../context/GroupsContext";
import { useSavings } from "../context/SavingsContext";
import { CurrencyFormatter } from "../../utils/currencyFormatter";

const Savings: React.FC = () => {
  const history = useHistory();
  const { selectedCluster } = useClusters();
  const { setTheSelectedGroup, selectedGroup } = useGroups();
  const { setTheSelectedSavingType, returnSavings, savings } = useSavings();
  const { messageState } = useNotificationMessage();

  const [savingsProducts, setSavingsProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch saving types
  const fetchSavingTypes = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getData("/api/saving-types");
      const data = Array.isArray(result) ? result : result.data || [];
      setSavingsProducts(data);
    } catch (err) {
      console.error("Failed to fetch saving types:", err);
      setError("Failed to fetch saving types");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch savings data
  const fetchSavings = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getData("/api/savings");
      const data = Array.isArray(result) ? result : result.data || [];
      returnSavings(data);
    } catch (err) {
      console.error("Failed to fetch savings data:", err);
      setError("Failed to fetch savings records");
    } finally {
      setLoading(false);
    }
  }, [returnSavings]);

  useEffect(() => {
    fetchSavingTypes();
    fetchSavings();
  }, []);

  // Calculate total savings per product for selected group
  const calculateSavingsPerProduct = (GroupID: any, sType: any) => {
    if (!savings || savings.length === 0) return 0;

    return savings
      .filter(
        (record: any) =>
          String(record.GroupID) === String(GroupID) &&
          String(record.sType) === String(sType)
      )
      .reduce((sum, record) => sum + (Number(record.Amount) || 0), 0);
  };

  // Handle add deposit
  const handleAddDeposit = (product: any) => {
    setTheSelectedSavingType(product);
    history.push("/add-saving");
  };

  // Calculate total savings for selected group
  const totalGroupSavings = savings
    .filter((s) => String(s.GroupID) === String(selectedGroup?.groupID))
    .reduce((sum, s) => sum + (Number(s.Amount) || 0), 0);
  const x = savings.filter(
    (s) => String(s.GroupID) === String(selectedGroup?.groupID)
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Savings</IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={() => {
                fetchSavingTypes();
                fetchSavings();
              }}
            >
              <IonIcon icon={search} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {messageState.type && (
        <NotificationMessage
          text={messageState.text}
          type={messageState.type}
        />
      )}

      <IonContent className="ion-padding">
        {/* Group Total Savings Card */}
        <IonCard>
          <IonCardContent>
            <IonCardTitle className="text-lg font-semibold text-gray-800">
              {selectedGroup?.groupname || "Selected Group"} Total Savings
            </IonCardTitle>
            <IonCardSubtitle>
              {CurrencyFormatter(totalGroupSavings)}
            </IonCardSubtitle>
          </IonCardContent>
        </IonCard>

        {/* Savings Products Card */}
        {loading ? (
          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <IonSpinner name="crescent" />
            <p>Loading savings...</p>
          </div>
        ) : error ? (
          <IonCard color="danger">
            <IonCardContent>{error}</IonCardContent>
          </IonCard>
        ) : (
          <IonCard
            style={{
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              borderRadius: "10px",
            }}
          >
            <IonCardTitle
              style={{
                backgroundColor: "#f4f4f4",
                padding: "10px 15px",
                borderTopLeftRadius: "10px",
                borderTopRightRadius: "10px",
                fontWeight: "bold",
                fontSize: "1.2rem",
                color: "#333",
              }}
            >
              Savings Products
            </IonCardTitle>

            <IonCardContent style={{ padding: "10px" }}>
              <IonList>
                {savingsProducts.length > 0 ? (
                  savingsProducts.map((product: any) => {
                    const totalAmount = calculateSavingsPerProduct(
                      selectedGroup?.groupID,
                      product?.TypeID
                    );
                    return (
                      <IonItem
                        key={product.TypeID}
                        lines="none"
                        style={{
                          border: "1px solid #e0e0e0",
                          borderRadius: "8px",
                          margin: "8px 0",
                          boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.05)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <IonLabel>
                          <h2
                            style={{
                              fontSize: "1rem",
                              fontWeight: "bold",
                              color: "#4CAF50",
                            }}
                          >
                            {product.savings_name || "Unnamed Product"}
                          </h2>
                          <p
                            style={{
                              fontSize: "0.95rem",
                              color: "#333",
                              marginTop: "5px",
                            }}
                          >
                            {CurrencyFormatter(totalAmount)}
                          </p>
                        </IonLabel>

                        <IonButton
                          fill="solid"
                          color="success"
                          onClick={() => handleAddDeposit(product)}
                        >
                          <IonIcon icon={add} />
                          Deposit
                        </IonButton>
                      </IonItem>
                    );
                  })
                ) : (
                  <IonItem lines="none">
                    <IonLabel>No savings products found</IonLabel>
                  </IonItem>
                )}
              </IonList>
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Savings;
