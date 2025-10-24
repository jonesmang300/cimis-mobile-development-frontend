import React, { useState, useCallback, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner,
  IonButtons,
  IonIcon,
} from "@ionic/react";
import { useHistory } from "react-router";
import { useMembers } from "../../context/MembersContext";
import { getData } from "../../../services/apiServices";
import { useLoanApplications } from "../../context/loanApplicationContext";
import { useLoanDetails } from "../../context/LoanDetailsContext";
import { arrowBackOutline } from "ionicons/icons";
import { CurrencyFormatter } from "../../../utils/currencyFormatter";

const LoanDetails: React.FC = () => {
  const history = useHistory();
  const [selectedTab, setSelectedTab] = useState<
    "details" | "payments" | "schedule"
  >("details");

  const { selectedMember } = useMembers();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    loanApplications,
    returnLoanApplications,
    setTheSelectedLoanApplication,
    selectedLoanApplication,
  } = useLoanApplications();
  const {
    loanDetails,
    returnLoanDetails,
    setTheSelectedLoanDetail,
    selectedLoanDetail,
  } = useLoanDetails();

  /** ✅ Fetch loan details **/
  const fetchAllData = useCallback(async () => {
    if (!selectedLoanApplication?.id) return;
    setLoading(true);
    setError(null);

    try {
      const response = await getData(
        `/api/loandetails/${selectedLoanApplication?.id}`
      );
      setTheSelectedLoanDetail(response);
    } catch (err) {
      setError("Failed to fetch loan details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedLoanApplication?.id]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleLoanPaymentClick = () => {
    const balance = selectedLoanDetail?.outstandingBalance;

    const numericBalance = Number(balance);
    console.log("balance", numericBalance);

    if (numericBalance <= 0) {
      history.push("/view-member");
    } else {
      history.push("/add-loan-repayment");
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {/* Back Button */}
          <IonButtons slot="start">
            <IonButton onClick={() => history.push("/view-member")}>
              <IonIcon icon={arrowBackOutline} slot="start" />
            </IonButton>
          </IonButtons>
          <IonTitle>Loan Details</IonTitle>
        </IonToolbar>

        <IonSegment
          value={selectedTab}
          onIonChange={(e) => setSelectedTab(e.detail.value as any)}
        >
          <IonSegmentButton value="details">
            <IonLabel>Loan Details</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="payments">
            <IonLabel>Payments</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="schedule">
            <IonLabel>Schedule</IonLabel>
          </IonSegmentButton>
        </IonSegment>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* ✅ Loading Spinner */}
        {loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "70vh",
            }}
          >
            <IonSpinner
              name="crescent"
              color="primary"
              style={{ marginBottom: "12px" }}
            />
            <IonText color="medium">
              <p>Loading loan details...</p>
            </IonText>
          </div>
        )}

        {/* ❌ Error message */}
        {error && (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        )}

        {/* ✅ Content when not loading or error */}
        {!loading && !error && loanDetails && (
          <>
            {/* --- Details Tab --- */}
            {selectedTab === "details" && (
              <>
                <div className="ion-text-center ion-margin-bottom">
                  <IonText color="dark">
                    <h2>
                      {selectedMember?.firstName ??
                        selectedLoanApplication?.fullName.split(" ")[0]}{" "}
                      {selectedMember?.lastName ??
                        selectedLoanApplication?.fullName.split(" ")[1]}
                    </h2>
                    <p>
                      {selectedMember?.phoneNumber ??
                        selectedLoanApplication?.phoneNumber}
                    </p>
                  </IonText>
                </div>

                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Balance</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent className="ion-text-center">
                    <h3>Outstanding Balance</h3>
                    <IonText color="primary">
                      <h1 style={{ marginTop: "8px" }}>
                        {CurrencyFormatter(
                          selectedLoanDetail?.outstandingBalance
                        )}
                      </h1>
                    </IonText>
                  </IonCardContent>
                </IonCard>

                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Loan Details</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonGrid>
                      <IonRow>
                        <IonCol size="6">
                          <strong>Approved Amount:</strong>
                          <p>
                            {CurrencyFormatter(
                              selectedLoanDetail?.approvalAmount
                            )}
                          </p>
                        </IonCol>
                        <IonCol size="6">
                          <strong>Disbursed Amount:</strong>
                          <p>
                            {CurrencyFormatter(
                              selectedLoanDetail?.loanDisbursement
                                ?.disbursementAmount
                            )}
                          </p>
                        </IonCol>
                      </IonRow>

                      <IonRow>
                        <IonCol size="6">
                          <strong>Loan Purpose:</strong>
                          <p>{selectedLoanDetail?.loanPurpose}</p>
                        </IonCol>
                        <IonCol size="6">
                          <strong>No. of Installments:</strong>
                          <p>{selectedLoanDetail?.numberOfInstallments}</p>
                        </IonCol>
                      </IonRow>
                    </IonGrid>
                  </IonCardContent>
                </IonCard>

                <IonButton
                  expand="block"
                  color="success"
                  onClick={handleLoanPaymentClick}
                >
                  MAKE LOAN PAYMENT
                </IonButton>
              </>
            )}

            {/* --- Payments Tab --- */}
            {selectedTab === "payments" && (
              <>
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Payment Schedule</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonGrid>
                      {selectedLoanDetail?.loanRepayment?.repayments?.map(
                        (item: any, index: number) => (
                          <IonRow key={index}>
                            <IonCol size="6">
                              <strong>Payment {index + 1}</strong>
                              <p>{item?.repaymentDate}</p>
                            </IonCol>
                            <IonCol size="6">
                              <strong>Principal:</strong>
                              <p>{CurrencyFormatter(item?.repaymentAmount)}</p>
                            </IonCol>
                          </IonRow>
                        )
                      )}
                    </IonGrid>
                  </IonCardContent>
                </IonCard>

                <IonCard>
                  <IonCardContent>
                    <IonGrid>
                      <IonRow>
                        <IonCol size="6">
                          <strong>Total Payments:</strong>
                        </IonCol>
                        <IonCol size="6" className="ion-text-right">
                          {CurrencyFormatter(
                            selectedLoanDetail?.loanRepayment
                              ?.totalRepaymentAmount
                          )}
                        </IonCol>
                      </IonRow>
                      <IonRow>
                        <IonCol size="6">
                          <strong>Interest:</strong>
                        </IonCol>
                        <IonCol size="6" className="ion-text-right">
                          {CurrencyFormatter(selectedLoanDetail?.totalInterest)}
                        </IonCol>
                      </IonRow>
                      <IonRow>
                        <IonCol size="6">
                          <strong>Outstanding Balance:</strong>
                        </IonCol>
                        <IonCol size="6" className="ion-text-right">
                          {CurrencyFormatter(
                            selectedLoanDetail?.outstandingBalance
                          )}
                        </IonCol>
                      </IonRow>
                    </IonGrid>
                  </IonCardContent>
                </IonCard>
              </>
            )}

            {/* --- Schedule Tab --- */}
            {selectedTab === "schedule" && (
              <>
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Loan Schedule</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    {selectedLoanDetail?.loanPeriod?.map(
                      (period: any, index: any) => (
                        <IonCard
                          key={index}
                          style={{
                            marginBottom: "10px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                          }}
                        >
                          <IonCardContent>
                            <IonGrid>
                              <IonRow>
                                <IonCol size="6">
                                  <strong>Period:</strong>
                                  <p>{period?.periodNumber}</p>
                                </IonCol>
                                <IonCol size="6">
                                  <strong>Interest:</strong>
                                  <p>{CurrencyFormatter(period?.interest)}</p>
                                </IonCol>
                              </IonRow>
                              <IonRow>
                                <IonCol size="6">
                                  <strong>Start Date:</strong>
                                  <p>{period?.startDate}</p>
                                </IonCol>
                                <IonCol size="6">
                                  <strong>End Date:</strong>
                                  <p>{period?.endDate}</p>
                                </IonCol>
                              </IonRow>
                              <IonRow>
                                <IonCol size="6">
                                  <strong>Total Payments:</strong>
                                  <p>
                                    {CurrencyFormatter(period?.totalPayments)}
                                  </p>
                                </IonCol>
                                <IonCol size="6">
                                  <strong>Outstanding Balance:</strong>
                                  <p>
                                    {CurrencyFormatter(period?.loanBalance)}
                                  </p>
                                </IonCol>
                              </IonRow>
                            </IonGrid>
                          </IonCardContent>
                        </IonCard>
                      )
                    )}
                  </IonCardContent>
                </IonCard>

                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Totals Summary</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonGrid>
                      <IonRow>
                        <IonCol size="6">
                          <strong>Total Payments:</strong>
                        </IonCol>
                        <IonCol size="6" className="ion-text-right">
                          {CurrencyFormatter(
                            selectedLoanDetail?.loanRepayment
                              ?.totalRepaymentAmount
                          )}
                        </IonCol>
                      </IonRow>
                      <IonRow>
                        <IonCol size="6">
                          <strong>Total Interest:</strong>
                        </IonCol>
                        <IonCol size="6" className="ion-text-right">
                          {CurrencyFormatter(selectedLoanDetail?.totalInterest)}
                        </IonCol>
                      </IonRow>
                      <IonRow>
                        <IonCol size="6">
                          <strong>Outstanding Balance:</strong>
                        </IonCol>
                        <IonCol size="6" className="ion-text-right">
                          {CurrencyFormatter(
                            selectedLoanDetail?.outstandingBalance
                          )}
                        </IonCol>
                      </IonRow>
                    </IonGrid>
                  </IonCardContent>
                </IonCard>
              </>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default LoanDetails;
