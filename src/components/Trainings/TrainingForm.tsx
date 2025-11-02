import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonIcon,
  IonLoading,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
} from "@ionic/react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { postData, putData, getData } from "../../services/apiServices";
import { useClusters } from "../context/ClustersContext";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";
import { arrowBackOutline } from "ionicons/icons";
import { useIonRouter } from "@ionic/react";
import { useTrainings } from "../context/TrainingsContext";
import { TextInputField } from "../form";

// ✅ Validation Schema
const schema = Yup.object().shape({
  TrainingTypeID: Yup.string().required("Training Type is required"),
  StartDate: Yup.date().required("Start Date is required"),
  FinishDate: Yup.date().required("Finish Date is required"),
  trainedBy: Yup.string().required("Trained By is required"),
  Males: Yup.number()
    .typeError("Number of Males must be a number")
    .required("Number of Males is required"),
  Females: Yup.number()
    .typeError("Number of Females must be a number")
    .required("Number of Females is required"),
});

const TrainingForm: React.FC = () => {
  const router = useIonRouter();
  const { messageState, setMessage } = useNotificationMessage();
  const { selectedTraining, addTraining, editTraining } = useTrainings();
  const { selectedCluster } = useClusters();

  const [initialValues, setInitialValues] = useState({
    TrainingID: "",
    regionID: "",
    districtID: "",
    groupID: "",
    TrainingTypeID: "",
    StartDate: "",
    FinishDate: "",
    trainedBy: "",
    Males: "",
    Females: "",
  });

  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState("Add Training");
  const [buttonTitle, setButtonTitle] = useState("Add Training");
  const [trainingTypes, setTrainingTypes] = useState<any[]>([]);
  const [facilitators, setFacilitators] = useState<any[]>([]);
  const TrainingID = selectedTraining?.TrainingID;

  // ✅ Fetch from /api/training-types and /api/training-facilitators
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [typesRes, facilitatorsRes] = await Promise.all([
          getData("/api/training-types"),
          getData("/api/training-facilitators"),
        ]);

        setTrainingTypes(typesRes || []);
        setFacilitators(facilitatorsRes || []);
      } catch (error) {
        console.error("Error loading dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, []);

  // ✅ Load form for edit mode
  useEffect(() => {
    if (TrainingID && selectedTraining) {
      const formattedStartDate = new Date(selectedTraining.StartDate)
        .toISOString()
        .split("T")[0];
      const formattedFinishDate = new Date(selectedTraining.FinishDate)
        .toISOString()
        .split("T")[0];

      setInitialValues({
        TrainingID: selectedTraining.TrainingID,
        regionID: selectedCluster.regionID,
        districtID: selectedCluster.districtID,
        groupID: selectedCluster.ClusterID,
        TrainingTypeID: selectedTraining.TrainingTypeID,
        StartDate: formattedStartDate,
        FinishDate: formattedFinishDate,
        trainedBy: selectedTraining.trainedBy,
        Males: selectedTraining.Males,
        Females: selectedTraining.Females,
      });

      setPageTitle("Edit Training");
      setButtonTitle("Update Training");
    } else {
      setInitialValues({
        TrainingID: "",
        regionID: selectedCluster?.regionID || "",
        districtID: selectedCluster?.districtID || "",
        groupID: selectedCluster?.ClusterID || "",
        TrainingTypeID: "",
        StartDate: "",
        FinishDate: "",
        trainedBy: "",
        Males: "",
        Females: "",
      });
      setPageTitle("Add Training");
      setButtonTitle("Add Training");
    }
    setLoading(false);
  }, [TrainingID, selectedTraining, selectedCluster]);

  // ✅ Submit handler
  const handleSubmit = async (formData: any, { resetForm }: any) => {
    const formattedFormData = {
      ...formData,
      groupID: selectedCluster?.ClusterID || formData.groupID,
      regionID: selectedCluster?.regionID,
      districtID: selectedCluster?.districtID,
    };

    try {
      setLoading(true);

      if (TrainingID) {
        console.log("training id>>>", TrainingID);
        await putData(`/api/trainings/${TrainingID}`, formattedFormData);
        editTraining(TrainingID, formattedFormData);
        setMessage("Training updated successfully!", "success");
      } else {
        delete formattedFormData.TrainingID;
        const response = await postData("/api/trainings", formattedFormData);
        const newTrainingData = {
          ...formattedFormData,
          TrainingID: response.TrainingID,
        };
        addTraining(newTrainingData);
        setMessage("Training added successfully!", "success");
      }
      console.log("formattedFormData", formattedFormData);

      resetForm();
      router.push("/trainings", "forward");
    } catch (error) {
      console.error("Error saving training:", error);
      setMessage("Failed to save training. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  //   if (loading) {
  //     return (
  //       <IonPage>
  //         <IonLoading isOpen={true} message="Loading form..." />
  //       </IonPage>
  //     );
  //   }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => router.push("/trainings", "back")}>
              <IonIcon icon={arrowBackOutline} slot="start" />
            </IonButton>
          </IonButtons>
          <IonTitle>{pageTitle}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {messageState.text && (
          <NotificationMessage
            text={messageState.text}
            type={messageState.type}
          />
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={schema}
          enableReinitialize={true}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => (
            <Form>
              {/* ✅ Training Type */}
              <IonItem>
                <IonLabel position="stacked">Select Training Type</IonLabel>
                <IonSelect
                  value={values.TrainingTypeID}
                  placeholder="Select Training Type"
                  onIonChange={(e) =>
                    setFieldValue("TrainingTypeID", e.detail.value)
                  }
                >
                  {trainingTypes.map((type) => (
                    <IonSelectOption
                      key={type.trainingTypeID}
                      value={type.trainingTypeID}
                    >
                      {type.training_name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <TextInputField
                name="StartDate"
                label="Start Date"
                type="date"
                id={""}
              />

              <TextInputField
                name="FinishDate"
                label="Finish Date"
                type="date"
                id={""}
              />

              {/* ✅ Trained By */}
              <IonItem>
                <IonLabel position="stacked">Trained By</IonLabel>
                <IonSelect
                  value={values.trainedBy}
                  placeholder="Select Facilitator"
                  onIonChange={(e) =>
                    setFieldValue("trainedBy", e.detail.value)
                  }
                >
                  {facilitators.map((f) => (
                    <IonSelectOption
                      key={f.facilitatorID}
                      value={f.facilitatorID}
                    >
                      {f.title}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <TextInputField
                name="Males"
                label="Number of Males"
                type="number"
                id={""}
              />

              <TextInputField
                name="Females"
                label="Number of Females"
                type="number"
                id={""}
              />

              <IonButton
                expand="block"
                type="submit"
                className="ion-margin-top"
                style={{
                  "--background": "#0b9e43",
                  "--color": "#fff",
                  fontWeight: "bold",
                  borderRadius: "8px",
                  padding: "14px 0",
                }}
              >
                {buttonTitle}
              </IonButton>
            </Form>
          )}
        </Formik>
      </IonContent>
    </IonPage>
  );
};

export default TrainingForm;
