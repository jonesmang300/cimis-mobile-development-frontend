import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  IonActionSheet,
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
  ellipsisHorizontal,
  createOutline,
  eyeOutline,
  personAddOutline,
  trashOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useSelectedGroup } from "../hooks/useSelectedGroup";
import { useSyncRefresh } from "../hooks/useSyncRefresh";
import { goBackFromGroupChild } from "../utils/groupNavigation";
import MobileDateInput from "./form/MobileDateInput";
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
import "./Attendance.css";

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
  const { selectedGroupID, selectedGroupName, refreshSelectedGroup } =
    useSelectedGroup();

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
  const [actionMeeting, setActionMeeting] = useState<Meeting | null>(null);
  const [viewMeeting, setViewMeeting] = useState<Meeting | null>(null);

  const [showAttendanceModal, setShowAttendanceModal] = useState<boolean>(false);
  const [attendanceSearch, setAttendanceSearch] = useState<string>("");
  const [meetingSearch, setMeetingSearch] = useState<string>("");
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [attendanceMeetingId, setAttendanceMeetingId] = useState<string>("");
  const [removeAttendanceTarget, setRemoveAttendanceTarget] =
    useState<MeetingAttendance | null>(null);

  const load = useCallback(async (groupIDOverride?: string) => {
    const activeGroupID = groupIDOverride ?? selectedGroupID;

    if (!activeGroupID) {
      setMeetings([]);
      setMembers([]);
      setAttendanceRows([]);
      setSelectedMeeting(null);
      return;
    }

    setLoading(true);
    try {
      const [meetingRowsResult, allAttendanceResult, groupMembersResult] =
        await Promise.allSettled([
          fetchMeetingsByGroupCode(activeGroupID),
          fetchMeetingAttendance(),
          fetchBeneficiariesByGroupCode(activeGroupID),
        ]);

      const meetingRowsRaw =
        meetingRowsResult.status === "fulfilled"
          ? meetingRowsResult.value
          : [];
      const allAttendanceRaw =
        allAttendanceResult.status === "fulfilled"
          ? allAttendanceResult.value
          : [];
      const groupMembersRaw =
        groupMembersResult.status === "fulfilled"
          ? groupMembersResult.value
          : [];

      const meetingRows = Array.isArray(meetingRowsRaw) ? meetingRowsRaw : [];
      const allAttendance = Array.isArray(allAttendanceRaw)
        ? allAttendanceRaw
        : [];
      const groupMembers = Array.isArray(groupMembersRaw)
        ? groupMembersRaw
        : [];

      const filteredAttendance = allAttendance.filter(
        (row) => String(row.groupCode || "") === String(activeGroupID),
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

      const loadFailures = [
        meetingRowsResult,
        allAttendanceResult,
        groupMembersResult,
      ].filter((result) => result.status === "rejected");

      if (loadFailures.length > 0) {
        console.error("Attendance partial load failure:", loadFailures);
      }
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

  useEffect(() => {
    load();
  }, [load]);

  useSyncRefresh(() => {
    const latest = refreshSelectedGroup();
    load(latest.selectedGroupID);
  }, [refreshSelectedGroup, load]);

  const attendanceCountByMeeting = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of attendanceRows) {
      const key = String(row.meetID || "");
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [attendanceRows]);

  const activeAttendanceMeeting = useMemo(
    () =>
      meetings.find(
        (meeting) =>
          String(meeting.meetID || "") === String(attendanceMeetingId || ""),
      ) || null,
    [attendanceMeetingId, meetings],
  );

  const selectedMeetingAttendances = useMemo(
    () =>
      attendanceRows.filter(
        (row) => row.meetID === activeAttendanceMeeting?.meetID,
      ),
    [activeAttendanceMeeting, attendanceRows],
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

  const allVisibleSelected =
    availableMembers.length > 0 &&
    availableMembers.every((member) =>
      selectedCodes.includes(String(member.sppCode || "")),
    );

  const someVisibleSelected =
    availableMembers.some((member) =>
      selectedCodes.includes(String(member.sppCode || "")),
    ) && !allVisibleSelected;

  const filteredMeetings = useMemo(() => {
    const query = meetingSearch.trim().toLowerCase();
    if (!query) return meetings;

    return meetings.filter((meeting) => {
      const searchable = [
        meeting.purpose,
        formatDateLong(meeting.meetingdate),
        meeting.minutes,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      return searchable.includes(query);
    });
  }, [meetingSearch, meetings]);

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
    const activeMeetingId = String(activeAttendanceMeeting?.meetID || "").trim();

    if (!activeMeetingId) {
      setActionMessage("Choose a meeting first.");
      return;
    }

    if (selectedCodes.length === 0) {
      setActionMessage("Select at least one member.");
      return;
    }

    try {
      setSaving(true);
      const codesToSave = [...selectedCodes];
      const savedAttendanceRows: MeetingAttendance[] = [];
      const results: Array<
        | { status: "fulfilled" }
        | { status: "rejected"; reason: unknown }
      > = [];

      for (const sppCode of codesToSave) {
        try {
          await createMeetingAttendance({
            meetID: activeMeetingId,
            groupCode: selectedGroupID,
            sppCode,
          });
          savedAttendanceRows.push({
            meetID: activeMeetingId,
            groupCode: selectedGroupID,
            sppCode,
          });
          results.push({ status: "fulfilled" });
        } catch (error) {
          results.push({ status: "rejected", reason: error });
        }
      }

      const failedCount = results.filter(
        (result) => result.status === "rejected",
      ).length;

      if (savedAttendanceRows.length > 0) {
        setAttendanceRows((prev) => {
          const seen = new Set(
            prev.map(
              (row) => `${String(row.meetID || "")}:${String(row.sppCode || "")}`,
            ),
          );
          const appended = savedAttendanceRows.filter(
            (row) =>
              !seen.has(`${String(row.meetID || "")}:${String(row.sppCode || "")}`),
          );
          return appended.length > 0 ? [...appended, ...prev] : prev;
        });
      }

      setShowAttendanceModal(false);
      setSelectedCodes([]);
      setAttendanceSearch("");
      setAttendanceMeetingId("");
      void load();

      if (failedCount > 0) {
        setActionMessage(
          `${codesToSave.length - failedCount} attendance record(s) saved. ${failedCount} failed.`,
        );
      }
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
            <IonButton onClick={() => goBackFromGroupChild(history)} color="light">
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle style={{ color: "white" }}>Meetings & Attendance</IonTitle>
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
          </IonCardContent>
        </IonCard>

        <IonSearchbar
          value={meetingSearch}
          onIonInput={(e) => setMeetingSearch(String(e.detail.value || ""))}
          placeholder="Search meetings"
        />

        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 24 }}>
            <IonSpinner name="crescent" />
          </div>
        ) : filteredMeetings.length === 0 ? (
          <IonCard>
            <IonCardContent>
              <IonLabel color="medium">
                {meetingSearch.trim()
                  ? "No meetings match your search."
                  : "No meetings found for the selected group."}
              </IonLabel>
            </IonCardContent>
          </IonCard>
        ) : (
          <IonList className="meetings-list">
            {filteredMeetings.map((meeting) => (
              <IonCard
                key={meeting.meetID || `${meeting.groupCode}-${meeting.meetingdate}`}
                className="meetings-list-card"
              >
                <IonCardContent className="meetings-list-card__content">
                  <div className="meetings-list-card__header">
                    <div
                      className="meetings-list-card__copy"
                      onClick={() => setSelectedMeeting(meeting)}
                    >
                      <IonLabel>
                        <h2>{meeting.purpose || "Untitled Meeting"}</h2>
                        <p className="meetings-list-card__date">
                          {formatDateLong(meeting.meetingdate)}
                        </p>
                        <IonBadge color="light" className="meetings-list-card__badge">
                          <IonIcon icon={personAddOutline} />
                          <span>
                            {attendanceCountByMeeting[String(meeting.meetID || "")] || 0}{" "}
                            Attendees
                          </span>
                        </IonBadge>
                      </IonLabel>
                    </div>
                    <IonButton
                      fill="clear"
                      size="small"
                      title="More actions"
                      aria-label="More actions"
                      className="app-inline-action-button meetings-list-card__menu"
                      onClick={() => setActionMeeting(meeting)}
                    >
                      <IonIcon icon={ellipsisHorizontal} slot="icon-only" />
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}

        <IonModal
          isOpen={!!viewMeeting}
          onDidDismiss={() => setViewMeeting(null)}
        >
          <IonHeader>
            <IonToolbar color="success">
              <IonTitle>Meeting Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setViewMeeting(null)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding app-record-modal-content">
            <div className="app-record-modal-stack">
              <IonCard className="app-record-modal-hero">
                <IonCardContent>
                  <IonLabel>
                    <h2>{viewMeeting?.purpose || "Meeting"}</h2>
                    <p>{selectedGroupName || selectedGroupID || "-"}</p>
                  </IonLabel>
                </IonCardContent>
              </IonCard>
              <IonItem lines="none" className="app-record-modal-item">
                <IonLabel>
                  <h3>Purpose</h3>
                  <p>{viewMeeting?.purpose || "-"}</p>
                </IonLabel>
              </IonItem>
              <IonItem lines="none" className="app-record-modal-item">
                <IonLabel>
                  <h3>Meeting Date</h3>
                  <p>{formatDateLong(viewMeeting?.meetingdate)}</p>
                </IonLabel>
              </IonItem>
              <IonItem lines="none" className="app-record-modal-item">
                <IonLabel>
                  <h3>Minutes</h3>
                  <p>{viewMeeting?.minutes || "-"}</p>
                </IonLabel>
              </IonItem>
              <IonItem lines="none" className="app-record-modal-item">
                <IonLabel>
                  <h3>Attendance Count</h3>
                  <p>{attendanceCountByMeeting[String(viewMeeting?.meetID || "")] || 0}</p>
                </IonLabel>
              </IonItem>
            </div>
          </IonContent>
        </IonModal>

        <IonModal
          isOpen={showMeetingModal}
          onDidDismiss={() => {
            setShowMeetingModal(false);
            setEditingMeeting(null);
          }}
        >
          <IonHeader>
            <IonToolbar color="success">
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
          <IonContent className="ion-padding app-record-modal-content">
            <div className="app-record-modal-stack">
            <IonCard className="app-record-modal-hero">
              <IonCardContent>
                <IonLabel>
                  <h2>{editingMeeting ? "Edit Meeting" : "Add Meeting"}</h2>
                  <p>{selectedGroupName || selectedGroupID || "-"}</p>
                </IonLabel>
              </IonCardContent>
            </IonCard>
            <IonItem className="app-record-modal-item">
              <IonLabel position="stacked">Purpose</IonLabel>
              <IonInput
                placeholder="Enter meeting purpose"
                value={meetingForm.purpose}
                onIonInput={(e) =>
                  setMeetingForm((prev) => ({
                    ...prev,
                    purpose: e.detail.value || "",
                  }))
                }
              />
            </IonItem>
            <IonItem className="app-record-modal-item">
              <IonLabel position="stacked">Meeting Date</IonLabel>
              <MobileDateInput
                value={meetingForm.meetingdate}
                placeholder="Select meeting date"
                onIonInput={(e) =>
                  setMeetingForm((prev) => ({
                    ...prev,
                    meetingdate: e.detail.value || "",
                  }))
                }
              />
            </IonItem>
            <IonItem className="app-record-modal-item">
              <IonLabel position="stacked">Minutes</IonLabel>
              <IonTextarea
                placeholder="Enter meeting minutes"
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
              className="app-record-modal-save"
            >
              {saving ? "Saving..." : editingMeeting ? "Update Meeting" : "Add Meeting"}
            </IonButton>
            </div>
          </IonContent>
        </IonModal>

        <IonModal
          isOpen={showAttendanceModal}
          onDidDismiss={() => {
            setShowAttendanceModal(false);
            setSelectedCodes([]);
            setAttendanceSearch("");
            setAttendanceMeetingId("");
          }}
        >
          <IonHeader>
            <IonToolbar color="success">
              <IonTitle>Add Meeting Participants</IonTitle>
              <IonButtons slot="end">
                <IonButton
                  onClick={() => {
                    setShowAttendanceModal(false);
                    setSelectedCodes([]);
                    setAttendanceSearch("");
                    setAttendanceMeetingId("");
                  }}
                >
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding app-record-modal-content">
            <div className="app-record-modal-stack">
              <IonCard className="app-record-modal-hero">
                <IonCardContent>
                  <IonLabel>
                    <h2>{activeAttendanceMeeting?.purpose || "Meeting Attendance"}</h2>
                    <p>{selectedGroupName || selectedGroupID || "-"}</p>
                  </IonLabel>
                </IonCardContent>
              </IonCard>

              <IonItem lines="none" className="app-record-modal-item">
                <IonLabel>
                  <h3>Meeting Date</h3>
                  <p>{formatDateLong(activeAttendanceMeeting?.meetingdate)}</p>
                </IonLabel>
              </IonItem>

            <IonSearchbar
              value={attendanceSearch}
              onIonInput={(e) => setAttendanceSearch(e.detail.value || "")}
              placeholder="Search beneficiaries"
            />

            {availableMembers.length === 0 ? (
              <IonItem lines="none" className="app-record-modal-item">
                <IonLabel color="medium">
                  All beneficiaries for this group are already marked present.
                </IonLabel>
              </IonItem>
            ) : (
              <>
                <IonItem lines="none" className="app-record-modal-item">
                  <IonCheckbox
                    slot="start"
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onIonChange={(e) => {
                      const checked = !!e.detail.checked;
                      const visibleCodes = availableMembers
                        .map((member) => String(member.sppCode || ""))
                        .filter(Boolean);

                      setSelectedCodes((prev) => {
                        const next = new Set(prev);
                        if (checked) {
                          visibleCodes.forEach((code) => next.add(code));
                        } else {
                          visibleCodes.forEach((code) => next.delete(code));
                        }
                        return Array.from(next);
                      });
                    }}
                  />
                  <IonLabel>Select All</IonLabel>
                </IonItem>

                <IonList>
                  {availableMembers.map((member) => {
                    const sppCode = String(member.sppCode || "");
                    const checked = selectedCodes.includes(sppCode);

                    return (
                      <IonItem
                        key={sppCode}
                        className="app-record-modal-item meeting-participant-item"
                      >
                        <IonCheckbox
                          slot="start"
                          checked={checked}
                          onIonChange={(e) =>
                            handleToggleCode(sppCode, !!e.detail.checked)
                          }
                        />
                        <IonLabel className="meeting-participant-item__label">
                          <h3>{member.hh_head_name || sppCode}</h3>
                          <p>ML Code: {member.hh_code || "-"}</p>
                        </IonLabel>
                      </IonItem>
                    );
                  })}
                </IonList>
              </>
            )}

            <IonButton
              expand="block"
              color="success"
              onClick={handleSaveAttendance}
              disabled={saving || selectedCodes.length === 0}
              className="app-record-modal-save"
            >
              {saving ? "Saving..." : "Save Attendance"}
            </IonButton>
            </div>
          </IonContent>
        </IonModal>

        <IonActionSheet
          isOpen={!!actionMeeting}
          onDidDismiss={() => setActionMeeting(null)}
          header={actionMeeting?.purpose || "Meeting"}
          subHeader={actionMeeting ? formatDateLong(actionMeeting.meetingdate) : undefined}
          buttons={[
            {
              text: "Add Attendance",
              icon: personAddOutline,
              handler: () => {
                if (!actionMeeting?.meetID) {
                  setActionMessage("Meeting not found.");
                  return;
                }

                setSelectedMeeting(actionMeeting);
                setAttendanceMeetingId(String(actionMeeting.meetID || ""));
                setSelectedCodes([]);
                setAttendanceSearch("");
                setShowAttendanceModal(true);
              },
            },
            {
              text: "View Details",
              icon: eyeOutline,
              handler: () => {
                if (actionMeeting) setViewMeeting(actionMeeting);
              },
            },
            {
              text: "Edit Meeting",
              icon: createOutline,
              handler: () => {
                if (actionMeeting) openEditMeeting(actionMeeting);
              },
            },
            {
              text: "Delete Meeting",
              role: "destructive",
              icon: trashOutline,
              handler: () => {
                if (actionMeeting) setDeleteMeetingTarget(actionMeeting);
              },
            },
            { text: "Cancel", role: "cancel" },
          ]}
        />

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
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Attendance;

