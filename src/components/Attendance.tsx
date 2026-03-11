import React, { useCallback, useMemo, useState } from "react";
import {
  IonAlert,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonSearchbar,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from "@ionic/react";
import {
  addCircleOutline,
  arrowBack,
  createOutline,
  eyeOutline,
  personAddOutline,
  trashOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import {
  Beneficiary,
  fetchBeneficiariesByGroupCode,
} from "../services/beneficiaries.service";
import {
  createMeeting,
  createMeetingAttendance,
  deleteMeeting,
  deleteMeetingAttendance,
  fetchMeetingAttendance,
  fetchMeetingsByGroupCode,
  Meeting,
  MeetingAttendance,
  updateMeeting,
} from "../services/groupOperations.service";

type MeetingFormState = {
  purpose: string;
  meetingdate: string;
  minutes: string;
};

const emptyMeetingForm: MeetingFormState = {
  purpose: "",
  meetingdate: "",
  minutes: "",
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

const Attendance: React.FC = () => {
  const history = useHistory();
  const selectedGroupID = localStorage.getItem("selectedGroupID") || "";
  const selectedGroupName = localStorage.getItem("selectedGroupName") || "";

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [members, setMembers] = useState<Beneficiary[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<MeetingAttendance[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string>("");

  const [showMeetingModal, setShowMeetingModal] = useState<boolean>(false);
  const [meetingForm, setMeetingForm] = useState<MeetingFormState>(emptyMeetingForm);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [deleteMeetingTarget, setDeleteMeetingTarget] = useState<Meeting | null>(null);

  const [showAttendanceModal, setShowAttendanceModal] = useState<boolean>(false);
  const [attendanceSearch, setAttendanceSearch] = useState<string>("");
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [removeAttendanceTarget, setRemoveAttendanceTarget] =
    useState<MeetingAttendance | null>(null);

  const load = useCallback(async () => {
    if (!selectedGroupID) {
      setMeetings([]);
      setMembers([]);
      setAttendanceRows([]);
      setSelectedMeeting(null);
      return;
    }

    setLoading(true);
    try {
      const [meetingRows, allAttendance, groupMembers] = await Promise.all([
        fetchMeetingsByGroupCode(selectedGroupID),
        fetchMeetingAttendance(),
        fetchBeneficiariesByGroupCode(selectedGroupID),
      ]);

      const filteredAttendance = allAttendance.filter(
        (row) => String(row.groupCode || "") === String(selectedGroupID),
      );

      setMeetings(meetingRows);
      setMembers(groupMembers);
      setAttendanceRows(filteredAttendance);

      setSelectedMeeting((prev) => {
        if (!prev?.meetID) return meetingRows[0] || null;
        return (
          meetingRows.find((row) => row.meetID === prev.meetID) ||
          meetingRows[0] ||
          null
        );
      });
    } catch (error) {
      console.error("Failed to load meetings and attendance:", error);
      setMeetings([]);
      setMembers([]);
      setAttendanceRows([]);
      setSelectedMeeting(null);
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Failed to load meetings and attendance.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedGroupID]);

  useIonViewWillEnter(() => {
    load();
  });

  const attendanceCountByMeeting = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of attendanceRows) {
      const key = String(row.meetID || "");
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [attendanceRows]);

  const selectedMeetingAttendances = useMemo(
    () =>
      attendanceRows.filter(
        (row) => row.meetID === selectedMeeting?.meetID,
      ),
    [attendanceRows, selectedMeeting],
  );

  const selectedAttendeeCodes = useMemo(
    () => new Set(selectedMeetingAttendances.map((row) => String(row.sppCode || ""))),
    [selectedMeetingAttendances],
  );

  const availableMembers = useMemo(() => {
    const query = attendanceSearch.trim().toLowerCase();

    return members.filter((member) => {
      const code = String(member.sppCode || "");
      if (!code || selectedAttendeeCodes.has(code)) return false;

      if (!query) return true;

      const searchable = `${member.hh_head_name || ""} ${member.hh_code || ""} ${member.sppCode || ""}`.toLowerCase();
      return searchable.includes(query);
    });
  }, [attendanceSearch, members, selectedAttendeeCodes]);

  const openAddMeeting = () => {
    setEditingMeeting(null);
    setMeetingForm(emptyMeetingForm);
    setShowMeetingModal(true);
  };

  const openEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setMeetingForm({
      purpose: String(meeting.purpose || ""),
      meetingdate: toDateInput(meeting.meetingdate),
      minutes: String(meeting.minutes || ""),
    });
    setShowMeetingModal(true);
  };

  const handleSaveMeeting = async () => {
    if (!selectedGroupID) {
      setActionMessage("Select a group first.");
      return;
    }

    if (
      !meetingForm.purpose.trim() ||
      !meetingForm.meetingdate ||
      !meetingForm.minutes.trim()
    ) {
      setActionMessage("Purpose, meeting date and minutes are required.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        purpose: meetingForm.purpose.trim(),
        meetingdate: meetingForm.meetingdate,
        minutes: meetingForm.minutes.trim(),
        groupCode: selectedGroupID,
      };

      if (editingMeeting?.meetID) {
        await updateMeeting(editingMeeting.meetID, payload);
      } else {
        await createMeeting(payload);
      }

      setShowMeetingModal(false);
      setEditingMeeting(null);
      setMeetingForm(emptyMeetingForm);
      await load();
    } catch (error) {
      console.error("Failed to save meeting:", error);
      setActionMessage(
        error instanceof Error ? error.message : "Failed to save meeting.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!deleteMeetingTarget?.meetID) return;

    try {
      await deleteMeeting(deleteMeetingTarget.meetID);
      setDeleteMeetingTarget(null);
      await load();
    } catch (error) {
      console.error("Failed to delete meeting:", error);
      setActionMessage(
        error instanceof Error ? error.message : "Failed to delete meeting.",
      );
    }
  };

  const handleToggleCode = (sppCode: string, checked: boolean) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(sppCode);
      } else {
        next.delete(sppCode);
      }
      return Array.from(next);
    });
  };

  const handleSaveAttendance = async () => {
    if (!selectedMeeting?.meetID) {
      setActionMessage("Choose a meeting first.");
      return;
    }

    if (selectedCodes.length === 0) {
      setActionMessage("Select at least one member.");
      return;
    }

    try {
      setSaving(true);
      await Promise.all(
        selectedCodes.map((sppCode) =>
          createMeetingAttendance({
            meetID: Number(selectedMeeting.meetID),
            groupCode: selectedGroupID,
            sppCode,
          }),
        ),
      );
      setShowAttendanceModal(false);
      setSelectedCodes([]);
      setAttendanceSearch("");
      await load();
    } catch (error) {
      console.error("Failed to save meeting attendance:", error);
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Failed to save meeting attendance.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAttendance = async () => {
    if (!removeAttendanceTarget?.id) return;

    try {
      await deleteMeetingAttendance(removeAttendanceTarget.id);
      setRemoveAttendanceTarget(null);
      await load();
    } catch (error) {
      console.error("Failed to remove meeting attendance:", error);
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Failed to remove meeting attendance.",
      );
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()} color="light">
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle style={{ color: "white" }}>Meetings & Attendance</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <IonLabel>
              <h2>{selectedGroupName || "No group selected"}</h2>
              <p>{selectedGroupID || "-"}</p>
            </IonLabel>
          </IonCardContent>
        </IonCard>

        <IonButton expand="block" color="success" onClick={openAddMeeting}>
          <IonIcon icon={addCircleOutline} slot="start" />
          Add Meeting
        </IonButton>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Summary</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none">
              <IonLabel>Total Meetings</IonLabel>
              <IonBadge slot="end" color="success">
                {meetings.length}
              </IonBadge>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>Group Beneficiaries</IonLabel>
              <IonBadge slot="end" color="tertiary">
                {members.length}
              </IonBadge>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 24 }}>
            <IonSpinner name="crescent" />
          </div>
        ) : meetings.length === 0 ? (
          <IonCard>
            <IonCardContent>
              <IonLabel color="medium">
                No meetings found for the selected group.
              </IonLabel>
            </IonCardContent>
          </IonCard>
        ) : (
          <IonList>
            {meetings.map((meeting) => (
              <IonCard key={meeting.meetID || `${meeting.groupCode}-${meeting.meetingdate}`}>
                <IonCardContent>
                  <IonButton
                    expand="block"
                    color="success"
                    onClick={() => {
                      setSelectedMeeting(meeting);
                      setSelectedCodes([]);
                      setAttendanceSearch("");
                      setShowAttendanceModal(true);
                    }}
                  >
                    <IonIcon icon={personAddOutline} slot="start" />
                    Add Attendance
                  </IonButton>

                  <IonItem
                    lines="none"
                    onClick={() => setSelectedMeeting(meeting)}
                  >
                    <IonLabel>
                      <h2>{meeting.purpose || "Untitled Meeting"}</h2>
                      <p>{formatDateLong(meeting.meetingdate)}</p>
                    </IonLabel>
                    <IonBadge slot="end" color="success">
                      {attendanceCountByMeeting[String(meeting.meetID || "")] || 0}
                    </IonBadge>
                  </IonItem>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "nowrap",
                      overflowX: "auto",
                      marginTop: "8px",
                    }}
                  >
                    <IonButton
                      fill="clear"
                      size="small"
                      title="View"
                      aria-label="View meeting"
                      style={{ margin: 0, minWidth: "36px" }}
                      onClick={() =>
                        history.push(
                          `/groups/attendance/view/${encodeURIComponent(
                            String(meeting.meetID || ""),
                          )}`,
                        )
                      }
                    >
                      <IonIcon icon={eyeOutline} />
                    </IonButton>
                    <IonButton
                      fill="clear"
                      size="small"
                      title="Edit"
                      aria-label="Edit meeting"
                      style={{ margin: 0, minWidth: "36px" }}
                      onClick={() => openEditMeeting(meeting)}
                    >
                      <IonIcon icon={createOutline} />
                    </IonButton>
                    <IonButton
                      fill="clear"
                      color="danger"
                      size="small"
                      title="Delete"
                      aria-label="Delete meeting"
                      style={{ margin: 0, minWidth: "36px" }}
                      onClick={() => setDeleteMeetingTarget(meeting)}
                    >
                      <IonIcon icon={trashOutline} />
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}

        <IonModal
          isOpen={showMeetingModal}
          onDidDismiss={() => {
            setShowMeetingModal(false);
            setEditingMeeting(null);
          }}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editingMeeting ? "Edit Meeting" : "Add Meeting"}</IonTitle>
              <IonButtons slot="end">
                <IonButton
                  onClick={() => {
                    setShowMeetingModal(false);
                    setEditingMeeting(null);
                  }}
                >
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">Purpose</IonLabel>
              <IonInput
                value={meetingForm.purpose}
                onIonInput={(e) =>
                  setMeetingForm((prev) => ({
                    ...prev,
                    purpose: e.detail.value || "",
                  }))
                }
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Meeting Date</IonLabel>
              <IonInput
                type="date"
                value={meetingForm.meetingdate}
                onIonInput={(e) =>
                  setMeetingForm((prev) => ({
                    ...prev,
                    meetingdate: e.detail.value || "",
                  }))
                }
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Minutes</IonLabel>
              <IonTextarea
                value={meetingForm.minutes}
                autoGrow
                rows={6}
                onIonInput={(e) =>
                  setMeetingForm((prev) => ({
                    ...prev,
                    minutes: e.detail.value || "",
                  }))
                }
              />
            </IonItem>

            <IonButton
              expand="block"
              color="success"
              onClick={handleSaveMeeting}
              disabled={saving}
            >
              {saving ? "Saving..." : editingMeeting ? "Update Meeting" : "Add Meeting"}
            </IonButton>
          </IonContent>
        </IonModal>

        <IonModal
          isOpen={showAttendanceModal}
          onDidDismiss={() => {
            setShowAttendanceModal(false);
            setSelectedCodes([]);
            setAttendanceSearch("");
          }}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Add Attendance</IonTitle>
              <IonButtons slot="end">
                <IonButton
                  onClick={() => {
                    setShowAttendanceModal(false);
                    setSelectedCodes([]);
                    setAttendanceSearch("");
                  }}
                >
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem lines="none">
              <IonLabel>
                <h2>{selectedMeeting?.purpose || "-"}</h2>
                <p>{formatDateLong(selectedMeeting?.meetingdate)}</p>
              </IonLabel>
            </IonItem>

            <IonSearchbar
              value={attendanceSearch}
              onIonInput={(e) => setAttendanceSearch(e.detail.value || "")}
              placeholder="Search beneficiaries"
            />

            {availableMembers.length === 0 ? (
              <IonItem lines="none">
                <IonLabel color="medium">
                  All beneficiaries for this group are already marked present.
                </IonLabel>
              </IonItem>
            ) : (
              <IonList>
                {availableMembers.map((member) => {
                  const sppCode = String(member.sppCode || "");
                  const checked = selectedCodes.includes(sppCode);

                  return (
                    <IonItem key={sppCode}>
                      <IonCheckbox
                        slot="start"
                        checked={checked}
                        onIonChange={(e) =>
                          handleToggleCode(sppCode, !!e.detail.checked)
                        }
                      />
                      <IonLabel>
                        <h3>{member.hh_head_name || sppCode}</h3>
                        <p>Beneficiary Code: {sppCode || "-"}</p>
                        <p>ML Code: {member.hh_code || "-"}</p>
                      </IonLabel>
                    </IonItem>
                  );
                })}
              </IonList>
            )}

            <IonButton
              expand="block"
              color="success"
              onClick={handleSaveAttendance}
              disabled={saving || selectedCodes.length === 0}
            >
              {saving ? "Saving..." : "Save Attendance"}
            </IonButton>
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={!!deleteMeetingTarget}
          onDidDismiss={() => setDeleteMeetingTarget(null)}
          header="Delete Meeting"
          message={`Delete meeting "${deleteMeetingTarget?.purpose || ""}"?`}
          buttons={[
            { text: "Cancel", role: "cancel" },
            { text: "Delete", role: "destructive", handler: handleDeleteMeeting },
          ]}
        />

        <IonAlert
          isOpen={!!removeAttendanceTarget}
          onDidDismiss={() => setRemoveAttendanceTarget(null)}
          header="Remove Attendance"
          message={`Remove attendance for ${removeAttendanceTarget?.sppCode || ""}?`}
          buttons={[
            { text: "Cancel", role: "cancel" },
            {
              text: "Remove",
              role: "destructive",
              handler: handleRemoveAttendance,
            },
          ]}
        />

        <IonAlert
          isOpen={!!actionMessage}
          onDidDismiss={() => setActionMessage("")}
          header="Meetings"
          message={actionMessage}
          buttons={["OK"]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Attendance;
