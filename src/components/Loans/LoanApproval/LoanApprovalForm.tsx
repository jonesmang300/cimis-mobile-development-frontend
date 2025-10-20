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
import { useLoanApplications } from "../../context/loanApplicationContext";
import { useNotificationMessage } from "../../context/notificationMessageContext";
import { NotificationMessage } from "../../notificationMessage";
import { useHistory } from "react-router";
import { postData } from "../../../services/apiServices";
import { useLoanApprovals } from "../../context/LoanApprovalContext";
import { arrowBackOutline } from "ionicons/icons";
import { CurrencyFormatter } from "../../../utils/currencyFormatter";

const schema = Yup.object().shape({
  approvalAmount: Yup.number().required("Loan approval amount is required"),
  approvalDate: Yup.date().required("Date is required"),
});

const LoanApprovalForm: React.FC = () => {
  const history = useHistory();
  const { messageState, setMessage } = useNotificationMessage();
  const { selectedLoanApproval, addLoanApproval, loanApprovals } =
    useLoanApprovals();
  const { selectedLoanApplication, fetchLoanApplications, loanApplications } =
    useLoanApplications(); // ✅ get fetch function from context

  const initialValues = {
    loanApplicationId: Number(selectedLoanApplication?.id) || "",
    approvalAmount: Number(selectedLoanApproval?.approvalAmount) || "",
    approvalDate: selectedLoanApproval?.approvalDate || "",
  };

  const handleSubmit = async (formData: any, { resetForm }: any) => {
    // const existingApproval = loanApprovals.find(
    //   (a: any) => a.loanApplicationId === selectedLoanApplication?.id
    // );
    const existingApproval = loanApplications.find(
      (a: any) => a.loanApplicationId === selectedLoanApplication?.id
    );

    if (existingApproval) {
      setMessage("This loan has already been approved.", "error");
      return;
    }

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
        ...formattedFormData,
        id: addResponse.insertId,
      };

      // ✅ update loan approval context
      addLoanApproval(formattedAddResponse);

      await fetchLoanApplications();

      // ✅ refresh loan applications from backend

      // ✅ success message
      setMessage("Loan approved successfully!", "success");

      resetForm();
      history.push("/view-member");
    } catch (error) {
      setMessage("Failed to approve Loan. Please try again.", "error");
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
          onSubmit={handleSubmit}
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
      </IonContent>
    </IonPage>
  );
};

export default LoanApprovalForm;
