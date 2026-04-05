import React, { useEffect, useState } from "react";
import {
  IonActionSheet,
  IonAlert,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
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
} from "@ionic/react";
import {
  arrowBack,
  cashOutline,
  createOutline,
  ellipsisHorizontal,
  eyeOutline,
  pieChartOutline,
} from "ionicons/icons";
import {
  Beneficiary,
  fetchBeneficiariesByGroupCode,
  updateBeneficiary,
} from "../services/beneficiaries.service";
import { subscribeSyncUpdates } from "../data/sync";
import { useSelectedGroup } from "../hooks/useSelectedGroup";
import MobileDateInput from "./form/MobileDateInput";
import MemberSavings from "./MemberSavings";
import MemberIGA from "./MemberIGA";
import { goBackFromGroupChild } from "../utils/groupNavigation";
import { useHistory } from "react-router-dom";
import { extractDateOnly, formatDateLongLocal, parseDateOnlyLocal } from "../utils/date";
import "./GroupBeneficiaries.css";

const MAX_NAT_ID = 8;
const MAX_HH_SIZE = 100;
const MIN_AGE_YEARS = 18;

const formatGender = (value: string | null | undefined) => {
  const v = String(value || "").trim();
  if (v === "01") return "Male";
  if (v === "02") return "Female";
  return v || "-";
};

const toDateInputValue = (value: string | null | undefined) => {
  return extractDateOnly(value);
};

const validateSex = (sex: string | null | undefined) => {
  const value = String(sex || "").trim();
  if (!value) return "Gender is required.";
  if (value !== "01" && value !== "02") return "Invalid gender selected.";
  return "";
};

const validateDOB18Plus = (dob: string | null | undefined) => {
  const value = String(dob || "").trim();
  if (!value) return "Date of birth is required.";

  const date = parseDateOnlyLocal(value);
  if (!date) return "Invalid date of birth.";

  const today = new Date();
  const minDate = new Date(
    today.getFullYear() - MIN_AGE_YEARS,
    today.getMonth(),
    today.getDate(),
  );

  if (date > minDate) {
    return `Beneficiary must be at least ${MIN_AGE_YEARS} years old.`;
  }

  return "";
};

const validateNationalID = (natId: string | null | undefined) => {
  const value = String(natId || "").trim();
  if (!value) return "";
  if (value.length > MAX_NAT_ID) {
    return `National ID must not exceed ${MAX_NAT_ID} characters.`;
  }
  if (value.includes("T") && value.includes("-")) {
    return "National ID looks like a date. Please enter a valid ID.";
  }
  return "";
};

const validateHouseholdSize = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return "Household size must be a number.";
  if (num < 0) return "Household size cannot be negative.";
  if (num > MAX_HH_SIZE) {
    return `Household size cannot exceed ${MAX_HH_SIZE}.`;
  }
  return "";
};

