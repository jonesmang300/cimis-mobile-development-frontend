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
  eyeOutline,
  trashOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import {
  Beneficiary,
  fetchBeneficiariesByGroupCode,
} from "../services/beneficiaries.service";
import { apiGet } from "../services/api";
import {
  createGroupSaving,
  deleteGroupSaving,
  fetchGroupSavingsByGroupID,
  fetchSavingsTypes,
  GroupSaving,
  SavingsType,
  updateGroupSaving,
} from "../services/savings.service";

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

const getMonthName = (monthValue: string | number | null | undefined) => {
  const value = String(monthValue || "").padStart(2, "0");
  const found = monthOptions.find((m) => m.value === value);
  return found?.label || "-";
};

const Savings: React.FC = () => {
  const history = useHistory();
  const selectedGroupID = localStorage.getItem("selectedGroupID") || "";
  const selectedGroupName = localStorage.getItem("selectedGroupName") || "";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [groupSavings, setGroupSavings] = useState<GroupSaving[]>([]);
  const [members, setMembers] = useState<Beneficiary[]>([]);
  const [savingsTypes, setSavingsTypes] = useState<SavingsType[]>([]);
  const [selectedGroupDistrictID, setSelectedGroupDistrictID] =
    useState<string>("");

  const [amount, setAmount] = useState<string>("");
  const [month, setMonth] = useState<string>(
    String(new Date().getMonth() + 1).padStart(2, "0"),
  );
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));

  const [editingRecID, setEditingRecID] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<SavingsType | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewRow, setViewRow] = useState<GroupSaving | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GroupSaving | null>(null);

  const load = useCallback(async () => {
    if (!selectedGroupID) {
      setGroupSavings([]);
      setMembers([]);
      setSavingsTypes([]);
      return;
    }

    setLoading(true);
    try {
      const [sRows, mRows, tRows] = await Promise.all([
        fetchGroupSavingsByGroupID(selectedGroupID),
        fetchBeneficiariesByGroupCode(selectedGroupID),
        fetchSavingsTypes(),
      ]);

      try {
        const groupRow = await apiGet<{
          DistrictID?: string;
          districtID?: string;
        }>(`/groups/${encodeURIComponent(selectedGroupID)}`);
        setSelectedGroupDistrictID(
          String(groupRow?.DistrictID || groupRow?.districtID || ""),
        );
      } catch {
        setSelectedGroupDistrictID("");
      }

      setGroupSavings(sRows);
      setMembers(mRows);
      setSavingsTypes(
        tRows.length > 0
          ? tRows
          : [{ TypeID: "02", savings_name: "Group Savings" }],
      );
    } catch (error) {
      console.error("Failed to load savings data:", error);
      setGroupSavings([]);
      setMembers([]);
      setSavingsTypes([]);
    } finally {
      setLoading(false);
    }
  }, [selectedGroupID]);

  useIonViewWillEnter(() => {
    load();
  });

  const totalByType = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const row of groupSavings) {
      const typeKey = String(row.sType || "");
      const amountValue = Number(row.Amount || 0);
      totals[typeKey] = (totals[typeKey] || 0) + amountValue;
    }
    return totals;
  }, [groupSavings]);

  const totalGroupSavings = useMemo(
    () => groupSavings.reduce((sum, row) => sum + Number(row.Amount || 0), 0),
    [groupSavings],
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
    setMonth(String(new Date().getMonth() + 1).padStart(2, "0"));
    setYear(String(new Date().getFullYear()));
    setEditingRecID(null);
  };

  const openAddModalForType = (type: SavingsType) => {
    resetForm();
    setActiveType(type);
    setShowAddModal(true);
  };

  const handleSaveGroupSaving = async () => {
    if (!selectedGroupID) return;
    if (!activeType?.TypeID) return;
    const numericAmount = parseAmount(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      window.alert("Please enter a valid amount greater than 0.");
      return;
    }

    try {
      setSaving(true);
      if (editingRecID) {
        await updateGroupSaving(editingRecID, {
          GroupID: selectedGroupID,
          DistrictID: selectedGroupDistrictID || undefined,
          Yr: year,
          Month: month,
          Amount: numericAmount,
          sType: activeType.TypeID,
        });
      } else {
        await createGroupSaving({
          GroupID: selectedGroupID,
          DistrictID: selectedGroupDistrictID || undefined,
          Yr: year,
          Month: month,
          Amount: numericAmount,
          sType: activeType.TypeID,
        });
      }

      setShowAddModal(false);
      resetForm();
      await load();
    } catch (error) {
      console.error("Failed to save group saving:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save group saving. Please try again.";
      window.alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row: GroupSaving) => {
    if (!row?.RecID) return;
    setEditingRecID(row.RecID);
    setAmount(formatAmountInput(String(row.Amount || "")));
    setMonth(String(row.Month || ""));
    setYear(String(row.Yr || ""));

    const selected = savingsTypes.find((t) => String(t.TypeID) === String(row.sType));
    setActiveType(selected || { TypeID: String(row.sType || ""), savings_name: String(row.sType || "") });
    setShowAddModal(true);
  };

  const handleDelete = async (row: GroupSaving) => {
    if (!row?.RecID) return;

    try {
      await deleteGroupSaving(row.RecID);
      if (editingRecID === row.RecID) {
        setShowAddModal(false);
        resetForm();
      }
      await load();
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete group saving:", error);
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
          <IonTitle style={{ color: "white" }}>Group Savings</IonTitle>
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

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Total Group Savings</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonBadge color="success">{formatAmountDisplay(totalGroupSavings)}</IonBadge>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Savings Types</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {loading ? (
              <IonSpinner name="crescent" />
            ) : savingsTypes.length === 0 ? (
              <IonLabel color="medium">No savings types found</IonLabel>
            ) : (
              <IonList>
                {savingsTypes.map((type) => {
                  const total = totalByType[String(type.TypeID)] || 0;
                  return (
                    <IonCard key={type.TypeID}>
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
              Group Savings History{" "}
              <IonBadge color="success">{groupSavings.length}</IonBadge>
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {loading ? (
              <IonSpinner name="crescent" />
            ) : groupSavings.length === 0 ? (
              <IonLabel color="medium">No group savings found</IonLabel>
            ) : (
              <IonList>
                {groupSavings.map((row) => (
                  <IonItem key={row.RecID}>
                    <IonLabel>
                      <h3>
                        {row.Yr}/{getMonthName(row.Month)}
                      </h3>
                      <p>Amount: {formatAmountDisplay(row.Amount)}</p>
                      <p>{savingsTypeNameById[String(row.sType || "")] || "-"}</p>
                    </IonLabel>
                    <IonButton
                      slot="end"
                      fill="clear"
                      size="small"
                      title="View"
                      onClick={() => setViewRow(row)}
                    >
                      <IonIcon icon={eyeOutline} />
                    </IonButton>
                    <IonButton
                      slot="end"
                      fill="clear"
                      size="small"
                      title="Edit"
                      onClick={() => handleEdit(row)}
                    >
                      <IonIcon icon={createOutline} />
                    </IonButton>
                    <IonButton
                      slot="end"
                      fill="clear"
                      size="small"
                      color="danger"
                      title="Delete"
                      onClick={() => setDeleteTarget(row)}
                    >
                      <IonIcon icon={trashOutline} />
                    </IonButton>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              Members <IonBadge color="primary">{members.length}</IonBadge>
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {members.length === 0 ? (
              <IonLabel color="medium">No group members found</IonLabel>
            ) : (
              <IonList>
                {members.map((m) => (
                  <IonItem
                    key={m.sppCode}
                    button
                    detail
                    onClick={() =>
                      history.push(
                        `/groups/savings/member/${encodeURIComponent(
                          m.sppCode || "",
                        )}`,
                      )
                    }
                  >
                    <IonLabel>
                      <h3>{m.hh_head_name || m.sppCode}</h3>
                      <p>{m.sppCode}</p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        <IonModal
          isOpen={showAddModal}
          onDidDismiss={() => setShowAddModal(false)}
        >
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
              <IonLabel position="stacked">Month</IonLabel>
              <IonSelect
                value={month}
                onIonChange={(e) => setMonth(String(e.detail.value || ""))}
              >
                {monthOptions.map((m) => (
                  <IonSelectOption key={m.value} value={m.value}>
                    {m.label}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Year</IonLabel>
              <IonSelect
                value={year}
                onIonChange={(e) => setYear(String(e.detail.value || ""))}
              >
                {yearOptions.map((y) => (
                  <IonSelectOption key={y} value={y}>
                    {y}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonButton
              expand="block"
              color="success"
              onClick={handleSaveGroupSaving}
              disabled={saving || !selectedGroupID || !activeType}
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

        <IonModal
          isOpen={!!viewRow}
          onDidDismiss={() => setViewRow(null)}
        >
          <IonHeader>
            <IonToolbar color="success">
              <IonTitle>Group Saving Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setViewRow(null)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem lines="none">
              <IonLabel>
                <h3>Group Name</h3>
                <p>{selectedGroupName || "-"}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>
                <h3>Year / Month / Saving Type</h3>
                <p>
                  {viewRow?.Yr || "-"} / {getMonthName(viewRow?.Month)} /{" "}
                  {savingsTypeNameById[String(viewRow?.sType || "")] || "-"}
                </p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>
                <h3>Amount</h3>
                <p>{formatAmountDisplay(viewRow?.Amount)}</p>
              </IonLabel>
            </IonItem>
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={!!deleteTarget}
          header="Delete Group Saving?"
          message={
            deleteTarget
              ? [
                  `Group: ${selectedGroupName || "-"}`,
                  `Period: ${deleteTarget.Yr || "-"} / ${getMonthName(
                    deleteTarget.Month,
                  )}`,
                  `Type: ${
                    savingsTypeNameById[String(deleteTarget.sType || "")] || "-"
                  }`,
                  `Amount: ${formatAmountDisplay(deleteTarget.Amount)}`,
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

export default Savings;

