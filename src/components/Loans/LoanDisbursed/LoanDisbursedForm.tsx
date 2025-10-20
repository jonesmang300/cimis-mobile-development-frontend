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
import { TextInputField } from "../../form"; // Adjust import paths
import * as Yup from "yup";
import { useMembers } from "../../context/MembersContext";
import { useClusters } from "../../context/ClustersContext";
import { useLoanApplications } from "../../context/loanApplicationContext";
import { useNotificationMessage } from "../../context/notificationMessageContext";
import { NotificationMessage } from "../../notificationMessage";
import { useHistory } from "react-router";
import { postData, putData } from "../../../services/apiServices";
import { useLoanApprovals } from "../../context/LoanApprovalContext";
import { useLoanDisbursements } from "../../context/LoanDisbursementContext";
import { arrowBackOutline } from "ionicons/icons";
import { CurrencyFormatter } from "../../../utils/currencyFormatter";

// Validation schema
const schema = Yup.object().shape({
  disbursementAmount: Yup.number().required(
    "Loan disbursement amount is required"
  ),
  disbursementDate: Yup.date().required("Disbursement Date is required"),
});

const LoanDisbursedForm: React.FC = () => {
  const history = useHistory();
  const { messageState, setMessage } = useNotificationMessage();
  const { selectedLoanApproval, addLoanApproval, loanApprovals } =
    useLoanApprovals();
  const { selectedLoanDisbursement, addLoanDisbursement, loanDisbursements } =
    useLoanDisbursements();
  const { selectedLoanApplication, fetchLoanApplications, loanApplications } =
    useLoanApplications();

  const initialValues = {
    loanApplicationId: Number(selectedLoanApplication?.id) || "",
    disbursementAmount:
      Number(selectedLoanDisbursement?.disbursementAmount) || "",
    disbursementDate: selectedLoanDisbursement?.disbursementDate || "",
  };

  const approvedAmount = loanApplications.find(
    (a: any) => a.id === selectedLoanApplication?.id
  )?.approvalAmount;

  const handleSubmit = async (formData: any, { resetForm }: any) => {
    const existingDisbursement = loanApplications.find(
      (d: any) => d.loanApplicationId === selectedLoanApplication?.id
    );

    if (existingDisbursement) {
      setMessage("This loan has already been disbursed.", "error");
      return;
    }

    const formattedFormData = {
      loanApplicationId: Number(selectedLoanApplication?.id),
      disbursementAmount: Number(formData?.disbursementAmount),
      disbursementDate: formData?.disbursementDate,
      status: "Disbursed",
      ...formData,
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

      resetForm();
      history.push("/view-member");
    } catch (error) {
      setMessage("Failed to disburse Loan. Please try again.", "error");
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

        {/* Card displaying the approved amount */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Approved Amount</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>{CurrencyFormatter(approvedAmount)}</IonCardContent>
        </IonCard>

        <Formik
          initialValues={initialValues}
          validationSchema={schema}
          onSubmit={handleSubmit}
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
      </IonContent>
    </IonPage>
  );
};

export default LoanDisbursedForm;
