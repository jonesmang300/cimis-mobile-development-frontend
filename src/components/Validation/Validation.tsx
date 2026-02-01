import React, { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import {
  getRegions,
  getDistricts,
  getTAs,
  getVillageClusters,
  getBeneficiaries,
  preloadBeneficiaries,
} from "../../db/sqlite";

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
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { useIonRouter } from "@ionic/react";
import "./Validation.css";

/* ===============================
   CONFIG
================================ */
const BASE_URL = "https://api-development-t6ui.onrender.com/api";

const PAGE_SIZE = 20;
const isNative = Capacitor.getPlatform() !== "web";

/* ===============================
   COMPONENT
================================ */
const GroupAssignment: React.FC = () => {
  const router = useIonRouter();

  /* FILTER STATE */
  const [regions, setRegions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [tas, setTas] = useState<any[]>([]);
  const [vcs, setVcs] = useState<any[]>([]);

  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [ta, setTa] = useState("");
  const [vc, setVc] = useState("");

  /* BENEFICIARIES */
  const [members, setMembers] = useState<any[]>([]);
  const [visibleMembers, setVisibleMembers] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false);

  /* GROUP */
  const [groupName, setGroupName] = useState("");

  /* EDIT MODAL */
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  /* UI */
  const [toastMessage, setToastMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // spinner state

  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingTas, setLoadingTas] = useState(false);
  const [loadingVcs, setLoadingVcs] = useState(false);

  const isFilterLoading =
    loadingRegions || loadingDistricts || loadingTas || loadingVcs;

  /* ===============================
     HELPER: FETCH DATA SAFELY
  =============================== */
  const safeFetch = async (url: string) => {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!data) return [];
      if (!Array.isArray(data)) {
        console.warn("API returned non-array:", data);
        return [];
      }
      return data;
    } catch (err) {
      console.error("Fetch error:", err);
      return [];
    }
  };

  /* ===============================
     LOAD REGIONS
  =============================== */
  useEffect(() => {
    const load = async () => {
      setLoadingRegions(true);
      try {
        if (isNative) {
          const res = await getRegions();
          setRegions(res.values || []);
        } else {
          setRegions(await safeFetch(`${BASE_URL}/regions`));
        }
      } finally {
        setLoadingRegions(false);
      }
    };
    load();
  }, []);

  /* ===============================
     LOAD DISTRICTS
  =============================== */
  useEffect(() => {
    if (!region) return;

    setDistrict("");
    setTa("");
    setVc("");
    setMembers([]);
    setVisibleMembers([]);

    const load = async () => {
      setLoadingDistricts(true);
      try {
        if (isNative) {
          const res = await getDistricts(region);
          setDistricts(res.values || []);
        } else {
          setDistricts(
            await safeFetch(`${BASE_URL}/districts?regionID=${region}`),
          );
        }
      } finally {
        setLoadingDistricts(false);
      }
    };
    load();
  }, [region]);

  /* ===============================
     LOAD TAs
  =============================== */
  useEffect(() => {
    if (!district) return;

    setTa("");
    setVc("");
    setMembers([]);
    setVisibleMembers([]);

    const load = async () => {
      setLoadingTas(true);
      try {
        if (isNative) {
          const res = await getTAs(district);
          setTas(res.values || []);
        } else {
          setTas(await safeFetch(`${BASE_URL}/tas?districtID=${district}`));
        }
      } finally {
        setLoadingTas(false);
      }
    };
    load();
  }, [district]);

  /* ===============================
     LOAD VILLAGE CLUSTERS
  =============================== */
  useEffect(() => {
    if (!ta) return;

    setVc("");
    setMembers([]);
    setVisibleMembers([]);

    const load = async () => {
      setLoadingVcs(true);
      try {
        if (isNative) {
          const res = await getVillageClusters(ta);
          setVcs(res.values || []);
        } else {
          setVcs(await safeFetch(`${BASE_URL}/village-clusters?taID=${ta}`));
        }
      } finally {
        setLoadingVcs(false);
      }
    };
    load();
  }, [ta]);

  /* ===============================
     LOAD BENEFICIARIES
  =============================== */
  useEffect(() => {
    if (!vc) return;

    const load = async () => {
      setMembers([]);
      setVisibleMembers([]);
      setHasMore(false);
      setLoadingBeneficiaries(true);

      try {
        let data: any[] = [];

        if (isNative) {
          // fetch latest from API and store into SQLite
          await preloadBeneficiaries(vc);

          // read from SQLite
          const res = await getBeneficiaries(vc);
          data = res.values || [];
        } else {
          // web: direct API only
          data = await safeFetch(
            `${BASE_URL}/beneficiaries/filter?villageClusterID=${vc}`,
          );
        }

        setMembers(data);
        setVisibleMembers(data.slice(0, PAGE_SIZE));
        setHasMore(data.length > PAGE_SIZE);
      } finally {
        setLoadingBeneficiaries(false);
      }
    };

    load();
  }, [vc]);

  /* ===============================
     LOAD MORE ON SCROLL
  =============================== */
  const loadMoreMembers = (e: any) => {
    const el = e.target;
    if (hasMore && el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      const next = visibleMembers.length + PAGE_SIZE;
      const nextItems = members.slice(0, next);
      setVisibleMembers(nextItems);
      setHasMore(nextItems.length < members.length);
    }
  };

  /* ===============================
     SELECT / UNSELECT
  =============================== */
  const toggleMember = (member: any) => {
    setSelectedMembers((prev) => {
      const exists = prev.find((m) => m.sppCode === member.sppCode);
      return exists
        ? prev.filter((m) => m.sppCode !== member.sppCode)
        : [
            ...prev,
            {
              ...member,
              groupname: groupName,
            },
          ];
    });
  };

  /* ===============================
     SAVE EDIT (PATCH)
  =============================== */
  const saveEditedMember = async () => {
    if (!editingMember) return;

    try {
      setIsSubmitting(true);
      await fetch(
        `${BASE_URL}/beneficiaries/${encodeURIComponent(
          editingMember.sppCode,
        )}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sex: editingMember.sex,
            dob: editingMember.dob ? editingMember.dob.split("T")[0] : null,
          }),
        },
      );

      setMembers((prev) =>
        prev.map((m) =>
          m.sppCode === editingMember.sppCode ? editingMember : m,
        ),
      );

      setVisibleMembers((prev) =>
        prev.map((m) =>
          m.sppCode === editingMember.sppCode ? editingMember : m,
        ),
      );

      setSelectedMembers((prev) =>
        prev.map((m) =>
          m.sppCode === editingMember.sppCode
            ? { ...editingMember, groupname: groupName }
            : m,
        ),
      );

      setShowEditModal(false);
    } catch {
      setToastMessage("Failed to update beneficiary");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ===============================
     SUBMIT GROUP
  =============================== */
  const submitGroup = async () => {
    if (!groupName.trim()) {
      setToastMessage("Group name is required");
      return;
    }

    if (selectedMembers.length === 0) {
      setToastMessage("Select at least one beneficiary");
      return;
    }

    const incomplete = selectedMembers.find((m) => !m.sex || !m.dob);
    if (incomplete) {
      setToastMessage("Some selected beneficiaries need Sex and DOB");
      return;
    }

    try {
      setIsSubmitting(true);
      await fetch(`${BASE_URL}/beneficiaries/bulk-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          selectedMembers.map((m) => ({
            sppCode: m.sppCode,
            sex: m.sex,
            dob: m.dob ? m.dob.split("T")[0] : null,
            groupname: m.groupname,
            selected: 1,
          })),
        ),
      });

      setToastMessage("Group created & synced");
      setSelectedMembers([]);
      setGroupName("");
    } catch {
      setToastMessage("Sync failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ===============================
     UI
  =============================== */
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

      <IonContent className="ion-padding">
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
                disabled={loadingRegions}
                onIonChange={(e) => setRegion(e.detail.value)}
              >
                {regions?.map((r) => (
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
                {districts?.map((d) => (
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
                {tas?.map((t) => (
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
                {vcs?.map((v) => (
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

        {/* GLOBAL FILTER LOADER */}
        <IonLoading
          isOpen={isFilterLoading}
          spinner="crescent"
          message={
            loadingRegions
              ? "Loading regions..."
              : loadingDistricts
                ? "Loading districts..."
                : loadingTas
                  ? "Loading traditional authorities..."
                  : loadingVcs
                    ? "Loading village clusters..."
                    : "Loading..."
          }
        />

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={3000}
          onDidDismiss={() => setToastMessage("")}
        />

        {/* GROUP CARD */}
        <IonCard className="group-details-card">
          <IonCardHeader>
            <IonCardTitle>Group Details</IonCardTitle>
          </IonCardHeader>

          <IonCardContent className="group-details-scroll">
            {/* GROUP NAME */}
            <IonItem>
              <IonLabel position="stacked">Group Name *</IonLabel>
              <IonInput
                value={groupName}
                onIonInput={(e) => {
                  const value = e.detail.value!;
                  setGroupName(value);
                  setSelectedMembers((prev) =>
                    prev.map((m) => ({
                      ...m,
                      groupname: value,
                    })),
                  );
                }}
              />
            </IonItem>

            {/* SELECTED COUNT */}
            <IonItem lines="none">
              <IonLabel>Selected Beneficiaries</IonLabel>
              <IonBadge slot="end" color="success">
                {selectedMembers.length}
              </IonBadge>
            </IonItem>

            {/* VIEW-PAGINATED LIST */}
            <div
              style={{
                maxHeight: "55vh",
                overflowY: "auto",
                border: "1px solid var(--ion-color-light)",
                borderRadius: 8,
              }}
              onScroll={loadMoreMembers}
            >
              <IonList>
                {loadingBeneficiaries ? (
                  <IonItem lines="none">
                    <IonSpinner name="crescent" style={{ marginRight: 10 }} />
                    <IonLabel>Loading beneficiaries...</IonLabel>
                  </IonItem>
                ) : (
                  Array.isArray(visibleMembers) &&
                  visibleMembers.map((m) => {
                    const selected = selectedMembers.some(
                      (x) => x.sppCode === m.sppCode,
                    );
                    const incomplete = !m.sex || !m.dob;

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
                          <IonBadge color={incomplete ? "danger" : "success"}>
                            {incomplete ? "REQUIRES EDIT" : "COMPLETE"}
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

                {!loadingBeneficiaries && hasMore && (
                  <IonItem lines="none">
                    <IonLabel color="medium">Waiting…</IonLabel>
                  </IonItem>
                )}
              </IonList>
            </div>
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
              <IonTitle>Edit Beneficiary</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            {editingMember && (
              <>
                <IonItem>
                  <IonLabel position="stacked">Sex</IonLabel>
                  <IonSelect
                    value={editingMember.sex}
                    onIonChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        sex: e.detail.value,
                      })
                    }
                  >
                    <IonSelectOption value="01">Male</IonSelectOption>
                    <IonSelectOption value="02">Female</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Date of Birth</IonLabel>
                  <IonDatetime
                    presentation="date"
                    value={editingMember.dob}
                    onIonChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        dob: e.detail.value,
                      })
                    }
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
                      Save Changes
                    </>
                  ) : (
                    "Submit Details"
                  )}
                </IonButton>
              </>
            )}
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={3000}
          onDidDismiss={() => setToastMessage("")}
        />
      </IonContent>
    </IonPage>
  );
};

export default GroupAssignment;
