import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  IonAlert,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { useSelectedGroup } from "../hooks/useSelectedGroup";
import { useSyncRefresh } from "../hooks/useSyncRefresh";
import {
  Beneficiary,
  fetchBeneficiariesByGroupCode,
} from "../services/beneficiaries.service";
import {
  createMemberTraining,
  fetchGroupTrainingsByGroupID,
  fetchMemberTrainings,
  GroupTraining,
} from "../services/groupOperations.service";
import { apiGet } from "../services/api";

type Params = {
  trainingID: string;
};

type TrainingTypeRow = {
  trainingTypeID?: string;
  training_name?: string;
};

type FacilitatorRow = {
  facilitatorID?: string;
  title?: string;
};

type TrainingParticipantsLocationState = {
  training?: GroupTraining | null;
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

const TrainingParticipants: React.FC = () => {
  const history = useHistory();
  const location = useLocation<TrainingParticipantsLocationState>();
  const { trainingID } = useParams<Params>();
  const { selectedGroupID, selectedGroupName, refreshSelectedGroup } =
    useSelectedGroup();

  const [training, setTraining] = useState<GroupTraining | null>(null);
  const [members, setMembers] = useState<Beneficiary[]>([]);
  const [trainingTypes, setTrainingTypes] = useState<TrainingTypeRow[]>([]);
  const [facilitators, setFacilitators] = useState<FacilitatorRow[]>([]);
  const [existingCodes, setExistingCodes] = useState<string[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const routeTraining = location.state?.training || null;

  const load = useCallback(async (groupIDOverride?: string) => {
    const activeGroupID = groupIDOverride ?? selectedGroupID;

    if (!activeGroupID || !trainingID) {
      setTraining(null);
      setMembers([]);
      return;
    }

    setLoading(true);
    try {
      const [
        trainingRowsResult,
        beneficiaryRowsResult,
        trainingTypeRowsResult,
        facilitatorRowsResult,
        memberTrainingRowsResult,
      ] = await Promise.allSettled([
        fetchGroupTrainingsByGroupID(activeGroupID),
        fetchBeneficiariesByGroupCode(activeGroupID),
        apiGet<TrainingTypeRow[]>("/training-types"),
        apiGet<FacilitatorRow[]>("/training-facilitators"),
        fetchMemberTrainings({
          trainingID,
          groupID: activeGroupID,
        }),
      ]);

      const trainingRows =
        trainingRowsResult.status === "fulfilled" ? trainingRowsResult.value : [];
      const beneficiaryRows =
        beneficiaryRowsResult.status === "fulfilled" ? beneficiaryRowsResult.value : [];
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

      const foundTraining =
        trainingRows.find(
          (row) => String(row.TrainingID || "") === String(trainingID || ""),
        ) ||
        (routeTraining &&
        String(routeTraining.TrainingID || "") === String(trainingID || "")
          ? routeTraining
          : null);

      setTraining(foundTraining);
      setMembers(beneficiaryRows);
      setTrainingTypes(trainingTypeRows);
      setFacilitators(facilitatorRows);
      setExistingCodes(
        Array.from(
          new Set(
            memberTrainingRows
              .map((row) => String(row.sppCode || ""))
              .filter(Boolean),
          ),
        ),
      );
      setSelectedCodes([]);

      if (!foundTraining) {
        setActionMessage("Training not found.");
      }

      const loadFailures = [
        trainingRowsResult,
        beneficiaryRowsResult,
        trainingTypeRowsResult,
        facilitatorRowsResult,
        memberTrainingRowsResult,
      ].filter((result) => result.status === "rejected");

      if (loadFailures.length > 0) {
        console.error("Training participants partial load failure:", loadFailures);
      }
    } catch (error) {
      console.error("Failed to load training participants page:", error);
      setTraining(null);
      setMembers([]);
      setTrainingTypes([]);
      setFacilitators([]);
      setActionMessage(
        error instanceof Error ? error.message : "Failed to load training.",
      );
    } finally {
      setLoading(false);
    }
  }, [routeTraining, selectedGroupID, trainingID]);

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

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const availableMembers = members.filter(
      (member) => !existingCodes.includes(String(member.sppCode || "")),
    );
    if (!query) return availableMembers;
    return availableMembers.filter((member) => {
      const searchable = `${member.hh_head_name || ""} ${member.hh_code || ""} ${member.sppCode || ""}`.toLowerCase();
      return searchable.includes(query);
    });
  }, [existingCodes, members, searchQuery]);

  const allVisibleSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((member) =>
      selectedCodes.includes(String(member.sppCode || "")),
    );

  const someVisibleSelected =
    filteredMembers.some((member) =>
      selectedCodes.includes(String(member.sppCode || "")),
    ) && !allVisibleSelected;

  const handleToggle = (sppCode: string, checked: boolean) => {
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

  const selectedMembers = useMemo(
    () =>
      members.filter((member) =>
        selectedCodes.includes(String(member.sppCode || "")),
      ),
    [members, selectedCodes],
  );

  const existingMembers = useMemo(
    () =>
      members.filter((member) =>
        existingCodes.includes(String(member.sppCode || "")),
      ),
    [existingCodes, members],
  );

  const handleSave = async () => {
    if (!training?.TrainingID) {
      setActionMessage("Training not found.");
      return;
    }

    try {
      setSaving(true);
      const codesToSave = [...selectedCodes];

      for (const sppCode of codesToSave) {
        await createMemberTraining({
          groupID: selectedGroupID,
          sppCode,
          TrainingID: String(training.TrainingID || ""),
          attendance: "1",
        });
      }

      history.push("/groups/trainings");
    } catch (error) {
      console.error("Failed to save training attendance:", error);
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Failed to save training attendance.",
      );
    } finally {
      setSaving(false);
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
          <IonTitle style={{ color: "white" }}>Add Training Participants</IonTitle>
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

        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 24 }}>
            <IonSpinner name="crescent" />
          </div>
        ) : !training ? (
          <IonCard>
            <IonCardContent>
              <IonLabel color="medium">Training not found.</IonLabel>
            </IonCardContent>
          </IonCard>
        ) : (
          <>
            <IonCard>
              <IonCardContent>
                <IonItem lines="none">
                  <IonLabel>
                    <h2>
                      {trainingTypeNameById[String(training.TrainingTypeID || "")] ||
                        training.TrainingTypeID ||
                        "-"}
                    </h2>
                    <p>Start Date: {formatDateLong(training.StartDate)}</p>
                    <p>Finish Date: {formatDateLong(training.FinishDate)}</p>
                    <p>
                      Trained By:{" "}
                      {facilitatorNameById[String(training.trainedBy || "")] ||
                        training.trainedBy ||
                        "-"}
                    </p>
                  </IonLabel>
                </IonItem>
              </IonCardContent>
            </IonCard>

            <IonSearchbar
              value={searchQuery}
              onIonInput={(e) => setSearchQuery(e.detail.value || "")}
              placeholder="Search beneficiaries"
            />

            {filteredMembers.length === 0 ? (
              <IonCard>
                <IonCardContent>
                  <IonLabel color="medium">
                    No eligible beneficiaries found. Previously added training
                    participants are excluded from this list.
                  </IonLabel>
                </IonCardContent>
              </IonCard>
            ) : (
              <>
                <IonItem lines="none">
                  <IonCheckbox
                    slot="start"
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onIonChange={(e) => {
                      const checked = !!e.detail.checked;
                      const visibleCodes = filteredMembers
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
                  {filteredMembers.map((member) => {
                    const sppCode = String(member.sppCode || "");
                    const checked = selectedCodes.includes(sppCode);

                    return (
                      <IonItem key={sppCode}>
                        <IonCheckbox
                          slot="start"
                          checked={checked}
                          onIonChange={(e) =>
                            handleToggle(sppCode, !!e.detail.checked)
                          }
                        />
                        <IonLabel>
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
              onClick={handleSave}
              disabled={saving}
              style={{ marginBottom: 16 }}
            >
              {saving ? "Saving..." : "Save Training Participants"}
            </IonButton>
          </>
        )}

        <IonAlert
          isOpen={!!actionMessage}
          onDidDismiss={() => setActionMessage("")}
          header="Training Participants"
          message={actionMessage}
          buttons={["OK"]}
        />
      </IonContent>
    </IonPage>
  );
};

export default TrainingParticipants;
