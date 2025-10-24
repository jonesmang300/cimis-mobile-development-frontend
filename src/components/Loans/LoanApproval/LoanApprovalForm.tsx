import React, { useState } from "react";
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
import { useLoanApplications } from "../../context/loanApplicationContext";
import { useLoanApprovals } from "../../context/LoanApprovalContext";
import { useNotificationMessage } from "../../context/notificationMessageContext";
import { NotificationMessage } from "../../notificationMessage";
import { useHistory } from "react-router";
import { postData, deleteData } from "../../../services/apiServices";
import { arrowBackOutline } from "ionicons/icons";
import ConfirmDialog from "../../../utils/ConfirmDialog";
import { CurrencyFormatter } from "../../../utils/currencyFormatter";

const schema = Yup.object().shape({
  approvalAmount: Yup.number().required("Loan approval amount is required"),
  approvalDate: Yup.date().required("Date is required"),
});

const LoanApprovalForm: React.FC = () => {
  const history = useHistory();
  const { messageState, setMessage } = useNotificationMessage();
  const { selectedLoanApproval, addLoanApproval } = useLoanApprovals();
  const {
    selectedLoanApplication,
    fetchLoanApplications,
    loanApplications,
    returnLoanApplications,
  } = useLoanApplications();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [pendingFormData, setPendingFormData] = useState<any>(null);

  const initialValues = {
    loanApplicationId: Number(selectedLoanApplication?.id) || "",
    approvalAmount: Number(selectedLoanApproval?.approvalAmount) || "",
    approvalDate: selectedLoanApproval?.approvalDate || "",
  };

  const openConfirmDialog = (action: "approve" | "reject", formData?: any) => {
    // ✅ Check if approval amount exceeds requested amount
    if (action === "approve" && formData) {
      const approvalAmount = Number(formData.approvalAmount);
      const requestedAmount = Number(
        selectedLoanApplication?.requestedAmount || 0
      );
      if (approvalAmount > requestedAmount) {
        setMessage(
          `Approved amount cannot exceed requested amount of ${CurrencyFormatter(
            requestedAmount
          )}`,
          "error"
        );
        return; // stop submission
      }
    }

    setConfirmAction(action);
    if (formData) setPendingFormData(formData);
    setShowConfirmDialog(true);
  };

  const handleSubmitConfirmed = async () => {
    if (!pendingFormData) return;

    const formattedData = {
      loanApplicationId: Number(selectedLoanApplication?.id),
      approvalAmount: Number(pendingFormData?.approvalAmount),
      approvalDate: pendingFormData?.approvalDate,
      status: "Approved",
      ...pendingFormData,
    };

    try {
      const response = await postData("/api/loanapproval", formattedData);
      addLoanApproval({ ...formattedData, id: response.insertId });
      await fetchLoanApplications();
      setMessage("Loan approved successfully!", "success");
      history.push("/view-member");
    } catch {
      setMessage("Failed to approve Loan. Please try again.", "error");
    } finally {
      setShowConfirmDialog(false);
      setPendingFormData(null);
      setConfirmAction(null);
    }
  };

  const handleRejectConfirmed = async () => {
    try {
      await deleteData(`/api/loanapplication`, selectedLoanApplication?.id);
      const filteredLoanApplications = loanApplications.filter(
        (a: any) => a.id !== selectedLoanApplication?.id
      );
      returnLoanApplications(filteredLoanApplications);
      setMessage("Loan rejected and deleted successfully!", "success");
      history.push("/view-member");
    } catch {
      setMessage("Failed to reject Loan. Please try again.", "error");
    } finally {
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
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
          <IonTitle>Loan Approval</IonTitle>
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
            <IonCardTitle>Amount Applied For</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {CurrencyFormatter(selectedLoanApplication?.requestedAmount)}
          </IonCardContent>
        </IonCard>

        <Formik
          initialValues={initialValues}
          validationSchema={schema}
          onSubmit={(formData) => openConfirmDialog("approve", formData)}
          enableReinitialize
        >
          {() => (
            <Form>
              <TextInputField
                name="approvalDate"
                label="Loan Approval Date"
                placeholder="YYYY-MM-DD"
                type="date"
                id="approvalDate"
              />
              <TextInputField
                name="approvalAmount"
                label="How much is Approved?"
                placeholder="Enter Amount Approved"
                type="number"
                id="approvalAmount"
              />
              <IonButton type="submit" expand="block" color="success">
                Approve Loan
              </IonButton>
            </Form>
          )}
        </Formik>

        <IonButton
          expand="block"
          color="danger"
          onClick={() => openConfirmDialog("reject")}
        >
          Reject Loan
        </IonButton>

        <ConfirmDialog
          isOpen={showConfirmDialog}
          header={
            confirmAction === "approve"
              ? "Confirm Loan Approval"
              : "Confirm Loan Rejection"
          }
          message={
            confirmAction === "approve"
              ? `Are you sure you want to approve this loan of amount: ${CurrencyFormatter(
                  pendingFormData?.approvalAmount ||
                    selectedLoanApplication?.requestedAmount
                )}?`
              : "Are you sure you want to reject and delete this loan application?"
          }
          confirmText="Yes"
          cancelText="Cancel"
          onConfirm={
            confirmAction === "approve"
              ? handleSubmitConfirmed
              : handleRejectConfirmed
          }
          onCancel={() => setShowConfirmDialog(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default LoanApprovalForm;
