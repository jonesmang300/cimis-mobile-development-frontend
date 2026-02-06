import React, { useEffect, useMemo, useRef, useState } from "react";
import { useIonRouter } from "@ionic/react";
import { arrowBack } from "ionicons/icons";

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonList,
  IonCheckbox,
  IonButton,
  IonBadge,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonToast,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonLoading,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from "@ionic/react";

import { useLocationFilters } from "../../hooks/useLocationFilters";

import {
  fetchBeneficiariesByVC,
  updateBeneficiary,
  bulkSyncGroup,
  Beneficiary,
} from "../../services/beneficiaries.service";

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

/* ===============================
   COMPONENT
================================ */
const GroupAssignment: React.FC = () => {
  const router = useIonRouter();

  /* ===============================
     FILTERS
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
     BENEFICIARIES
  ================================ */
  const [members, setMembers] = useState<Beneficiary[]>([]);
  const [visibleMembers, setVisibleMembers] = useState<Beneficiary[]>([]);
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false);

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

  const infiniteRef = useRef<HTMLIonInfiniteScrollElement | null>(null);

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
    setVisibleMembers([]);
    setSelectedMembers([]);

    if (infiniteRef.current) {
      infiniteRef.current.disabled = false;
    }
  }, [vc]);

  /* ===============================
     LOAD BENEFICIARIES
  ================================ */
  useEffect(() => {
    if (!vc) return;

    const load = async () => {
      setLoadingBeneficiaries(true);

      try {
        if (infiniteRef.current) {
          infiniteRef.current.disabled = false;
        }

        const data = await fetchBeneficiariesByVC(vc);
        setMembers(data);
        setVisibleMembers(data.slice(0, PAGE_SIZE));
      } catch (err) {
        console.error("Load beneficiaries failed:", err);
        setMembers([]);
        setVisibleMembers([]);
        setToastMessage("Failed to load beneficiaries");
      } finally {
        setLoadingBeneficiaries(false);
      }
    };

    load();
  }, [vc]);

  /* ===============================
     LOAD MORE
  ================================ */
  const loadMore = async (ev: CustomEvent<void>) => {
    const next = visibleMembers.length + PAGE_SIZE;
    const nextItems = members.slice(0, next);

    setVisibleMembers(nextItems);

    (ev.target as HTMLIonInfiniteScrollElement).complete();

    if (nextItems.length >= members.length) {
      (ev.target as HTMLIonInfiniteScrollElement).disabled = true;
    }
  };

  /* ===============================
     SELECT MEMBER
  ================================ */
  const toggleMember = (member: Beneficiary) => {
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
  const hasMembers = members.length > 0;

  const allSelected =
    members.length > 0 && selectedMembers.length === members.length;

  const someSelected =
    selectedMembers.length > 0 && selectedMembers.length < members.length;

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedMembers([]);
      return;
    }

    setSelectedMembers(
      members.map((m) => ({
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
     SAVE EDIT
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

      setVisibleMembers((prev) =>
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
     SUBMIT GROUP
  ================================ */
  const submitGroup = async () => {
    const groupErr = validateGroupName(groupName);
    if (groupErr) return setToastMessage(groupErr);

    if (selectedMembers.length === 0) {
      setToastMessage("Select at least one beneficiary");
      return;
    }

    // validate all selected
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

    // clean payload
    const payload: Beneficiary[] = selectedMembers.map((m) => ({
      ...m,
      groupname: groupName.trim(),
      nat_id: cleanNatId(m.nat_id),
      hh_size: cleanHHSize(m.hh_size),
    }));

    try {
      setIsSubmitting(true);

      await bulkSyncGroup(payload, groupName.trim());

      // ✅ IMMEDIATE UI UPDATE (makes badge green instantly)
      const submittedCodes = new Set(payload.map((p) => p.sppCode));

      setMembers((prev) =>
        prev.map((m) =>
          submittedCodes.has(m.sppCode)
            ? {
                ...m,
                selected: 1,
                groupname: groupName.trim(),
              }
            : m,
        ),
      );

      setVisibleMembers((prev) =>
        prev.map((m) =>
          submittedCodes.has(m.sppCode)
            ? {
                ...m,
                selected: 1,
                groupname: groupName.trim(),
              }
            : m,
        ),
      );

      setToastMessage("Group created & synced");
      setSelectedMembers([]);
      setGroupName("");
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
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => router.goBack()}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Group Assignment</IonTitle>
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

        {/* FILTER LOADER */}
        <IonLoading
          isOpen={isFilterLoading}
          spinner="crescent"
          message="Loading filters..."
        />

        {/* TOAST */}
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

            {hasMembers && (
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
                        onIonChange={() => toggleMember(m)}
                      />

                      <IonLabel>
                        <h2>{m.hh_head_name}</h2>
                        <p>{m.hh_code}</p>

                        <IonBadge
                          color={
                            incomplete
                              ? "danger"
                              : isVerified
                                ? "success"
                                : "warning"
                          }
                        >
                          {incomplete
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
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>{modalTitle}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent fullscreen className="ion-padding validation-modal">
            {editingMember && (
              <>
                <IonItem>
                  <IonLabel position="stacked">Gender *</IonLabel>
                  <IonSelect
                    value={editingMember.sex}
                    onIonChange={(e) =>
                      setEditingMember((prev) =>
                        prev
                          ? {
                              ...prev,
                              sex: e.detail.value,
                            }
                          : prev,
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

                  <IonDatetime
                    presentation="date"
                    value={editingMember.dob || undefined}
                    max={getMaxDobISO()}
                    onIonChange={(e) => {
                      const val = String(e.detail.value || "");
                      setEditingMember((prev) =>
                        prev
                          ? {
                              ...prev,
                              dob: val,
                            }
                          : prev,
                      );

                      setTimeout(() => {
                        (document.activeElement as HTMLElement | null)?.blur();
                      }, 50);
                    }}
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
                          ? {
                              ...prev,
                              nat_id: String(e.detail.value || ""),
                            }
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
                                e.detail.value === "" || e.detail.value === null
                                  ? null
                                  : Number(String(e.detail.value)),
                            }
                          : prev,
                      )
                    }
                    placeholder="Enter household size"
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  color="success"
                  onClick={saveEditedMember}
                  style={{ marginTop: 20 }}
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

                <div className="bottom-spacer" />
              </>
            )}
          </IonContent>
        </IonModal>

        <div className="bottom-spacer" />
      </IonContent>
    </IonPage>
  );
};

export default GroupAssignment;
