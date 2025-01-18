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
  IonButton,
  IonIcon,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonText,
  IonSpinner,
} from "@ionic/react";
import { add, peopleOutline, search } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useMembers } from "../context/MembersContext";
import { useClusters } from "../context/ClustersContext";
import { useSavingsProducts } from "../context/SavingsProductsContext";
import { getData } from "../../services/apiServices";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";
import { useDeposits } from "../context/DepositContext";
import { useFeesFines } from "../context/FeesFinesContext";

const ViewMember: React.FC = () => {
  const history = useHistory();
  const {
    members,
    returnMembers,
    setTheSelectedMemberId,
    setTheSelectedMember,
    selectedMember,
  } = useMembers();
  const {
    savingsProducts,
    returnSavingsProducts,
    setTheSelectedSavingsProductId,
    setTheSelectedSavingsProduct,
    selectedSavingsProduct,
  } = useSavingsProducts();
  const { deposits, returnDeposits } = useDeposits();
  const { feesFines, returnFeesFines } = useFeesFines();
  const { selectedCluster } = useClusters();
  const { messageState, setMessage } = useNotificationMessage();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savingsSummary, setSavingsSummary] = useState<Record<number, number>>(
    {}
  );

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getData(`/api/membership`);
      const filteredMembers = result.filter(
        (m: any) => m.clusterCode === selectedCluster[0].clusterCode
      );
      returnMembers(filteredMembers);
    } catch (error) {
      setError("Failed to fetch members data");
    } finally {
      setLoading(false);
    }
  }, [selectedCluster]);

  const fetchSavingsProducts = useCallback(async () => {
    setLoading(true);
    try {
      const results = await getData(`/api/savingsproducts`);
      returnSavingsProducts(results);
    } catch (error) {
      setError("Failed to fetch savings products data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeposits = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getData(`/api/deposits`);
      const filteredDeposits = result.filter(
        (m: any) => m.memberCode === selectedMember.memberCode
      );
      returnDeposits(filteredDeposits);
    } catch (error) {
      setError("Failed to fetch deposits data");
    } finally {
      setLoading(false);
    }
  }, [selectedMember]);

  // Function to fetch and calculate total fees and fines
  const fetchFeesFines = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getData(`/api/feesfines`);
      const filteredFeesFines = result.filter(
        (item: any) => item.memberCode === selectedMember.memberCode
      );

      returnFeesFines(filteredFeesFines);
    } catch (error) {
      setError("Failed to fetch fees or fines data");
    } finally {
      setLoading(false);
    }
  }, [selectedMember]);

  // Fetch fees/fines data on component mount
  useEffect(() => {
    fetchFeesFines();
  }, [fetchFeesFines]);

  const totalFeesFines = feesFines.reduce(
    (sum: number, item: { amount: number }) => sum + Number(item.amount),
    0
  );

  const totalMemberSavings = (productId: number): number => {
    const memberCode = selectedMember?.memberCode;

    if (memberCode && deposits) {
      // Filter deposits for the given productId and memberCode
      const filteredDeposits = deposits.filter(
        (deposit: any) =>
          deposit.savingsProductId === productId &&
          deposit.memberCode === memberCode
      );

      // Calculate the total savings with proper numeric addition
      return filteredDeposits.reduce(
        (total: number, current: { depositAmount: any }) =>
          total + Number(current.depositAmount), // Convert depositAmount to a number
        0
      );
    }

    return 0;
  };

  useEffect(() => {
    if (savingsProducts.length > 0 && deposits.length > 0) {
      const summary = savingsProducts.reduce((acc, product) => {
        acc[product.id] = totalMemberSavings(product.id);
        return acc;
      }, {} as Record<number, number>);

      setSavingsSummary(summary);
    } else {
      setSavingsSummary({}); // Reset if there are no products or deposits
    }
  }, [deposits, savingsProducts, selectedMember]); // Include selectedMember to ensure updates when it changes

  useEffect(() => {
    fetchMembers();
    fetchSavingsProducts();
    fetchDeposits();
  }, [fetchMembers, fetchSavingsProducts, fetchDeposits]);

  const CurrencyFormatter = (amount: any) => {
    const formattedAmount =
      amount != null && !isNaN(amount)
        ? new Intl.NumberFormat("en-MW", {
            style: "currency",
            currency: "MWK",
          }).format(amount)
        : "Invalid amount";
    return <span>{formattedAmount}</span>;
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>View Member</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding" style={{ textAlign: "center" }}>
          <IonSpinner name="crescent" />
          <p>Loading...</p>
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>View Member</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding" style={{ textAlign: "center" }}>
          <p>{error}</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>View Member</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push("/group-members")}>
              <IonIcon icon={peopleOutline} />
            </IonButton>
            <IonButton>
              <IonIcon icon={search} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {messageState.type === "success" && (
        <NotificationMessage
          text={messageState.text}
          type={messageState.type}
        />
      )}

      {/* Savings Accounts Section Card */}
      <IonContent>
        {/* Savings Accounts Section Card */}
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
            Savings Accounts
          </IonCardTitle>
          <IonCardContent style={{ padding: "10px" }}>
            {/* Display Total Savings */}
            <IonItem
              lines="none"
              style={{
                backgroundColor: "#e8f5e9", // Light green background for emphasis
                borderRadius: "8px",
                margin: "8px 0",
                padding: "10px",
                boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.05)",
              }}
            >
              <IonLabel>
                <h2
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    color: "#4CAF50",
                  }}
                >
                  Total Savings:
                </h2>
                <p
                  style={{
                    margin: "5px 0",
                    fontSize: "1rem",
                    color: "#333",
                  }}
                >
                  {CurrencyFormatter(
                    Object.values(savingsSummary).reduce(
                      (total, amount) => total + amount,
                      0
                    ) || 0
                  )}
                </p>
              </IonLabel>
            </IonItem>

            {/* Display Savings Products */}
            <IonList>
              {savingsProducts.length > 0 ? (
                savingsProducts.map((product: any) => (
                  <IonItem
                    key={product.id}
                    lines="none"
                    style={{
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      margin: "8px 0",
                      boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.05)",
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
                        {product.productName}
                      </h2>
                      <p
                        style={{
                          margin: "5px 0",
                          fontSize: "0.9rem",
                          color: "#555",
                        }}
                      >
                        <strong>
                          {CurrencyFormatter(savingsSummary[product.id] || 0)}
                        </strong>
                      </p>
                    </IonLabel>
                    <IonButton
                      slot="end"
                      fill="solid"
                      color="success"
                      onClick={() => {
                        history.push("/add-deposit");
                        setTheSelectedSavingsProduct(product);
                      }}
                    >
                      <IonIcon icon={add} />
                      Deposit
                    </IonButton>
                  </IonItem>
                ))
              ) : (
                <IonItem lines="none">
                  <IonLabel>No Savings Products Found</IonLabel>
                </IonItem>
              )}
            </IonList>
          </IonCardContent>
        </IonCard>

        <IonCard
          style={{
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
            borderRadius: "10px",
            marginTop: "20px", // Add spacing between the cards
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
            Fees or Fines
          </IonCardTitle>
          <IonCardContent
            style={{
              padding: "20px",
            }}
          >
            <IonItem
              lines="none"
              style={{
                marginBottom: "15px", // Add spacing before the button
              }}
            >
              <IonLabel>
                <h2
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                  }}
                >
                  Total Fees or Fines:
                </h2>
                <p style={{ fontSize: "1rem", color: "#333" }}>
                  {CurrencyFormatter(totalFeesFines)}
                </p>
              </IonLabel>
            </IonItem>
            <IonButton
              fill="solid"
              color="success"
              onClick={() => history.push("/add-fees-fine")}
            >
              <IonIcon icon={add} slot="start" />
              Add Fees or Fine
            </IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default ViewMember;
