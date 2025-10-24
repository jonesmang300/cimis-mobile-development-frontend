import React, { useEffect, useState, useCallback } from "react";
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
  IonSpinner,
  IonButtons,
  IonIcon,
  IonAlert,
} from "@ionic/react";
import { Formik, Form } from "formik";
import { TextInputField } from "../../form";
import * as Yup from "yup";
import { useLoanApplications } from "../../context/loanApplicationContext";
import { useNotificationMessage } from "../../context/notificationMessageContext";
import { NotificationMessage } from "../../notificationMessage";
import { useHistory } from "react-router";
import { getData, postData } from "../../../services/apiServices";
import { useLoanRepayments } from "../../context/LoanRepaymentsContext";
import { useLoanDisbursements } from "../../context/LoanDisbursementContext";
import { useLoanDetails } from "../../context/LoanDetailsContext";
import { arrowBackOutline } from "ionicons/icons";
import { CurrencyFormatter } from "../../../utils/currencyFormatter";

const schema = Yup.object().shape({
  repaymentAmount: Yup.number().required("Loan repayment amount is required"),
  repaymentDate: Yup.date().required("Loan Repayment Date is required"),
});

const LoanRepaymentForm: React.FC = () => {
  const history = useHistory();
  const { messageState, setMessage } = useNotificationMessage();
  const { selectedLoanApplication, fetchLoanApplications, loanApplications } =
    useLoanApplications();
  const { addLoanRepayment } = useLoanRepayments();
  const [loading, setLoading] = useState(false);
  const { returnLoanDisbursements } = useLoanDisbursements();
  const { returnLoanDetails, setTheSelectedLoanDetail } = useLoanDetails();

  const [loanDetailData, setLoanDetailData] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [resetFormFunc, setResetFormFunc] = useState<any>(null);

  const initialValues = {
    loanApplicationId: Number(selectedLoanApplication?.id) || "",
    repaymentAmount: "",
    repaymentDate: "",
  };

  // ✅ Stable fetch function
  const fetchData = useCallback(async () => {
    if (!selectedLoanApplication?.id) return;

    try {
      const [disbursements, details] = await Promise.all([
        getData("/api/loandisbursement"),
        getData(`/api/loandetails/${selectedLoanApplication.id}`),
      ]);

      const filteredDisbursements = disbursements.filter(
        (item: any) => item.loanApplicationId === selectedLoanApplication.id
      );
      returnLoanDisbursements(filteredDisbursements);

      if (details) {
        returnLoanDetails(details);
        setLoanDetailData(details);
      }
    } catch (error) {
      setMessage("Failed to fetch data. Please try again later.", "error");
    }
  }, [selectedLoanApplication?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const disbursedAmount =
    loanDetailData?.amountDisbursed ||
    loanApplications.find((a: any) => a.id === selectedLoanApplication?.id)
      ?.disbursementAmount ||
    0;
  const outstandingBalance = loanDetailData?.outstandingBalance || 0;
  const totalPayments =
    loanDetailData?.loanRepayment?.totalRepaymentAmount || 0;
  const totalInterest = loanDetailData?.totalInterest || 0;

  const handleConfirm = async () => {
    if (!pendingFormData) return;
    setShowConfirm(false);
    setLoading(true);

    const formattedFormData = {
      ...pendingFormData,
      loanApplicationId: Number(selectedLoanApplication?.id),
      status: "Paid",
    };

    try {
      const response = await postData("/api/loanrepayments", formattedFormData);
      addLoanRepayment({ ...response, id: response.insertId });

      await fetchLoanApplications();

      const updatedLoanDetails = await getData(
        `/api/loandetails/${selectedLoanApplication?.id}`
      );

      if (updatedLoanDetails) {
        setLoanDetailData(updatedLoanDetails);
        setTheSelectedLoanDetail(updatedLoanDetails);
      }

      setMessage("Loan repaid successfully!", "success");

      if (resetFormFunc) resetFormFunc();

      history.push("/loan-details");
    } catch {
      setMessage("Failed to repay loan. Please try again.", "error");
    } finally {
      setLoading(false);
      setPendingFormData(null);
      setResetFormFunc(null);
    }
  };

  const handleSubmit = (formData: any) => {
    const amount = Number(formData.repaymentAmount);
    if (amount > outstandingBalance) {
      setMessage(
        `Repayment amount cannot exceed the outstanding balance of ${CurrencyFormatter(
          outstandingBalance
        )}`,
        "error"
      );
      return;
    }

    setPendingFormData(formData);
    setShowConfirm(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.push("/view-member")}>
              <IonIcon icon={arrowBackOutline} slot="start" />
            </IonButton>
          </IonButtons>
          <IonTitle>Loan Repayment</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {messageState.type && (
          <NotificationMessage
            text={messageState.text}
            type={messageState.type}
          />
        )}

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Loan Details</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>
              <strong>Amount Disbursed:</strong>{" "}
              {CurrencyFormatter(disbursedAmount)}
            </p>
            <p>
              <strong>Outstanding Balance:</strong>{" "}
              {CurrencyFormatter(outstandingBalance)}
            </p>
            <p>
              <strong>Total Payments:</strong>{" "}
              {CurrencyFormatter(totalPayments)}
            </p>
            <p>
              <strong>Total Interest:</strong>{" "}
              {CurrencyFormatter(totalInterest)}
            </p>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Repayment Information</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <Formik
              initialValues={initialValues}
              validationSchema={schema}
              onSubmit={(values, { resetForm }) => {
                setResetFormFunc(() => resetForm);
                handleSubmit(values);
              }}
              enableReinitialize
            >
              {() => (
                <Form>
                  <TextInputField
                    name="repaymentDate"
                    label="Loan Payment Date"
                    placeholder="YYYY-MM-DD"
                    type="date"
                    id=""
                  />
                  <TextInputField
                    name="repaymentAmount"
                    label="How much are you paying?"
                    placeholder="Enter amount to pay"
                    type="number"
                    id=""
                  />

                  <IonButton
                    type="submit"
                    expand="block"
                    color="success"
                    disabled={loading}
                  >
                    {loading ? <IonSpinner /> : "Make Payment"}
                  </IonButton>
                </Form>
              )}
            </Formik>
          </IonCardContent>
        </IonCard>

        <IonAlert
          isOpen={showConfirm}
          header="Confirm Repayment"
          message={`Are you sure you want to make a repayment of ${CurrencyFormatter(
            pendingFormData?.repaymentAmount || 0
          )}?`}
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () => setShowConfirm(false),
            },
            { text: "Confirm", handler: handleConfirm },
          ]}
          onDidDismiss={() => setShowConfirm(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default LoanRepaymentForm;
