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
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonCardSubtitle, // Import IonSearchbar component
} from "@ionic/react";
import { add, peopleOutline, search, pencil, people } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useMembers } from "../context/MembersContext";
import { useClusters } from "../context/ClustersContext";
import { getData } from "../../services/apiServices";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";

const GroupMembers: React.FC = () => {
  const history = useHistory();
  const {
    members,
    returnMembers,
    setTheSelectedMemberId,
    setTheSelectedMember,
  } = useMembers();
  const { selectedCluster } = useClusters();
  const { messageState, setMessage } = useNotificationMessage();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true); // To track if more members are available
  const [searchQuery, setSearchQuery] = useState<string>(""); // New state for search query

  const itemsPerPage = 20; // Number of members to load per page

  const fetchMembers = useCallback(async () => {
    if (loading || !hasMore) return; // Prevent multiple fetches
    setLoading(true);

    try {
      const result = await getData(
        `/api/membership?page=${page}&limit=${itemsPerPage}`
      );
      const filteredMembers = result.filter(
        (m: any) => m.clusterCode === selectedCluster[0].clusterCode
      );

      // If no members are returned, we’ve reached the end of the list
      if (filteredMembers.length === 0) {
        setHasMore(false);
      }

      returnMembers(filteredMembers);
    } catch (error) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, returnMembers, selectedCluster]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleScroll = (e: any) => {
    const bottom =
      e.currentTarget.scrollHeight ===
      e.currentTarget.scrollTop + e.currentTarget.clientHeight;
    if (bottom && hasMore && !loading) {
      setPage((prevPage) => prevPage + 1); // Increment page to fetch next batch of members
    }
  };

  const handleAddMember = () => {
    setTheSelectedMemberId("");
    history.push("add-member");
  };

  const handleEditClick = (id: number) => {
    const member = members.find((m: any) => m.id === id);
    if (member) {
      setTheSelectedMember(member);
      setTheSelectedMemberId(id);
      history.push("edit-member");
    }
  };

  // Filter members based on the search query
  const filteredMembers = members.filter(
    (member) =>
      member.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.village?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phoneNumber?.includes(searchQuery) // Include phone number if needed
  );

  const handleMeetingClick = () => {
    history.push("meetings");
  };

  if (!members.length) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Members</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>Loading...</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Members</IonTitle>
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

      <IonContent
        className="ion-padding"
        onIonScroll={handleScroll}
        scrollEvents={true}
      >
        <IonCard>
          <IonCardContent>
            <div style={{ backgroundColor: "#4CAF50", color: "#fff" }}>
              <IonButton expand="full" onClick={handleMeetingClick}>
                <IonIcon icon={people} slot="start" />
                Meetings and Attendance
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        <div
          style={{ marginTop: "0px", marginBottom: "0px", marginLeft: "10px" }}
        >
          <IonFabButton color="success" onClick={handleAddMember}>
            <IonIcon icon={add} />
          </IonFabButton>
        </div>

        {/* Add IonSearchbar for search */}
        <IonSearchbar
          value={searchQuery}
          onIonInput={(e) => setSearchQuery(e.detail.value!)}
          debounce={0} // This prevents delay in search input
          showClearButton="focus"
          placeholder="Search members..."
        />

        <IonList>
          {filteredMembers.map((member, index) => (
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
                  }}
                  onClick={() => {
                    history.push("/view-member");
                    setTheSelectedMember(member);
                  }}
                >
                  {member.firstName[0]}
                  {member.lastName[0]}
                </div>
              </IonAvatar>
              <IonLabel
                onClick={() => {
                  history.push("/view-member");
                  setTheSelectedMember(member);
                }}
              >
                <h2>
                  {member.firstName} {member.lastName}
                </h2>
                <p>{member.village} Village</p>
                <p style={{ fontWeight: "bold" }}>{member.phoneNumber}</p>
                <p>{member.memberCode}</p>
              </IonLabel>
              <IonButton
                fill="clear"
                slot="end"
                onClick={() => handleEditClick(member.id)}
              >
                <IonIcon icon={pencil} />
              </IonButton>
            </IonItem>
          ))}
        </IonList>

        {loading && <p>Loading more members...</p>}
      </IonContent>
    </IonPage>
  );
};

export default GroupMembers;
