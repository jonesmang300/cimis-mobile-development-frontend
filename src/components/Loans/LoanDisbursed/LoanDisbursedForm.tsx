import React, { useEffect, useState } from "react";
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
  IonButtons,
  IonIcon,
} from "@ionic/react";
import { Formik, Form } from "formik";
import { TextInputField } from "../../form";
import * as Yup from "yup";
import { useNotificationMessage } from "../../context/notificationMessageContext";
import { NotificationMessage } from "../../notificationMessage";
import { useHistory } from "react-router";
import { postData, getData } from "../../../services/apiServices";
import { useLoanDisbursements } from "../../context/LoanDisbursementContext";
import { useLoanApplications } from "../../context/loanApplicationContext";
import { arrowBackOutline } from "ionicons/icons";
import ConfirmDialog from "../../../utils/ConfirmDialog";
import { CurrencyFormatter } from "../../../utils/currencyFormatter";

const schema = Yup.object().shape({
  disbursementAmount: Yup.number().required(
    "Loan disbursement amount is required"
  ),
  disbursementDate: Yup.date().required("Disbursement Date is required"),
});

const LoanDisbursedForm: React.FC = () => {
  const history = useHistory();
  const { messageState, setMessage } = useNotificationMessage();
  const { addLoanDisbursement } = useLoanDisbursements();
  const { selectedLoanApplication, fetchLoanApplications, loanApplications } =
    useLoanApplications();

  const [loanPurposes, setLoanPurposes] = useState<any[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);

  const initialValues = {
    loanApplicationId: Number(selectedLoanApplication?.id) || "",
    disbursementAmount: "",
    disbursementDate: "",
  };

  const approvedAmount = Number(
    loanApplications.find((a: any) => a.id === selectedLoanApplication?.id)
      ?.approvalAmount || 0
  );

  // ✅ Fetch loan purposes from API
  useEffect(() => {
    const fetchLoanPurposes = async () => {
      try {
        const response = await getData("/api/loanpurposes");
        setLoanPurposes(response);
      } catch (error) {
        console.error("Failed to fetch loan purposes:", error);
      }
    };

    fetchLoanPurposes();
  }, [selectedLoanApplication]);

  // ✅ Show confirmation dialog before submitting
  const openConfirmDialog = (formData: any) => {
    // 🔥 Check if disbursement amount exceeds approved amount
    const disbursementAmount = Number(formData.disbursementAmount || 0);
    if (disbursementAmount > approvedAmount) {
      setMessage(
        `Disbursed amount cannot exceed approved amount of ${CurrencyFormatter(
          approvedAmount
        )}`,
        "error"
      );
      return; // stop submission
    }

    setPendingFormData(formData);
    setShowConfirmDialog(true);
  };

  // ✅ Confirm disbursement
  const handleConfirmDisbursement = async () => {
    if (!pendingFormData) return;

    const formattedFormData = {
      loanApplicationId: Number(selectedLoanApplication?.id),
      disbursementAmount: Number(pendingFormData?.disbursementAmount),
      disbursementDate: pendingFormData?.disbursementDate,
      status: "Disbursed",
      ...pendingFormData,
    };

    try {
      const addResponse = await postData(
        "/api/loandisbursement",
        formattedFormData
      );

      const formattedAddResponse = {
        ...formattedFormData,
        id: addResponse.insertId,
      };

      addLoanDisbursement(formattedAddResponse);
      await fetchLoanApplications();

      setMessage("Loan Disbursed successfully!", "success");
      setShowConfirmDialog(false);
      history.push("/view-member");
    } catch (error) {
      setMessage("Failed to disburse Loan. Please try again.", "error");
      setShowConfirmDialog(false);
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
          <IonTitle>Loan Disbursement</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {messageState.type === "error" && (
          <NotificationMessage
            text={messageState.text}
            type={messageState.type}
          />
        )}

        {/* === Loan Details Card === */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Loan Details</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>
              <strong>Requested Amount:</strong>{" "}
              {CurrencyFormatter(selectedLoanApplication?.requestedAmount)}
            </p>
            <p>
              <strong>Approved Amount:</strong>{" "}
              {CurrencyFormatter(selectedLoanApplication?.approvalAmount)}
            </p>
            <p>
              <strong>Purpose:</strong>{" "}
              {
                loanPurposes.find(
                  (p: any) => p.id === selectedLoanApplication?.loanPurposeId
                )?.purpose
              }
            </p>
            <p>
              <strong>Number of Installments:</strong>{" "}
              {selectedLoanApplication?.numberOfInstallments || "N/A"}
            </p>
          </IonCardContent>
        </IonCard>

        {/* === Disbursement Information === */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Disbursement Information</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <Formik
              initialValues={initialValues}
              validationSchema={schema}
              onSubmit={openConfirmDialog}
              enableReinitialize
            >
              {() => (
                <Form>
                  <TextInputField
                    name="disbursementDate"
                    label="Loan Disbursement Date?"
                    placeholder="YYYY-MM-DD"
                    type="date"
                    id={""}
                  />
                  <TextInputField
                    name="disbursementAmount"
                    label="Amount to Disburse?"
                    placeholder="Enter Amount to Disburse"
                    type="number"
                    id={""}
                  />
                  <IonButton type="submit" expand="block" color="success">
                    Disburse Loan
                  </IonButton>
                </Form>
              )}
            </Formik>
          </IonCardContent>
        </IonCard>

        {/* ✅ Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showConfirmDialog}
          header="Confirm Loan Disbursement"
          message={`Are you sure you want to disburse this loan amount of ${CurrencyFormatter(
            pendingFormData?.disbursementAmount
          )}?`}
          confirmText="Yes"
          cancelText="Cancel"
          onConfirm={handleConfirmDisbursement}
          onCancel={() => setShowConfirmDialog(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default LoanDisbursedForm;
