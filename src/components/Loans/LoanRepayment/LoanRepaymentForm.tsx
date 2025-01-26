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
} from "@ionic/react";
import { Formik, Form } from "formik";
import { SelectInputField, TextInputField } from "../../form"; // Adjust import paths
import * as Yup from "yup";
import { useLoanApplications } from "../../context/loanApplicationContext";
import { useNotificationMessage } from "../../context/notificationMessageContext";
import { NotificationMessage } from "../../notificationMessage";
import { useHistory } from "react-router";
import { getData, postData } from "../../../services/apiServices";
import { useLoanRepayments } from "../../context/LoanRepaymentsContext";
import { useLoanDisbursements } from "../../context/LoanDisbursementContext";

// Validation schema
const schema = Yup.object().shape({
  repaymentAmount: Yup.number().required("Loan repayment amount is required"),
  repaymentDate: Yup.date().required("Loan Repayment Date is required"),
  loanRepaymentMethodId: Yup.number().required(
    "Loan repayment method is required"
  ),
});

const LoanRepaymentForm: React.FC = () => {
  const history = useHistory();
  const { messageState, setMessage } = useNotificationMessage();
  const { selectedLoanApplication } = useLoanApplications();
  const { addLoanRepayment } = useLoanRepayments();
  const [loanRepaymentMethods, setLoanRepaymentMethods] = useState([]);
  const [savingsAccounts, setSavingsAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { loanDisbursements, returnLoanDisbursements } = useLoanDisbursements();

  const initialValues = {
    loanApplicationId: Number(selectedLoanApplication?.id) || "",
    loanRepaymentMethodId: "",
    savingsAccountId: "",
    repaymentAmount: "",
    repaymentDate: "",
  };

  const handleSubmit = async (formData: any, { resetForm }: any) => {
    setLoading(true);
    const formattedFormData = {
      ...formData,
      loanApplicationId: Number(selectedLoanApplication?.id),
      status: "Paid",
    };

    try {
      const response = await postData("/api/loanrepayments", formattedFormData);
      addLoanRepayment({ ...response, id: response.insertId });

      setMessage("Loan repaid successfully!", "success");
      resetForm();
      history.push("/view-member");
    } catch (error) {
      setMessage("Failed to repay loan. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [methods, accounts, disbursements] = await Promise.all([
        getData("/api/loanrepaymentmethods"),
        getData("/api/savingsproducts"),
        getData(`/api/loandisbursement`),
      ]);

      setLoanRepaymentMethods(methods);
      setSavingsAccounts(accounts);

      const filteredDisbursements = disbursements.filter(
        (item: any) => item.loanApplicationId === selectedLoanApplication.id
      );
      returnLoanDisbursements(filteredDisbursements);
    } catch (error) {
      setMessage("Failed to fetch data. Please try again later.", "error");
    }
  }, [selectedLoanApplication, returnLoanDisbursements, setMessage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const CurrencyFormatter = (amount: any) =>
    amount != null && !isNaN(amount)
      ? new Intl.NumberFormat("en-MW", {
          style: "currency",
          currency: "MWK",
        }).format(amount)
      : "Invalid amount";

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Loan Repayment</IonTitle>
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
            <IonCardTitle>Amount Disbursed</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {CurrencyFormatter(loanDisbursements[0]?.disbursementAmount)}
          </IonCardContent>
        </IonCard>

        <Formik
          initialValues={initialValues}
          validationSchema={schema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, setFieldValue }) => (
            <Form>
              <TextInputField
                name="repaymentDate"
                label="Loan Payment Date?"
                placeholder="YYYY-MM-DD"
                type="date"
                id={""}
              />
              <TextInputField
                name="repaymentAmount"
                label="How much are you paying?"
                placeholder="Enter amount to pay"
                type="number"
                id={""}
              />

              <div
                style={{
                  paddingTop: "15px",
                  paddingLeft: "15px",
                  paddingRight: "15px",
                }}
              >
                <SelectInputField
                  name="loanRepaymentMethodId"
                  selectItems={loanRepaymentMethods.map((l: any) => ({
                    label: l.method,
                    value: l.id,
                    key: l.id,
                  }))}
                  label="Select Payment Method"
                />
              </div>

              {Number(values.loanRepaymentMethodId) === 2 && (
                <div
                  style={{
                    paddingTop: "15px",
                    paddingLeft: "15px",
                    paddingRight: "15px",
                  }}
                >
                  <SelectInputField
                    name="savingsAccountId"
                    selectItems={savingsAccounts.map((s: any) => ({
                      label: s.productName,
                      value: s.id,
                      key: s.id,
                    }))}
                    label="Select Savings Account"
                  />
                </div>
              )}

              <IonButton
                type="submit"
                expand="block"
                style={{ marginTop: "20px" }}
                disabled={loading}
              >
                {loading ? <IonSpinner /> : "Make Payment"}
              </IonButton>
            </Form>
          )}
        </Formik>
      </IonContent>
    </IonPage>
  );
};

export default LoanRepaymentForm;
