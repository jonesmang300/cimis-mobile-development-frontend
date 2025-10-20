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
import {
  add,
  peopleOutline,
  search,
  arrowForwardOutline,
  arrowBackOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useMeetings } from "../context/MeetingsContext";
import { useClusters } from "../context/ClustersContext";
import { getData } from "../../services/apiServices";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";
import { useMeetingAttendances } from "../context/MeetingAttendanceContext";

const MeetingsList: React.FC = () => {
  const history = useHistory();
  const {
    meetings,
    returnMeetings,
    setTheSelectedMeetingId,
    setTheSelectedMeeting,
  } = useMeetings();
  const { selectedCluster } = useClusters();
  const { messageState, setMessage } = useNotificationMessage();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  // const [meetingAttendances, setMeetingAttendances] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const { returnMeetingAttendances, meetingAttendances } =
    useMeetingAttendances();
  // const [attendances, setAttendances] = useState<any[]>([]);

  const itemsPerPage = 20;

  const fetchMeetings = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const result = await getData(
        `/api/meeting?page=${page}&limit=${itemsPerPage}`
      );

      const filteredMeetings = result.filter(
        (m: any) => m.clusterCode === selectedCluster[0].clusterCode
      );

      if (filteredMeetings.length === 0) {
        setHasMore(false);
      }

      returnMeetings(filteredMeetings);
    } catch (error) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, returnMeetings, selectedCluster]);

  const fetchMeetingAttendances = async () => {
    setLoading(true);

    try {
      const result = await getData(`/api/meetingattendance`);

      returnMeetingAttendances(result);
    } catch (error) {
      setError("Failed to fetch data");
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
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchMeetingAttendances();
    fetchMembers();
  }, []);

  const handleScroll = (e: any) => {
    const bottom =
      e.currentTarget.scrollHeight - e.currentTarget.clientHeight ===
      e.currentTarget.scrollTop;
    if (bottom && hasMore && !loading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handleAddMeeting = () => {
    setTheSelectedMeetingId("");
    history.push("add-meeting");
  };

  const handleViewClick = (id: number) => {
    const meeting = meetings.find((m: any) => m.id === id);

    setTheSelectedMeeting(meeting);
    setTheSelectedMeetingId(id);
    history.push("view-meeting");
  };

  const filteredMeetings = meetings.filter(
    (meeting) =>
      meeting.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.meetingDate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!meetings) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Meetings</IonTitle>
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
          {/* Back Button */}
          <IonButtons slot="start">
            <IonButton onClick={() => history.push("/group-members")}>
              <IonIcon icon={arrowBackOutline} slot="start" />
            </IonButton>
          </IonButtons>

          <IonTitle>Meetings</IonTitle>

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
        <div
          style={{ marginTop: "0px", marginBottom: "0px", marginLeft: "10px" }}
        >
          <IonFabButton color="success" onClick={handleAddMeeting}>
            <IonIcon icon={add} />
          </IonFabButton>
        </div>

        <IonSearchbar
          value={searchQuery}
          onIonInput={(e) => setSearchQuery(e.detail.value!)}
          debounce={300} // Adding a debounce value greater than 0
          showClearButton="focus"
          placeholder="Search meetings..."
        />

        {filteredMeetings.map((meeting) => (
          <div key={meeting.id}>
            <IonList>
              <IonItem button onClick={() => handleViewClick(meeting.id)}>
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
                  >
                    {meeting.purpose[0]}
                  </div>
                </IonAvatar>
                <IonLabel>
                  <h2>{meeting.purpose}</h2>
                  <p>
                    {new Date(meeting.meetingDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p style={{ fontWeight: "bold" }}>
                    Attendance:{" "}
                    {
                      meetingAttendances.filter(
                        (a: any) => a.meetingId === meeting.id
                      ).length
                    }{" "}
                    /{" "}
                    {
                      members.filter(
                        (m: any) =>
                          m.clusterCode === selectedCluster[0].clusterCode
                      ).length
                    }
                  </p>
                </IonLabel>
                <IonButton
                  fill="clear"
                  slot="end"
                  onClick={() => handleViewClick(meeting.id)}
                >
                  <IonIcon icon={arrowForwardOutline} />
                </IonButton>
              </IonItem>
            </IonList>
          </div>
        ))}
      </IonContent>
    </IonPage>
  );
};

export default MeetingsList;
