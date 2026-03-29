import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  IonAlert,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
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
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from "@ionic/react";
import {
  addCircleOutline,
  arrowBack,
  createOutline,
  eyeOutline,
  trashOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useSelectedGroup } from "../hooks/useSelectedGroup";
import { useSyncRefresh } from "../hooks/useSyncRefresh";
import { goBackFromGroupChild } from "../utils/groupNavigation";
import MobileDateInput from "./form/MobileDateInput";
import { apiGet } from "../services/api";
import {
  Beneficiary,
  fetchBeneficiariesByGroupCode,
} from "../services/beneficiaries.service";
import {
  createGroupTraining,
  deleteGroupTraining,
  fetchGroupTrainingsByGroupID,
  GroupTraining,
  fetchMemberTrainings,
  MemberTraining,
  updateGroupTraining,
} from "../services/groupOperations.service";

type GroupMeta = {
  groupID?: string;
  regionID?: string;
  DistrictID?: string;
  districtID?: string;
};

type TrainingTypeRow = {
  trainingTypeID?: string;
  training_name?: string;
};

type FacilitatorRow = {
  facilitatorID?: string;
  title?: string;
};

type TrainingFormState = {
  TrainingTypeID: string;
  StartDate: string;
  FinishDate: string;
  trainedBy: string;
  Males: string;
  Females: string;
};

