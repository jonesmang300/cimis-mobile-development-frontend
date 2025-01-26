import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
} from "@ionic/react";
import { Formik, Form, Field } from "formik"; // Import Formik components
import { SelectInputField, TextInputField } from "../form"; // Adjust import paths
import * as Yup from "yup";
import { useMembers } from "../context/MembersContext";
import { useClusters } from "../context/ClustersContext";
import { useExpenses } from "../context/ExpenseContext";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";
import { useHistory } from "react-router";
import { getData, postData, putData } from "../../services/apiServices";
import { useLoanProducts } from "../context/LoanProductsContext";

// Validation schema
const schema = Yup.object().shape({
  loanProduct: Yup.string().required("Loan product is required"),
  interest: Yup.number().required("Interest is required"),
  paymentFrequencyId: Yup.number().required("Payment frequency is required"),
});

const LoanProductForm: React.FC = () => {
  const history = useHistory();
  const { messageState, setMessage } = useNotificationMessage();
  const { members } = useMembers();
  const { selectedCluster } = useClusters();
  const { selectedLoanProduct, addLoanProduct, editLoanProduct } =
    useLoanProducts();

  const [loading, setLoading] = useState(true);
  const [paymentFrequencies, setPaymentFrequencies] = useState([]);
  const [membership, setMembership] = useState([]);
  const [selectedPaymentFrequency, setSelectedPaymentFrequency] = useState<
    number | null
  >(null);

  const initialValues = {
    id: selectedLoanProduct?.id || "",
    loanProduct: selectedLoanProduct?.loanProduct || "",
    interest: Number(selectedLoanProduct?.interest) || "",
    paymentFrequencyId: selectedLoanProduct?.paymentFrequencyId || "",
    clusterCode: selectedCluster[0]?.clusterCode || "",
  };

  const fetchPaymentFrequencies = async () => {
    try {
      const result = await getData(`/api/paymentfrequencies`);
      setPaymentFrequencies(result);
    } catch (error) {
      setMessage("Failed to fetch payment frequencies", "error");
    }
  };

  useEffect(() => {
    fetchPaymentFrequencies();
  }, []);

  const handleSubmit = async (formData: any, { resetForm }: any) => {
    // Submission logic
    const formattedFormData = {
      clusterCode: selectedCluster[0]?.clusterCode,
      interest: Number(formData.interest),
      paymentFrequencyId: Number(formData.paymentFrequencyId),
      ...formData,
    };

    try {
      if (selectedLoanProduct?.id) {
        await putData(
          `/api/loanproducts/${selectedLoanProduct?.id}`,
          formattedFormData
        );
        editLoanProduct(selectedLoanProduct?.id, formattedFormData);
        setMessage("Loan Product updated successfully!", "success");
      } else {
        await postData("/api/loanproducts", formattedFormData);

        addLoanProduct(formattedFormData);
        setMessage("Loan Product added successfully!", "success");
      }
      resetForm();
      history.push("/loan-products");
    } catch (error) {
      console.log("error", error);
      setMessage("Failed to save Loan Product. Please try again.", "error");
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {selectedLoanProduct ? "Edit Loan Product" : "Add Loan Product"}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {messageState.type === "error" && (
          <NotificationMessage
            text={messageState.text}
            type={messageState.type}
          />
        )}
        <Formik
          initialValues={initialValues}
          validationSchema={schema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, setFieldValue }) => {
            useEffect(() => {
              setSelectedPaymentFrequency(values.paymentFrequencyId);
            }, [values.paymentFrequencyId]);

            return (
              <Form>
                <TextInputField
                  name="loanProduct"
                  id="loanProduct"
                  label="Loan Product Name"
                  placeholder="Enter Loan Product Name"
                />
                <div
                  style={{
                    paddingTop: "15px",
                    paddingLeft: "15px",
                    paddingRight: "15px",
                  }}
                >
                  <SelectInputField
                    name="paymentFrequencyId"
                    selectItems={paymentFrequencies.map((p: any) => ({
                      label: p.paymentFrequency,
                      value: p.id,
                      key: p.id,
                    }))}
                    label="Select Payment Frequency"
                  />
                </div>
                <TextInputField
                  name="interest"
                  id="interest"
                  label="interest (%)"
                  placeholder="Enter interest as Percentage"
                  type="number"
                />

                <IonButton
                  type="submit"
                  expand="block"
                  style={{ marginTop: "20px" }}
                >
                  {selectedLoanProduct
                    ? "Edit Loan Product"
                    : "Add Loan Product"}
                </IonButton>
              </Form>
            );
          }}
        </Formik>
      </IonContent>
    </IonPage>
  );
};

export default LoanProductForm;
