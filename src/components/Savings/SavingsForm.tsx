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
  IonSelect,
  IonSelectOption,
  IonInput,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";
import { useHistory } from "react-router";
import { postData, getData } from "../../services/apiServices";
import { useSavings } from "../context/SavingsContext";
import { useGroups } from "../context/GroupsContext";
import { useClusters } from "../context/ClustersContext";
import { arrowBackOutline } from "ionicons/icons";
import ConfirmDialog from "../../utils/ConfirmDialog";
import { CurrencyFormatter } from "../../utils/currencyFormatter";
import "./SavingsForm.css"; // CSS for consistent styling

const schema = Yup.object().shape({
  Yr: Yup.string().required("Year is required"),
  Month: Yup.string().required("Month is required"),
  Amount: Yup.string().required("Amount is required"),
});

const SavingsForm: React.FC = () => {
  const history = useHistory();
  const { messageState, setMessage } = useNotificationMessage();
  const { addSaving, selectedSavingType } = useSavings();
  const { selectedGroup } = useGroups();
  const { selectedCluster } = useClusters();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [formResetFn, setFormResetFn] = useState<(() => void) | null>(null);
  const [savingTypes, setSavingTypes] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2014 }, (_, i) => 2015 + i);

  const months = [
    { key: "01", name: "January" },
    { key: "02", name: "February" },
    { key: "03", name: "March" },
    { key: "04", name: "April" },
    { key: "05", name: "May" },
    { key: "06", name: "June" },
    { key: "07", name: "July" },
    { key: "08", name: "August" },
    { key: "09", name: "September" },
    { key: "10", name: "October" },
    { key: "11", name: "November" },
    { key: "12", name: "December" },
  ];

  const initialValues = {
    ClusterID: selectedCluster?.ClusterID || "",
    GroupID: selectedGroup?.groupID || "",
    DistrictID: selectedGroup?.DistrictID || "",
    Yr: "",
    Month: "",
    Amount: "",
  };

  const savingType =
    savingTypes.find(
      (s: any) => Number(s?.TypeID) === Number(selectedSavingType?.TypeID)
    )?.savings_name || "";

  useEffect(() => {
    const fetchSavingsTypes = async () => {
      try {
        const response = await getData("/api/saving-types");
        setSavingTypes(response);
      } catch (error) {
        console.error("Failed to fetch savings types:", error);
      }
    };
    fetchSavingsTypes();
  }, []);

  const openConfirmDialog = (formData: any, resetForm: any) => {
    setPendingFormData(formData);
    setFormResetFn(() => resetForm);
    setShowConfirmDialog(true);
  };

  const handleConfirmDeposit = async () => {
    if (!pendingFormData || isSubmitting) return;

    setIsSubmitting(true);

    const formattedFormData = {
      ClusterID: selectedCluster?.ClusterID,
      GroupID: selectedGroup?.groupID,
      DistrictID: selectedGroup?.DistrictID,
      sType: selectedSavingType?.TypeID,
      ...pendingFormData,
    };

    try {
      const addResponse = await postData("/api/savings", formattedFormData);
      const formattedAddResponse = {
        ...formattedFormData,
        RecID: addResponse.insertId,
      };
      addSaving(formattedAddResponse);

      setMessage("Saving record added successfully!", "success");

      if (formResetFn) formResetFn();

      setShowConfirmDialog(false);
      setPendingFormData(null);
      history.push("/savings");
    } catch (error) {
      console.error(error);
      setMessage("Failed to add saving record. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMonthName = (key: string) =>
    months.find((m) => m.key === key)?.name || key;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.push("/view-member")}>
              <IonIcon icon={arrowBackOutline} slot="start" />
            </IonButton>
          </IonButtons>
          <IonTitle>Add Savings</IonTitle>
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
            <IonCardTitle>Savings Details</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>
              <strong>Cluster:</strong> {selectedCluster?.ClusterName}
            </p>
            <p>
              <strong>Group:</strong> {selectedGroup?.groupname}
            </p>
            <p>
              <strong>Savings Product:</strong> {savingType}
            </p>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Deposit Information</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <Formik
              initialValues={initialValues}
              validationSchema={schema}
              enableReinitialize
              onSubmit={(values, { resetForm }) =>
                openConfirmDialog(values, resetForm)
              }
            >
              {({
                setFieldValue,
                setFieldTouched,
                errors,
                touched,
                values,
              }) => (
                <Form>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="12" sizeMd="4" className="form-field">
                        <label>Year</label>
                        <IonSelect
                          value={values.Yr}
                          placeholder="Select Year"
                          onIonChange={(e) =>
                            setFieldValue("Yr", e.detail.value)
                          }
                          onIonBlur={() => setFieldTouched("Yr", true)}
                        >
                          {years.map((year) => (
                            <IonSelectOption key={year} value={year.toString()}>
                              {year}
                            </IonSelectOption>
                          ))}
                        </IonSelect>
                        {errors.Yr && touched.Yr && (
                          <p className="error-text">{errors.Yr}</p>
                        )}
                      </IonCol>

                      <IonCol size="12" sizeMd="4" className="form-field">
                        <label>Month</label>
                        <IonSelect
                          value={values.Month}
                          placeholder="Select Month"
                          onIonChange={(e) =>
                            setFieldValue("Month", e.detail.value)
                          }
                          onIonBlur={() => setFieldTouched("Month", true)}
                        >
                          {months.map((month) => (
                            <IonSelectOption key={month.key} value={month.key}>
                              {month.name}
                            </IonSelectOption>
                          ))}
                        </IonSelect>
                        {errors.Month && touched.Month && (
                          <p className="error-text">{errors.Month}</p>
                        )}
                      </IonCol>

                      <IonCol size="12" sizeMd="4" className="form-field">
                        <label>Amount</label>
                        <IonInput
                          value={values.Amount}
                          placeholder="Enter Amount"
                          type="number"
                          onIonChange={(e) =>
                            setFieldValue("Amount", e.detail.value)
                          }
                          onIonBlur={() => setFieldTouched("Amount", true)}
                        />
                        {errors.Amount && touched.Amount && (
                          <p className="error-text">{errors.Amount}</p>
                        )}
                      </IonCol>
                    </IonRow>
                  </IonGrid>

                  <IonButton type="submit" expand="block" color="success">
                    Save
                  </IonButton>
                </Form>
              )}
            </Formik>
          </IonCardContent>
        </IonCard>

        <ConfirmDialog
          isOpen={showConfirmDialog}
          header="Confirm Add Saving"
          message={`Are you sure you want to deposit ${CurrencyFormatter(
            pendingFormData?.Amount || 0
          )} for ${getMonthName(pendingFormData?.Month)} ${
            pendingFormData?.Yr
          }?`}
          confirmText={isSubmitting ? "Saving..." : "Yes"}
          cancelText="Cancel"
          onConfirm={handleConfirmDeposit}
          onCancel={() => setShowConfirmDialog(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default SavingsForm;