const getInitial = (value: string | null | undefined) => {
  const trimmed = String(value || "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "B";
};

const GroupBeneficiaries: React.FC = () => {
  const history = useHistory();
  const [rows, setRows] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { selectedGroupID, selectedGroupName, refreshSelectedGroup } =
    useSelectedGroup();
  const [viewMember, setViewMember] = useState<Beneficiary | null>(null);
  const [editMember, setEditMember] = useState<Beneficiary | null>(null);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [editSex, setEditSex] = useState<string>("");
  const [editDob, setEditDob] = useState<string>("");
  const [editNatId, setEditNatId] = useState<string>("");
  const [editHouseholdSize, setEditHouseholdSize] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<string>("");
  const [loadError, setLoadError] = useState<string>("");
  const [actionMember, setActionMember] = useState<Beneficiary | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [memberSavingsTarget, setMemberSavingsTarget] = useState<Beneficiary | null>(null);
  const [memberIgaTarget, setMemberIgaTarget] = useState<Beneficiary | null>(null);

  const activeGroupName =
    selectedGroupName || localStorage.getItem("selectedGroupName") || "";
  const activeGroupID =
    selectedGroupID || localStorage.getItem("selectedGroupID") || "";

  const loadBeneficiaries = React.useCallback(async () => {
    const latestSelectedGroupID =
      localStorage.getItem("selectedGroupID") || selectedGroupID;
    if (!latestSelectedGroupID) {
      setRows([]);
      setLoadError("Select a group first, then open Beneficiaries.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");
    try {
      const data = await fetchBeneficiariesByGroupCode(latestSelectedGroupID);
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load group beneficiaries:", error);
      setRows([]);
      setLoadError(
        error instanceof Error
          ? error.message
          : "Failed to load beneficiaries for the selected group.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedGroupID]);

  useEffect(() => {
    loadBeneficiaries();
  }, [loadBeneficiaries]);

  useEffect(() => {
    const unsubscribe = subscribeSyncUpdates(() => {
      refreshSelectedGroup();
      loadBeneficiaries();
    });
    return () => unsubscribe();
  }, [loadBeneficiaries, refreshSelectedGroup]);

  const filteredRows = rows.filter((member) => {
    const query = searchText.trim().toLowerCase();
    if (!query) return true;

    return [
      member.hh_head_name,
      member.hh_code,
      member.sppCode,
      member.nat_id,
    ]
      .map((value) => String(value || "").toLowerCase())
      .some((value) => value.includes(query));
  });

  const openEdit = (member: Beneficiary) => {
    setEditMember(member);
    setEditSex(String(member.sex || ""));
    setEditDob(toDateInputValue(member.dob));
    setEditNatId(String(member.nat_id || ""));
    setEditHouseholdSize(
      member.hh_size === null || member.hh_size === undefined
        ? ""
        : String(member.hh_size),
    );
  };

  const handleSaveEdit = async () => {
    if (!editMember?.sppCode) return;

    try {
      setSavingEdit(true);
      const sexError = validateSex(editSex);
      if (sexError) {
        throw new Error(sexError);
      }

      const dobError = validateDOB18Plus(editDob);
      if (dobError) {
        throw new Error(dobError);
      }

      const natIdValue = editNatId.trim();
      const natIdError = validateNationalID(natIdValue);
      if (natIdError) {
        throw new Error(natIdError);
      }

      const householdSizeValue = editHouseholdSize.trim();
      const householdSizeError = validateHouseholdSize(householdSizeValue);
      if (householdSizeError) {
        throw new Error(householdSizeError);
      }

      const hh_size =
        householdSizeValue === ""
          ? null
          : Number.isNaN(Number(householdSizeValue))
            ? null
            : Number(householdSizeValue);

      if (householdSizeValue !== "" && hh_size === null) {
        throw new Error("Enter a valid household size.");
      }

      await updateBeneficiary({
        ...editMember,
        sex: editSex || null,
        dob: editDob || null,
        nat_id: natIdValue || null,
        hh_size,
      });

      setRows((prev) =>
        prev.map((m) =>
          m.sppCode === editMember.sppCode
            ? {
                ...m,
                sex: editSex || null,
                dob: editDob || null,
                nat_id: natIdValue || null,
                hh_size,
              }
            : m,
        ),
      );

      if (viewMember?.sppCode === editMember.sppCode) {
        setViewMember((prev) =>
          prev
            ? {
                ...prev,
                sex: editSex || null,
                dob: editDob || null,
                nat_id: natIdValue || null,
                hh_size,
              }
            : prev,
        );
      }

      setEditMember(null);
      setActionMessage("Beneficiary updated successfully.");
    } catch (error) {
      console.error("Failed to update beneficiary:", error);
      setActionMessage(
        error instanceof Error ? error.message : "Failed to update beneficiary.",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonButtons slot="start">
            <IonButton
              onClick={() => {
                goBackFromGroupChild(history);
              }}
              color="light"
            >
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle style={{ color: "white" }}>Group Beneficiaries</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard className="group-beneficiaries-hero">
          <IonCardContent className="group-beneficiaries-hero__content">
            <div className="group-beneficiaries-hero__meta">
              <div className="group-beneficiaries-hero__text">
                <h2>{activeGroupName || "Selected Group"}</h2>
                <p>{activeGroupID || "No group selected"}</p>
              </div>
              <IonBadge color="light" className="group-beneficiaries-hero__badge">
                {rows.length} members
              </IonBadge>
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard className="group-beneficiaries-search-card">
          <IonCardContent>
            <IonSearchbar
              value={searchText}
              onIonInput={(e) => setSearchText(String(e.detail.value || ""))}
              placeholder="Search by beneficiary name, ML code, SPP code, or national ID"
              className="group-beneficiaries-searchbar"
            />
          </IonCardContent>
        </IonCard>

        {!!loadError && (
          <IonItem lines="none" className="group-beneficiaries-inline-state error">
            <IonLabel color="danger">{loadError}</IonLabel>
          </IonItem>
        )}

        {loading ? (
          <div className="group-beneficiaries-loading">
            <IonSpinner name="crescent" />
          </div>
        ) : rows.length === 0 ? (
          <IonItem lines="none" className="group-beneficiaries-inline-state empty">
            <IonLabel color="medium">No beneficiaries found for this group</IonLabel>
          </IonItem>
        ) : filteredRows.length === 0 ? (
          <IonItem lines="none" className="group-beneficiaries-inline-state empty">
            <IonLabel color="medium">No beneficiaries match your search</IonLabel>
          </IonItem>
        ) : (
          <IonList className="group-beneficiaries-list">
            {filteredRows.map((m) => (
              <IonCard key={m.sppCode} className="beneficiary-card">
                <IonCardContent className="beneficiary-card__content">
                  <div className="beneficiary-card__top">
                    <div className="beneficiary-card__avatar">
                      {getInitial(m.hh_head_name || m.sppCode)}
                    </div>
                    <div className="beneficiary-card__summary app-inline-action-main">
                      <h2>{m.hh_head_name || m.sppCode}</h2>
                      <p>{m.hh_code ? `ML Code: ${m.hh_code}` : `SPP Code: ${m.sppCode || "-"}`}</p>
                    </div>
                    <IonButton
                      fill="clear"
                      size="small"
                      title="More actions"
                      className="beneficiary-menu-button"
                      onClick={() => setActionMember(m)}
                    >
                      <IonIcon icon={ellipsisHorizontal} />
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}

        <IonActionSheet
          isOpen={!!actionMember}
          header={actionMember?.hh_head_name || "Beneficiary actions"}
          subHeader={actionMember?.hh_code ? `ML Code: ${actionMember.hh_code}` : undefined}
          onDidDismiss={() => setActionMember(null)}
          buttons={[
            {
              text: "View Details",
              icon: eyeOutline,
              handler: () => {
                if (actionMember) setViewMember(actionMember);
              },
            },
            {
              text: "Edit Beneficiary",
              icon: createOutline,
              handler: () => {
                if (actionMember) openEdit(actionMember);
              },
            },
            {
              text: "Member Savings",
              icon: cashOutline,
              handler: () => {
                if (actionMember) {
                  setMemberSavingsTarget(actionMember);
                }
              },
            },
            {
              text: "Member IGA",
              icon: pieChartOutline,
              handler: () => {
                if (actionMember) {
                  setMemberIgaTarget(actionMember);
                }
              },
            },
            {
              text: "Cancel",
              role: "cancel",
            },
          ]}
        />

        <IonModal
          isOpen={!!viewMember}
          onDidDismiss={() => setViewMember(null)}
        >
          <IonHeader>
            <IonToolbar color="success">
              <IonTitle>Beneficiary Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setViewMember(null)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding group-beneficiaries-modal-content">
            <IonCard className="group-beneficiaries-modal-hero">
              <IonCardContent>
                <h2>{viewMember?.hh_head_name || "-"}</h2>
                <p>{viewMember?.hh_code ? `ML Code: ${viewMember.hh_code}` : `SPP Code: ${viewMember?.sppCode || "-"}`}</p>
              </IonCardContent>
            </IonCard>
            <IonItem lines="none" className="group-beneficiaries-detail-item">
              <IonLabel>
                <h3>Beneficiary Name</h3>
                <p>{viewMember?.hh_head_name || "-"}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none" className="group-beneficiaries-detail-item">
              <IonLabel>
                <h3>Gender</h3>
                <p>{formatGender(viewMember?.sex)}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none" className="group-beneficiaries-detail-item">
              <IonLabel>
                <h3>Date of Birth</h3>
                <p>{formatDateLongLocal(viewMember?.dob)}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none" className="group-beneficiaries-detail-item">
              <IonLabel>
                <h3>National ID</h3>
                <p>{viewMember?.nat_id || "-"}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none" className="group-beneficiaries-detail-item">
              <IonLabel>
                <h3>ML Code</h3>
                <p>{viewMember?.hh_code || "-"}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none" className="group-beneficiaries-detail-item">
              <IonLabel>
                <h3>Household Size</h3>
                <p>{viewMember?.hh_size ?? "-"}</p>
              </IonLabel>
            </IonItem>
          </IonContent>
        </IonModal>

        <IonModal
          isOpen={!!editMember}
          onDidDismiss={() => setEditMember(null)}
        >
          <IonHeader>
            <IonToolbar color="success">
              <IonTitle>Edit Beneficiary</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setEditMember(null)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding group-beneficiaries-modal-content">
            <IonCard className="group-beneficiaries-modal-hero">
              <IonCardContent>
                <h2>{editMember?.hh_head_name || "-"}</h2>
                <p>{editMember?.hh_code ? `ML Code: ${editMember.hh_code}` : `SPP Code: ${editMember?.sppCode || "-"}`}</p>
              </IonCardContent>
            </IonCard>
            <IonItem className="group-beneficiaries-form-item">
              <IonLabel position="stacked">Beneficiary Name</IonLabel>
              <IonInput value={editMember?.hh_head_name || "-"} readonly />
            </IonItem>
            <IonItem className="group-beneficiaries-form-item">
              <IonLabel position="stacked">Gender</IonLabel>
              <IonSelect
                value={editSex}
                placeholder="Select gender"
                onIonChange={(e) => setEditSex(String(e.detail.value || ""))}
              >
                <IonSelectOption value="01">Male</IonSelectOption>
                <IonSelectOption value="02">Female</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem className="group-beneficiaries-form-item">
              <IonLabel position="stacked">Date of Birth</IonLabel>
              <MobileDateInput
                value={editDob}
                placeholder="Select date"
                onIonInput={(e) => setEditDob(String(e.detail.value || ""))}
              />
            </IonItem>
            <IonItem className="group-beneficiaries-form-item">
              <IonLabel position="stacked">National ID</IonLabel>
              <IonInput
                value={editNatId}
                placeholder="Enter national ID"
                onIonInput={(e) => setEditNatId(String(e.detail.value || ""))}
              />
            </IonItem>
            <IonItem className="group-beneficiaries-form-item">
              <IonLabel position="stacked">Household Size</IonLabel>
              <IonInput
                inputmode="numeric"
                placeholder="Enter household size"
                value={editHouseholdSize}
                onIonInput={(e) =>
                  setEditHouseholdSize(
                    String(e.detail.value || "").replace(/[^\d]/g, ""),
                  )
                }
              />
            </IonItem>

            <IonButton
              expand="block"
              color="success"
              disabled={savingEdit || !editMember?.sppCode}
              onClick={handleSaveEdit}
              className="group-beneficiaries-save-button"
            >
              {savingEdit ? <IonSpinner name="crescent" /> : "Save Changes"}
            </IonButton>
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={!!actionMessage}
          header="Info"
          message={actionMessage}
          buttons={[{ text: "OK", role: "cancel" }]}
          onDidDismiss={() => setActionMessage("")}
        />

        <MemberSavings
          embedded
          isOpen={!!memberSavingsTarget}
          onClose={() => setMemberSavingsTarget(null)}
          sppCodeOverride={memberSavingsTarget?.sppCode || ""}
        />

        <MemberIGA
          embedded
          isOpen={!!memberIgaTarget}
          onClose={() => setMemberIgaTarget(null)}
          sppCodeOverride={memberIgaTarget?.sppCode || ""}
        />
      </IonContent>
    </IonPage>
  );
};

export default GroupBeneficiaries;

