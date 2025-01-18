import React from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
} from "@ionic/react";
import { FormikInit, TextInputField } from "./form"; // Reusing your existing components
import * as Yup from "yup";
import { useHistory } from "react-router-dom";

const Meetings: React.FC = () => {
  const history = useHistory();

  // Validation schema
  const schema = Yup.object().shape({
    purpose: Yup.string()
      .required("Purpose is required")
      .min(3, "Purpose is too short"),
    date: Yup.string().required("Date is required"),
    location: Yup.string()
      .required("Location is required")
      .min(3, "Location is too short"),
    summary: Yup.string()
      .required("Summary is required")
      .min(10, "Summary must be at least 10 characters"),
  });

  // Submission logic
  const handleMeetingSubmit = (values: {
    purpose: string;
    date: string;
    location: string;
    summary: string;
  }) => {
    // Example success action
    alert("Meeting scheduled successfully!");
    history.push("/home"); // Redirect to the dashboard or another page
  };

  return (
    <IonPage>
      {/* Header */}
      <IonHeader>
        <IonToolbar style={{ backgroundColor: "#4CAF50" }}>
          <IonTitle>Schedule a Meeting</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Content */}
      <IonContent className="ion-padding">
        <FormikInit
          initialValues={{
            purpose: "",
            date: "",
            location: "",
            summary: "",
          }}
          validationSchema={schema}
          onSubmit={handleMeetingSubmit}
        >
          <div>
            <h2>Meeting Details</h2>
            <p>Fill out the form below to schedule your meeting.</p>
          </div>

          {/* Purpose Field */}
          <TextInputField
            name="purpose"
            label="Meeting Purpose"
            placeholder="Enter the purpose of the meeting"
            id="purpose"
          />

          {/* Date Field */}
          <TextInputField
            name="date"
            label="Meeting Date and Time"
            placeholder="Enter meeting date and time"
            id="date"
            type="date" // Ensure datetime picker is displayed
          />

          {/* Location Field */}
          <TextInputField
            name="location"
            label="Meeting Location"
            placeholder="Enter meeting location"
            id="location"
          />

          {/* Summary Field */}
          <TextInputField
            id="summary"
            name="summary"
            label="Meeting Summary"
            placeholder="Enter a summary"
            multiline={true}
            rows={6}
          />

          {/* Submit Button */}
          <IonButton
            expand="block"
            color="success"
            type="submit"
            style={{ marginTop: "1em" }}
          >
            Schedule Meeting
          </IonButton>
        </FormikInit>
      </IonContent>
    </IonPage>
  );
};

export default Meetings;
