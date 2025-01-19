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
import { peopleOutline, search, pencil, add, trash } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useExpenses } from "../context/ExpenseContext";
import { useClusters } from "../context/ClustersContext";
import { deleteData, getData, viewDataById } from "../../services/apiServices";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";
import { useIncomes } from "../context/IncomeContext";

const Income: React.FC = () => {
  const history = useHistory();
  const { incomes, returnIncomes, setTheSelectedIncome, selectedIncome } =
    useIncomes();
  const { selectedCluster } = useClusters();
  const { messageState, setMessage } = useNotificationMessage();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [incomeToRemove, setIncomeToRemove] = useState<any>();
  const [incomeCategory, setIncomeCategory] = useState<any[]>([]);

  const itemsPerPage = 20;

  const fetchIncomes = useCallback(async () => {
    setLoading(true);

    try {
      const result = await getData(
        `/api/income?page=${page}&limit=${itemsPerPage}`
      );

      const filteredIncomes = result.filter(
        (income: any) => income.clusterCode === selectedCluster[0]?.clusterCode
      );

      if (filteredIncomes.length === 0) {
        setHasMore(false);
      }

      returnIncomes(filteredIncomes);
    } catch (error) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [page, selectedCluster, returnIncomes]);

  const fetchIncomeCategory = async () => {
    setLoading(true);

    try {
      const result = await getData(`/api/incomecategories`);

      setIncomeCategory(result);
    } catch (error) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
    fetchIncomeCategory();
  }, []);

  const handleScroll = (e: CustomEvent) => {
    const target = e.target as HTMLDivElement;
    const bottom =
      target.scrollHeight === target.scrollTop + target.clientHeight;
    if (bottom && hasMore && !loading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handleEditClick = (id: number) => {
    const income = incomes.find((income: any) => income.id === id);
    if (income) {
      setTheSelectedIncome(income);
      history.push("edit-income");
    }
  };

  const filteredIncomes = incomes.filter(
    (income) =>
      income.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      income.date?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      income.amount?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleAddIncome = () => {
    setTheSelectedIncome(null); // Clear the selected income
    history.push("add-income");
  };

  const handleRemoveIncomeClick = async () => {
    if (!incomeToRemove) return;

    try {
      setLoading(true);
      await deleteData(`/api/income`, incomeToRemove.id);

      const updatedIncomes = incomes.filter(
        (income: any) => income.id !== incomeToRemove.id
      );

      returnIncomes(updatedIncomes);
      setMessage("Income removed successfully!", "success");
    } catch (error) {
      setMessage("Failed to remove income.", "error");
    } finally {
      setLoading(false);
      setShowDeleteAlert(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Cluster Income</IonTitle>
          <IonButton slot="end">
            <IonIcon icon={peopleOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      {messageState.type === "success" && (
        <NotificationMessage
          text={messageState.text}
          type={messageState.type}
        />
      )}

      <IonContent
        className="ion-padding"
        onIonScroll={(e) => handleScroll(e)}
        scrollEvents={true}
      >
        <IonFabButton color="success" onClick={handleAddIncome}>
          <IonIcon icon={add} />
        </IonFabButton>
        <IonSearchbar
          value={searchQuery}
          onIonInput={(e: any) => setSearchQuery(e.target.value)}
          debounce={0}
          showClearButton="focus"
          placeholder="Search Income..."
        />

        <IonList>
          {filteredIncomes.length > 0 ? (
            filteredIncomes.map((income, index) => (
              <IonItem key={income.id}>
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
                  <h2>
                    {incomeCategory && incomeCategory.length > 0
                      ? incomeCategory.find(
                          (c: any) => c.id === income.incomeCategoryId
                        )?.category || "Unknown Category"
                      : "No Categories Available"}
                  </h2>

                  <span>
                    {income.description?.length > 30
                      ? `${income.description.slice(0, 30)}...`
                      : income.description}
                  </span>
                  <p>
                    {new Date(income.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p style={{ fontWeight: "bold" }}>
                    {CurrencyFormatter(income.amount)}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      gap: "10px",
                      marginTop: "8px",
                    }}
                  >
                    <IonButton
                      fill="outline"
                      size="small"
                      color="success"
                      onClick={() => handleEditClick(income.id)}
                    >
                      <IonIcon icon={pencil} />
                    </IonButton>
                    <IonButton
                      fill="outline"
                      size="small"
                      color="danger"
                      onClick={() => {
                        setIncomeToRemove(income);
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
                <h2>There are no Income yet.</h2>
              </IonLabel>
            </IonItem>
          )}
        </IonList>

        {loading && <p>Loading more Income...</p>}
        {/* {error && <p style={{ color: "red" }}>{error}</p>} */}

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Confirm Delete"
          message={"Are you sure you want to delete this Income?"}
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () => setShowDeleteAlert(false),
            },
            {
              text: "Delete",
              handler: handleRemoveIncomeClick,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Income;
