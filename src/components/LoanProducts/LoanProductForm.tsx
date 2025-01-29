import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonSpinner,
} from "@ionic/react";
import { Formik, Form, Field } from "formik";
import { SelectInputField, TextInputField } from "../form";
import * as Yup from "yup";
import { useMembers } from "../context/MembersContext";
import { useClusters } from "../context/ClustersContext";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";
import { useHistory } from "react-router";
import { getData, postData, putData } from "../../services/apiServices";
import { useLoanProducts } from "../context/LoanProductsContext";

const schema = Yup.object().shape({
  loanProduct: Yup.string().required("Loan product is required"),
  interest: Yup.number().required("Interest is required"),
  paymentFrequencyId: Yup.number().required("Payment frequency is required"),
  interestMethodId: Yup.number().required("Interest Method is required"),
});

const LoanProductForm: React.FC = () => {
  const history = useHistory();
  const { messageState, setMessage } = useNotificationMessage();
  const { selectedCluster } = useClusters();
  const { selectedLoanProduct, addLoanProduct, editLoanProduct } =
    useLoanProducts();

  const [loading, setLoading] = useState(true);
  const [paymentFrequencies, setPaymentFrequencies] = useState([]);
  const [interestMethods, setInterestMethods] = useState([]);

  const initialValues = {
    id: selectedLoanProduct?.id || "",
    loanProduct: selectedLoanProduct?.loanProduct || "",
    interest: Number(selectedLoanProduct?.interest) || "",
    paymentFrequencyId: selectedLoanProduct?.paymentFrequencyId || "",
    interestMethodId: selectedLoanProduct?.interestMethodId || "",
    clusterCode: selectedCluster[0]?.clusterCode || "",
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [frequencies, methods] = await Promise.all([
          getData(`/api/paymentfrequencies`),
          getData(`/api/interestmethods`),
        ]);
        setPaymentFrequencies(frequencies);
        setInterestMethods(methods);
      } catch (error) {
        setMessage("Failed to fetch data. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (formData: any, { resetForm }: any) => {
    const formattedFormData = {
      clusterCode: selectedCluster[0]?.clusterCode,
      interest: Number(formData.interest),
      loanProduct: formData.loanProduct,
      paymentFrequencyId: Number(formData.paymentFrequencyId),
      interestMethodId: Number(formData.interestMethodId),
    };
    console.log("formattedFormData", formattedFormData);
    setLoading(true);
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
      setMessage("Failed to save Loan Product. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-text-center ion-padding">
          <IonSpinner name="crescent" />
          <p>Loading...</p>
        </IonContent>
      </IonPage>
    );
  }

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
          {({ values }) => (
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
                label="Interest (%)"
                placeholder="Enter interest as Percentage"
                type="number"
              />
              <div
                style={{
                  paddingTop: "15px",
                  paddingLeft: "15px",
                  paddingRight: "15px",
                }}
              >
                <SelectInputField
                  name="interestMethodId"
                  selectItems={interestMethods.map((im: any) => ({
                    label: im.method,
                    value: im.id,
                    key: im.id,
                  }))}
                  label="Select Interest Method"
                />
              </div>
              <IonButton
                type="submit"
                expand="block"
                style={{ marginTop: "20px" }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <IonSpinner name="dots" />
                    Saving...
                  </>
                ) : selectedLoanProduct ? (
                  "Edit Loan Product"
                ) : (
                  "Add Loan Product"
                )}
              </IonButton>
            </Form>
          )}
        </Formik>
      </IonContent>
    </IonPage>
  );
};

export default LoanProductForm;
