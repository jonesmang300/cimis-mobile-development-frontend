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

// Validation schema
const schema = Yup.object().shape({
  approvalAmount: Yup.number().required("Loan approval amount is required"),
  approvalDate: Yup.date().required("Date is required"),
});

const LoanApprovalForm: React.FC = () => {
  const history = useHistory();
  const { messageState, setMessage } = useNotificationMessage();
  const { selectedLoanApproval, addLoanApproval } = useLoanApprovals();
  const { selectedLoanApplication } = useLoanApplications();

  const initialValues = {
    loanApplicationId: Number(selectedLoanApplication?.id) || "",
    approvalAmount: Number(selectedLoanApproval?.approvalAmount) || "",
    approvalDate: selectedLoanApproval?.approvalDate || "",
  };

  const handleSubmit = async (formData: any, { resetForm }: any) => {
    const formattedFormData = {
      loanApplicationId: Number(selectedLoanApplication?.id),
      approvalAmount: Number(formData?.approvalAmount),
      approvalDate: formData?.approvalDate,
      status: "Approved",
      ...formData,
    };

    try {
      const addResponse = await postData(
        "/api/loanapproval",
        formattedFormData
      );
      const formattedAddResponse = {
        ...addResponse,
        id: addResponse.insertId,
      };

      addLoanApproval(formattedAddResponse);
      setMessage("Loan Approved successfully!", "success");

      resetForm();
      history.push("/view-member");
    } catch (error) {
      setMessage("Failed to approve Loan. Please try again.", "error");
    }
  };

  const CurrencyFormatter = (amount: any) => {
    const formattedAmount =
      amount != null && !isNaN(amount)
        ? new Intl.NumberFormat("en-MW", {
            style: "currency",
            currency: "MWK",
          }).format(amount)
        : "Invalid amount";
    return <span>{formattedAmount}</span>; // Properly close the return statement
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Loan Approval</IonTitle>
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
            <IonCardTitle>Amount Applied For</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {CurrencyFormatter(selectedLoanApplication?.requestedAmount)}
          </IonCardContent>
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
                name="approvalDate"
                label="Loan Approval Date?"
                placeholder="YYYY-MM-DD"
                type="date"
                id={""}
              />
              <TextInputField
                name="approvalAmount"
                label="How much is Approved?"
                placeholder="Enter Amount Approved"
                type="number"
                id={""}
              />
              <IonButton
                type="submit"
                expand="block"
                style={{ marginTop: "20px" }}
              >
                Approve Loan
              </IonButton>
            </Form>
          )}
        </Formik>
      </IonContent>
    </IonPage>
  );
};

export default LoanApprovalForm;
