import React, { useEffect, useState, useCallback } from "react";
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
} from "@ionic/react";
import { add, peopleOutline, search, pencil } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useMembers } from "../context/MembersContext";
import { useGroups } from "../context/GroupsContext";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { getData } from "../../services/apiServices";
import { NotificationMessage } from "../notificationMessage";
import { useClusters } from "../context/ClustersContext";

const GroupMembers: React.FC = () => {
  const history = useHistory();
  const {
    members,
    returnMembers,
    setTheSelectedMemberId,
    setTheSelectedMember,
  } = useMembers();
  const { selectedGroup } = useGroups();
  const { selectedCluster } = useClusters();
  const { messageState, setMessage } = useNotificationMessage();

  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchMembers = useCallback(async () => {
    if (!selectedGroup?.groupID) return;

    setLoading(true);
    try {
      const groupID = encodeURIComponent(selectedGroup.groupID);
      const result = await getData(`/api/groupmembers/${groupID}`);

      // Expecting API returns an array of members
      returnMembers(result);
    } catch (error) {
      setMessage("⚠️ Failed to fetch members.", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedGroup]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = () => {
    setTheSelectedMemberId("");
    history.push("/add-member");
  };

  const handleEditClick = (id: string) => {
    const member = members.find((m: any) => m.sppCode === id);
    if (member) {
      setTheSelectedMember(member);
      setTheSelectedMemberId(id);
      history.push("edit-member");
    }
  };

  // Filter members by search query
  const filteredMembers = members.filter(
    (m) =>
      m.hh_head_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sppCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Group Members</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push("/meetings")}>
              <IonIcon icon={peopleOutline} />
            </IonButton>
            <IonButton>
              <IonIcon icon={search} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {messageState.type === "success" && (
        <NotificationMessage
          text={messageState.text}
          type={messageState.type}
        />
      )}

      <IonContent className="ion-padding">
        {/* Cluster Name */}
        <div
          style={{
            textAlign: "center",
            fontSize: "1.1rem",
            fontWeight: "bold",
            color: "#2e7d32",
            marginBottom: "12px",
          }}
        >
          {selectedCluster?.ClusterName
            ? `Cluster: ${selectedCluster.ClusterName}`
            : "Cluster: (Not selected)"}
        </div>

        {/* Group Name */}
        <div
          style={{
            textAlign: "center",
            fontSize: "1.1rem",
            fontWeight: "bold",
            color: "#2e7d32",
            marginBottom: "12px",
          }}
        >
          {selectedGroup?.groupname
            ? `Group: ${selectedGroup.groupname}`
            : "Group: (Not selected)"}
        </div>

        {/* Add Member Button */}
        <div style={{ marginLeft: 10, marginBottom: 10 }}>
          <IonFabButton color="success" onClick={handleAddMember}>
            <IonIcon icon={add} />
          </IonFabButton>
        </div>

        {/* Search */}
        <IonSearchbar
          value={searchQuery}
          onIonInput={(e) => setSearchQuery(e.detail.value!)}
          debounce={0}
          showClearButton="focus"
          placeholder="Search members..."
        />

        {/* Display total count */}
        <div
          style={{
            textAlign: "center",
            fontWeight: "bold",
            marginBottom: "10px",
            color: "#333",
          }}
        >
          {loading
            ? "Loading members..."
            : `Total Members: ${filteredMembers.length}`}
        </div>

        {/* Scrollable Members List */}
        <div
          style={{
            maxHeight: "80vh",
            overflowY: "auto",
            paddingBottom: "1rem",
          }}
        >
          <IonList>
            {filteredMembers.length > 0
              ? filteredMembers.map((member, index) => (
                  <IonItem key={index} button>
                    <IonAvatar slot="start">
                      <div
                        style={{
                          backgroundColor: "#4CAF50",
                          color: "#fff",
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontWeight: "bold",
                          fontSize: "16px",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setTheSelectedMember(member);
                          history.push("/view-member");
                        }}
                      >
                        {member.hh_head_name?.[0]?.toUpperCase() || "?"}
                      </div>
                    </IonAvatar>

                    <IonLabel
                      onClick={() => {
                        setTheSelectedMember(member);
                        history.push("/view-member");
                      }}
                    >
                      <h2>{member.hh_head_name}</h2>
                      <p>{member.sppCode}</p>
                    </IonLabel>

                    <IonIcon
                      icon={pencil}
                      slot="end"
                      color="success"
                      size="large"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleEditClick(member.sppCode)}
                    />
                  </IonItem>
                ))
              : !loading && (
                  <p style={{ textAlign: "center", marginTop: "2rem" }}>
                    No members found
                  </p>
                )}
          </IonList>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default GroupMembers;
