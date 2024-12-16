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
  IonIcon,
  IonButton,
  IonButtons,
  IonBackButton,
  IonModal,
  IonInput,
} from "@ionic/react";
import { pencilOutline, closeOutline } from "ionicons/icons";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";

// Yup validation schema
const validationSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  phone: Yup.string()
    .required("Phone number is required")
    .matches(/^\+?\d{9,15}$/, "Phone number is not valid"),
});

const GroupRoles = () => {
  const [roles, setRoles] = useState([
    { role: "Chairperson", name: "Chikondi Emmanuel", phone: "+265984334433" },
    { role: "Secretary", name: "", phone: "" },
    { role: "Treasurer", name: "", phone: "" },
    { role: "Vice Chairperson", name: "", phone: "" },
    { role: "Publicity", name: "", phone: "" },
    { role: "Money Counter", name: "Uchizi Nyirongo", phone: "+265994567899" },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [currentRoleIndex, setCurrentRoleIndex] = useState<number | null>(null);

  // Open modal and populate with role data
  const openEditModal = (index: number) => {
    setCurrentRoleIndex(index);
    setShowModal(true);
  };

  // Handle form submission
  const handleSave = (values: { name: string; phone: string }) => {
    if (currentRoleIndex !== null) {
      const updatedRoles = [...roles];
      updatedRoles[currentRoleIndex] = {
        ...updatedRoles[currentRoleIndex],
        ...values,
      };
      setRoles(updatedRoles);
    }
    setShowModal(false);
  };

  return (
    <IonPage>
      {/* Header */}
      <IonHeader>
        <IonToolbar style={{ backgroundColor: "#4CAF50" }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dashboard" />
          </IonButtons>
          <IonTitle>Group Roles</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Content */}
      <IonContent className="ion-padding">
        <IonList>
          {roles.map((role, index) => (
            <IonItem key={index} lines="none">
              <IonLabel>
                <h2 style={{ fontWeight: "bold", fontSize: "1.1em" }}>
                  {role.role}
                </h2>
                <p style={{ margin: "4px 0" }}>{role.name || "—"}</p>
                <p style={{ color: "#007BFF", margin: 0 }}>
                  {role.phone || "—"}
                </p>
              </IonLabel>
              <IonIcon
                icon={pencilOutline}
                slot="end"
                color="success"
                onClick={() => openEditModal(index)}
                style={{ cursor: "pointer", fontSize: "2em" }}
              />
            </IonItem>
          ))}
        </IonList>

        {/* Edit Modal */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar style={{ backgroundColor: "#4CAF50" }}>
              <IonTitle>Edit Role</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding" style={{ textAlign: "center" }}>
            {currentRoleIndex !== null && (
              <Formik
                initialValues={{
                  name: roles[currentRoleIndex].name,
                  phone: roles[currentRoleIndex].phone,
                }}
                validationSchema={validationSchema}
                onSubmit={handleSave}
              >
                {({ touched, errors }) => (
                  <Form>
                    <IonItem style={{ marginBottom: "15px", borderRadius: "8px" }}>
                      <IonLabel position="stacked" style={{ fontWeight: "bold" }}>
                        Name
                      </IonLabel>
                      <Field
                        name="name"
                        as={IonInput}
                        placeholder="Enter Name"
                        style={{
                          borderBottom: "2px solid #4CAF50",
                        }}
                      />
                      {touched.name && errors.name && (
                        <div style={{ color: "red", fontSize: "12px" }}>
                          {errors.name}
                        </div>
                      )}
                    </IonItem>

                    <IonItem style={{ marginBottom: "15px", borderRadius: "8px" }}>
                      <IonLabel position="stacked" style={{ fontWeight: "bold" }}>
                        Phone
                      </IonLabel>
                      <Field
                        name="phone"
                        as={IonInput}
                        placeholder="Enter Phone"
                        style={{
                          borderBottom: "2px solid #4CAF50",
                        }}
                      />
                      {touched.phone && errors.phone && (
                        <div style={{ color: "red", fontSize: "12px" }}>
                          {errors.phone}
                        </div>
                      )}
                    </IonItem>

                    <IonButton
                      expand="block"
                      color="success"
                      type="submit"
                      style={{ borderRadius: "20px", marginTop: "20px" }}
                    >
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

export default GroupRoles;
