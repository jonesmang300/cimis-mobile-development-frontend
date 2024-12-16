import React, { useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonModal,
  IonInput,
  IonButtons,
  IonIcon,
} from "@ionic/react";
import { pencilOutline, closeOutline } from "ionicons/icons";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";

// Yup validation schema for fees
const validationSchema = Yup.object().shape({
  depositFee: Yup.number()
    .required("Deposit fee is required")
    .min(1, "Deposit fee must be greater than 0"),
  withdrawFee: Yup.number()
    .required("Withdraw fee is required")
    .min(1, "Withdraw fee must be greater than 0"),
  monthlyCharge: Yup.number()
    .required("Monthly charge is required")
    .min(1, "Monthly charge must be greater than 0"),
});

interface FeeDetails {
  depositFee: number;
  withdrawFee: number;
  monthlyCharge: number;
}

interface Product {
  name: string;
  fees: FeeDetails;
}

const SavingsProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([
    { name: "Shares", fees: { depositFee: 100, withdrawFee: 50, monthlyCharge: 10 } },
    { name: "Purposive", fees: { depositFee: 200, withdrawFee: 75, monthlyCharge: 20 } },
    { name: "Mandatory", fees: { depositFee: 150, withdrawFee: 60, monthlyCharge: 15 } },
    { name: "Voluntary", fees: { depositFee: 120, withdrawFee: 55, monthlyCharge: 12 } },
    { name: "Social Welfare", fees: { depositFee: 180, withdrawFee: 80, monthlyCharge: 25 } },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState<number | null>(null);
  const [editFees, setEditFees] = useState<FeeDetails>({ depositFee: 0, withdrawFee: 0, monthlyCharge: 0 });

  const openEditModal = (index: number) => {
    setCurrentProductIndex(index);
    setEditFees(products[index].fees);
    setShowModal(true);
  };

  const handleSave = (values: FeeDetails) => {
    if (currentProductIndex !== null) {
      const updatedProducts = [...products];
      updatedProducts[currentProductIndex].fees = values;
      setProducts(updatedProducts);
      setShowModal(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ backgroundColor: "#4CAF50" }}>
          <IonTitle>Savings Products</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonList>
          {products.map((product, index) => (
            <IonItem key={index}>
              <IonLabel>
                <h2 style={{ color: "green", fontWeight: "bold" }}>{product.name}</h2>
                <p>Deposit Fee: MWK {product.fees.depositFee}</p>
                <p>Withdraw Fee: MWK {product.fees.withdrawFee}</p>
                <p>Monthly Charge: MWK {product.fees.monthlyCharge}</p>
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

        {/* Edit Fee Modal */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Fees</IonTitle>
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
                initialValues={editFees}
                validationSchema={validationSchema}
                onSubmit={handleSave}
              >
                {({ touched, errors }) => (
                  <Form>
                    <IonItem>
                      <IonLabel position="stacked">Deposit Fee (MWK)</IonLabel>
                      <Field
                        name="depositFee"
                        as={IonInput}
                        type="number"
                        value={editFees.depositFee}
                        onIonChange={(e: { detail: { value: string; }; }) =>
                          setEditFees({ ...editFees, depositFee: parseFloat(e.detail.value!) || 0 })
                        }
                      />
                     {/* Error Message */}
                     {touched.depositFee && errors.depositFee && (
                        <div style={{ color: "red", fontSize: "12px" }}>
                          {errors.depositFee}
                        </div>
                      )}
                    </IonItem>

                    <IonItem>
                      <IonLabel position="stacked">Withdraw Fee (MWK)</IonLabel>
                      <Field
                        name="withdrawFee"
                        as={IonInput}
                        type="number"
                        value={editFees.withdrawFee}
                        onIonChange={(e: { detail: { value: string; }; }) =>
                          setEditFees({ ...editFees, withdrawFee: parseFloat(e.detail.value!) || 0 })
                        }
                      />
                     {/* Error Message */}
                     {touched.withdrawFee && errors.withdrawFee && (
                        <div style={{ color: "red", fontSize: "12px" }}>
                          {errors.withdrawFee}
                        </div>
                      )}
                    </IonItem>

                    <IonItem>
                      <IonLabel position="stacked">Monthly Charge (MWK)</IonLabel>
                      <Field
                        name="monthlyCharge"
                        as={IonInput}
                        type="number"
                        value={editFees.monthlyCharge}
                        onIonChange={(e: { detail: { value: string; }; }) =>
                          setEditFees({ ...editFees, monthlyCharge: parseFloat(e.detail.value!) || 0 })
                        }
                      />
                     {/* Error Message */}
                     {touched.monthlyCharge && errors.monthlyCharge && (
                        <div style={{ color: "red", fontSize: "12px" }}>
                          {errors.monthlyCharge}
                        </div>
                      )}
                    </IonItem>

                    <IonButton expand="block" color="success" type="submit">
                      Save
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

export default SavingsProducts;
