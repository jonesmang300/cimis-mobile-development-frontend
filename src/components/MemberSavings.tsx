import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  IonActionSheet,
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
  ellipsisHorizontal,
  createOutline,
  eyeOutline,
  trashOutline,
} from "ionicons/icons";
import { useHistory, useParams } from "react-router-dom";
import { useSelectedGroup } from "../hooks/useSelectedGroup";
import { useSyncRefresh } from "../hooks/useSyncRefresh";
import MobileDateInput from "./form/MobileDateInput";
import {
  formatDateLongLocal,
  getTodayLocalDateOnly,
  toLocalDateOnly,
} from "../utils/date";
import { fetchBeneficiariesByGroupCode } from "../services/beneficiaries.service";
import {
  createMemberSaving,
  deleteMemberSaving,
  fetchMemberSavings,
  fetchSavingsTypes,
  getDefaultMemberSavingsTypes,
  MemberSaving,
  SavingsType,
  updateMemberSaving,
} from "../services/savings.service";
import "./MemberSavings.css";

type Params = {
  sppCode: string;
};

type MemberSavingsProps = {
  embedded?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  sppCodeOverride?: string;
};

type BeneficiarySummary = {
  sppCode?: string;
  hh_head_name?: string;
  hh_code?: string | null;
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

const MemberSavings: React.FC<MemberSavingsProps> = ({
  embedded = false,
  isOpen = true,
  onClose,
  sppCodeOverride,
}) => {
  const history = useHistory();
  const { sppCode: sppCodeParam } = useParams<Params>();
  const sppCode = safeDecodeURIComponent(sppCodeOverride ?? sppCodeParam ?? "");
  const {
    selectedGroupID: groupCode,
    selectedGroupName: groupName,
    refreshSelectedGroup,
  } = useSelectedGroup();

  const [rows, setRows] = useState<MemberSaving[]>([]);
  const [savingsTypes, setSavingsTypes] = useState<SavingsType[]>(
    getDefaultMemberSavingsTypes(),
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [memberName, setMemberName] = useState<string>("");
  const [memberMlCode, setMemberMlCode] = useState<string>("");
  const [savingDate, setSavingDate] = useState<string>(getTodayLocalDateOnly());

  const [amount, setAmount] = useState<string>("");
  const [editingRecID, setEditingRecID] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<SavingsType | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewRow, setViewRow] = useState<MemberSaving | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MemberSaving | null>(null);
  const [historyActionRow, setHistoryActionRow] = useState<MemberSaving | null>(null);

  const load = useCallback(async (groupCodeOverride?: string) => {
    const activeGroupCode = groupCodeOverride ?? groupCode;

    if (!activeGroupCode || !sppCode) {
      setRows([]);
      setSavingsTypes([]);
      return;
    }

    setLoading(true);
    try {
      const [memberRowsResult, typeRowsResult, beneficiaryResult] =
        await Promise.allSettled([
          fetchMemberSavings(activeGroupCode, sppCode),
          fetchSavingsTypes(),
          fetchBeneficiariesByGroupCode(activeGroupCode),
        ]);

      const memberRows =
        memberRowsResult.status === "fulfilled" ? memberRowsResult.value : [];
      const typeRows =
        typeRowsResult.status === "fulfilled" ? typeRowsResult.value : [];
      const beneficiaryRows =
        beneficiaryResult.status === "fulfilled" ? beneficiaryResult.value : [];
      const beneficiary: BeneficiarySummary = Array.isArray(beneficiaryRows)
        ? beneficiaryRows.find(
            (row) => String(row.sppCode || "").trim() === String(sppCode || "").trim(),
          ) || {}
        : {};

      setRows(memberRows);
      setSavingsTypes(
        typeRows.length > 0
          ? typeRows
          : getDefaultMemberSavingsTypes(),
      );
      setMemberName(String(beneficiary?.hh_head_name || ""));
      setMemberMlCode(String(beneficiary?.hh_code || ""));
    } catch (error) {
      console.error("Failed to load member savings:", error);
      setRows([]);
      setSavingsTypes(getDefaultMemberSavingsTypes());
      setMemberName("");
      setMemberMlCode("");
    } finally {
      setLoading(false);
    }
  }, [groupCode, sppCode]);

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
    setSavingDate(getTodayLocalDateOnly());
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
    setSavingDate(toLocalDateOnly(row.date) || getTodayLocalDateOnly());
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

  const handleClose = onClose ?? (() => history.goBack());

  const content = (
      <IonContent className="ion-padding">
        <IonCard className="member-savings-hero-card">
          <IonCardContent className="member-savings-hero-card__content">
            <IonLabel>
              <h2>{memberName || "Beneficiary"}</h2>
              <p>ML Code: {memberMlCode || "-"}</p>
              <p>Group: {groupName || groupCode || "-"}</p>
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
                      <IonCardContent className="member-savings-type-card__content">
                        <div className="member-savings-type-card__copy">
                          <IonLabel>
                            <h3>{type.savings_name || `Type ${type.TypeID}`}</h3>
                            <p>Add a member saving record</p>
                          </IonLabel>
                        </div>
                        <div className="member-savings-type-card__actions">
                          <IonBadge color="success" className="member-savings-type-card__badge">
                            {formatAmountDisplay(total)}
                          </IonBadge>
                          <IonButton
                            fill="clear"
                            className="member-savings-type-card__button"
                            onClick={() => openAddModalForType(type)}
                            aria-label={`Add ${type.savings_name || `type ${type.TypeID}`} saving`}
                          >
                            <IonIcon icon={addCircleOutline} slot="icon-only" />
                          </IonButton>
                        </div>
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
              <IonList className="member-savings-history-list">
                {rows.map((r) => {
                  return (
                    <IonCard key={r.recID} className="member-savings-history-card">
                      <IonCardContent className="member-savings-history-card__content">
                        <div className="member-savings-history-card__copy">
                          <h3>{formatDateLongLocal(r.date)}</h3>
                          <p>Amount: {formatAmountDisplay(r.amount)}</p>
                          <p>{savingsTypeNameById[String(r.sType || "")] || "-"}</p>
                        </div>
                        <IonButton
                          fill="clear"
                          className="member-savings-history-card__menu"
                          title="More actions"
                          onClick={() => setHistoryActionRow(r)}
                          aria-label="More actions"
                        >
                          <IonIcon icon={ellipsisHorizontal} slot="icon-only" />
                        </IonButton>
                      </IonCardContent>
                    </IonCard>
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
          <IonContent className="ion-padding member-savings-modal-content">
            <IonCard className="member-savings-modal-hero">
              <IonCardContent>
                <h2>{memberName || "Beneficiary"}</h2>
                <p>{activeType?.savings_name || activeType?.TypeID || "-"}</p>
              </IonCardContent>
            </IonCard>
            <IonItem className="member-savings-form-item">
              <IonLabel position="stacked">Amount</IonLabel>
              <IonInput
                type="text"
                inputMode="numeric"
                placeholder="Enter amount"
                value={amount}
                onIonInput={(e) =>
                  setAmount(formatAmountInput(String(e.detail.value || "")))
                }
              />
            </IonItem>
            <IonItem className="member-savings-form-item">
              <IonLabel position="stacked">Transaction Date</IonLabel>
              <MobileDateInput
                value={savingDate}
                placeholder="Select transaction date"
                onIonInput={(e) => setSavingDate(String(e.detail.value || ""))}
              />
            </IonItem>
            <IonButton
              expand="block"
              color="success"
              onClick={handleSave}
              disabled={saving || !groupCode || !activeType}
              className="member-savings-save-button"
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
          <IonContent className="ion-padding member-savings-modal-content">
            <IonCard className="member-savings-modal-hero">
              <IonCardContent>
                <h2>{memberName || "-"}</h2>
                <p>{memberMlCode ? `ML Code: ${memberMlCode}` : "Member Saving Details"}</p>
              </IonCardContent>
            </IonCard>
            <IonItem lines="none" className="member-savings-detail-item">
              <IonLabel>
                <h3>Beneficiary Name</h3>
                <p>{memberName || "-"}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none" className="member-savings-detail-item">
              <IonLabel>
                <h3>ML Code</h3>
                <p>{memberMlCode || "-"}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none" className="member-savings-detail-item">
              <IonLabel>
                <h3>Transaction Date / Saving Type</h3>
                <p>
                  {formatDateLongLocal(viewRow?.date)} /{" "}
                  {savingsTypeNameById[String(viewRow?.sType || "")] || "-"}
                </p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none" className="member-savings-detail-item">
              <IonLabel>
                <h3>Amount</h3>
                <p>{formatAmountDisplay(viewRow?.amount)}</p>
              </IonLabel>
            </IonItem>
          </IonContent>
        </IonModal>

        <IonActionSheet
          isOpen={!!historyActionRow}
          header={historyActionRow ? formatDateLongLocal(historyActionRow.date) : "Member Saving"}
          subHeader={
            historyActionRow
              ? savingsTypeNameById[String(historyActionRow.sType || "")] || "-"
              : undefined
          }
          onDidDismiss={() => setHistoryActionRow(null)}
          buttons={[
            {
              text: "View Details",
              icon: eyeOutline,
              handler: () => {
                if (historyActionRow) setViewRow(historyActionRow);
              },
            },
            {
              text: "Edit Saving",
              icon: createOutline,
              handler: () => {
                if (historyActionRow) handleEdit(historyActionRow);
              },
            },
            {
              text: "Delete Saving",
              role: "destructive",
              icon: trashOutline,
              handler: () => {
                if (historyActionRow) setDeleteTarget(historyActionRow);
              },
            },
            {
              text: "Cancel",
              role: "cancel",
            },
          ]}
        />

        <IonAlert
          isOpen={!!deleteTarget}
          header="Delete Member Saving?"
          message={
            deleteTarget
              ? [
                  `Beneficiary Name: ${memberName || "-"}`,
                  `ML Code: ${memberMlCode || "-"}`,
                  `Transaction Date: ${formatDateLongLocal(deleteTarget.date)}`,
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
  );

  if (embedded) {
    return (
      <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
        <IonHeader>
          <IonToolbar color="success">
            <IonButtons slot="start">
              <IonButton onClick={handleClose} color="light">
                <IonIcon icon={arrowBack} />
              </IonButton>
            </IonButtons>
            <IonTitle style={{ color: "white" }}>Member Savings</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleClose}>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        {content}
      </IonModal>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonButtons slot="start">
            <IonButton onClick={handleClose} color="light">
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle style={{ color: "white" }}>Member Savings</IonTitle>
        </IonToolbar>
      </IonHeader>
      {content}
    </IonPage>
  );
};

export default MemberSavings;

