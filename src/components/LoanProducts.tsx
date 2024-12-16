import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButtons,
} from "@ionic/react";
import { pencilOutline, closeOutline } from "ionicons/icons";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";

// Yup validation schema
const validationSchema = Yup.object().shape({
  interestMethod: Yup.string().required("Interest method is required"),
  interestRate: Yup.number()
    .required("Interest rate is required")
    .min(0, "Interest rate must be a positive number"),
  paymentFrequency: Yup.string().required("Payment frequency is required"),
  minSavingsPercentage: Yup.number()
    .required("Minimum savings percentage is required")
    .min(0, "Minimum savings percentage must be a positive number")
    .max(100, "Maximum savings percentage is 100%"),
});

const LoanProducts: React.FC = () => {
  const [loanProducts, setLoanProducts] = useState([
    {
      name: "Emergency Loan",
      interestMethod: "Flat Rate",
      interestRate: 12,
      paymentFrequency: "Monthly",
      minSavingsPercentage: 10,
    },
    {
      name: "Education Loan",
      interestMethod: "Reducing Balance",
      interestRate: 10,
      paymentFrequency: "Quarterly",
      minSavingsPercentage: 15,
    },
    {
      name: "Business Loan",
      interestMethod: "Flat Rate",
      interestRate: 15,
      paymentFrequency: "Monthly",
      minSavingsPercentage: 20,
    },
    {
      name: "Agriculture Loan",
      interestMethod: "Reducing Balance",
      interestRate: 8,
      paymentFrequency: "Yearly",
      minSavingsPercentage: 5,
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState<number | null>(null);

  const openEditModal = (index: number) => {
    setCurrentProductIndex(index);
    setShowModal(true);
  };

  const handleSave = (values: any) => {
    if (currentProductIndex !== null) {
      const updatedProducts = [...loanProducts];
      updatedProducts[currentProductIndex] = {
        ...updatedProducts[currentProductIndex],
        ...values,
      };
      setLoanProducts(updatedProducts);
    }
    setShowModal(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ backgroundColor: "#4CAF50" }}>
          <IonTitle>Loan Products</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          {loanProducts.map((product, index) => (
            <IonItem key={index}>
              <IonLabel>
                <h2
                  style={{
                    fontWeight: "bold",
                    color: "green",
                    fontSize: "1.2em",
                  }}
                >
                  {product.name}
                </h2>
                <p>Interest Method: {product.interestMethod}</p>
                <p>Interest Rate: {product.interestRate}%</p>
                <p>Payment Frequency: {product.paymentFrequency}</p>
                <p>Minimum Savings: {product.minSavingsPercentage}%</p>
              </IonLabel>
              <IonIcon
                icon={pencilOutline}
                slot="end"
                style={{ cursor: "pointer", color: "green", fontSize: "1.5em" }}
                onClick={() => openEditModal(index)}
              />
            </IonItem>
          ))}
        </IonList>

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Loan Product</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {currentProductIndex !== null && (
              <Formik
                initialValues={{
                  interestMethod: loanProducts[currentProductIndex].interestMethod,
                  interestRate: loanProducts[currentProductIndex].interestRate.toString(),
                  paymentFrequency: loanProducts[currentProductIndex].paymentFrequency,
                  minSavingsPercentage: loanProducts[currentProductIndex].minSavingsPercentage.toString(),
                }}
                validationSchema={validationSchema}
                onSubmit={handleSave}
              >
                {({ touched, errors }) => (
                  <Form>
                    <IonItem>
                      <IonLabel position="stacked">Interest Method</IonLabel>
                      <Field
                        name="interestMethod"
                        as={IonSelect}
                        placeholder="Select Interest Method"
                      >
                        <IonSelectOption value="Flat Rate">Flat Rate</IonSelectOption>
                        <IonSelectOption value="Reducing Balance">Reducing Balance</IonSelectOption>
                      </Field>
                      {touched.interestMethod && errors.interestMethod && (
                        <div style={{ color: "red", fontSize: "12px" }}>
                          {errors.interestMethod}
                        </div>
                      )}
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Interest Rate (%)</IonLabel>
                      <Field
                        name="interestRate"
                        as={IonInput}
                        type="number"
                        placeholder="Enter Interest Rate"
                      />
                      {touched.interestRate && errors.interestRate && (
                        <div style={{ color: "red", fontSize: "12px" }}>
                          {errors.interestRate}
                        </div>
                      )}
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Payment Frequency</IonLabel>
                      <Field
                        name="paymentFrequency"
                        as={IonSelect}
                        placeholder="Select Payment Frequency"
                      >
                        <IonSelectOption value="Daily">Daily</IonSelectOption>
                        <IonSelectOption value="Weekly">Weekly</IonSelectOption>
                        <IonSelectOption value="Bi-weekly">Bi-weekly</IonSelectOption>
                        <IonSelectOption value="Monthly">Monthly</IonSelectOption>
                        <IonSelectOption value="Annually">Annually</IonSelectOption>
                      </Field>
                      {touched.paymentFrequency && errors.paymentFrequency && (
                        <div style={{ color: "red", fontSize: "12px" }}>
                          {errors.paymentFrequency}
                        </div>
                      )}
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Minimum Savings Percentage (%)</IonLabel>
                      <Field
                        name="minSavingsPercentage"
                        as={IonInput}
                        type="number"
                        placeholder="Enter Minimum Savings Percentage"
                      />
                      {touched.minSavingsPercentage && errors.minSavingsPercentage && (
                        <div style={{ color: "red", fontSize: "12px" }}>
                          {errors.minSavingsPercentage}
                        </div>
                      )}
                    </IonItem>
                    <IonButton expand="block" color="success" type="submit">
                      Save Changes
                    </IonButton>
                  </Form>
                )}
              </Formik>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default LoanProducts;
