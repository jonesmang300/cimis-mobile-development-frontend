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
import { apiGet } from "../services/api";
import {
  createGroupIGA,
  deleteGroupIGA,
  fetchGroupIGAsByGroupID,
  GroupIGA as GroupIGARow,
  updateGroupIGA,
} from "../services/groupOperations.service";

type GroupMeta = {
  DistrictID?: string;
  districtID?: string;
};

type BusinessCategoryRow = {
  categoryID?: string;
  catname?: string;
};

type IGATypeRow = {
  ID?: number;
  categoryID?: string;
  name?: string;
  description?: string;
};

type FormState = {
  bus_category: string;
  type: string;
  no_male: string;
  no_female: string;
  amount_invested: string;
  imonth: string;
  iyear: string;
};

const monthOptions = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 10 }, (_, i) =>
  String(currentYear - 5 + i),
);

const emptyForm: FormState = {
  bus_category: "",
  type: "",
  no_male: "0",
  no_female: "0",
  amount_invested: "",
  imonth: String(new Date().getMonth() + 1).padStart(2, "0"),
  iyear: String(currentYear),
};

const formatAmountInput = (value: string | number) => {
  const digitsOnly = String(value ?? "").replace(/[^\d]/g, "");
  if (!digitsOnly) return "";
  return Number(digitsOnly).toLocaleString("en-US");
};

const parseAmount = (value: string | number) => {
  const digitsOnly = String(value ?? "").replace(/[^\d]/g, "");
  if (!digitsOnly) return 0;
  return Number(digitsOnly);
};

const formatAmountDisplay = (value: string | number | null | undefined) => {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) return "K 0";
  return `K ${numericValue.toLocaleString("en-US")}`;
};

const monthName = (monthValue: string | number | null | undefined) => {
  const value = String(monthValue || "").padStart(2, "0");
  return monthOptions.find((m) => m.value === value)?.label || "-";
};

