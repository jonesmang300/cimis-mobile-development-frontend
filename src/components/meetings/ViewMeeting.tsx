import React, { useEffect, useState } from "react";
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
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonCardSubtitle,
  IonSearchbar,
  IonAlert,
} from "@ionic/react";
import { search, peopleOutline, arrowBackOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useMeetings } from "../context/MeetingsContext";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";
import { getData, deleteData } from "../../services/apiServices";
import { useMeetingAttendances } from "../context/MeetingAttendanceContext";
import { useMembers } from "../context/MembersContext";

const ViewMeeting: React.FC = () => {
  const history = useHistory();
  const {
    meetings,
    setTheSelectedMeetingId,
    setTheSelectedMeeting,
    selectedMeeting,
  } = useMeetings();
  const { messageState, setMessage } = useNotificationMessage();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [attendeeToRemove, setAttendeeToRemove] = useState<any>();

  const { returnMeetingAttendances, meetingAttendances } =
    useMeetingAttendances();
  const { members, returnMembers } = useMembers();

  const handleEditClick = (id: number) => {
    const meeting = meetings.find((m: any) => m.id === id);
    if (meeting) {
      setTheSelectedMeeting(meeting);
      setTheSelectedMeetingId(id);
      history.push("edit-meeting");
    }
  };

  const handleAddAttendanceClick = () => {
    history.push("add-attendance");
  };

  const handleRemoveAttendanceClick = async () => {
    if (!attendeeToRemove) return;

    try {
      setLoading(true);
      await deleteData(`/api/meetingattendance`, attendeeToRemove.id);

      const updatedAttendances = meetingAttendances.filter(
        (attendance: any) => attendance.id !== attendeeToRemove.id
      );

      returnMeetingAttendances(updatedAttendances);
      setMessage("Member attendance removed successfully!", "success");
    } catch {
      setMessage("Failed to remove member attendance.", "error");
    } finally {
      setLoading(false);
      setShowDeleteAlert(false);
    }
  };

  const fetchMeetingAttendance = async () => {
    setLoading(true);
    try {
      const response = await getData(`/api/meetingattendance`);
      returnMeetingAttendances(response);
    } catch {
      setError("Error fetching meeting attendances");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await getData(`/api/membership`);
      returnMembers(response);
    } catch {
      setError("Error fetching members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchMeetingAttendance();
  }, []);

  const attendances =
    meetingAttendances?.filter(
      (m: any) => m.meetingId === selectedMeeting?.id
    ) || [];

  const filteredAttendees = attendances.filter((attendee) => {
    const member = members.find(
      (member: any) => member.memberCode === attendee.memberCode
    );
    const fullName = `${member?.firstName} ${member?.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const fullNameOnConfirmation = () => {
    const memberFound = members.find(
      (m: any) => m.memberCode === attendeeToRemove?.memberCode
    );
    return (
      "Are you sure you want to remove " +
      memberFound?.firstName +
      " " +
      memberFound?.lastName +
      "?"
    );
  };

  return (
    <IonPage>
      {/* Header with functional back button */}
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.push("/meetings")}>
              <IonIcon icon={arrowBackOutline} slot="start" />
            </IonButton>
          </IonButtons>
          <IonTitle>View Meeting</IonTitle>
          <IonButtons slot="end">
            <IonButton>
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

      {selectedMeeting && (
        <IonContent className="ion-padding">
          {/* Meeting Details */}
          <IonCard>
            <IonCardContent>
              <IonCardTitle>Meeting Details</IonCardTitle>
              <IonCardSubtitle>Meeting Purpose:</IonCardSubtitle>
              <IonItem>
                <IonLabel>{selectedMeeting.purpose}</IonLabel>
              </IonItem>

              <IonCardSubtitle>Meeting Date:</IonCardSubtitle>
              <IonItem>
                <IonLabel>
                  {new Date(selectedMeeting.meetingDate).toLocaleDateString(
                    "en-GB",
                    { day: "numeric", month: "long", year: "numeric" }
                  )}
                </IonLabel>
              </IonItem>

              <IonCardSubtitle>Meeting Minutes:</IonCardSubtitle>
              <IonItem>
                <IonLabel>{selectedMeeting.minutes}</IonLabel>
              </IonItem>
            </IonCardContent>
          </IonCard>

          {/* Attendees */}
          <IonCard>
            <IonCardContent>
              <IonCardTitle>Meeting Attendees</IonCardTitle>
              <IonItem>
                <IonLabel>Total Attendees: {filteredAttendees.length}</IonLabel>
              </IonItem>
              <IonSearchbar
                value={searchQuery}
                onIonInput={(e) => setSearchQuery(e.detail.value!)}
                debounce={0}
                placeholder="Search attendees"
              />
              <IonList>
                {filteredAttendees.length > 0 ? (
                  filteredAttendees.map((attendee, index) => (
                    <IonItem key={index}>
                      <div style={{ display: "block" }}>
                        <IonLabel style={{ display: "flex", gap: "5px" }}>
                          <p style={{ fontWeight: "bold" }}>Member Name:</p>
                          <p>
                            {
                              members.find(
                                (member: any) =>
                                  member.memberCode === attendee.memberCode
                              )?.firstName
                            }{" "}
                            {
                              members.find(
                                (member: any) =>
                                  member.memberCode === attendee.memberCode
                              )?.lastName
                            }
                          </p>
                        </IonLabel>
                        <IonLabel style={{ display: "flex", gap: "5px" }}>
                          <p style={{ fontWeight: "bold" }}>Cluster Code:</p>
                          <p>{attendee.memberCode}</p>
                        </IonLabel>
                        <IonButton
                          color="danger"
                          onClick={() => {
                            setAttendeeToRemove(attendee);
                            setShowDeleteAlert(true);
                          }}
                        >
                          Remove
                        </IonButton>
                      </div>
                    </IonItem>
                  ))
                ) : (
                  <IonItem>
                    <IonLabel>No attendees recorded for this meeting.</IonLabel>
                  </IonItem>
                )}
              </IonList>
            </IonCardContent>
          </IonCard>

          <IonButton
            expand="full"
            onClick={() => handleEditClick(selectedMeeting.id)}
          >
            Edit Meeting
          </IonButton>
          <IonButton expand="full" onClick={handleAddAttendanceClick}>
            Add Attendance
          </IonButton>

          <IonAlert
            isOpen={showDeleteAlert}
            onDidDismiss={() => setShowDeleteAlert(false)}
            header="Confirm Delete"
            message={fullNameOnConfirmation()}
            buttons={[
              {
                text: "Cancel",
                role: "cancel",
                handler: () => setShowDeleteAlert(false),
              },
              {
                text: "Delete",
                handler: handleRemoveAttendanceClick,
              },
            ]}
          />
        </IonContent>
      )}
    </IonPage>
  );
};

export default ViewMeeting;
