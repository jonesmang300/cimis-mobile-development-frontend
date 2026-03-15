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
import { useHistory, useParams } from "react-router-dom";
import { apiGet } from "../services/api";
import {
  createMemberSaving,
  deleteMemberSaving,
  fetchMemberSavings,
  fetchSavingsTypes,
  MemberSaving,
  SavingsType,
  updateMemberSaving,
} from "../services/savings.service";
import "./MemberSavings.css";

type Params = {
  sppCode: string;
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

const toDateOnly = (value: string | null | undefined) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.includes("T") ? raw.split("T")[0] : raw;
};

const formatDateLong = (value: string | null | undefined) => {
  const raw = toDateOnly(value);
  if (!raw) return "-";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
};

const MemberSavings: React.FC = () => {
  const history = useHistory();
  const { sppCode: sppCodeParam } = useParams<Params>();
  const sppCode = safeDecodeURIComponent(sppCodeParam || "");
  const groupCode = localStorage.getItem("selectedGroupID") || "";
  const groupName = localStorage.getItem("selectedGroupName") || "";

  const [rows, setRows] = useState<MemberSaving[]>([]);
  const [savingsTypes, setSavingsTypes] = useState<SavingsType[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [memberName, setMemberName] = useState<string>("");
  const [memberMlCode, setMemberMlCode] = useState<string>("");
  const [savingDate, setSavingDate] = useState<string>(
    toDateOnly(new Date().toISOString()),
  );

  const [amount, setAmount] = useState<string>("");
  const [editingRecID, setEditingRecID] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<SavingsType | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewRow, setViewRow] = useState<MemberSaving | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MemberSaving | null>(null);

  const load = useCallback(async () => {
    if (!groupCode || !sppCode) {
      setRows([]);
      setSavingsTypes([]);
      return;
    }

    setLoading(true);
    try {
      const [memberRowsResult, typeRowsResult, beneficiaryResult] =
        await Promise.allSettled([
          fetchMemberSavings(groupCode, sppCode),
          fetchSavingsTypes(),
        apiGet<{
          hh_head_name?: string;
          hh_code?: string;
          dob?: string;
        }>(`/beneficiaries/${encodeURIComponent(sppCode)}`),
      ]);

      const memberRows =
        memberRowsResult.status === "fulfilled" ? memberRowsResult.value : [];
      const typeRows =
        typeRowsResult.status === "fulfilled" ? typeRowsResult.value : [];
      const beneficiary =
        beneficiaryResult.status === "fulfilled" ? beneficiaryResult.value : {};

      setRows(memberRows);
      setSavingsTypes(
        typeRows.length > 0
          ? typeRows
          : [{ TypeID: "00", savings_name: "Member Savings" }],
      );
      setMemberName(String(beneficiary?.hh_head_name || ""));
      setMemberMlCode(String(beneficiary?.hh_code || ""));
    } catch (error) {
      console.error("Failed to load member savings:", error);
      setRows([]);
      setSavingsTypes([{ TypeID: "00", savings_name: "Member Savings" }]);
      setMemberName("");
      setMemberMlCode("");
    } finally {
      setLoading(false);
    }
  }, [groupCode, sppCode]);

  useIonViewWillEnter(() => {
    load();
  });

  const totalsByType = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const row of rows) {
      const typeKey = String(row.sType || "");
      const amountValue = Number(row.amount || 0);
      totals[typeKey] = (totals[typeKey] || 0) + amountValue;
    }
    return totals;
  }, [rows]);

  const totalMemberSavings = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    [rows],
  );

  const savingsTypeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of savingsTypes) {
      map[String(t.TypeID)] = t.savings_name || String(t.TypeID);
    }
    return map;
  }, [savingsTypes]);

  const resetForm = () => {
    setAmount("");
    setSavingDate(toDateOnly(new Date().toISOString()));
    setEditingRecID(null);
  };

  const openAddModalForType = (type: SavingsType) => {
    resetForm();
    setActiveType(type);
    setShowAddModal(true);
  };

  const handleEdit = (row: MemberSaving) => {
    if (!row?.recID) return;
    setEditingRecID(row.recID);
    setAmount(formatAmountInput(String(row.amount || "")));
    setSavingDate(toDateOnly(row.date) || toDateOnly(new Date().toISOString()));
    const selected = savingsTypes.find(
      (t) => String(t.TypeID) === String(row.sType),
    );
    setActiveType(
      selected || {
        TypeID: String(row.sType || ""),
        savings_name: String(row.sType || ""),
      },
    );
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!groupCode || !sppCode || !activeType?.TypeID) return;
    const numericAmount = parseAmount(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      window.alert("Please enter a valid amount greater than 0.");
      return;
    }

    try {
      setSaving(true);
      if (editingRecID) {
        await updateMemberSaving(editingRecID, {
          amount: numericAmount,
          date: savingDate,
          sType: activeType.TypeID,
        });
      } else {
        await createMemberSaving({
          sppCode,
          groupCode,
          amount: numericAmount,
          date: savingDate,
          sType: activeType.TypeID,
        });
      }

      setShowAddModal(false);
      resetForm();
      await load();
    } catch (error) {
      console.error("Failed to save member saving:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save member saving. Please try again.";
      window.alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: MemberSaving) => {
    if (!row?.recID) return;
    try {
      await deleteMemberSaving(row.recID);
      setDeleteTarget(null);
      if (editingRecID === row.recID) {
        setShowAddModal(false);
        resetForm();
      }
      await load();
    } catch (error) {
      console.error("Failed to delete member saving:", error);
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
          <IonTitle style={{ color: "white" }}>Member Savings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <IonLabel>
              <h2>{memberName || "Beneficiary"}</h2>
              <p>ML Code: {memberMlCode || "-"}</p>
              <p>Group: {groupName || groupCode || "-"}</p>
              <p>Transaction Date: {formatDateLong(savingDate)}</p>
            </IonLabel>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Total Member Savings</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonBadge color="success">{formatAmountDisplay(totalMemberSavings)}</IonBadge>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Savings Accounts</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {loading ? (
              <IonSpinner name="crescent" />
            ) : savingsTypes.length === 0 ? (
              <IonLabel color="medium">No savings types found</IonLabel>
            ) : (
              <IonList className="member-savings-types-list">
                {savingsTypes.map((type) => {
                  const total = totalsByType[String(type.TypeID)] || 0;
                  return (
                    <IonCard key={type.TypeID} className="member-savings-type-card">
                      <IonCardContent>
                        <IonItem lines="none">
                          <IonLabel>
                            <h3>{type.savings_name || `Type ${type.TypeID}`}</h3>
                          </IonLabel>
                          <IonBadge color="success" slot="end">
                            {formatAmountDisplay(total)}
                          </IonBadge>
                          <IonButton
                            slot="end"
                            fill="clear"
                            onClick={() => openAddModalForType(type)}
                          >
                            <IonIcon icon={addCircleOutline} />
                          </IonButton>
                        </IonItem>
                      </IonCardContent>
                    </IonCard>
                  );
                })}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              Member Savings History <IonBadge color="primary">{rows.length}</IonBadge>
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {loading ? (
              <IonSpinner name="crescent" />
            ) : rows.length === 0 ? (
              <IonLabel color="medium">No member savings found</IonLabel>
            ) : (
              <IonList>
                {rows.map((r) => {
                  return (
                    <IonItem key={r.recID}>
                      <IonLabel>
                        <h3>{formatDateLong(r.date)}</h3>
                        <p>Amount: {formatAmountDisplay(r.amount)}</p>
                        <p>{savingsTypeNameById[String(r.sType || "")] || "-"}</p>
                      </IonLabel>
                      <div
                        slot="end"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "2px",
                          flexShrink: 0,
                        }}
                      >
                        <IonButton
                          fill="clear"
                          size="small"
                          title="View"
                          onClick={() => setViewRow(r)}
                          style={{ margin: 0 }}
                        >
                          <IonIcon icon={eyeOutline} />
                        </IonButton>
                        <IonButton
                          fill="clear"
                          size="small"
                          title="Edit"
                          onClick={() => handleEdit(r)}
                          style={{ margin: 0 }}
                        >
                          <IonIcon icon={createOutline} />
                        </IonButton>
                        <IonButton
                          fill="clear"
                          size="small"
                          color="danger"
                          title="Delete"
                          onClick={() => setDeleteTarget(r)}
                          style={{ margin: 0 }}
                        >
                          <IonIcon icon={trashOutline} />
                        </IonButton>
                      </div>
                    </IonItem>
                  );
                })}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        <IonModal isOpen={showAddModal} onDidDismiss={() => setShowAddModal(false)}>
          <IonHeader>
            <IonToolbar color="success">
              <IonTitle>
                {editingRecID ? "Edit Saving" : "Add Saving"} -{" "}
                {activeType?.savings_name || activeType?.TypeID || ""}
              </IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowAddModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">Amount</IonLabel>
              <IonInput
                type="text"
                inputMode="numeric"
                value={amount}
                onIonInput={(e) =>
                  setAmount(formatAmountInput(String(e.detail.value || "")))
                }
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Transaction Date</IonLabel>
              <IonInput
                type="date"
                value={savingDate}
                onIonInput={(e) => setSavingDate(String(e.detail.value || ""))}
              />
            </IonItem>
            <IonButton
              expand="block"
              color="success"
              onClick={handleSave}
              disabled={saving || !groupCode || !activeType}
              style={{ marginTop: 12 }}
            >
              {saving ? (
                <IonSpinner name="crescent" />
              ) : editingRecID ? (
                "Update Saving"
              ) : (
                "Save Saving"
              )}
            </IonButton>
          </IonContent>
        </IonModal>

        <IonModal isOpen={!!viewRow} onDidDismiss={() => setViewRow(null)}>
          <IonHeader>
            <IonToolbar color="success">
              <IonTitle>Member Saving Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setViewRow(null)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem lines="none">
              <IonLabel>
                <h3>Beneficiary Name</h3>
                <p>{memberName || "-"}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>
                <h3>ML Code</h3>
                <p>{memberMlCode || "-"}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>
                <h3>Transaction Date / Saving Type</h3>
                <p>
                  {formatDateLong(viewRow?.date)} /{" "}
                  {savingsTypeNameById[String(viewRow?.sType || "")] || "-"}
                </p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>
                <h3>Amount</h3>
                <p>{formatAmountDisplay(viewRow?.amount)}</p>
              </IonLabel>
            </IonItem>
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={!!deleteTarget}
          header="Delete Member Saving?"
          message={
            deleteTarget
              ? [
                  `Beneficiary Name: ${memberName || "-"}`,
                  `ML Code: ${memberMlCode || "-"}`,
                  `Transaction Date: ${formatDateLong(deleteTarget.date)}`,
                  `Type: ${
                    savingsTypeNameById[String(deleteTarget.sType || "")] || "-"
                  }`,
                  `Amount: ${formatAmountDisplay(deleteTarget.amount)}`,
                ].join("\n")
              : ""
          }
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () => setDeleteTarget(null),
            },
            {
              text: "Delete",
              role: "destructive",
              handler: () => {
                if (deleteTarget) {
                  void handleDelete(deleteTarget);
                }
              },
            },
          ]}
          onDidDismiss={() => setDeleteTarget(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default MemberSavings;