const emptyForm: TrainingFormState = {
  TrainingTypeID: "",
  StartDate: "",
  FinishDate: "",
  trainedBy: "",
  Males: "0",
  Females: "0",
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

const Trainings: React.FC = () => {
  const history = useHistory();
  const { selectedGroupID, selectedGroupName, refreshSelectedGroup } =
    useSelectedGroup();

  const [rows, setRows] = useState<GroupTraining[]>([]);
  const [memberTrainings, setMemberTrainings] = useState<MemberTraining[]>([]);
  const [members, setMembers] = useState<Beneficiary[]>([]);
  const [groupMeta, setGroupMeta] = useState<GroupMeta | null>(null);
  const [trainingTypes, setTrainingTypes] = useState<TrainingTypeRow[]>([]);
  const [facilitators, setFacilitators] = useState<FacilitatorRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingRow, setEditingRow] = useState<GroupTraining | null>(null);
  const [viewRow, setViewRow] = useState<GroupTraining | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GroupTraining | null>(null);
  const [actionMessage, setActionMessage] = useState<string>("");
  const [form, setForm] = useState<TrainingFormState>(emptyForm);
  const [listSearch, setListSearch] = useState("");

  const load = useCallback(async (groupIDOverride?: string) => {
    const activeGroupID = groupIDOverride ?? selectedGroupID;

    if (!activeGroupID) {
      setRows([]);
      setGroupMeta(null);
      return;
    }

    setLoading(true);
    try {
      const [
        trainingRowsResult,
        groupRowResult,
        trainingTypeRowsResult,
        facilitatorRowsResult,
        memberTrainingRowsResult,
        beneficiaryRowsResult,
      ] = await Promise.allSettled([
        fetchGroupTrainingsByGroupID(activeGroupID),
        apiGet<GroupMeta>(`/groups/${encodeURIComponent(activeGroupID)}`),
        apiGet<TrainingTypeRow[]>("/training-types"),
        apiGet<FacilitatorRow[]>("/training-facilitators"),
        fetchMemberTrainings({ groupID: activeGroupID }),
        fetchBeneficiariesByGroupCode(activeGroupID),
      ]);

      const trainingRows =
        trainingRowsResult.status === "fulfilled"
          ? trainingRowsResult.value
          : [];
      const groupRow =
        groupRowResult.status === "fulfilled" ? groupRowResult.value : null;
      const trainingTypeRows =
        trainingTypeRowsResult.status === "fulfilled"
          ? trainingTypeRowsResult.value
          : [];
      const facilitatorRows =
        facilitatorRowsResult.status === "fulfilled"
          ? facilitatorRowsResult.value
          : [];
      const memberTrainingRows =
        memberTrainingRowsResult.status === "fulfilled"
          ? memberTrainingRowsResult.value
          : [];
      const beneficiaryRows =
        beneficiaryRowsResult.status === "fulfilled"
          ? beneficiaryRowsResult.value
          : [];

      setRows(Array.isArray(trainingRows) ? trainingRows : []);
      setMemberTrainings(
        Array.isArray(memberTrainingRows) ? memberTrainingRows : [],
      );
      setMembers(Array.isArray(beneficiaryRows) ? beneficiaryRows : []);
      setGroupMeta(groupRow || null);
      setTrainingTypes(Array.isArray(trainingTypeRows) ? trainingTypeRows : []);
      setFacilitators(Array.isArray(facilitatorRows) ? facilitatorRows : []);

      const loadFailures = [
        trainingRowsResult,
        groupRowResult,
        trainingTypeRowsResult,
        facilitatorRowsResult,
        memberTrainingRowsResult,
        beneficiaryRowsResult,
      ].filter((result) => result.status === "rejected");

      if (loadFailures.length > 0) {
        console.error("Trainings partial load failure:", loadFailures);
      }
    } catch (error) {
      console.error("Failed to load trainings:", error);
      setRows([]);
      setMemberTrainings([]);
      setMembers([]);
      setGroupMeta(null);
      setTrainingTypes([]);
      setFacilitators([]);
      setActionMessage(
        error instanceof Error ? error.message : "Failed to load trainings.",
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

  const memberSexBySppCode = useMemo(() => {
    const map: Record<string, string> = {};
    for (const member of members) {
      map[String(member.sppCode || "")] = String(member.sex || "");
    }
    return map;
  }, [members]);

  const attendanceCountByTraining = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of memberTrainings) {
      const key = String(row.TrainingID || "");
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [memberTrainings]);

  const attendanceStatsByTraining = useMemo(() => {
    const stats: Record<
      string,
      { males: number; females: number; total: number }
    > = {};

    for (const row of memberTrainings) {
      const key = String(row.TrainingID || "");
      if (!stats[key]) {
        stats[key] = { males: 0, females: 0, total: 0 };
      }

      const sex = memberSexBySppCode[String(row.sppCode || "")];
      if (sex === "01") {
        stats[key].males += 1;
      } else if (sex === "02") {
        stats[key].females += 1;
      }
      stats[key].total += 1;
    }

    return stats;
  }, [memberSexBySppCode, memberTrainings]);

  const trainingTypeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of trainingTypes) {
      map[String(row.trainingTypeID || "")] =
        row.training_name || String(row.trainingTypeID || "");
    }
    return map;
  }, [trainingTypes]);

  const facilitatorNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of facilitators) {
      map[String(row.facilitatorID || "")] =
        row.title || String(row.facilitatorID || "");
    }
    return map;
  }, [facilitators]);

  const filteredRows = useMemo(() => {
    const query = listSearch.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) => {
      const trainingType = String(
        trainingTypeNameById[String(row.TrainingTypeID || "")] ||
          row.TrainingTypeID ||
          "",
      ).toLowerCase();
      const facilitator = String(
        facilitatorNameById[String(row.trainedBy || "")] || row.trainedBy || "",
      ).toLowerCase();
      const startDate = String(formatDateLong(row.StartDate)).toLowerCase();
      const finishDate = String(formatDateLong(row.FinishDate)).toLowerCase();

      return [trainingType, facilitator, startDate, finishDate].some((value) =>
        value.includes(query),
      );
    });
  }, [facilitatorNameById, listSearch, rows, trainingTypeNameById]);

  const openCreateModal = () => {
    setEditingRow(null);
    setForm(emptyForm);
    setShowFormModal(true);
  };

  const openEditModal = (row: GroupTraining) => {
    const stats = attendanceStatsByTraining[String(row.TrainingID || "")] || {
      males: 0,
      females: 0,
      total: 0,
    };

    setEditingRow(row);
    setForm({
      TrainingTypeID: String(row.TrainingTypeID || ""),
      StartDate: toDateInput(row.StartDate),
      FinishDate: toDateInput(row.FinishDate),
      trainedBy: String(row.trainedBy || ""),
      Males: String(stats.males),
      Females: String(stats.females),
    });
    setShowFormModal(true);
  };

  const handleSave = async () => {
    if (!selectedGroupID) {
      setActionMessage("Select a group first.");
      return;
    }

    if (
      !form.TrainingTypeID.trim() ||
      !form.StartDate ||
      !form.FinishDate ||
      !form.trainedBy.trim()
    ) {
      setActionMessage("Training type, dates and trained by are required.");
      return;
    }

    const males = Number(form.Males || 0);
    const females = Number(form.Females || 0);

    if (
      Number.isNaN(males) ||
      Number.isNaN(females) ||
      males < 0 ||
      females < 0
    ) {
      setActionMessage("Attendance counts must be valid non-negative numbers.");
      return;
    }

    const payload = {
      regionID: String(groupMeta?.regionID || ""),
      districtID: String(groupMeta?.DistrictID || groupMeta?.districtID || ""),
      groupID: selectedGroupID,
      TrainingTypeID: form.TrainingTypeID.trim(),
      StartDate: form.StartDate,
      FinishDate: form.FinishDate,
      trainedBy: form.trainedBy.trim(),
      Males: males,
      Females: females,
    };

    try {
      setSaving(true);
      if (editingRow?.TrainingID) {
        await updateGroupTraining(editingRow.TrainingID, payload);
      } else {
        await createGroupTraining(payload);
      }

      setShowFormModal(false);
      setEditingRow(null);
      setForm(emptyForm);
      await load();
    } catch (error) {
      console.error("Failed to save training:", error);
      setActionMessage(
        error instanceof Error ? error.message : "Failed to save training.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.TrainingID) return;

    try {
      await deleteGroupTraining(deleteTarget.TrainingID);
      if (viewRow?.TrainingID === deleteTarget.TrainingID) {
        setViewRow(null);
      }
      setDeleteTarget(null);
      await load();
    } catch (error) {
      console.error("Failed to delete training:", error);
      setActionMessage(
        error instanceof Error ? error.message : "Failed to delete training.",
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
          <IonTitle style={{ color: "white" }}>Trainings</IonTitle>
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

        <IonButton expand="block" color="success" onClick={openCreateModal}>
          <IonIcon icon={addCircleOutline} slot="start" />
          Add Training
        </IonButton>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Training Summary</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none">
              <IonLabel>Total Trainings</IonLabel>
              <IonBadge slot="end" color="success">
                {rows.length}
              </IonBadge>
            </IonItem>
          </IonCardContent>
        </IonCard>

        <IonSearchbar
          value={listSearch}
          onIonInput={(e) => setListSearch(String(e.detail.value || ""))}
          placeholder="Search trainings"
        />

        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 24 }}>
            <IonSpinner name="crescent" />
          </div>
        ) : filteredRows.length === 0 ? (
          <IonCard>
            <IonCardContent>
              <IonLabel color="medium">
                {listSearch.trim()
                  ? "No trainings match your search."
                  : "No trainings found for the selected group."}
              </IonLabel>
            </IonCardContent>
          </IonCard>
        ) : (
          <IonList>
            {filteredRows.map((row) => {
              const stats = attendanceStatsByTraining[
                String(row.TrainingID || "")
              ] || {
                males: 0,
                females: 0,
                total:
                  attendanceCountByTraining[String(row.TrainingID || "")] || 0,
              };
              const total = stats.total;

              return (
                <IonCard
                  key={row.TrainingID || `${row.groupID}-${row.StartDate}`}
                >
                  <IonCardContent>
                  <IonButton
                    expand="block"
                    color="success"
                    onClick={() => {
                      if (!row.TrainingID) {
                        setActionMessage("Training not found.");
                        return;
                      }

                      history.push({
                        pathname: `/groups/trainings/attendance/${encodeURIComponent(
                          String(row.TrainingID || ""),
                        )}`,
                        state: { training: row },
                      });
                    }}
                  >
                    <IonIcon icon={addCircleOutline} slot="start" />
                    Add Attendance
                  </IonButton>

                    <IonItem lines="none">
                      <IonLabel>
                        <h2>Training</h2>
                        <p>
                          Training Type:{" "}
                          {trainingTypeNameById[
                            String(row.TrainingTypeID || "")
                          ] ||
                            row.TrainingTypeID ||
                            "-"}
                        </p>
                      </IonLabel>
                      <IonBadge slot="end" color="success">
                        {total}
                      </IonBadge>
                    </IonItem>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
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
                        aria-label="View training"
                        style={{ margin: 0, minWidth: "36px" }}
                        onClick={() => setViewRow(row)}
                      >
                        <IonIcon icon={eyeOutline} />
                      </IonButton>
                      <IonButton
                        fill="clear"
                        size="small"
                        title="Edit"
                        aria-label="Edit training"
                        style={{ margin: 0, minWidth: "36px" }}
                        onClick={() => openEditModal(row)}
                      >
                        <IonIcon icon={createOutline} />
                      </IonButton>
                      <IonButton
                        fill="clear"
                        color="danger"
                        size="small"
                        title="Delete"
                        aria-label="Delete training"
                        style={{ margin: 0, minWidth: "36px" }}
                        onClick={() => setDeleteTarget(row)}
                      >
                        <IonIcon icon={trashOutline} />
                      </IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              );
            })}
          </IonList>
        )}

        <IonModal
          isOpen={showFormModal}
          onDidDismiss={() => {
            setShowFormModal(false);
            setEditingRow(null);
          }}
        >
          <IonHeader>
            <IonToolbar color="success">
              <IonTitle>
                {editingRow ? "Edit Training" : "Add Training"}
              </IonTitle>
              <IonButtons slot="end">
                <IonButton
                  onClick={() => {
                    setShowFormModal(false);
                    setEditingRow(null);
                  }}
                >
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">Select Training Type</IonLabel>
              <IonSelect
                value={form.TrainingTypeID}
                placeholder="Select Training Type"
                onIonChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    TrainingTypeID: e.detail.value || "",
                  }))
                }
              >
                {trainingTypes.map((type) => (
                  <IonSelectOption
                    key={String(type.trainingTypeID || "")}
                    value={String(type.trainingTypeID || "")}
                  >
                    {type.training_name || type.trainingTypeID || "-"}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Start Date</IonLabel>
              <MobileDateInput
                value={form.StartDate}
                onIonInput={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    StartDate: e.detail.value || "",
                  }))
                }
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Finish Date</IonLabel>
              <MobileDateInput
                value={form.FinishDate}
                onIonInput={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    FinishDate: e.detail.value || "",
                  }))
                }
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Select Trained By</IonLabel>
              <IonSelect
                value={form.trainedBy}
                placeholder="Select Facilitator"
                onIonChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    trainedBy: e.detail.value || "",
                  }))
                }
              >
                {facilitators.map((facilitator) => (
                  <IonSelectOption
                    key={String(facilitator.facilitatorID || "")}
                    value={String(facilitator.facilitatorID || "")}
                  >
                    {facilitator.title || facilitator.facilitatorID || "-"}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Males Attended</IonLabel>
              <IonInput
                type="number"
                value={form.Males}
                onIonInput={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    Males:
                      e.detail.value === null ? "" : String(e.detail.value),
                  }))
                }
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Females Attended</IonLabel>
              <IonInput
                type="number"
                value={form.Females}
                onIonInput={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    Females:
                      e.detail.value === null ? "" : String(e.detail.value),
                  }))
                }
              />
            </IonItem>

            <IonButton
              expand="block"
              color="success"
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingRow
                  ? "Update Training"
                  : "Add Training"}
            </IonButton>
          </IonContent>
        </IonModal>

        <IonModal isOpen={!!viewRow} onDidDismiss={() => setViewRow(null)}>
          <IonHeader>
            <IonToolbar color="success">
              <IonTitle>Training Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setViewRow(null)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {(() => {
              const stats = attendanceStatsByTraining[
                String(viewRow?.TrainingID || "")
              ] || { males: 0, females: 0, total: 0 };
              const attachedRows = memberTrainings.filter(
                (row) =>
                  String(row.TrainingID || "") ===
                  String(viewRow?.TrainingID || ""),
              );
              const attachedMembers = attachedRows
                .map((row) =>
                  members.find(
                    (member) =>
                      String(member.sppCode || "") ===
                      String(row.sppCode || ""),
                  ),
                )
                .filter(Boolean);

              return (
                <>
                  <IonItem lines="none">
                    <IonLabel>
                      <h3>Training Type</h3>
                      <p>
                        {trainingTypeNameById[
                          String(viewRow?.TrainingTypeID || "")
                        ] ||
                          viewRow?.TrainingTypeID ||
                          "-"}
                      </p>
                    </IonLabel>
                  </IonItem>
                  <IonItem lines="none">
                    <IonLabel>
                      <h3>Start Date</h3>
                      <p>{formatDateLong(viewRow?.StartDate)}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem lines="none">
                    <IonLabel>
                      <h3>Finish Date</h3>
                      <p>{formatDateLong(viewRow?.FinishDate)}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem lines="none">
                    <IonLabel>
                      <h3>Trained By</h3>
                      <p>
                        {facilitatorNameById[
                          String(viewRow?.trainedBy || "")
                        ] ||
                          viewRow?.trainedBy ||
                          "-"}
                      </p>
                    </IonLabel>
                  </IonItem>
                  <IonItem lines="none">
                    <IonLabel>
                      <h3>Attendance</h3>
                      <p>Males: {stats.males}</p>
                      <p>Females: {stats.females}</p>
                      <p>Total: {stats.total}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem lines="none">
                    <IonLabel>
                      <h3>Attendance Register:</h3>
                    </IonLabel>
                  </IonItem>
                  {attachedMembers.length === 0 ? (
                    <IonItem lines="none">
                      <IonLabel color="medium">
                        No members attached to this training yet.
                      </IonLabel>
                    </IonItem>
                  ) : (
                    attachedMembers.map((member, index) => (
                      <IonItem
                        key={`${member?.sppCode || "member"}-${index}`}
                        lines="none"
                      >
                        <IonLabel>
                          <h3>
                            {member?.hh_head_name || member?.sppCode || "-"}
                          </h3>
                          <p>ML Code: {member?.hh_code || "-"}</p>
                          <p>
                            Sex:{" "}
                            {String(member?.sex || "") === "01"
                              ? "Male"
                              : String(member?.sex || "") === "02"
                                ? "Female"
                                : "-"}
                          </p>
                        </IonLabel>
                      </IonItem>
                    ))
                  )}
                </>
              );
            })()}
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={!!deleteTarget}
          onDidDismiss={() => setDeleteTarget(null)}
          header="Delete Training"
          message={`Delete training ${
            trainingTypeNameById[String(deleteTarget?.TrainingTypeID || "")] ||
            deleteTarget?.TrainingTypeID ||
            ""
          }?`}
          buttons={[
            { text: "Cancel", role: "cancel" },
            { text: "Delete", role: "destructive", handler: handleDelete },
          ]}
        />

        <IonAlert
          isOpen={!!actionMessage}
          onDidDismiss={() => setActionMessage("")}
          header="Trainings"
          message={actionMessage}
          buttons={["OK"]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Trainings;
