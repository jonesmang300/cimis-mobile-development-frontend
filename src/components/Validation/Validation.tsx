import React, { useEffect, useMemo, useRef, useState } from "react";
import {
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
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonLoading,
  IonModal,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToast,
  IonToolbar,
  useIonRouter,
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";

import { getStableDeviceId } from "../../utils/device";
import { useLocationFilters } from "../../hooks/useLocationFilters";
import { useLocalInfiniteScroll } from "../../hooks/useLocalInfiniteScroll";
import { useAuth } from "../context/AuthContext";

import {
  Beneficiary,
  bulkSyncGroup,
  createGroup,
  fetchBeneficiariesByVC,
  CreateGroupPayload,
  saveQueuedServerGroupAssignments,
  saveOfflineGroupAssignments,
  updateBeneficiary,
} from "../../services/beneficiaries.service";
import { subscribeSyncUpdates } from "../../data/sync";
import MobileDateInput from "../form/MobileDateInput";

import "./Validation.css";

/* ===============================
   CONFIG
================================ */
const PAGE_SIZE = 20;

const MAX_GROUP_NAME = 45;
const MAX_NAT_ID = 8;
const MAX_HH_SIZE = 100;
const MIN_AGE_YEARS = 18;

/* ===============================
   HELPERS
================================ */
const getMaxDobISO = () => {
  const today = new Date();
  const max = new Date(
    today.getFullYear() - MIN_AGE_YEARS,
    today.getMonth(),
    today.getDate(),
  );
  return max.toISOString();
};

const cleanNatId = (val: any) => {
  const v = String(val ?? "").trim();
  return v === "" ? null : v;
};

const cleanHHSize = (val: any) => {
  const v = String(val ?? "").trim();
  if (v === "") return null;

  const n = Number(v);
  if (Number.isNaN(n)) return null;

  return n;
};

const isSelectedValue = (val: Beneficiary["selected"]) => {
  return String(val ?? "") === "1" || Number(val) === 1;
};

const isAllocatedMember = (member: Beneficiary) => {
  return (
    isSelectedValue(member.selected) ||
    String(member.groupCode || "").trim() !== ""
  );
};

const toDateOnly = (date: Date) => {
  return date.toISOString().split("T")[0];
};

/* ===============================
   COMPONENT
================================ */
const GroupAssignment: React.FC = () => {
  const router = useIonRouter();
  const { user } = useAuth();

  /* ===============================
     FILTERS (SQLite master data)
  ================================ */
  const {
    regions,
    districts,
    tas,
    vcs,

    region,
    district,
    ta,
    vc,

    setRegion,
    setDistrict,
    setTa,
    setVc,

    loadingDistricts,
    loadingTas,
    loadingVcs,
    isFilterLoading,
  } = useLocationFilters();

  /* ===============================
     BENEFICIARIES (API DATA)
  ================================ */
  const [members, setMembers] = useState<Beneficiary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedMemberCodes, setSubmittedMemberCodes] = useState<Set<string>>(
    () => new Set(),
  );
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false);
  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return members;
    }

    return members.filter((member) => {
      const searchable = [
        member.hh_head_name,
        member.hh_code,
        member.sppCode,
        member.groupname,
        member.groupCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [members, searchQuery]);

  /* ===============================
     INFINITE SCROLL (REUSABLE)
  ================================ */
  const {
    visible: visibleMembers,
    loadMore,
    resetKey,
  } = useLocalInfiniteScroll<Beneficiary>({
    items: filteredMembers,
    pageSize: PAGE_SIZE,
  });

  const infiniteRef = useRef<HTMLIonInfiniteScrollElement | null>(null);

  /* ===============================
     GROUP
  ================================ */
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Beneficiary[]>([]);

  /* ===============================
     EDIT MODAL
  ================================ */
  const [editingMember, setEditingMember] = useState<Beneficiary | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  /* ===============================
     UI
  ================================ */
  const [toastMessage, setToastMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ===============================
     VALIDATORS
  ================================ */
  const validateGroupName = (name: string) => {
    const v = (name || "").trim();
    if (!v) return "Group name is required";
    if (v.length > MAX_GROUP_NAME)
      return `Group name must not exceed ${MAX_GROUP_NAME} characters`;
    return "";
  };

  const validateSex = (sex: string | null | undefined) => {
    const v = String(sex || "").trim();
    if (!v) return "Gender is required";
    if (v !== "01" && v !== "02") return "Invalid gender selected";
    return "";
  };

  const validateDOB18Plus = (dob: string | null | undefined) => {
    if (!dob) return "Date of birth is required";

    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return "Invalid date of birth";

    const today = new Date();
    const minDate = new Date(
      today.getFullYear() - MIN_AGE_YEARS,
      today.getMonth(),
      today.getDate(),
    );

    if (d > minDate) {
      return `Beneficiary must be at least ${MIN_AGE_YEARS} years old`;
    }

    return "";
  };

  const validateNationalID = (natId: string) => {
    const v = (natId || "").trim();

    // optional
    if (!v) return "";

    if (v.length > MAX_NAT_ID) {
      return `National ID must not exceed ${MAX_NAT_ID} characters`;
    }

    // avoid ISO date accidentally stored as nat_id
    if (v.includes("T") && v.includes("-")) {
      return "National ID looks like a date. Please enter correct ID";
    }

    return "";
  };

  const validateHouseholdSize = (size: any) => {
    // optional
    if (size === null || size === undefined || size === "") return "";

    const num = Number(size);

    if (Number.isNaN(num)) return "Household size must be a number";
    if (num > MAX_HH_SIZE) return `Household size cannot exceed ${MAX_HH_SIZE}`;
    if (num < 0) return "Household size cannot be negative";

    return "";
  };

  /* ===============================
     RESET WHEN VC CHANGES
  ================================ */
  useEffect(() => {
    setMembers([]);
    setSearchQuery("");
    setSelectedMembers([]);
    setSubmittedMemberCodes(new Set());

    if (infiniteRef.current) {
      infiniteRef.current.disabled = false;
    }
  }, [vc]);

  useEffect(() => {
    if (infiniteRef.current) {
      infiniteRef.current.disabled = false;
    }
  }, [members, searchQuery]);

  /* ===============================
     LOAD BENEFICIARIES (API)
    ================================ */
  const loadMembers = React.useCallback(async () => {
    if (!vc) return;
    setLoadingBeneficiaries(true);
    let cancelled = false;

    try {
      if (infiniteRef.current) {
        infiniteRef.current.disabled = false;
      }

      const data = await fetchBeneficiariesByVC(vc);
      if (!cancelled) {
        const all = Array.isArray(data) ? data : [];
        const merged = all.map((member) => {
          if (!submittedMemberCodes.has(String(member.sppCode))) {
            return member;
          }

          return {
            ...member,
            selected: 1,
            groupCode: String(member.groupCode || "PENDING_LOCAL_ASSIGNMENT"),
          };
        });
        setMembers(merged);
      }
    } catch (err) {
      console.error("Load beneficiaries failed:", err);
      if (!cancelled) {
        setMembers([]);
        setToastMessage("Failed to load beneficiaries");
      }
    } finally {
      if (!cancelled) setLoadingBeneficiaries(false);
    }

    return () => {
      cancelled = true;
    };
  }, [submittedMemberCodes, vc]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    const unsubscribe = subscribeSyncUpdates(() => {
      loadMembers();
    });
    return () => unsubscribe();
  }, [loadMembers]);

  /* ===============================
     SELECT MEMBER
  ================================ */
  const toggleMember = (member: Beneficiary) => {
    if (isAllocatedMember(member)) {
      return;
    }

    setSelectedMembers((prev) => {
      const exists = prev.some((m) => m.sppCode === member.sppCode);

      if (exists) {
        return prev.filter((m) => m.sppCode !== member.sppCode);
      }

      return [
        ...prev,
        {
          ...member,
          groupname: groupName.trim(),
        },
      ];
    });
  };

  /* ===============================
     SELECT ALL
  ================================ */
  const selectableMembers = filteredMembers.filter((m) => !isAllocatedMember(m));

  const allSelected =
    selectableMembers.length > 0 &&
    selectedMembers.length === selectableMembers.length;

  const someSelected =
    selectedMembers.length > 0 &&
    selectedMembers.length < selectableMembers.length;

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedMembers([]);
      return;
    }

    setSelectedMembers(
      selectableMembers.map((m) => ({
        ...m,
        groupname: groupName.trim(),
      })),
    );
  };

  /* ===============================
     UPDATE GROUPNAME ON SELECTED
  ================================ */
  useEffect(() => {
    setSelectedMembers((prev) =>
      prev.map((m) => ({
        ...m,
        groupname: groupName.trim(),
      })),
    );
  }, [groupName]);

  /* ===============================
     SAVE EDIT (API)
  ================================ */
  const saveEditedMember = async () => {
    if (!editingMember) return;

    const sexErr = validateSex(editingMember.sex);
    const dobErr = validateDOB18Plus(editingMember.dob);
    const natErr = validateNationalID(editingMember.nat_id || "");
    const hhErr = validateHouseholdSize(editingMember.hh_size);

    if (sexErr) return setToastMessage(sexErr);
    if (dobErr) return setToastMessage(dobErr);
    if (natErr) return setToastMessage(natErr);
    if (hhErr) return setToastMessage(hhErr);

    const cleaned: Beneficiary = {
      ...editingMember,
      nat_id: cleanNatId(editingMember.nat_id),
      hh_size: cleanHHSize(editingMember.hh_size),
    };

    try {
      setIsSubmitting(true);

      await updateBeneficiary(cleaned);

      setMembers((prev) =>
        prev.map((m) => (m.sppCode === cleaned.sppCode ? cleaned : m)),
      );

      setSelectedMembers((prev) =>
        prev.map((m) =>
          m.sppCode === cleaned.sppCode
            ? { ...cleaned, groupname: groupName.trim() }
            : m,
        ),
      );

      setShowEditModal(false);
      setToastMessage("Beneficiary updated");
    } catch (err) {
      console.error("Update failed:", err);
      setToastMessage("Failed to update beneficiary");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ===============================
     SUBMIT GROUP (API)
  ================================ */
  const submitGroup = async () => {
    const groupErr = validateGroupName(groupName);
    if (groupErr) return setToastMessage(groupErr);

    if (selectedMembers.length === 0) {
      setToastMessage("Select at least one beneficiary");
      return;
    }
    if (!region || !district || !ta || !vc) {
      setToastMessage("Please select region, district, TA and village cluster");
      return;
    }

    for (const m of selectedMembers) {
      const sexErr = validateSex(m.sex);
      if (sexErr) return setToastMessage(`(${m.hh_head_name}) ${sexErr}`);

      const dobErr = validateDOB18Plus(m.dob);
      if (dobErr) return setToastMessage(`(${m.hh_head_name}) ${dobErr}`);

      const natErr = validateNationalID(m.nat_id || "");
      if (natErr) return setToastMessage(`(${m.hh_head_name}) ${natErr}`);

      const hhErr = validateHouseholdSize(m.hh_size);
      if (hhErr) return setToastMessage(`(${m.hh_head_name}) ${hhErr}`);
    }

    try {
      setIsSubmitting(true);

      const deviceId = await getStableDeviceId();
      const trimmedGroupName = groupName.trim();

      const groupRequest: CreateGroupPayload = {
        groupname: trimmedGroupName,
        DateEstablished: toDateOnly(new Date()),
        regionID: region,
        DistrictID: district,
        TAID: ta,
        villageClusterID: vc,
        cohort: "1",
        projectID: "06",
        programID: "11",
        userID: user?.id ? String(user.id) : null,
        slgApproved: "1",
      };

      const groupResult = await createGroup(groupRequest);

      const createdGroupID =
        String(groupResult?.groupID || groupResult?.id || "").trim();
      const offlineClientId = (groupResult as any)?.offlineClientId;
      const isOfflineQueued = Boolean((groupResult as any)?.offline);
      const effectiveGroupID = createdGroupID;

      if (!effectiveGroupID) {
        throw new Error("Failed to generate group ID");
      }

      const payload: Beneficiary[] = selectedMembers.map((m) => ({
        ...m,
        groupname: trimmedGroupName,
        groupCode: effectiveGroupID,
        nat_id: cleanNatId(m.nat_id),
        hh_size: cleanHHSize(m.hh_size),
        selected: 1,
        deviceId,
      }));

      const applySubmittedMembers = () => {
        const submittedCodes = new Set(payload.map((p) => p.sppCode));

        setSubmittedMemberCodes((prev) => {
          const next = new Set(prev);
          submittedCodes.forEach((code) => next.add(String(code)));
          return next;
        });
        setMembers((prev) =>
          prev.map((member) =>
            submittedCodes.has(member.sppCode)
              ? {
                  ...member,
                  selected: 1,
                  groupCode: effectiveGroupID,
                  groupname: trimmedGroupName,
                }
              : member,
          ),
        );
        setSelectedMembers([]);
        setGroupName("");
      };

      if (isOfflineQueued && offlineClientId) {
        await saveOfflineGroupAssignments(offlineClientId, payload);

        applySubmittedMembers();
        setToastMessage(`Group ${effectiveGroupID} saved offline and will sync automatically`);
        return;
      }

      const bulkSyncResult = await bulkSyncGroup(
        payload,
        trimmedGroupName,
        effectiveGroupID,
        deviceId,
      );

      if ((bulkSyncResult as any)?._queued) {
        await saveQueuedServerGroupAssignments(
          effectiveGroupID,
          groupRequest,
          payload,
          deviceId,
        );

        applySubmittedMembers();
        setToastMessage(
          `Beneficiary assignments for ${effectiveGroupID} were queued and will sync automatically`,
        );
        return;
      }

      applySubmittedMembers();
      setToastMessage(`Group ${createdGroupID} created & synced`);
    } catch (err: any) {
      console.error("Sync failed:", err);

      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Sync failed";

      setToastMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ===============================
     UI HELPERS
  ================================ */
  const selectedCount = selectedMembers.length;

  const modalTitle = useMemo(() => {
    if (!editingMember) return "Edit Beneficiary";
    return `Edit: ${editingMember.hh_head_name || "Beneficiary"}`;
  }, [editingMember]);

  /* ===============================
     UI
  ================================ */
  return (
    <IonPage>
      <IonHeader>
    <IonToolbar color="success">
    <IonButtons slot="start">
      <IonButton onClick={() => router.goBack()} color="light">
        <IonIcon icon={arrowBack} />
      </IonButton>
    </IonButtons>

    <IonTitle style={{ color: "white" }}>Formation</IonTitle>
  </IonToolbar>
</IonHeader>

      <IonContent fullscreen className="ion-padding validation-page">
        {/* FILTER CARD */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Filter Beneficiaries</IonCardTitle>
          </IonCardHeader>

          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Region</IonLabel>
              <IonSelect
                value={region}
                onIonChange={(e) => setRegion(e.detail.value)}
              >
                {regions.map((r) => (
                  <IonSelectOption key={r.regionID} value={r.regionID}>
                    {r.name}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">District</IonLabel>
              <IonSelect
                value={district}
                disabled={!region || loadingDistricts}
                onIonChange={(e) => setDistrict(e.detail.value)}
              >
                {districts.map((d) => (
                  <IonSelectOption key={d.DistrictID} value={d.DistrictID}>
                    {d.DistrictName}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Traditional Authority</IonLabel>
              <IonSelect
                value={ta}
                disabled={!district || loadingTas}
                onIonChange={(e) => setTa(e.detail.value)}
              >
                {tas.map((t) => (
                  <IonSelectOption key={t.TAID} value={t.TAID}>
                    {t.TAName}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Village Cluster</IonLabel>
              <IonSelect
                value={vc}
                disabled={!ta || loadingVcs}
                onIonChange={(e) => setVc(e.detail.value)}
              >
                {vcs.map((v) => (
                  <IonSelectOption
                    key={v.villageClusterID}
                    value={v.villageClusterID}
                  >
                    {v.villageClusterName}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          </IonCardContent>
        </IonCard>

        <IonLoading
          isOpen={isFilterLoading}
          spinner="crescent"
          message="Loading filters..."
        />

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={3500}
          onDidDismiss={() => setToastMessage("")}
        />

        {/* GROUP DETAILS */}
        <IonCard className="group-details-card">
          <IonCardHeader>
            <IonCardTitle>Group Details</IonCardTitle>
          </IonCardHeader>

          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked" className="big-label">
                Group Name *
              </IonLabel>
              <IonInput
                className="big-input"
                placeholder="Enter group name"
                value={groupName}
                maxlength={MAX_GROUP_NAME}
                onIonInput={(e) => setGroupName(e.detail.value || "")}
              />
            </IonItem>

            <IonItem lines="none">
              <IonLabel>Selected Beneficiaries</IonLabel>
              <IonBadge slot="end" color="success">
                {selectedCount}
              </IonBadge>
            </IonItem>

            <IonSearchbar
              value={searchQuery}
              debounce={200}
              placeholder="Search beneficiaries"
              onIonInput={(e) => setSearchQuery(String(e.detail.value || ""))}
            />

            {selectableMembers.length > 0 && (
              <IonItem lines="none">
                <IonCheckbox
                  slot="start"
                  checked={allSelected}
                  indeterminate={someSelected}
                  onIonChange={(e) => toggleSelectAll(e.detail.checked)}
                />
                <IonLabel>Select All Beneficiaries</IonLabel>
              </IonItem>
            )}

            <IonList>
              {loadingBeneficiaries ? (
                <IonItem lines="none">
                  <IonSpinner name="crescent" style={{ marginRight: 10 }} />
                  <IonLabel>Loading beneficiaries...</IonLabel>
                </IonItem>
              ) : visibleMembers.length === 0 ? (
                <IonItem lines="none">
                  <IonLabel color="medium">No beneficiaries found</IonLabel>
                </IonItem>
              ) : (
                visibleMembers.map((m) => {
                  const selected = selectedMembers.some(
                    (x) => x.sppCode === m.sppCode,
                  );

                  const isAllocated = isAllocatedMember(m);
                  const isVerified =
                    String((m as any).selected ?? "") === "1" ||
                    Number((m as any).selected) === 1;

                  const incomplete =
                    validateSex(m.sex) !== "" ||
                    validateDOB18Plus(m.dob) !== "";

                  return (
                    <IonItem key={m.sppCode}>
                      <IonCheckbox
                        slot="start"
                        checked={selected}
                        disabled={isAllocated}
                        onIonChange={() => toggleMember(m)}
                      />

                      <IonLabel>
                        <h2>{m.hh_head_name}</h2>
                        <p>{m.hh_code}</p>

                        <IonBadge
                          color={
                            isAllocated
                              ? "medium"
                              : incomplete
                              ? "danger"
                              : isVerified
                                ? "success"
                                : "warning"
                          }
                        >
                          {isAllocated
                            ? "ALREADY ALLOCATED"
                            : incomplete
                            ? "REQUIRES EDIT"
                            : isVerified
                              ? "COMPLETE & VERIFIED"
                              : "COMPLETE"}
                        </IonBadge>
                      </IonLabel>

                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={() => {
                          setEditingMember(m);
                          setShowEditModal(true);
                        }}
                      >
                        Edit
                      </IonButton>
                    </IonItem>
                  );
                })
              )}
            </IonList>

            <IonInfiniteScroll
              key={resetKey}
              ref={infiniteRef}
              onIonInfinite={loadMore}
              threshold="120px"
            >
              <IonInfiniteScrollContent
                loadingSpinner="crescent"
                loadingText="Loading more..."
              />
            </IonInfiniteScroll>
          </IonCardContent>

          <div className="group-details-footer">
            <IonButton
              expand="block"
              color="success"
              onClick={submitGroup}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <IonSpinner name="crescent" style={{ marginRight: 8 }} />
                  Submitting…
                </>
              ) : (
                "Submit Details"
              )}
            </IonButton>
          </div>
        </IonCard>

        {/* EDIT MODAL */}
        <IonModal
          isOpen={showEditModal}
          onDidDismiss={() => setShowEditModal(false)}
          className="validation-edit-modal"
        >
          <IonHeader>
            <IonToolbar color="success">
              <IonTitle>{modalTitle}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding validation-modal">
            {editingMember && (
              <IonCard className="validation-edit-card">
                <IonCardContent className="validation-edit-card-content">
                  <IonItem>
                    <IonLabel position="stacked">Gender *</IonLabel>
                    <IonSelect
                      value={editingMember.sex}
                      onIonChange={(e) =>
                        setEditingMember((prev) =>
                          prev ? { ...prev, sex: e.detail.value } : prev,
                        )
                      }
                    >
                      <IonSelectOption value="01">Male</IonSelectOption>
                      <IonSelectOption value="02">Female</IonSelectOption>
                    </IonSelect>
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">
                      Date of Birth (must be 18+) *
                    </IonLabel>
                    <MobileDateInput
                      value={String(editingMember.dob || "").split("T")[0]}
                      placeholder="Select date"
                      max={getMaxDobISO().split("T")[0]}
                      onIonInput={(e) =>
                        setEditingMember((prev) =>
                          prev
                            ? { ...prev, dob: String(e.detail.value || "") }
                            : prev,
                        )
                      }
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">
                      National ID (optional, max {MAX_NAT_ID})
                    </IonLabel>
                    <IonInput
                      type="text"
                      value={editingMember.nat_id || ""}
                      maxlength={MAX_NAT_ID}
                      onIonInput={(e) =>
                        setEditingMember((prev) =>
                          prev
                            ? { ...prev, nat_id: String(e.detail.value || "") }
                            : prev,
                        )
                      }
                      placeholder="Enter National ID"
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">
                      Household Size (optional, max {MAX_HH_SIZE})
                    </IonLabel>
                    <IonInput
                      type="number"
                      value={editingMember.hh_size ?? ""}
                      onIonInput={(e) =>
                        setEditingMember((prev) =>
                          prev
                            ? {
                                ...prev,
                                hh_size:
                                  e.detail.value === "" ||
                                  e.detail.value === null
                                    ? null
                                    : Number(String(e.detail.value)),
                              }
                            : prev,
                        )
                      }
                      placeholder="Enter household size"
                    />
                  </IonItem>

                  {/* spacer so last item isn't hidden */}
                  <div className="validation-edit-spacer" />
                </IonCardContent>
              </IonCard>
            )}
          </IonContent>

          {/* Sticky footer */}
          <div className="validation-edit-footer">
            <IonButton
              expand="block"
              color="success"
              onClick={saveEditedMember}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <IonSpinner name="crescent" style={{ marginRight: 8 }} />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </IonButton>
          </div>
        </IonModal>

        <div className="bottom-spacer" />
      </IonContent>
    </IonPage>
  );
};

export default GroupAssignment;

