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
import { useLoanApplications } from "../context/loanApplicationContext"; // Import Loans context
import { useLoanApprovals } from "../context/LoanApprovalContext";
import { useLoanDisbursements } from "../context/LoanDisbursementContext";
import { useLoanRepayments } from "../context/LoanRepaymentsContext";

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
  const {
    loanApplications,
    returnLoanApplications,
    setTheSelectedLoanApplication,
    selectedLoanApplication,
  } = useLoanApplications(); // Loans context
  const {
    selectedLoanApproval,
    returnLoanApprovals,
    loanApprovals,
    addLoanApproval,
    editLoanApproval,
    setTheSelectedLoanApproval,
  } = useLoanApprovals();
  const {
    selectedLoanDisbursement,
    returnLoanDisbursements,
    loanDisbursements,
    addLoanDisbursement,
    editLoanDisbursement,
    setTheSelectedLoanDisbursement,
  } = useLoanDisbursements();
  const {
    selectedLoanRepayment,
    returnLoanRepayments,
    loanRepayments,
    addLoanRepayment,
    editLoanRepayment,
    setTheSelectedLoanRepayment,
  } = useLoanRepayments();

  interface LoanPurpose {
    id: number;
    purpose: string;
  }
  const [loanPurposes, setLoanPurposes] = useState<LoanPurpose[]>([]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all API data in parallel using Promise.all
      const [
        membersResult,
        savingsProductsResult,
        depositsResult,
        feesFinesResult,
        loanApplicationsResult,
        loanApprovalsResult,
        loanDisbursementsResult,
        loanPurposesResult,
      ] = await Promise.all([
        getData(`/api/membership`),
        getData(`/api/savingsproducts`),
        getData(`/api/deposits`),
        getData(`/api/feesfines`),
        getData(`/api/loanapplication`),
        getData(`/api/loanapproval`),
        getData(`/api/loandisbursement`),
        getData(`/api/loanpurposes`),
      ]);

      // Process and filter fetched data
      const filteredMembers = membersResult.filter(
        (m: any) => m.clusterCode === selectedCluster[0].clusterCode
      );
      returnMembers(filteredMembers);

      returnSavingsProducts(savingsProductsResult);

      const filteredDeposits = depositsResult.filter(
        (d: any) => d.memberCode === selectedMember.memberCode
      );
      returnDeposits(filteredDeposits);

      const filteredFeesFines = feesFinesResult.filter(
        (f: any) => f.memberCode === selectedMember.memberCode
      );
      returnFeesFines(filteredFeesFines);

      const filteredLoanApplications = loanApplicationsResult.filter(
        (loan: any) => loan.memberCode === selectedMember.memberCode
      );
      returnLoanApplications(filteredLoanApplications);

      const filteredLoanApprovals = loanApprovalsResult.filter(
        (loan: any) => loan.loanApplicationId === selectedLoanApplication?.id
      );
      returnLoanApprovals(filteredLoanApprovals);

      const filteredLoanDisbursements = loanDisbursementsResult.filter(
        (loan: any) => loan.loanApplicationId === selectedLoanApplication?.id
      );
      returnLoanDisbursements(filteredLoanDisbursements);

      setLoanPurposes(loanPurposesResult);
    } catch (error) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [selectedCluster, selectedMember, selectedLoanApplication]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Helper function for total fees/fines
  const totalFeesFines = feesFines.reduce(
    (sum: number, item: { amount: number }) => sum + Number(item.amount),
    0
  );

  // Helper function for total member savings
  const totalMemberSavings = (productId: number): number => {
    const memberCode = selectedMember?.memberCode;

    if (memberCode && deposits) {
      const filteredDeposits = deposits.filter(
        (deposit: any) =>
          deposit.savingsProductId === productId &&
          deposit.memberCode === memberCode
      );

      return filteredDeposits.reduce(
        (total: number, current: { depositAmount: any }) =>
          total + Number(current.depositAmount),
        0
      );
    }

    return 0;
  };

  // Update savings summary based on deposits and savings products
  useEffect(() => {
    if (savingsProducts.length > 0 && deposits.length > 0) {
      const summary = savingsProducts.reduce((acc, product) => {
        acc[product.id] = totalMemberSavings(product.id);
        return acc;
      }, {} as Record<number, number>);

      setSavingsSummary(summary);
    } else {
      setSavingsSummary({});
    }
  }, [deposits, savingsProducts, selectedMember]);

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

  // Loan redirection handler
  const handleLoanRedirections = (loan: any) => {
    setTheSelectedLoanApplication(loan);

    if (loanApprovals.length === 0) {
      history.push("add-loan-approval");
    } else if (loanDisbursements.length === 0) {
      history.push("add-loan-disbursement");
    } else if (loanDisbursements.length > 0) {
      history.push("add-loan-repayment");
    }
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

        {/* Loans Card */}
        <IonCard
          style={{
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
            borderRadius: "10px",
            marginTop: "20px",
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
            Member Loans
          </IonCardTitle>
          <IonCardContent style={{ padding: "10px" }}>
            {/* Total Loans */}
            <IonItem
              lines="none"
              style={{
                backgroundColor: "#fde2e2", // Light red background
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
                  }}
                >
                  Total Loans:
                </h2>
                <p
                  style={{
                    margin: "5px 0",
                    fontSize: "1rem",
                    color: "#333",
                  }}
                >
                  20000
                </p>
              </IonLabel>
            </IonItem>

            <IonButton
              fill="solid"
              color="success"
              onClick={() => history.push("/add-loan-application")}
            >
              <IonIcon icon={add} slot="start" />
              Apply for Loan
            </IonButton>

            {/* Loans List */}
            {/* Loans List */}
            <IonList>
              {loanApplications.length > 0 ? (
                loanApplications.map((loan: any, index: number) => (
                  <IonItem
                    key={loan.id}
                    lines="none"
                    style={{
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      margin: "8px 0",
                      boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.05)",
                      cursor: "pointer",
                    }}
                    onClick={() => handleLoanRedirections(loan)}
                  >
                    <IonLabel>
                      {/* Loan Number and Status */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <h2
                          style={{
                            fontSize: "1.1rem",
                            fontWeight: "bold",
                          }}
                        >
                          Loan {index + 1}
                        </h2>
                        <p
                          style={{
                            fontSize: "0.9rem",
                            color: "#007BFF",
                            fontWeight: "bold",
                            margin: 0,
                          }}
                        >
                          {loan.status || "Pending"}
                        </p>
                      </div>

                      {/* Loan Purpose and Amount */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "8px",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "0.9rem",
                            color: "#555",
                            margin: 0,
                          }}
                        >
                          {loanPurposes.length > 0 ? (
                            <strong>
                              {loanPurposes.find(
                                (p: any) => p.id === loan.loanPurposeId
                              )?.purpose || "Unknown Purpose"}
                            </strong>
                          ) : (
                            <strong>Loading...</strong>
                          )}
                        </p>
                        <p
                          style={{
                            color: "#555",
                            fontWeight: "bold",
                            margin: 0,
                          }}
                        >
                          <strong>
                            {CurrencyFormatter(loan.requestedAmount)}
                          </strong>
                        </p>
                      </div>
                    </IonLabel>
                  </IonItem>
                ))
              ) : (
                <IonItem lines="none">
                  <IonLabel>No Loans Found</IonLabel>
                </IonItem>
              )}
            </IonList>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default ViewMember;
