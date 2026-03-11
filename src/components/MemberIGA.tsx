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
  trashOutline,
} from "ionicons/icons";
import { useHistory, useParams } from "react-router-dom";
import { apiGet } from "../services/api";
import {
  createMemberIGA,
  deleteMemberIGA,
  fetchMemberIGAsByMember,
  MemberIGA as MemberIGARow,
  updateMemberIGA,
} from "../services/groupOperations.service";

type Params = {
  sppCode: string;
};

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

type BeneficiaryMeta = {
  hh_head_name?: string;
  hh_code?: string;
};

type FormState = {
  bus_category: string;
  type: string;
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
  amount_invested: "",
  imonth: String(new Date().getMonth() + 1).padStart(2, "0"),
  iyear: String(currentYear),
};

const safeDecodeURIComponent = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
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

const MemberIGA: React.FC = () => {
  const history = useHistory();
  const { sppCode: sppCodeParam } = useParams<Params>();
  const sppCode = safeDecodeURIComponent(sppCodeParam || "");
  const selectedGroupID = localStorage.getItem("selectedGroupID") || "";
  const selectedGroupName = localStorage.getItem("selectedGroupName") || "";

  const [rows, setRows] = useState<MemberIGARow[]>([]);
  const [groupMeta, setGroupMeta] = useState<GroupMeta | null>(null);
  const [beneficiaryMeta, setBeneficiaryMeta] = useState<BeneficiaryMeta | null>(null);
  const [businessCategories, setBusinessCategories] = useState<BusinessCategoryRow[]>([]);
  const [igaTypes, setIgaTypes] = useState<IGATypeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRow, setEditingRow] = useState<MemberIGARow | null>(null);
  const [viewRow, setViewRow] = useState<MemberIGARow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MemberIGARow | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = useCallback(async () => {
    if (!selectedGroupID || !sppCode) {
      setRows([]);
      setGroupMeta(null);
      setBeneficiaryMeta(null);
      return;
    }

    setLoading(true);
    try {
      const [igaRows, groupRow, categoryRows, igaTypeRows, beneficiaryRow] =
        await Promise.all([
          fetchMemberIGAsByMember(selectedGroupID, sppCode),
          apiGet<GroupMeta>(`/groups/${encodeURIComponent(selectedGroupID)}`),
          apiGet<BusinessCategoryRow[]>("/business-categories"),
          apiGet<IGATypeRow[]>("/iga-types"),
          apiGet<BeneficiaryMeta>(
            `/beneficiaries/${encodeURIComponent(sppCode)}`,
          ),
        ]);

      setRows(igaRows);
      setGroupMeta(groupRow || null);
      setBusinessCategories(Array.isArray(categoryRows) ? categoryRows : []);
      setIgaTypes(Array.isArray(igaTypeRows) ? igaTypeRows : []);
      setBeneficiaryMeta(beneficiaryRow || null);
    } catch (error) {
      console.error("Failed to load member IGAs:", error);
      setRows([]);
      setGroupMeta(null);
      setBeneficiaryMeta(null);
      setBusinessCategories([]);
      setIgaTypes([]);
      setActionMessage(
        error instanceof Error ? error.message : "Failed to load member IGA.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedGroupID, sppCode]);

  useIonViewWillEnter(() => {
    load();
  });

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

  const openEditModal = (row: MemberIGARow) => {
    setEditingRow(row);
    setForm({
      bus_category: String(row.bus_category || ""),
      type: String(row.type || ""),
      amount_invested: formatAmountInput(String(row.amount_invested || "")),
      imonth: String(row.imonth || emptyForm.imonth).padStart(2, "0"),
      iyear: String(row.iyear || emptyForm.iyear),
    });
    setShowFormModal(true);
  };

  const handleSave = async () => {
    if (!selectedGroupID || !sppCode) {
      setActionMessage("Select a beneficiary first.");
      return;
    }

    if (!form.bus_category.trim() || !form.type.trim()) {
      setActionMessage("Business category and IGA type are required.");
      return;
    }

    const amountInvested = parseAmount(form.amount_invested);
    if (!Number.isFinite(amountInvested) || amountInvested < 0) {
      setActionMessage("Enter a valid amount invested.");
      return;
    }

    const payload = {
      groupID: selectedGroupID,
      districtID:
        String(groupMeta?.DistrictID || groupMeta?.districtID || "").trim() || "",
      sppCode,
      bus_category: form.bus_category.trim(),
      type: form.type.trim(),
      amount_invested: amountInvested,
      imonth: form.imonth,
      iyear: form.iyear,
    };

    try {
      setSaving(true);
      if (editingRow?.recID) {
        await updateMemberIGA(editingRow.recID, payload);
      } else {
        await createMemberIGA(payload);
      }
      setShowFormModal(false);
      setEditingRow(null);
      setForm(emptyForm);
      await load();
    } catch (error) {
      console.error("Failed to save member IGA:", error);
      setActionMessage(
        error instanceof Error ? error.message : "Failed to save member IGA.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.recID) return;

    try {
      await deleteMemberIGA(deleteTarget.recID);
      if (viewRow?.recID === deleteTarget.recID) {
        setViewRow(null);
      }
      setDeleteTarget(null);
      await load();
    } catch (error) {
      console.error("Failed to delete member IGA:", error);
      setActionMessage(
        error instanceof Error ? error.message : "Failed to delete member IGA.",
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
          <IonTitle style={{ color: "white" }}>Member IGA</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonItem lines="none">
          <IonLabel>
            <h2>{beneficiaryMeta?.hh_head_name || "Selected Beneficiary"}</h2>
            <p>{sppCode || "-"}</p>
            <p>ML Code: {beneficiaryMeta?.hh_code || "-"}</p>
            <p>{selectedGroupName || selectedGroupID || "Selected Group"}</p>
          </IonLabel>
          <IonBadge slot="end" color="success">
            {rows.length}
          </IonBadge>
        </IonItem>

        <IonButton
          expand="block"
          color="success"
          onClick={openCreateModal}
          style={{ marginTop: 12 }}
        >
          <IonIcon icon={addCircleOutline} slot="start" />
          Add Member IGA
        </IonButton>

        <IonCard style={{ marginTop: 16 }}>
          <IonCardHeader>
            <IonCardTitle>Member IGA Summary</IonCardTitle>
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
              <IonBadge slot="end" color="success">
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
          <IonItem lines="none">
            <IonLabel color="medium">No member IGA records found</IonLabel>
          </IonItem>
        ) : (
          <IonList>
            {rows.map((row) => (
              <IonCard key={row.recID}>
                <IonCardContent>
                  <IonItem lines="none">
                    <IonLabel>
                      <h2>
                        {igaTypeNameById[String(row.type || "")] ||
                          businessCategoryNameById[String(row.bus_category || "")] ||
                          row.type ||
                          row.bus_category ||
                          "Member IGA"}
                      </h2>
                      <p>
                        Business Category:{" "}
                        {businessCategoryNameById[String(row.bus_category || "")] ||
                          row.bus_category ||
                          "-"}
                      </p>
                      <p>
                        IGA Type:{" "}
                        {igaTypeNameById[String(row.type || "")] || row.type || "-"}
                      </p>
                      <p>Amount Invested: {formatAmountDisplay(row.amount_invested)}</p>
                      <p>
                        Period: {monthName(row.imonth)} {row.iyear || "-"}
                      </p>
                    </IonLabel>
                    <IonButtons
                      slot="end"
                      style={{ display: "flex", flexWrap: "nowrap", gap: "4px" }}
                    >
                      <IonButton
                        fill="clear"
                        size="small"
                        title="Edit"
                        onClick={() => openEditModal(row)}
                        style={{ margin: 0, minWidth: "36px" }}
                      >
                        <IonIcon icon={createOutline} />
                      </IonButton>
                      <IonButton
                        fill="clear"
                        color="danger"
                        size="small"
                        title="Delete"
                        onClick={() => setDeleteTarget(row)}
                        style={{ margin: 0, minWidth: "36px" }}
                      >
                        <IonIcon icon={trashOutline} />
                      </IonButton>
                    </IonButtons>
                  </IonItem>
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
            setForm(emptyForm);
          }}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editingRow ? "Edit Member IGA" : "Add Member IGA"}</IonTitle>
              <IonButtons slot="end">
                <IonButton
                  onClick={() => {
                    setShowFormModal(false);
                    setEditingRow(null);
                    setForm(emptyForm);
                  }}
                >
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">Beneficiary Name</IonLabel>
              <IonInput value={beneficiaryMeta?.hh_head_name || "-"} readonly />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">ML Code</IonLabel>
              <IonInput value={beneficiaryMeta?.hh_code || "-"} readonly />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Business Category</IonLabel>
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
                {businessCategories.map((row) => (
                  <IonSelectOption
                    key={String(row.categoryID || "")}
                    value={String(row.categoryID || "")}
                  >
                    {row.catname || row.categoryID}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">IGA Type</IonLabel>
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
                {filteredIgaTypes.map((row) => (
                  <IonSelectOption
                    key={String(row.ID || "")}
                    value={String(row.ID || "")}
                  >
                    {row.name || row.ID}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Amount Invested</IonLabel>
              <IonInput
                inputmode="numeric"
                value={form.amount_invested}
                onIonInput={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    amount_invested: formatAmountInput(String(e.detail.value || "")),
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
                    imonth: String(e.detail.value || emptyForm.imonth),
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
                    iyear: String(e.detail.value || emptyForm.iyear),
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
              disabled={saving}
              onClick={handleSave}
              style={{ marginTop: 16 }}
            >
              {saving ? (
                <IonSpinner name="crescent" />
              ) : editingRow ? (
                "Update Member IGA"
              ) : (
                "Add Member IGA"
              )}
            </IonButton>
          </IonContent>
        </IonModal>

        <IonModal isOpen={!!viewRow} onDidDismiss={() => setViewRow(null)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>View Member IGA</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setViewRow(null)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem lines="none">
              <IonLabel>
                <h3>Beneficiary Name</h3>
                <p>{beneficiaryMeta?.hh_head_name || "-"}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>
                <h3>ML Code</h3>
                <p>{beneficiaryMeta?.hh_code || "-"}</p>
              </IonLabel>
            </IonItem>
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
                <p>{igaTypeNameById[String(viewRow?.type || "")] || viewRow?.type || "-"}</p>
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
          header="Delete Member IGA"
          message={`Delete member IGA "${deleteTargetLabel}"?`}
          buttons={[
            { text: "Cancel", role: "cancel" },
            { text: "Delete", role: "destructive", handler: handleDelete },
          ]}
        />

        <IonAlert
          isOpen={!!actionMessage}
          onDidDismiss={() => setActionMessage("")}
          header="Member IGA"
          message={actionMessage}
          buttons={["OK"]}
        />
      </IonContent>
    </IonPage>
  );
};

export default MemberIGA;
