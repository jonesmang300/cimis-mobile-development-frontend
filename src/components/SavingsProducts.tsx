import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonModal,
  IonButtons,
  IonLoading,
} from "@ionic/react";
import { getData } from "../services/apiServices";
import { useNotificationMessage } from "./context/notificationMessageContext";
import { useHistory } from "react-router-dom";
import { useSavingsProducts } from "./context/SavingsProductsContext";
import { useClusters } from "./context/ClustersContext";

// Helper function to get the initials of the product name
const getInitials = (productName: string) => {
  const words = productName.split(" ");
  const initials = words.map((word) => word.charAt(0).toUpperCase()).join("");
  return initials;
};

const SavingsProducts: React.FC = () => {
  const history = useHistory();
  const { selectedCluster } = useClusters();
  const { savingsProducts, returnSavingsProducts } = useSavingsProducts();
  const { messageState, setMessage } = useNotificationMessage();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSavingsProducts = async () => {
    setLoading(true);

    try {
      const results = await getData(`/api/savingsproducts`);
      returnSavingsProducts(results);
    } catch (error) {
      setError("Failed to fetch savings products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavingsProducts();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ backgroundColor: "#4CAF50" }}>
          <IonTitle>Savings Products</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Loading Spinner */}
        <IonLoading isOpen={loading} message="Loading..." spinner="crescent" />

        {/* Show savings products when they are available */}
        {!loading && savingsProducts.length === 0 && !error && (
          <p>No savings products available.</p>
        )}

        <IonList>
          {savingsProducts.map((product, index) => (
            <IonItem key={index}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  fontWeight: "bold",
                  marginRight: "10px",
                  fontSize: "16px",
                }}
              >
                {getInitials(product.productName)}
              </div>
              <IonLabel>
                <h2 style={{ color: "green", fontWeight: "bold" }}>
                  {product.productName}
                </h2>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>

        {/* Error message */}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </IonContent>
    </IonPage>
  );
};

export default SavingsProducts;
