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
import { SelectInputField, TextInputField } from "../../form";
import * as Yup from "yup";
import { useLoanApplications } from "../../context/loanApplicationContext";
import { useNotificationMessage } from "../../context/notificationMessageContext";
import { NotificationMessage } from "../../notificationMessage";
import { useHistory } from "react-router";
import { getData, postData } from "../../../services/apiServices";
import { useLoanRepayments } from "../../context/LoanRepaymentsContext";
import { useLoanDisbursements } from "../../context/LoanDisbursementContext";
import { useLoanDetails } from "../../context/LoanDetailsContext";

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
  const { selectedLoanApplication, setSelectedLoanApplication } =
    useLoanApplications();
  const { addLoanRepayment } = useLoanRepayments();
  const [loanRepaymentMethods, setLoanRepaymentMethods] = useState<any[]>([]);
  const [savingsAccounts, setSavingsAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { loanDisbursements, returnLoanDisbursements } = useLoanDisbursements();
  const {
    loanDetails,
    returnLoanDetails,
    setTheSelectedLoanDetail,
    selectedLoanDetail,
  } = useLoanDetails();

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
      // 1️⃣ Add repayment
      const response = await postData("/api/loanrepayments", formattedFormData);
      addLoanRepayment({ ...response, id: response.insertId });

      // 2️⃣ Refresh loan details immediately
      const updatedLoanDetails = await getData(
        `/api/loandetails/${selectedLoanApplication?.id}`
      );

      // 3️⃣ Update context with new data if applicable
      if (updatedLoanDetails) {
        setTheSelectedLoanDetail(updatedLoanDetails);
      }

      // 4️⃣ Notify success
      setMessage("Loan repaid successfully!", "success");
      resetForm();
      history.push("/loan-details");
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

        {/* Disbursed Amount */}
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
          {({ values }) => (
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

              <div style={{ padding: "15px" }}>
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
                <div style={{ padding: "15px" }}>
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
