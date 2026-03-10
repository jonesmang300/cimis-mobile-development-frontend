import React, { useEffect, useState } from "react";
import {
  IonAlert,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from "@ionic/react";
import {
  arrowBack,
  cashOutline,
  createOutline,
  eyeOutline,
} from "ionicons/icons";
import {
  Beneficiary,
  fetchBeneficiariesByGroupCode,
} from "../services/beneficiaries.service";
import { apiPatch } from "../services/api";

const formatGender = (value: string | null | undefined) => {
  const v = String(value || "").trim();
  if (v === "01") return "Male";
  if (v === "02") return "Female";
  return v || "-";
};

const formatDateLong = (value: string | null | undefined) => {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  const dateOnly = raw.includes("T") ? raw.split("T")[0] : raw;
  const d = new Date(dateOnly);
  if (Number.isNaN(d.getTime())) return dateOnly;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
};

const toDateInputValue = (value: string | null | undefined) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.includes("T") ? raw.split("T")[0] : raw;
};

const GroupBeneficiaries: React.FC = () => {
  const router = useIonRouter();
  const [rows, setRows] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMember, setViewMember] = useState<Beneficiary | null>(null);
  const [editMember, setEditMember] = useState<Beneficiary | null>(null);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [editSex, setEditSex] = useState<string>("");
  const [editDob, setEditDob] = useState<string>("");
  const [editNatId, setEditNatId] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<string>("");

  const selectedGroupID = localStorage.getItem("selectedGroupID") || "";
  const selectedGroupName = localStorage.getItem("selectedGroupName") || "";

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!selectedGroupID) {
        setRows([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchBeneficiariesByGroupCode(selectedGroupID);
        if (!cancelled) setRows(data);
      } catch (error) {
        console.error("Failed to load group beneficiaries:", error);
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [selectedGroupID]);

  const openEdit = (member: Beneficiary) => {
    setEditMember(member);
    setEditSex(String(member.sex || ""));
    setEditDob(toDateInputValue(member.dob));
    setEditNatId(String(member.nat_id || ""));
  };

  const handleSaveEdit = async () => {
    if (!editMember?.sppCode) return;

    try {
      setSavingEdit(true);
      await apiPatch(`/beneficiaries/${encodeURIComponent(editMember.sppCode)}`, {
        sex: editSex || null,
        dob: editDob || null,
        nat_id: editNatId.trim() || null,
      });

      setRows((prev) =>
        prev.map((m) =>
          m.sppCode === editMember.sppCode
            ? {
                ...m,
                sex: editSex || null,
                dob: editDob || null,
                nat_id: editNatId.trim() || null,
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
                nat_id: editNatId.trim() || null,
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
            <IonButton onClick={() => router.goBack()} color="light">
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle style={{ color: "white" }}>Group Beneficiaries</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonItem lines="none">
          <IonLabel>
            <h2>{selectedGroupName || "Selected Group"}</h2>
            <p>{selectedGroupID || "No group selected"}</p>
          </IonLabel>
          <IonBadge slot="end" color="success">
            {rows.length}
          </IonBadge>
        </IonItem>

        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 24 }}>
            <IonSpinner name="crescent" />
          </div>
        ) : rows.length === 0 ? (
          <IonItem lines="none">
            <IonLabel color="medium">No beneficiaries found for this group</IonLabel>
          </IonItem>
        ) : (
          <IonList>
            {rows.map((m) => (
              <IonItem key={m.sppCode}>
                <IonLabel>
                  <h2>{m.hh_head_name || m.sppCode}</h2>
                  <p>Beneficiary Code: {m.sppCode || "-"}</p>
                  <p>ML Code: {m.hh_code || "-"}</p>
                </IonLabel>
                <IonButton
                  slot="end"
                  fill="clear"
                  size="small"
                  title="View"
                  onClick={() => setViewMember(m)}
                >
                  <IonIcon icon={eyeOutline} />
                </IonButton>
                <IonButton
                  slot="end"
                  fill="clear"
                  size="small"
                  title="Edit"
                  onClick={() => openEdit(m)}
                >
                  <IonIcon icon={createOutline} />
                </IonButton>
                <IonButton
                  slot="end"
                  fill="clear"
                  size="small"
                  title="Savings"
                  onClick={() =>
                    router.push(
                      `/groups/savings/member/${encodeURIComponent(
                        m.sppCode || "",
                      )}`,
                    )
                  }
                >
                  <IonIcon icon={cashOutline} />
                </IonButton>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonModal
          isOpen={!!viewMember}
          onDidDismiss={() => setViewMember(null)}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Beneficiary Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setViewMember(null)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem lines="none">
              <IonLabel>
                <h3>Beneficiary Name</h3>
                <p>{viewMember?.hh_head_name || "-"}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>
                <h3>Gender</h3>
                <p>{formatGender(viewMember?.sex)}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>
                <h3>Date of Birth</h3>
                <p>{formatDateLong(viewMember?.dob)}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>
                <h3>National ID</h3>
                <p>{viewMember?.nat_id || "-"}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>
                <h3>ML Code</h3>
                <p>{viewMember?.hh_code || "-"}</p>
              </IonLabel>
            </IonItem>
          </IonContent>
        </IonModal>

        <IonModal
          isOpen={!!editMember}
          onDidDismiss={() => setEditMember(null)}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Beneficiary</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setEditMember(null)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">Beneficiary Name</IonLabel>
              <IonInput value={editMember?.hh_head_name || "-"} readonly />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Gender</IonLabel>
              <IonSelect
                value={editSex}
                onIonChange={(e) => setEditSex(String(e.detail.value || ""))}
              >
                <IonSelectOption value="01">Male</IonSelectOption>
                <IonSelectOption value="02">Female</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Date of Birth</IonLabel>
              <IonInput
                type="date"
                value={editDob}
                onIonInput={(e) => setEditDob(String(e.detail.value || ""))}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">National ID</IonLabel>
              <IonInput
                value={editNatId}
                onIonInput={(e) => setEditNatId(String(e.detail.value || ""))}
              />
            </IonItem>

            <IonButton
              expand="block"
              color="success"
              disabled={savingEdit || !editMember?.sppCode}
              onClick={handleSaveEdit}
              style={{ marginTop: 12 }}
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
      </IonContent>
    </IonPage>
  );
};

export default GroupBeneficiaries;
