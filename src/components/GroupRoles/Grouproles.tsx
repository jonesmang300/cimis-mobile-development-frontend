import React, { useEffect, useState, useRef } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonFabButton,
  IonAvatar,
  IonButtons,
  IonSearchbar,
  IonAlert,
} from "@ionic/react";
import {
  add,
  peopleOutline,
  search,
  pencil,
  trash,
  refresh,
} from "ionicons/icons"; // Added refresh icon import
import { useHistory } from "react-router-dom";
import { useGroupMemberRoles } from "../context/GroupMemberRolesContext";
import { useClusters } from "../context/ClustersContext";
import { deleteData, getData } from "../../services/apiServices";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";

const GroupRoles: React.FC = () => {
  const history = useHistory();
  const { selectedCluster } = useClusters();
  const { messageState, setMessage } = useNotificationMessage();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [members, setMembers] = useState<any[]>([]);

  const {
    returnGroupMemberRoles,
    groupMemberRoles,
    setTheSelectedGroupMemberRole,
    selectedGroupMemberRole,
  } = useGroupMemberRoles();
  const [groupRoles, setGroupRoles] = useState<any[]>([]);

  const itemsPerPage = 20;
  const [itemToRemove, setItemToRemove] = useState<any | null>(null);
  const deleteInProgress = useRef(false); // Flag to track if deletion is in progress

  const fetchGroupRoles = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const result = await getData(
        `/api/grouprole?page=${page}&limit=${itemsPerPage}`
      );
      setGroupRoles((prev) => [...prev, ...result]);
      if (result.length < itemsPerPage) {
        setHasMore(false);
      }
    } catch (error) {
      setError("Failed to fetch group roles");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMemberRoles = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const result = await getData(
        `/api/groupmemberrole?page=${page}&limit=${itemsPerPage}`
      );
      returnGroupMemberRoles(result);
    } catch (error) {
      setError("Failed to fetch group member roles");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);

    try {
      const result = await getData(`/api/membership`);
      setMembers(result);
    } catch (error) {
      setError("Failed to fetch members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupMemberRoles();
    fetchGroupRoles();
    fetchMembers();
  }, [page]);

  const handleRemoveRoleClick = async () => {
    // Check if selectedGroupMemberRole.id is empty
    if (!selectedGroupMemberRole?.id) {
      setMessage(
        "Cannot delete this record. Please refresh the page and try again.",
        "error"
      );

      return;
    }

    try {
      setLoading(true);

      // Proceed with deleting the selected group member role
      await deleteData(`/api/groupmemberrole`, selectedGroupMemberRole.id);

      // Filter out the deleted role from the list of group member roles
      const updatedRoles = groupMemberRoles.filter(
        (gr: any) => gr.id !== selectedGroupMemberRole.id
      );
      returnGroupMemberRoles(updatedRoles);

      // Show success message
      setMessage("Cluster member role removed successfully!", "success");
    } catch (error) {
      setMessage("Failed to remove cluster member role.", "error");
    } finally {
      setLoading(false);
      setShowDeleteAlert(false);
    }
  };

  const fullNameOnConfirmation = (role: any) => {
    const roleFound = groupRoles.find((r: any) => r.id === role?.groupRoleId);
    const memberFound = members.find(
      (m: any) => m.memberCode === role?.memberCode
    );
    if (roleFound && memberFound) {
      return `Are you sure you want to remove ${roleFound?.groupRole} ${memberFound?.firstName} ${memberFound?.lastName}?`;
    } else {
      return "Error finding the role or member for confirmation.";
    }
  };

  // Refresh data by triggering the API calls again
  const refreshPage = () => {
    setPage(1); // Reset to first page
    setGroupRoles([]); // Clear current roles
    setHasMore(true); // Ensure pagination is active
    setLoading(true); // Indicate loading state
    fetchGroupMemberRoles(); // Fetch group member roles
    fetchGroupRoles(); // Fetch group roles
    fetchMembers(); // Fetch members
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Member Roles</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push("/group-roles")}>
              <IonIcon icon={peopleOutline} />
            </IonButton>
            <IonButton>
              <IonIcon icon={search} />
            </IonButton>
            <IonButton onClick={refreshPage}>
              <IonIcon icon={refresh} /> {/* Refresh icon added here */}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {messageState.type === "success" ||
        (messageState.type === "error" && (
          <NotificationMessage
            text={messageState.text}
            type={messageState.type}
          />
        ))}

      <IonContent className="ion-padding">
        <div
          style={{ marginTop: "0px", marginBottom: "0px", marginLeft: "10px" }}
        >
          <IonFabButton
            color="success"
            onClick={() => {
              setTheSelectedGroupMemberRole(null);
              history.push("add-group-roles");
            }}
          >
            <IonIcon icon={add} />
          </IonFabButton>
        </div>

        <IonSearchbar
          value={searchQuery}
          onIonInput={(e) => setSearchQuery(e.detail.value!)}
          debounce={300}
          showClearButton="focus"
          placeholder="Search group roles..."
        />

        {/* Display message if no group roles are available */}
        {groupMemberRoles.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <p>No records found</p>
          </div>
        ) : (
          <IonList>
            {groupMemberRoles.map((role: any) => {
              const groupRole = groupRoles.find(
                (r: any) => r.id === role?.groupRoleId
              );
              const member = members.find(
                (m: any) => m.memberCode === role?.memberCode
              );

              return (
                <IonItem key={role.id}>
                  <IonAvatar slot="start">
                    <div
                      style={{
                        backgroundColor: "#4CAF50", // Green color for the initials button
                        color: "#fff",
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        fontWeight: "bold",
                      }}
                    >
                      {groupRole?.groupRole[0]}
                    </div>
                  </IonAvatar>
                  <IonLabel>
                    <h2>{groupRole?.groupRole}</h2>
                    <p style={{ fontWeight: "bold" }}>
                      {member?.firstName} {member?.lastName}
                    </p>
                    <p>{member?.memberCode}</p>
                  </IonLabel>
                  <IonButton
                    fill="clear"
                    slot="end"
                    onClick={() => {
                      setTheSelectedGroupMemberRole(role);
                      history.push("edit-group-roles");
                    }}
                  >
                    <IonIcon icon={pencil} />
                  </IonButton>

                  <IonButton
                    fill="clear"
                    color="danger"
                    slot="end"
                    onClick={() => {
                      setTheSelectedGroupMemberRole(role);
                      setItemToRemove(role);
                      setShowDeleteAlert(true);
                    }}
                  >
                    <IonIcon icon={trash} />
                  </IonButton>
                </IonItem>
              );
            })}
          </IonList>
        )}

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Confirm Delete"
          message={fullNameOnConfirmation(itemToRemove)}
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () => setShowDeleteAlert(false),
            },
            { text: "Delete", handler: handleRemoveRoleClick },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default GroupRoles;
