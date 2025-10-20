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
import { add, arrowBackOutline, peopleOutline, search } from "ionicons/icons";
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
import { useLoanDetails } from "../context/LoanDetailsContext";
import { usePagination } from "../../hooks/usePagination";
import { chevronBackOutline, chevronForwardOutline } from "ionicons/icons";
import { CurrencyFormatter } from "../../utils/currencyFormatter";

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
  const {
    loanDetails,
    returnLoanDetails,
    setTheSelectedLoanDetail,
    selectedLoanDetail,
  } = useLoanDetails();

  const {
    currentItems: currentLoans,
    currentPage,
    totalPages,
    startIndex, // ✅ make sure you include this
    handleNextPage,
    handlePrevPage,
  } = usePagination(loanApplications, 5, "id", "desc");

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
        (approval: any) =>
          filteredLoanApplications.some(
            (loan: any) => loan.id === approval.loanApplicationId
          )
      );
      returnLoanApprovals(filteredLoanApprovals);

      const filteredLoanDisbursements = loanDisbursementsResult.filter(
        (disb: any) =>
          filteredLoanApplications.some(
            (loan: any) => loan.id === disb.loanApplicationId
          )
      );
      returnLoanDisbursements(filteredLoanDisbursements);

      setLoanPurposes(loanPurposesResult);
    } catch (error) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [selectedCluster, selectedMember]);

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

  const getLoanLevelStatus = (loan: any) => {
    const requestedAmount = Number(loan.requestedAmount ?? 0);
    const approvalAmount = Number(loan.approvalAmount ?? 0);
    const disbursementAmount = Number(loan.disbursementAmount ?? 0);
    const outstandingBalance = Number(loan.outstandingBalance ?? 0);
    const totalLoan = disbursementAmount + Number(loan.totalInterest);

    let levelStatus = "Pending";
    let levelAmount = 0;

    // 1️⃣ Applied — no approval yet
    if (!approvalAmount || approvalAmount === 0) {
      levelStatus = "Applied";
      levelAmount = requestedAmount;
    }

    // 2️⃣ Approved — approved but not disbursed
    else if (
      approvalAmount > 0 &&
      (!disbursementAmount || disbursementAmount === 0)
    ) {
      levelStatus = "Approved";
      levelAmount = approvalAmount;
    }

    // 3️⃣ Disbursed — disbursed but no repayment yet (balance == disbursed)
    else if (disbursementAmount > 0 && outstandingBalance === totalLoan) {
      levelStatus = "Disbursed";
      levelAmount = disbursementAmount;
    }

    // 4️⃣ In Repayment — repayments started (balance < disbursed but > 0)
    else if (
      disbursementAmount > 0 &&
      outstandingBalance > 0 &&
      outstandingBalance < totalLoan
    ) {
      levelStatus = "In Repayment";
      levelAmount = outstandingBalance; // amount paid so far
    }

    // 5️⃣ Cleared — fully repaid (balance = 0)
    else if (disbursementAmount > 0 && outstandingBalance <= 0) {
      levelStatus = "Cleared";
      levelAmount = disbursementAmount;
    }

    return { levelStatus, levelAmount };
  };

  const handleLoanRedirections = (loan: any) => {
    setTheSelectedLoanApplication(loan);

    const requestedAmount = Number(loan.requestedAmount ?? 0);
    const approvalAmount = Number(loan.approvalAmount ?? 0);
    const disbursementAmount = Number(loan.disbursementAmount ?? 0);
    const outstandingBalance = Number(loan.outstandingBalance ?? 0);
    const totalLoan = disbursementAmount + Number(loan.totalInterest);

    // 🧭 Redirect logic based on loan stage

    // 1️⃣ Applied — no approval yet
    if (!approvalAmount || approvalAmount === 0) {
      history.push("/add-loan-approval");
      return;
    }

    // 2️⃣ Approved — approved but not disbursed
    if (
      approvalAmount > 0 &&
      (!disbursementAmount || disbursementAmount === 0)
    ) {
      history.push("/add-loan-disbursement");
      return;
    }

    // 3️⃣ Disbursed — disbursed but no repayment yet
    if (disbursementAmount > 0 && outstandingBalance === totalLoan) {
      history.push("/loan-details"); // could show repayment initiation
      return;
    }

    // 4️⃣ In Repayment — repayments ongoing
    if (
      disbursementAmount > 0 &&
      outstandingBalance > 0 &&
      outstandingBalance < totalLoan
    ) {
      history.push("/loan-details"); // repayment details or history
      return;
    }

    // 5️⃣ Cleared — fully paid
    if (disbursementAmount > 0 && outstandingBalance <= 0) {
      setMessage("Loan already fully cleared.", "success");
      return;
    }

    // fallback
    setMessage("Unable to determine loan stage.", "error");
  };

  const totalLoans = loanApplications.filter(
    (a: any) => a.memberCode === selectedMember?.memberCode
  ).length;

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
          <IonButtons slot="start">
            <IonButton onClick={() => history.push("/group-members")}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>

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
                  {totalLoans}
                </p>
              </IonLabel>
            </IonItem>

            <IonButton
              fill="solid"
              color="success"
              onClick={() => {
                setTheSelectedLoanApplication(null); // 👈 reset context
                history.push("/add-loan-application");
              }}
            >
              <IonIcon icon={add} slot="start" />
              Apply for Loan
            </IonButton>

            {/* Loans List */}
            <IonList>
              {currentLoans.length > 0 ? (
                currentLoans.map((loan: any, index: number) => (
                  <IonItem
                    key={`${loan.id}-${index}`}
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
                        <h2 style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                          Loan {startIndex + index + 1}
                        </h2>
                        <p
                          style={{
                            fontSize: "0.9rem",
                            color: "#007BFF",
                            fontWeight: "bold",
                            margin: 0,
                          }}
                        >
                          {getLoanLevelStatus(loan).levelStatus}
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
                                (p: any) => p.id === Number(loan.loanPurposeId)
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
                          {/* <strong>{CurrencyFormatter(loan.requestedAmount)}</strong> */}
                          <strong>
                            {CurrencyFormatter(
                              getLoanLevelStatus(loan).levelAmount
                            )}
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

            {/* Pagination Controls */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "12px",
                marginTop: "15px",
              }}
            >
              {/* Previous Button */}
              <IonButton
                color="success"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                style={{ display: "flex", alignItems: "center" }}
              >
                <IonIcon icon={chevronBackOutline} slot="start" />
                Previous
              </IonButton>

              {/* Page Indicator */}
              <span style={{ fontWeight: "bold", color: "#333" }}>
                Page {currentPage} of {totalPages}
              </span>

              {/* Next Button */}
              <IonButton
                color="success"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                style={{ display: "flex", alignItems: "center" }}
              >
                Next
                <IonIcon icon={chevronForwardOutline} slot="end" />
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default ViewMember;
