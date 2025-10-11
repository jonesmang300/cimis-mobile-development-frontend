import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonToast,
} from "@ionic/react";
import { Formik, Form } from "formik"; // Import Formik components
import { RadioGroupInput, TextInputField } from "../form";
import * as Yup from "yup";
import axios from "axios"; // Import Axios
import { useMembers } from "../context/MembersContext"; // Import the custom hook
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

// Validation schema for the form
const schema = Yup.object().shape({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  dob: Yup.date().required("Date of birth is required"),
  gender: Yup.string().required("Gender is required"),
  nationalId: Yup.string(),
  disability: Yup.string().required("Disability status is required"),
  kinName: Yup.string(),
  kinPhone: Yup.string()
    .required("Phone number is required")
    .matches(
      /^[1-9]\d{8}$/,
      "Phone number must be 9 digits and cannot start with 0"
    )
    .min(9, "Phone number must have 9 digits")
    .max(9, "Phone number must have 9 digits"),
  village: Yup.string().required("Village is required"),
  phoneNumber: Yup.string()
    .required("Phone number is required")
    .matches(
      /^[1-9]\d{8}$/,
      "Phone number must be 9 digits and cannot start with 0"
    )
    .min(9, "Phone number must have 9 digits")
    .max(9, "Phone number must have 9 digits"),
});

const MemberForm: React.FC = () => {
  const history = useHistory();
  const { messageState, setMessage } = useNotificationMessage();
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const {
    members,
    returnMembers,
    selectedMember,
    addMember,
    editMember,
    selectedMemberId,
  } = useMembers(); // Use the context
  const { selectedCluster } = useClusters(); // Use the context
  const [initialValues, setInitialValues] = useState({
    id: "",
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    disability: "",
    village: "",
    phoneNumber: "",
    nationalId: "",
    kinName: "",
    kinPhone: "",
    clusterCode: "",
  });
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState("");
  const [buttonTitle, setButtonTitle] = useState("");
  const memberId = selectedMemberId;

  useEffect(() => {
    if (selectedMemberId) {
      const date = new Date(selectedMember.dob);
      const formattedDate = date.toISOString().split("T")[0];
      const mPhone = selectedMember.phoneNumber.replace("+265", "");
      const kPhone = selectedMember.kinPhone.replace("+265", "");

      setInitialValues({
        id: selectedMember.id,
        firstName: selectedMember.firstName,
        lastName: selectedMember.lastName,
        dob: formattedDate, // Ensure the date format matches Formik's expectations
        gender: selectedMember.gender,
        disability: selectedMember.disability,
        village: selectedMember.village,
        phoneNumber: mPhone,
        nationalId: selectedMember.nationalId,
        kinName: selectedMember.kinName,
        kinPhone: kPhone,
        clusterCode: selectedMember.clusterCode,
      });
      setPageTitle("Edit Member");
      setButtonTitle("Edit Member");
      setLoading(false);
    } else {
      setInitialValues({
        id: "",
        firstName: "",
        lastName: "",
        dob: "",
        gender: "",
        disability: "",
        village: "",
        phoneNumber: "",
        nationalId: "",
        kinName: "",
        kinPhone: "",
        clusterCode: "",
      });
      setPageTitle("Add Member");
      setButtonTitle("Add Member");
    }
  }, [selectedMember, selectedMemberId]);

  const handleSubmit = async (formData: any, { resetForm }: any) => {
    const memberPhone = "+265" + formData.phoneNumber;
    const kinPhone = "+265" + formData.kinPhone;

    const formattedFormData = {
      ...formData,
      clusterCode: selectedCluster[0].clusterCode,
      phoneNumber: memberPhone,
      kinPhone,
    };

    try {
      if (memberId) {
        await putData(`/api/membership/${memberId}`, formattedFormData);

        const getMember = await viewDataById("/api/membership", memberId);

        const memberCode = getMember.memberCode;
        const clusterName = selectedCluster?.name;

        const newEditMemberData = {
          ...formattedFormData,
          memberCode,
          clusterName,
          phoneNumber: memberPhone,
          kinPhone,
        };
        editMember(memberId, newEditMemberData);
        setMessage(
          `${formattedFormData.firstName} ${formattedFormData.lastName} updated successfully!`,
          "success"
        );
      } else {
        const addResponse = await postData(
          "/api/membership",
          formattedFormData
        );
        const getMember = await viewDataById(
          "/api/membership",
          addResponse.insertId
        );
        const memberCode = getMember.memberCode;

        const clusterName = selectedCluster?.name;

        const newMemberData = {
          ...formattedFormData,
          memberCode,
          clusterName,
        };
        console.log("onesani", newMemberData);

        addMember(newMemberData);
        setMessage(
          `${formattedFormData.firstName} ${formattedFormData.lastName} added successfully!`,
          "success"
        );
      }

      // Reset the form after successful submission
      resetForm();

      // Navigate back to the group members page
      history.push("group-members");
    } catch (error) {
      setMessage("Failed to save Member. Please try again.", "error");
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ backgroundColor: "#4CAF50" }}>
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
                name="firstName"
                id="firstName"
                label="First Name"
                placeholder="Enter first name"
              />
              <TextInputField
                name="lastName"
                id="lastName"
                label="Last Name"
                placeholder="Enter last name"
              />
              <TextInputField
                name="dob"
                id="dob"
                label="Date Of Birth"
                placeholder="YYYY-MM-DD"
                type="date"
              />
              <RadioGroupInput
                name="gender"
                label="Gender"
                options={[
                  { label: "Male", value: "M" },
                  { label: "Female", value: "F" },
                ]}
              />
              <TextInputField
                name="nationalId"
                id="nationalId"
                label="National ID"
                placeholder="Enter National ID"
              />
              <TextInputField
                name="phoneNumber"
                id="phoneNumber"
                label="Phone Number"
                placeholder="Enter phone number"
              />
              <RadioGroupInput
                name="disability"
                label="Disability"
                options={[
                  { label: "Yes", value: "1" },
                  { label: "No", value: "0" },
                ]}
              />
              <TextInputField
                name="kinName"
                id="kinName"
                label="Next Of Kin"
                placeholder="Enter next of kin name"
              />
              <TextInputField
                name="kinPhone"
                id="kinPhone"
                label="Next Of Kin Phone"
                placeholder="Enter next of kin phone"
              />
              <TextInputField
                name="village"
                id="village"
                label="Village"
                placeholder="Enter village"
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

export default MemberForm;
