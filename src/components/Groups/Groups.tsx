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
  IonIcon,
  IonFabButton,
  IonSearchbar,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonCardSubtitle,
  IonButtons,
  IonButton,
  IonFooter,
} from "@ionic/react";
import {
  add,
  peopleOutline,
  search,
  eye,
  chevronBack,
  chevronForward,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { getData } from "../../services/apiServices";
import { useClusters } from "../context/ClustersContext";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";
import { useGroups } from "../context/GroupsContext";

const Groups: React.FC = () => {
  const history = useHistory();
  const { selectedCluster } = useClusters();
  const { selectedGroup, setTheSelectedGroup } = useGroups();
  const { messageState } = useNotificationMessage();

  const [groups, setGroups] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const groupsPerPage = 10; // number of groups per page

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getData("/api/group");
      const filteredGroups = result.filter(
        (g: any) => g.clusterID === selectedCluster.ClusterID
      );
      setGroups(filteredGroups);
    } catch (err) {
      setError("Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  }, [selectedCluster]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleAddGroup = () => {
    history.push("/add-group");
  };

  const handleViewGroup = (group: any) => {
    localStorage.setItem("selectedGroup", JSON.stringify(group));
    history.push("/view-group");
  };

  const handleViewMembers = (group: any) => {
    localStorage.setItem("selectedGroup", JSON.stringify(group));
    setTheSelectedGroup(group);
    history.push("/group-members");
  };

  // Filter and paginate
  const filteredGroups = groups.filter(
    (group) =>
      group.groupname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.groupID?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredGroups.length / groupsPerPage);
  const startIndex = (currentPage - 1) * groupsPerPage;
  const paginatedGroups = filteredGroups.slice(
    startIndex,
    startIndex + groupsPerPage
  );

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Groups</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={fetchGroups}>
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
        <IonCard>
          <IonCardContent>
            <IonCardTitle className="text-lg font-semibold text-gray-800">
              Groups in Cluster
            </IonCardTitle>
            <IonCardSubtitle>
              {selectedCluster?.ClusterName || "Cluster"}
            </IonCardSubtitle>
          </IonCardContent>
        </IonCard>

        {/* Searchbar */}
        <IonSearchbar
          value={searchQuery}
          onIonInput={(e) => setSearchQuery(e.detail.value!)}
          debounce={0}
          showClearButton="focus"
          placeholder="Search groups..."
        />

        {loading ? (
          <p>Loading groups...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : (
          <>
            <IonList>
              {paginatedGroups.map((group, index) => (
                <IonItem
                  key={index}
                  lines="full"
                  style={{
                    borderRadius: "10px",
                    marginBottom: "8px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                    alignItems: "center",
                  }}
                >
                  {/* Number in rounded circle */}
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      backgroundColor: "#10B981",
                      color: "white",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      fontWeight: "bold",
                      marginRight: "10px",
                    }}
                  >
                    {startIndex + index + 1}
                  </div>

                  {/* Group Info */}
                  <IonLabel
                    className="ion-text-wrap"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleViewGroup(group)}
                  >
                    <p
                      style={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        marginTop: "4px",
                        color: "#222",
                      }}
                    >
                      Group Code:{" "}
                      <span style={{ fontWeight: "normal" }}>
                        {group.groupID}
                      </span>
                    </p>

                    <p
                      style={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        marginTop: "4px",
                        color: "#222",
                      }}
                    >
                      Group Name:{" "}
                      <span style={{ fontWeight: "normal" }}>
                        {group.groupname}
                      </span>
                    </p>
                  </IonLabel>

                  {/* Action icons */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <IonIcon
                      icon={eye}
                      size="large"
                      color="primary"
                      onClick={() => handleViewGroup(group)}
                      style={{ cursor: "pointer" }}
                    />
                    <IonIcon
                      icon={peopleOutline}
                      size="large"
                      color="success"
                      onClick={() => handleViewMembers(group)}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                </IonItem>
              ))}
            </IonList>

            {/* Pagination Controls */}
            {filteredGroups.length > groupsPerPage && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: "15px",
                  gap: "15px",
                }}
              >
                <IonButton
                  fill="outline"
                  color="medium"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <IonIcon icon={chevronBack} />
                  Prev
                </IonButton>

                <span style={{ fontWeight: "500" }}>
                  Page {currentPage} of {totalPages}
                </span>

                <IonButton
                  fill="outline"
                  color="medium"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <IonIcon icon={chevronForward} />
                </IonButton>
              </div>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Groups;
