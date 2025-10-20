import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonToast,
  IonButtons,
  IonIcon,
} from "@ionic/react";
import { Formik, Form } from "formik"; // Import Formik components
import { RadioGroupInput, TextInputField } from "../form";
import * as Yup from "yup";
import axios from "axios"; // Import Axios
import { useMeetings } from "../context/MeetingsContext"; // Import the custom hook
import { useClusters } from "../context/ClustersContext"; // Import the custom hook
import {
  getData,
  postData,
  putData,
  viewDataById,
} from "../../services/apiServices";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";
import { useHistory } from "react-router";
import { arrowBackOutline } from "ionicons/icons";

// Validation schema for the form
const schema = Yup.object().shape({
  purpose: Yup.string().required("Meeting purpose is required"),
  meetingDate: Yup.date().required("Meeting Date is required"),
  minutes: Yup.string().required("Minutes is required"),
});

const MeetingForm: React.FC = () => {
  const history = useHistory();
  const { messageState, setMessage } = useNotificationMessage();
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const {
    meetings,
    returnMeetings,
    selectedMeeting,
    addMeeting,
    editMeeting,
    selectedMeetingId,
  } = useMeetings(); // Use the context
  const { selectedCluster } = useClusters(); // Use the context
  const [initialValues, setInitialValues] = useState({
    id: "",
    purpose: "",
    minutes: "",
    meetingDate: "",
    clusterCode: "",
  });
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState("");
  const [buttonTitle, setButtonTitle] = useState("");
  const meetingId = selectedMeetingId;

  useEffect(() => {
    if (selectedMeetingId) {
      const date = new Date(selectedMeeting.meetingDate)
        .toISOString()
        .split("T")[0];

      setInitialValues({
        id: selectedMeeting.id,
        purpose: selectedMeeting.purpose,
        minutes: selectedMeeting.minutes,
        meetingDate: date,
        clusterCode: selectedMeeting.clusterCode,
      });
      setPageTitle("Edit Meeting");
      setButtonTitle("Edit Meeting");
      setLoading(false);
    } else {
      setInitialValues({
        id: "",
        purpose: "",
        minutes: "",
        meetingDate: "",
        clusterCode: "",
      });
      setPageTitle("Add Meeting");
      setButtonTitle("Add Meeting");
    }
  }, [selectedMeeting, selectedMeetingId]);

  const handleSubmit = async (formData: any, { resetForm }: any) => {
    const formattedFormData = {
      ...formData,
      clusterCode: selectedCluster[0].clusterCode,
    };
    console.log("formattedFormData", formattedFormData);

    try {
      if (meetingId) {
        await putData(`/api/meeting/${meetingId}`, formattedFormData);

        const getMeeting = await viewDataById("/api/meeting", meetingId);

        const clusterName = selectedCluster?.name;

        const newEditMeetingData = {
          ...formattedFormData,
          clusterName,
        };
        editMeeting(meetingId, newEditMeetingData);
        setMessage(
          `${formattedFormData.purpose} meeting updated successfully!`,
          "success"
        );
      } else {
        const addResponse = await postData("/api/meeting", formattedFormData);

        const clusterName = selectedCluster?.name;

        const newMeetingData = {
          ...formattedFormData,
          clusterName,
        };

        addMeeting(newMeetingData);
        setMessage(
          `${formattedFormData.purpose} meeting added successfully!`,
          "success"
        );
      }

      // Reset the form after successful submission
      resetForm();

      // Navigate back to the group members page
      history.push("meetings");
    } catch (error) {
      setMessage("Failed to save Meeting. Please try again.", "error");
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ backgroundColor: "#4CAF50" }}>
          {/* Back Button */}
          <IonButtons slot="start">
            <IonButton onClick={() => history.push("/meetings")}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>

          <IonTitle>{pageTitle}</IonTitle>
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
          onSubmit={(values, { resetForm }) =>
            handleSubmit(values, { resetForm })
          }
          initialValues={initialValues}
          validationSchema={schema}
          enableReinitialize={true}
        >
          {({ resetForm }) => (
            <Form>
              <TextInputField
                name="purpose"
                id="purpose"
                label="Meeting Purpose"
                placeholder="Enter meeting purpose"
              />

              <TextInputField
                name="meetingDate"
                id="meetingDate"
                label="Meeting Date"
                placeholder="YYYY-MM-DD"
                type="date"
              />

              <TextInputField
                name="minutes"
                id="minutes"
                label="Meeting Minutes"
                placeholder="Enter meeting minutes"
                multiline={true}
                rows={10}
              />

              <IonButton
                type="submit"
                expand="block"
                style={{ marginTop: "20px" }}
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

export default MeetingForm;
