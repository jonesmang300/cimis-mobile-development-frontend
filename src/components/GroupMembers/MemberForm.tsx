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
} from "@ionic/react";
import { Formik, Form } from "formik";
import { RadioGroupInput, TextInputField } from "../form";
import * as Yup from "yup";
import { postData, putData, viewDataById } from "../../services/apiServices";
import { useMembers } from "../context/MembersContext";
import { useClusters } from "../context/ClustersContext";
import { useGroups } from "../context/GroupsContext";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";
import { arrowBackOutline } from "ionicons/icons";
import { useIonRouter } from "@ionic/react";

// ✅ Validation schema
// Calculate 18 years ago from today
const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

const schema = Yup.object().shape({
  hh_head_name: Yup.string().required("Beneficiary name is required"),
  dob: Yup.date()
    .required("Date of birth is required")
    .max(eighteenYearsAgo, "Member must be at least 18 years old"),
  sex: Yup.string().required("Gender is required"),
  nat_id: Yup.string().nullable(), // ✅ allows null values
  hh_code: Yup.string().nullable(),
});

const MemberForm: React.FC = () => {
  const router = useIonRouter();
  const { messageState, setMessage } = useNotificationMessage();
  const { selectedMember, selectedMemberId, addMember, editMember } =
    useMembers();
  const { selectedGroup } = useGroups();
  const [initialValues, setInitialValues] = useState({
    sppCode: "",
    hh_head_name: "",
    dob: "",
    sex: "",
    nat_id: "",
    hh_code: "",
    groupID: "",
  });
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState("Add Member");
  const [buttonTitle, setButtonTitle] = useState("Add Member");
  const memberId = selectedMemberId;

  // ✅ Load member for edit mode
  useEffect(() => {
    if (memberId && selectedMember) {
      const formattedDate = new Date(selectedMember.dob)
        .toISOString()
        .split("T")[0];
      setInitialValues({
        sppCode: selectedMember.sppCode,
        hh_head_name: selectedMember.hh_head_name,
        dob: formattedDate,
        sex: selectedMember.sex,
        nat_id: selectedMember.nat_id,
        hh_code: selectedMember.hh_code,
        groupID: selectedMember.groupID,
      });
      setPageTitle("Edit Member");
      setButtonTitle("Update Member");
    } else {
      setInitialValues({
        sppCode: "",
        hh_head_name: "",
        dob: "",
        sex: "",
        nat_id: "",
        hh_code: "",
        groupID: "",
      });
      setPageTitle("Add Member");
      setButtonTitle("Add Member");
    }
    setLoading(false);
  }, [memberId, selectedMember]);

  // ✅ Unified submit handler
  const handleSubmit = async (formData: any, { resetForm }: any) => {
    const formattedFormData = {
      ...formData,
      groupID: selectedGroup?.groupID || formData.groupID,
    };

    try {
      setLoading(true);

      if (memberId) {
        // 🟢 Update Member
        const mID = encodeURIComponent(memberId);
        await putData(`/api/membership/${mID}`, formattedFormData);
        editMember(memberId, formattedFormData);
        setMessage(
          `${formattedFormData.hh_head_name} updated successfully!`,
          "success"
        );
      } else {
        // 🟢 Add Member
        delete formattedFormData.sppCode;
        const addResponse = await postData(
          "/api/membership",
          formattedFormData
        );

        const newMemberData = {
          ...formattedFormData,
          sppCode: addResponse.sppCode,
        };

        addMember(newMemberData);
        setMessage(
          `${formattedFormData.hh_head_name} added successfully!`,
          "success"
        );
      }

      // ✅ Reset and navigate
      resetForm();
      router.push("/group-members", "forward");
    } catch (error) {
      console.error("Error saving member:", error);
      setMessage("Failed to save Member. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // if (loading) {
  //   return (
  //     <IonPage>
  //       <IonLoading isOpen={true} message="Loading form..." />
  //     </IonPage>
  //   );
  // }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => router.push("/group-members", "back")}>
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
          {() => (
            <Form>
              <TextInputField
                name="hh_head_name"
                id="hh_head_name"
                label="Beneficiary Name"
                placeholder="Enter Beneficiary Name"
              />
              <TextInputField
                name="dob"
                id="dob"
                label="Date of Birth"
                placeholder="YYYY-MM-DD"
                type="date"
              />
              <RadioGroupInput
                name="sex"
                label="Gender"
                options={[
                  { label: "Male", value: "01" },
                  { label: "Female", value: "02" },
                ]}
              />
              <TextInputField
                name="hh_code"
                id="hh_code"
                label="Household Code"
                placeholder="Enter Household Code"
              />
              <TextInputField
                name="nat_id"
                id="nat_id"
                label="National ID"
                placeholder="Enter National ID"
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

export default MemberForm;
