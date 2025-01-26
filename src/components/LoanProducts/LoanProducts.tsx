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
  IonAvatar,
  IonSearchbar,
  IonFabButton,
  IonAlert,
} from "@ionic/react";
import { pencil, add, trash } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useLoanProducts } from "../context/LoanProductsContext";
import { useClusters } from "../context/ClustersContext";
import { deleteData, getData } from "../../services/apiServices";
import { useNotificationMessage } from "../context/notificationMessageContext";

const LoanProducts: React.FC = () => {
  const history = useHistory();
  const { loanProducts, returnLoanProducts, setTheSelectedLoanProduct } =
    useLoanProducts();
  const { selectedCluster } = useClusters();
  const { messageState, setMessage } = useNotificationMessage();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [loanProductToRemove, setLoanProductToRemove] = useState<any | null>(
    null
  );

  interface PaymentFrequency {
    id: number;
    paymentFrequency: string;
  }
  const [paymentFrequencies, setPaymentFrequencies] = useState<
    PaymentFrequency[]
  >([]);

  const itemsPerPage = 20;

  const fetchLoanProducts = useCallback(async () => {
    if (loading || !hasMore) return; // Prevent multiple fetches
    setLoading(true);

    try {
      const result = await getData(
        `/api/loanproducts?page=${page}&limit=${itemsPerPage}`
      );

      if (!selectedCluster || selectedCluster.length === 0) {
        console.error("selectedCluster is empty or undefined");
        setHasMore(false);
        setLoading(false);
        return;
      }

      const filteredLoanProducts = result.filter(
        (l: any) => l.clusterCode === selectedCluster[0]?.clusterCode
      );

      if (filteredLoanProducts.length === 0) {
        setHasMore(false);
      } else {
        returnLoanProducts(filteredLoanProducts);
      }
    } catch (err) {
      setError("Failed to fetch loan products.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, selectedCluster, returnLoanProducts]);

  const fetchPaymentFrequencies = async () => {
    try {
      const result = await getData(`/api/paymentfrequencies`);
      setPaymentFrequencies(result);
    } catch (error) {
      setMessage("Failed to fetch payment frequencies", "error");
    }
  };

  useEffect(() => {
    fetchLoanProducts();
    fetchPaymentFrequencies();
  }, [selectedCluster]);

  const handleScroll = (e: any) => {
    const target = e.target as HTMLIonContentElement;
    if (target.scrollHeight - target.scrollTop === target.clientHeight) {
      if (hasMore && !loading) {
        setPage((prevPage) => prevPage + 1);
      }
    }
  };

  const handleEditClick = (id: number) => {
    const loanProduct = loanProducts.find((loan: any) => loan.id === id);
    if (loanProduct) {
      setTheSelectedLoanProduct(loanProduct);
      history.push("edit-loan-product");
    }
  };

  const handleRemoveLoanProductClick = async () => {
    if (!loanProductToRemove) return;

    try {
      setLoading(true);
      await deleteData(`/api/loanproducts`, loanProductToRemove.id);

      const updatedLoanProducts = loanProducts.filter(
        (loan: any) => loan.id !== loanProductToRemove.id
      );

      returnLoanProducts(updatedLoanProducts);
      setMessage("Loan Product removed successfully!", "success");
    } catch (err) {
      setMessage("Failed to remove loan product.", "error");
    } finally {
      setLoading(false);
      setShowDeleteAlert(false);
    }
  };

  const filteredLoanProducts = loanProducts.filter((loan: any) =>
    [loan.loanProduct, loan.interest, loan.paymentFrequencyId]
      .map((field) => field?.toString().toLowerCase() || "")
      .some((field) => field.includes(searchQuery.toLowerCase()))
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Loan Products</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent
        className="ion-padding"
        onIonScroll={handleScroll}
        scrollEvents={true}
      >
        <IonFabButton
          color="success"
          onClick={() => history.push("add-loan-product")}
        >
          <IonIcon icon={add} />
        </IonFabButton>

        <IonSearchbar
          value={searchQuery}
          onIonInput={(e: any) => setSearchQuery(e.detail.value)}
          debounce={250}
          showClearButton="focus"
          placeholder="Search loan products..."
        />

        <IonList>
          {filteredLoanProducts.length > 0 ? (
            filteredLoanProducts.map((loan: any, index: number) => (
              <IonItem key={`${loan.id}-${index}`}>
                <IonAvatar slot="start">
                  <div
                    style={{
                      backgroundColor: "#4CAF50",
                      color: "#fff",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {index + 1}
                  </div>
                </IonAvatar>
                <IonLabel>
                  <h2>{loan.loanProduct}</h2>
                  <p>Interest: {loan.interest}%</p>
                  <p>
                    Frequency:{" "}
                    {paymentFrequencies.find(
                      (pf: any) => pf.id === loan?.paymentFrequencyId
                    )?.paymentFrequency || "N/A"}
                  </p>
                  {/* Buttons moved here */}
                  <div
                    style={{ display: "flex", gap: "10px", marginTop: "10px" }}
                  >
                    <IonButton
                      fill="outline"
                      size="small"
                      color="success"
                      onClick={() => {
                        setTheSelectedLoanProduct(loan.id);
                        handleEditClick(loan.id);
                      }}
                    >
                      <IonIcon icon={pencil} />
                    </IonButton>
                    <IonButton
                      fill="outline"
                      size="small"
                      color="danger"
                      onClick={() => {
                        setLoanProductToRemove(loan);
                        setShowDeleteAlert(true);
                      }}
                    >
                      <IonIcon icon={trash} />
                    </IonButton>
                  </div>
                </IonLabel>
              </IonItem>
            ))
          ) : (
            <IonItem lines="none">
              <IonLabel className="ion-text-center">
                <h2>No loan products found.</h2>
              </IonLabel>
            </IonItem>
          )}
        </IonList>

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Confirm Delete"
          message="Are you sure you want to delete this loan product?"
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () => setShowDeleteAlert(false),
            },
            {
              text: "Delete",
              handler: handleRemoveLoanProductClick,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default LoanProducts;
