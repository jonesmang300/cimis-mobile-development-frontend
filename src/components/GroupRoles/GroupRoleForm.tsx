import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonLoading,
} from "@ionic/react";
import { Formik, Form } from "formik";
import { SelectInputField } from "../form";
import * as Yup from "yup";
import { useHistory } from "react-router";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";
import { getData, postData, putData } from "../../services/apiServices";
import { useClusters } from "../context/ClustersContext";
import { useGroupMemberRoles } from "../context/GroupMemberRolesContext";

// Schema for form validation
const schema = Yup.object().shape({
  memberCode: Yup.string().required("Member is required"),
  groupRoleId: Yup.string().required("Cluster Role is required"),
});

const GroupRoleForm: React.FC = () => {
  const history = useHistory();
  const { messageState, setMessage } = useNotificationMessage();
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState("");
  const [buttonTitle, setButtonTitle] = useState("");
  const [initialValues, setInitialValues] = useState({
    id: "",
    memberCode: "",
    clusterCode: "",
    groupRoleId: "",
  });
  const [groupRoles, setGroupRoles] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  const { selectedCluster } = useClusters();
  const {
    returnGroupMemberRoles,
    selectedGroupMemberRole,
    addGroupMemberRole,
    editGroupMemberRole,
    groupMemberRoles,
  } = useGroupMemberRoles();
  const selectedGroupMemberRoleId = selectedGroupMemberRole?.id;

  const handleSubmit = async (formData: any, { resetForm }: any) => {
    if (selectedCluster) {
      const formattedFormData = {
        ...formData,
        clusterCode: selectedCluster[0].clusterCode,
        memberCode: formData.memberCode,
        groupRoleId: formData.groupRoleId,
      };

      try {
        // If editing an existing role
        if (selectedGroupMemberRoleId) {
          const response = await putData(
            `/api/groupmemberrole/${selectedGroupMemberRoleId}`,
            formattedFormData
          );

          editGroupMemberRole(selectedGroupMemberRoleId, formattedFormData);
          setMessage("Role updated successfully!", "success");
        } else {
          // If adding a new role
          const result = await postData(
            "/api/groupmemberrole",
            formattedFormData
          );
          addGroupMemberRole(result);
          setMessage("Role added successfully!", "success");
        }
        resetForm();
        history.push("group-roles");
      } catch (error) {
        setMessage("Failed to save Role. Please try again.", "error");
      }
    } else {
      setMessage("Cluster data is missing or invalid.", "error");
    }
  };

  const fetchGroupRoles = async () => {
    setLoading(true);
    try {
      const result = await getData(`/api/grouprole`);
      setGroupRoles(result || []);
    } catch (error) {
      setMessage("Failed to fetch group roles", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const result = await getData(`/api/membership`);
      setMembers(result || []);
    } catch (error) {
      setMessage("Failed to fetch members", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupRoles();
    fetchMembers();

    if (selectedGroupMemberRole) {
      setInitialValues({
        id: selectedGroupMemberRole.id,
        memberCode: selectedGroupMemberRole.memberCode,
        groupRoleId: selectedGroupMemberRole.groupRoleId,
        clusterCode: selectedGroupMemberRole.clusterCode,
      });
      setPageTitle("Edit Cluster Role");
      setButtonTitle("Edit Cluster Role");
    } else {
      setInitialValues({
        id: "",
        memberCode: "",
        groupRoleId: "",
        clusterCode: "",
      });
      setPageTitle("Add Cluster Member Role");
      setButtonTitle("Add Cluster Member Role");
    }
  }, [selectedGroupMemberRole]);

  const isLoading = groupRoles.length === 0 || members.length === 0;
  console.log("Loading state:", groupMemberRoles); // Debugging log

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
        <IonLoading isOpen={loading} message={"Please wait..."} />

        {!isLoading && (
          <Formik
            onSubmit={(values, { resetForm }) =>
              handleSubmit(values, { resetForm })
            }
            initialValues={initialValues}
            validationSchema={schema}
            enableReinitialize={true}
          >
            {({ resetForm }) => (
              <Form style={{ padding: "15px" }}>
                <SelectInputField
                  name="groupRoleId"
                  selectItems={groupRoles.map((r: any) => ({
                    label: r.groupRole,
                    value: r.id,
                    key: r.id,
                  }))}
                  label="Select Group Role"
                />
                <SelectInputField
                  name="memberCode"
                  label="Select Member"
                  selectItems={members.map(
                    (member: {
                      firstName: string;
                      lastName: string;
                      memberCode: string;
                      id: string;
                    }) => ({
                      label: `${member.firstName} ${member.lastName} (${member.memberCode})`,
                      value: member.memberCode,
                      key: member.id,
                    })
                  )}
                />

                <IonButton
                  type="submit"
                  expand="block"
                  style={{ marginTop: "20px", borderRadius: "8px" }}
                >
                  {buttonTitle}
                </IonButton>
              </Form>
            )}
          </Formik>
        )}
      </IonContent>
    </IonPage>
  );
};

export default GroupRoleForm;
