import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonCheckbox,
  IonLabel,
  IonItem,
  IonSearchbar,
  IonList,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from "@ionic/react";
import { peopleOutline, search } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useClusters } from "../context/ClustersContext";
import { getData, postData } from "../../services/apiServices";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";
import { useMeetings } from "../context/MeetingsContext";
import { useMeetingAttendances } from "../context/MeetingAttendanceContext";
import "./AddAttendance.css";

const AddAttendance: React.FC = () => {
  const history = useHistory();
  const { selectedCluster } = useClusters();
  const { selectedMeeting } = useMeetings();
  const { messageState, setMessage } = useNotificationMessage();

  const [selectedParticipants, setSelectedParticipants] = useState<number[]>(
    []
  );
  const { addMeetingAttendance, meetingAttendances } = useMeetingAttendances();
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [selectAll, setSelectAll] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const fetchParticipants = async (
    searchQuery: string,
    page: number,
    pageSize: number
  ) => {
    setLoading(true);
    try {
      const response = await getData(
        `/api/membership?search=${searchQuery}&page=${page}&pageSize=${pageSize}`
      );
      if (response.length > 0) {
        setParticipants((prev) => {
          const newParticipants = response.filter(
            (p: any) => !prev.some((existing: any) => existing.id === p.id)
          );
          return [...prev, ...newParticipants];
        });
        setHasMore(true);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setError("Failed to load participants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setParticipants([]);
    setPage(1);
    setHasMore(true);
    fetchParticipants(searchQuery, 1, pageSize);
  }, [selectedCluster, searchQuery]);

  const handleAddAttendance = async () => {
    if (selectedParticipants.length === 0) {
      setError("No participants selected.");
      return;
    }

    setLoading(true);
    try {
      const formDataList = selectedParticipants
        .map((selectedParticipantId: any) => {
          const participant = participants.find(
            (p) => p.id === selectedParticipantId
          );
          if (participant) {
            const memberCode = participant?.memberCode;
            const clusterCode = selectedCluster[0]?.clusterCode;
            const meetingId = selectedMeeting?.id;
            return { memberCode, clusterCode, meetingId };
          }
        })
        .filter(Boolean);

      formDataList.map(async (formData: any) => {
        await postData("/api/meetingattendance", formData);

        addMeetingAttendance(formData);
      });

      history.push("view-meeting");
    } catch (err) {
      setError("Failed to submit attendance.");
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantChange = (participantId: number) => {
    setSelectedParticipants((prevSelected) =>
      prevSelected.includes(participantId)
        ? prevSelected.filter((id) => id !== participantId)
        : [...prevSelected, participantId]
    );
  };
  console.log("sp", selectedParticipants);

  const handleSelectAllChange = () => {
    if (selectAll) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(
        participants
          .filter((m: any) => m.clusterCode === selectedCluster[0].clusterCode)
          .map((p) => p.id)
      );
    }
    setSelectAll(!selectAll);
  };

  const filteredParticipants = participants
    .filter((m: any) => m.clusterCode === selectedCluster[0].clusterCode)
    .filter((participant) =>
      `${participant.firstName} ${participant.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );

  const loadMore = async (event: any) => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchParticipants(searchQuery, nextPage, pageSize);
      event.target.complete();
    } else {
      event.target.disabled = true;
      event.target.complete();
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{"Add Meeting Participants"}</IonTitle>
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

      {error && <div>{error}</div>}

      <IonContent className="ion-padding">
        <IonSearchbar
          value={searchQuery}
          debounce={500}
          placeholder="Search participants..."
          onIonInput={(e) => setSearchQuery(e.detail.value!)}
        />

        <div className="total-participants">
          Total Participants:{" "}
          {
            filteredParticipants.filter(
              (m: any) => m.clusterCode === selectedCluster[0].clusterCode
            ).length
          }
        </div>

        <IonItem>
          <IonLabel>Select All</IonLabel>
          <IonCheckbox
            slot="end"
            checked={selectAll}
            onIonChange={handleSelectAllChange}
          />
        </IonItem>

        <IonList>
          {filteredParticipants
            .filter(
              (m: any) => m.clusterCode === selectedCluster[0].clusterCode
            )
            .map((participant) => (
              <IonItem
                key={participant.id}
                className={
                  selectedParticipants.includes(participant.id)
                    ? "selected"
                    : ""
                }
              >
                <div className="initials-button">
                  {participant.firstName[0]}
                  {participant.lastName[0]}
                </div>
                <IonLabel>
                  {participant.firstName} {participant.lastName}
                </IonLabel>
                <IonCheckbox
                  slot="end"
                  checked={selectedParticipants.includes(participant.id)}
                  onIonChange={() => handleParticipantChange(participant.id)}
                />
              </IonItem>
            ))}
        </IonList>

        <IonInfiniteScroll
          threshold="100px"
          disabled={!hasMore}
          onIonInfinite={loadMore}
        >
          <IonInfiniteScrollContent loadingText="Loading more participants..."></IonInfiniteScrollContent>
        </IonInfiniteScroll>

        <IonButton
          expand="full"
          onClick={handleAddAttendance}
          disabled={loading || selectedParticipants.length === 0}
        >
          {loading ? "Processing..." : "Add Attendance"}
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default AddAttendance;
