import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { useHistory, useParams } from "react-router-dom";
import { useSelectedGroup } from "../hooks/useSelectedGroup";
import { useSyncRefresh } from "../hooks/useSyncRefresh";
import {
  Beneficiary,
  fetchBeneficiariesByGroupCode,
} from "../services/beneficiaries.service";
import {
  fetchMeetingAttendance,
  fetchMeetingsByGroupCode,
  Meeting,
  MeetingAttendance,
} from "../services/groupOperations.service";

type Params = {
  meetingID: string;
};

const toDateInput = (value: string | null | undefined) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.includes("T") ? raw.split("T")[0] : raw;
};

const formatDateLong = (value: string | null | undefined) => {
  const raw = toDateInput(value);
  if (!raw) return "-";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const ViewMeeting: React.FC = () => {
  const history = useHistory();
  const { meetingID } = useParams<Params>();
  const { selectedGroupID, selectedGroupName, refreshSelectedGroup } =
    useSelectedGroup();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [members, setMembers] = useState<Beneficiary[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<MeetingAttendance[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (groupIDOverride?: string) => {
    const activeGroupID = groupIDOverride ?? selectedGroupID;

    if (!activeGroupID || !meetingID) {
      setMeeting(null);
      setMembers([]);
      setAttendanceRows([]);
      return;
    }

    setLoading(true);
    try {
      const [meetingRowsRaw, allAttendanceRaw, groupMembersRaw] =
        await Promise.all([
          fetchMeetingsByGroupCode(activeGroupID),
          fetchMeetingAttendance(),
          fetchBeneficiariesByGroupCode(activeGroupID),
        ]);

      const meetingRows = Array.isArray(meetingRowsRaw) ? meetingRowsRaw : [];
      const allAttendance = Array.isArray(allAttendanceRaw)
        ? allAttendanceRaw
        : [];
      const groupMembers = Array.isArray(groupMembersRaw)
        ? groupMembersRaw
        : [];

      setMeeting(
        meetingRows.find(
          (row) => String(row.meetID || "") === String(meetingID || ""),
        ) || null,
      );
      setMembers(groupMembers);
      setAttendanceRows(
        allAttendance.filter(
          (row) =>
            String(row.groupCode || "") === String(activeGroupID) &&
            String(row.meetID || "") === String(meetingID || ""),
        ),
      );
    } catch (error) {
      console.error("Failed to load meeting details:", error);
      setMeeting(null);
      setMembers([]);
      setAttendanceRows([]);
    } finally {
      setLoading(false);
    }
  }, [meetingID, selectedGroupID]);

  useIonViewWillEnter(() => {
    load();
  });

  useEffect(() => {
    load();
  }, [load]);

  useSyncRefresh(() => {
    const latest = refreshSelectedGroup();
    load(latest.selectedGroupID);
  }, [refreshSelectedGroup, load]);

  const attachedMembers = useMemo(
    () =>
      attendanceRows
        .map((row) =>
          members.find(
            (member) =>
              String(member.sppCode || "") === String(row.sppCode || ""),
          ),
        )
        .filter(Boolean),
    [attendanceRows, members],
  );

  return (
    <IonPage>
      <IonModal isOpen onDidDismiss={() => history.goBack()}>
        <IonHeader>
          <IonToolbar color="success">
            <IonButtons slot="start">
              <IonButton onClick={() => history.goBack()} color="light">
                <IonIcon icon={arrowBack} />
              </IonButton>
            </IonButtons>
            <IonTitle style={{ color: "white" }}>View Meeting</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          <div className="app-detail-modal-shell">
            <IonCard className="app-detail-hero-card">
              <IonCardContent>
                <IonLabel>
                  <h2>{selectedGroupName || "No group selected"}</h2>
                  <p>{selectedGroupID || "-"}</p>
                </IonLabel>
              </IonCardContent>
            </IonCard>

            {loading ? (
              <div style={{ textAlign: "center", paddingTop: 24 }}>
                <IonSpinner name="crescent" />
              </div>
            ) : !meeting ? (
              <IonCard>
                <IonCardContent>
                  <IonLabel color="medium">Meeting not found.</IonLabel>
                </IonCardContent>
              </IonCard>
            ) : (
              <>
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Meeting</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonItem lines="none">
                      <IonLabel>
                        <h2>{meeting.purpose || "-"}</h2>
                        <p>Date: {formatDateLong(meeting.meetingdate)}</p>
                        <p>Minutes: {meeting.minutes || "-"}</p>
                      </IonLabel>
                    </IonItem>
                  </IonCardContent>
                </IonCard>

                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Attendance Register</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    {attachedMembers.length === 0 ? (
                      <IonItem lines="none">
                        <IonLabel color="medium">
                          No members attached to this meeting yet.
                        </IonLabel>
                      </IonItem>
                    ) : (
                      <IonList>
                        {attachedMembers.map((member, index) => (
                          <IonItem
                            key={`${member?.sppCode || "member"}-${index}`}
                            lines="none"
                          >
                            <IonLabel>
                              <h3>{member?.hh_head_name || member?.sppCode || "-"}</h3>
                              <p>ML Code: {member?.hh_code || "-"}</p>
                            </IonLabel>
                          </IonItem>
                        ))}
                      </IonList>
                    )}
                  </IonCardContent>
                </IonCard>
              </>
            )}
          </div>
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default ViewMeeting;
