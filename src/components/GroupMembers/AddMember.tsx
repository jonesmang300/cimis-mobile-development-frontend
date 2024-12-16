import React from "react";
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonToast } from "@ionic/react";
import { Formik, Form } from "formik"; // Import Formik components
import { RadioGroupInput, TextInputField } from "../form";
import * as Yup from "yup";
import axios from "axios"; // Import Axios
import { useMembers } from "../context/MembersContext"; // Import the custom hook

// Validation schema for the form
const schema = Yup.object().shape({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  dob: Yup.date().required("Date of birth is required"),
  gender: Yup.string().required("Gender is required"),
  nationalId: Yup.string().required("National ID is required"),
  disability: Yup.string().required("Disability status is required"),
  kinName: Yup.string().required("Next of kin is required"),
  kinPhone: Yup.string().required("Next of kin phone is required").matches(/^\d+$/, "Phone number must be digits only"),
  nextOfKinAddress: Yup.string().required("Next of kin address is required"),
  constituency: Yup.string().required("Constituency is required"),
  village: Yup.string().required("Village is required"),
  phoneNumber: Yup.string().required("Phone number is required").matches(/^\d+$/, "Phone number must be digits only"),
  groupId: Yup.number().required("Group ID is required").positive("Group ID must be a positive number"),
});

const AddMember: React.FC = () => {
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const { addMember } = useMembers(); // Use the context

  const handleSubmit = async (values: any, { resetForm }: any) => {
    console.log("Submitting values:", values);
    try {
      const response = await axios.post("http://46.202.141.116:3000/membership", values);
      console.log("Member added successfully:", response.data);
      setToastMessage("Member added successfully!");
      setShowToast(true);
      addMember(values); // Add the new member to the context
      resetForm(); // Reset the form fields
    } catch (error) {
      console.error("Error adding member:", error);
      setToastMessage("Error adding member. Please try again.");
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ backgroundColor: "#4CAF50" }}>
          <IonTitle>Add Member</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <Formik
          initialValues={{
            firstName: "",
            lastName: "",
            dob: "",
            gender: "",
            nationalId: "",
            disability: "",
            kinName: "",
            kinPhone: "",
            nextOfKinAddress: "",
            constituency: "",
            village: "",
            phoneNumber: "",
            groupId: "",
          }}
          validationSchema={schema}
          onSubmit={handleSubmit}
        >
          {({ resetForm }) => (
            <Form>
              <TextInputField name="firstName" id="firstName" label="First Name" placeholder="Enter first name" />
              <TextInputField name="lastName" id="lastName" label="Last Name" placeholder="Enter last name" />
              <TextInputField name="dob" id="dob" label="Date Of Birth" placeholder="YYYY-MM-DD" type="date" />

              <RadioGroupInput
                name="gender"
                label="Gender"
                options={[
                  { label: "Male", value: "M" },
                  { label: "Female", value: "F" },
                ]}
              />

              <TextInputField name="nationalId" id="nationalId" label="National ID" placeholder="Enter National ID" />
              <TextInputField name="phoneNumber" id="phoneNumber" label="Phone Number" placeholder="Enter phone number" />

              <RadioGroupInput
                name="disability"
                label="Disability"
                options={[
                  { label: "Yes", value: "1" },
                  { label: "No", value: "0" },
                ]}
              />

              <TextInputField name="kinName" id="kinName" label="Next Of Kin" placeholder="Enter next of kin name" />
              <TextInputField name="kinPhone" id="kinPhone" label="Next Of Kin Phone" placeholder="Enter next of kin phone" />
              <TextInputField name="nextOfKinAddress" id="nextOfKinAddress" label="Next Of Kin Address" placeholder="Enter next of kin address" />
              <TextInputField name="constituency" id="constituency" label="Constituency" placeholder="Enter constituency" />
              <TextInputField name="village" id="village" label="Village" placeholder="Enter village" />
              <TextInputField name="groupId" id="groupId" label="Group ID" placeholder="Enter group ID" type="number" />

              <IonButton type="submit" expand="block" style={{ marginTop: "20px" }}>
                Add Member
              </IonButton>
            </Form>
          )}
        </Formik>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
      </IonContent>
    </IonPage>
  );
};

export default AddMember;