const GroupIGA: React.FC = () => {
  const history = useHistory();
  const { selectedGroupID, selectedGroupName, refreshSelectedGroup } =
    useSelectedGroup();

  const [rows, setRows] = useState<GroupIGARow[]>([]);
  const [groupMeta, setGroupMeta] = useState<GroupMeta | null>(null);
  const [businessCategories, setBusinessCategories] = useState<BusinessCategoryRow[]>([]);
  const [igaTypes, setIgaTypes] = useState<IGATypeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRow, setEditingRow] = useState<GroupIGARow | null>(null);
  const [viewRow, setViewRow] = useState<GroupIGARow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GroupIGARow | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);

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
        igaRowsResult,
        groupRowResult,
        categoryRowsResult,
        igaTypeRowsResult,
      ] = await Promise.allSettled([
        fetchGroupIGAsByGroupID(activeGroupID),
        apiGet<GroupMeta>(`/groups/${encodeURIComponent(activeGroupID)}`),
        apiGet<BusinessCategoryRow[]>("/business-categories"),
        apiGet<IGATypeRow[]>("/iga-types"),
      ]);

      const igaRows =
        igaRowsResult.status === "fulfilled" ? igaRowsResult.value : [];
      const groupRow =
        groupRowResult.status === "fulfilled" ? groupRowResult.value : null;
      const categoryRows =
        categoryRowsResult.status === "fulfilled" ? categoryRowsResult.value : [];
      const igaTypeRows =
        igaTypeRowsResult.status === "fulfilled" ? igaTypeRowsResult.value : [];

      setRows(Array.isArray(igaRows) ? igaRows : []);
      setGroupMeta(groupRow || null);
      setBusinessCategories(Array.isArray(categoryRows) ? categoryRows : []);
      setIgaTypes(Array.isArray(igaTypeRows) ? igaTypeRows : []);

      const loadFailures = [
        igaRowsResult,
        groupRowResult,
        categoryRowsResult,
        igaTypeRowsResult,
      ].filter((result) => result.status === "rejected");

      if (loadFailures.length > 0) {
        console.error("Group IGA partial load failure:", loadFailures);
      }
    } catch (error) {
      console.error("Failed to load group IGAs:", error);
      setRows([]);
      setGroupMeta(null);
      setBusinessCategories([]);
      setIgaTypes([]);
      setActionMessage(
        error instanceof Error ? error.message : "Failed to load group IGAs.",
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

  const totalInvested = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.amount_invested || 0), 0),
    [rows],
  );

  const businessCategoryNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of businessCategories) {
      map[String(row.categoryID || "")] = row.catname || String(row.categoryID || "");
    }
    return map;
  }, [businessCategories]);

  const igaTypeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of igaTypes) {
      map[String(row.ID || "")] = row.name || String(row.ID || "");
    }
    return map;
  }, [igaTypes]);

  const filteredIgaTypes = useMemo(
    () =>
      igaTypes.filter(
        (row) =>
          !form.bus_category ||
          String(row.categoryID || "") === String(form.bus_category || ""),
      ),
    [form.bus_category, igaTypes],
  );

  const deleteTargetLabel = useMemo(() => {
    if (!deleteTarget) return "";
    return (
      igaTypeNameById[String(deleteTarget.type || "")] ||
      businessCategoryNameById[String(deleteTarget.bus_category || "")] ||
      String(deleteTarget.type || deleteTarget.bus_category || "")
    );
  }, [businessCategoryNameById, deleteTarget, igaTypeNameById]);

  const openCreateModal = () => {
    setEditingRow(null);
    setForm(emptyForm);
    setShowFormModal(true);
  };

  const openEditModal = (row: GroupIGARow) => {
    setEditingRow(row);
      setForm({
        bus_category: String(row.bus_category || ""),
        type: String(row.type || ""),
      no_male: String(row.no_male ?? "0"),
      no_female: String(row.no_female ?? "0"),
      amount_invested: formatAmountInput(String(row.amount_invested || "")),
      imonth: String(row.imonth || emptyForm.imonth).padStart(2, "0"),
      iyear: String(row.iyear || emptyForm.iyear),
    });
    setShowFormModal(true);
  };

  const handleSave = async () => {
    if (!selectedGroupID) {
      setActionMessage("Select a group first.");
      return;
    }

    if (!form.bus_category.trim() || !form.type.trim()) {
      setActionMessage("Business category and type are required.");
      return;
    }

    const noMale = Number(form.no_male || 0);
    const noFemale = Number(form.no_female || 0);
    const amountInvested = parseAmount(form.amount_invested);

    if (
      Number.isNaN(noMale) ||
      Number.isNaN(noFemale) ||
      noMale < 0 ||
      noFemale < 0
    ) {
      setActionMessage("Male and female counts must be valid non-negative numbers.");
      return;
    }

    if (!Number.isFinite(amountInvested) || amountInvested < 0) {
      setActionMessage("Amount invested must be a valid non-negative amount.");
      return;
    }

    const payload = {
      groupID: selectedGroupID,
      districtID: String(groupMeta?.DistrictID || groupMeta?.districtID || ""),
      bus_category: form.bus_category.trim(),
      type: form.type.trim(),
      no_male: noMale,
      no_female: noFemale,
      amount_invested: amountInvested,
      imonth: form.imonth,
      iyear: form.iyear,
    };

    try {
      setSaving(true);
      if (editingRow?.recID) {
        await updateGroupIGA(editingRow.recID, payload);
      } else {
        await createGroupIGA(payload);
      }

      setShowFormModal(false);
      setEditingRow(null);
      setForm(emptyForm);
      await load();
    } catch (error) {
      console.error("Failed to save group IGA:", error);
      setActionMessage(
        error instanceof Error ? error.message : "Failed to save group IGA.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.recID) return;

    try {
      await deleteGroupIGA(deleteTarget.recID);
      setDeleteTarget(null);
      if (viewRow?.recID === deleteTarget.recID) {
        setViewRow(null);
      }
      await load();
    } catch (error) {
      console.error("Failed to delete group IGA:", error);
      setActionMessage(
        error instanceof Error ? error.message : "Failed to delete group IGA.",
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
          <IonTitle style={{ color: "white" }}>Group IGA</IonTitle>
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
          Add Group IGA
        </IonButton>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Summary</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none">
              <IonLabel>Total Records</IonLabel>
              <IonBadge slot="end" color="success">
                {rows.length}
              </IonBadge>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>Total Amount Invested</IonLabel>
              <IonBadge slot="end" color="tertiary">
                {formatAmountDisplay(totalInvested)}
              </IonBadge>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 24 }}>
            <IonSpinner name="crescent" />
          </div>
        ) : rows.length === 0 ? (
          <IonCard>
            <IonCardContent>
              <IonLabel color="medium">
                No group IGA records found for the selected group.
              </IonLabel>
            </IonCardContent>
          </IonCard>
        ) : (
          <IonList>
            {rows.map((row) => (
              <IonCard key={row.recID || `${row.groupID}-${row.imonth}-${row.iyear}`}>
                <IonCardContent>
                  <IonItem lines="none">
                      <IonLabel>
                        <h2>
                          {businessCategoryNameById[String(row.bus_category || "")] ||
                            row.bus_category ||
                            "-"}
                        </h2>
                        <p>
                          IGA Type:{" "}
                          {igaTypeNameById[String(row.type || "")] || row.type || "-"}
                        </p>
                        <p>
                          Period: {monthName(row.imonth)} {row.iyear || "-"}
                        </p>
                    </IonLabel>
                    <IonBadge slot="end" color="success">
                      {formatAmountDisplay(row.amount_invested)}
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
                      aria-label="View group IGA"
                      style={{ margin: 0, minWidth: "36px" }}
                      onClick={() => setViewRow(row)}
                    >
                      <IonIcon icon={eyeOutline} />
                    </IonButton>
                    <IonButton
                      fill="clear"
                      size="small"
                      title="Edit"
                      aria-label="Edit group IGA"
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
                      aria-label="Delete group IGA"
                      style={{ margin: 0, minWidth: "36px" }}
                      onClick={() => setDeleteTarget(row)}
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
          isOpen={showFormModal}
          onDidDismiss={() => {
            setShowFormModal(false);
            setEditingRow(null);
          }}
        >
          <IonHeader>
            <IonToolbar color="success">
              <IonTitle>{editingRow ? "Edit Group IGA" : "Add Group IGA"}</IonTitle>
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
              <IonLabel position="stacked">Select Business Category</IonLabel>
              <IonSelect
                value={form.bus_category}
                placeholder="Select Business Category"
                onIonChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    bus_category: String(e.detail.value || ""),
                    type: "",
                  }))
                }
              >
                {businessCategories.map((category) => (
                  <IonSelectOption
                    key={String(category.categoryID || "")}
                    value={String(category.categoryID || "")}
                  >
                    {category.catname || category.categoryID || "-"}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Select IGA Type</IonLabel>
              <IonSelect
                value={form.type}
                placeholder="Select IGA Type"
                onIonChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    type: String(e.detail.value || ""),
                  }))
                }
              >
                {filteredIgaTypes.map((igaType) => (
                  <IonSelectOption
                    key={String(igaType.ID || "")}
                    value={String(igaType.ID || "")}
                  >
                    {igaType.name || igaType.ID || "-"}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">No. Male</IonLabel>
              <IonInput
                type="number"
                value={form.no_male}
                onIonInput={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    no_male: e.detail.value === null ? "" : String(e.detail.value),
                  }))
                }
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">No. Female</IonLabel>
              <IonInput
                type="number"
                value={form.no_female}
                onIonInput={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    no_female:
                      e.detail.value === null ? "" : String(e.detail.value),
                  }))
                }
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Amount Invested</IonLabel>
              <IonInput
                inputMode="numeric"
                value={form.amount_invested}
                onIonInput={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    amount_invested: formatAmountInput(
                      String(e.detail.value || ""),
                    ),
                  }))
                }
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Month</IonLabel>
              <IonSelect
                value={form.imonth}
                onIonChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    imonth: String(e.detail.value || ""),
                  }))
                }
              >
                {monthOptions.map((month) => (
                  <IonSelectOption key={month.value} value={month.value}>
                    {month.label}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Year</IonLabel>
              <IonSelect
                value={form.iyear}
                onIonChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    iyear: String(e.detail.value || ""),
                  }))
                }
              >
                {yearOptions.map((year) => (
                  <IonSelectOption key={year} value={year}>
                    {year}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonButton
              expand="block"
              color="success"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : editingRow ? "Update Group IGA" : "Add Group IGA"}
            </IonButton>
          </IonContent>
        </IonModal>

        <IonModal isOpen={!!viewRow} onDidDismiss={() => setViewRow(null)}>
          <IonHeader>
            <IonToolbar color="success">
              <IonTitle>Group IGA Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setViewRow(null)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem lines="none">
              <IonLabel>
                <h3>Business Category</h3>
                <p>
                  {businessCategoryNameById[String(viewRow?.bus_category || "")] ||
                    viewRow?.bus_category ||
                    "-"}
                </p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>
                <h3>IGA Type</h3>
                <p>
                  {igaTypeNameById[String(viewRow?.type || "")] ||
                    viewRow?.type ||
                    "-"}
                </p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>
                <h3>Male Participants</h3>
                <p>{Number(viewRow?.no_male || 0)}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>
                <h3>Female Participants</h3>
                <p>{Number(viewRow?.no_female || 0)}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>
                <h3>Amount Invested</h3>
                <p>{formatAmountDisplay(viewRow?.amount_invested)}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>
                <h3>Period</h3>
                <p>
                  {monthName(viewRow?.imonth)} {viewRow?.iyear || "-"}
                </p>
              </IonLabel>
            </IonItem>
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={!!deleteTarget}
          onDidDismiss={() => setDeleteTarget(null)}
          header="Delete Group IGA"
          message={`Delete group IGA "${deleteTargetLabel}"?`}
          buttons={[
            { text: "Cancel", role: "cancel" },
            { text: "Delete", role: "destructive", handler: handleDelete },
          ]}
        />

        <IonAlert
          isOpen={!!actionMessage}
          onDidDismiss={() => setActionMessage("")}
          header="Group IGA"
          message={actionMessage}
          buttons={["OK"]}
        />
      </IonContent>
    </IonPage>
  );
};

export default GroupIGA;

