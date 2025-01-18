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
import { deleteData, getData } from "../../services/apiServices";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";

const Expenses: React.FC = () => {
  const history = useHistory();
  const { expenses, returnExpenses, setTheSelectedExpense } = useExpenses();
  const { selectedCluster } = useClusters();
  const { messageState, setMessage } = useNotificationMessage();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [expenseToRemove, setExpenseToRemove] = useState<any>();

  const itemsPerPage = 20;

  const fetchExpenses = useCallback(async () => {
    setLoading(true);

    try {
      const result = await getData(
        `/api/expenses?page=${page}&limit=${itemsPerPage}`
      );

      const filteredExpenses = result.filter(
        (expense: any) =>
          expense.clusterCode === selectedCluster[0]?.clusterCode
      );

      if (filteredExpenses.length === 0) {
        setHasMore(false);
      }

      returnExpenses(filteredExpenses);
    } catch (error) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [page, selectedCluster, returnExpenses]);

  useEffect(() => {
    fetchExpenses();
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
    const expense = expenses.find((expense: any) => expense.id === id);
    if (expense) {
      setTheSelectedExpense(expense);
      history.push("edit-expense");
    }
  };

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.date?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(expense.amount)?.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleAddExpense = () => {
    history.push("add-expense");
  };

  const handleRemoveExpenseClick = async () => {
    if (!expenseToRemove) return;

    try {
      setLoading(true);
      await deleteData(`/api/expenses`, expenseToRemove.id);

      const updatedExpenses = expenses.filter(
        (expense: any) => expense.id !== expenseToRemove.id
      );

      returnExpenses(updatedExpenses);
      setMessage("Expense removed successfully!", "success");
    } catch (error) {
      setMessage("Failed to remove expense.", "error");
    } finally {
      setLoading(false);
      setShowDeleteAlert(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Cluster Expenses</IonTitle>
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
        <IonFabButton color="success" onClick={handleAddExpense}>
          <IonIcon icon={add} />
        </IonFabButton>
        <IonSearchbar
          value={searchQuery}
          onIonInput={(e: any) => setSearchQuery(e.target.value)}
          debounce={0}
          showClearButton="focus"
          placeholder="Search expenses..."
        />

        <IonList>
          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((expense, index) => (
              <IonItem key={expense.id}>
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
                    {expense.description?.length > 30
                      ? `${expense.description.slice(0, 30)}...`
                      : expense.description}
                  </h2>
                  <p>
                    {new Date(expense.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p style={{ fontWeight: "bold" }}>
                    {CurrencyFormatter(expense.amount)}
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
                      onClick={() => handleEditClick(expense.id)}
                    >
                      <IonIcon icon={pencil} />
                    </IonButton>
                    <IonButton
                      fill="outline"
                      size="small"
                      color="danger"
                      onClick={() => {
                        setExpenseToRemove(expense);
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
                <h2>There are no expenses yet.</h2>
              </IonLabel>
            </IonItem>
          )}
        </IonList>

        {loading && <p>Loading more expenses...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Confirm Delete"
          message={"Are you sure you want to delete this Expense?"}
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () => setShowDeleteAlert(false),
            },
            {
              text: "Delete",
              handler: handleRemoveExpenseClick,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Expenses;
