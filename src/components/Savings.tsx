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
  IonSearchbar,
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
  ellipsisHorizontal,
  createOutline,
  eyeOutline,
  chevronForward,
  trashOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useSelectedGroup } from "../hooks/useSelectedGroup";
import { useSyncRefresh } from "../hooks/useSyncRefresh";
import { goBackFromGroupChild } from "../utils/groupNavigation";

import {
  Beneficiary,
  fetchBeneficiariesByGroupCode,
} from "../services/beneficiaries.service";

import { apiGet } from "../services/api";

import {
  createGroupSaving,
  deleteGroupSaving,
  fetchGroupSavingsByGroupID,
  MemberSaving,
  fetchSavingsTypes,
  getDefaultGroupSavingsTypes,
  updateGroupSaving,
  GroupSaving,
  SavingsType,
} from "../services/savings.service";

import "./Savings.css";

/* ---------------- CONSTANTS ---------------- */

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

/* ---------------- HELPERS ---------------- */

const formatAmountInput = (value: string | number) => {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
};

const parseAmount = (value: string | number) => {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  if (!digits) return 0;
  return Number(digits);
};

const formatAmountDisplay = (value: any) => {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "K 0";
  return `K ${num.toLocaleString("en-US")}`;
};

/* ---------------- COMPONENT ---------------- */

const Savings: React.FC = () => {
  const history = useHistory();
  const { selectedGroupID, selectedGroupName, refreshSelectedGroup } =
    useSelectedGroup();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [groupSavings, setGroupSavings] = useState<GroupSaving[]>([]);
  const [memberSavings, setMemberSavings] = useState<MemberSaving[]>([]);
  const [members, setMembers] = useState<Beneficiary[]>([]);
  const [savingsTypes, setSavingsTypes] = useState<SavingsType[]>(
    getDefaultGroupSavingsTypes(),
  );
  const [selectedGroupDistrictID, setSelectedGroupDistrictID] = useState("");

  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0"),
  );
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const [editingRecID, setEditingRecID] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<SavingsType | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewRow, setViewRow] = useState<GroupSaving | null>(null);
  const [historyActionRow, setHistoryActionRow] = useState<GroupSaving | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GroupSaving | null>(null);
  const [memberSearchText, setMemberSearchText] = useState("");

  /* ---------------- LOAD DATA ---------------- */

  const load = useCallback(async (groupIDOverride?: string) => {
    const activeGroupID = groupIDOverride ?? selectedGroupID;
    if (!activeGroupID) return;

    setLoading(true);

    try {
      const [
        sRowsResult,
        mRowsResult,
        tRowsResult,
        groupRowResult,
        memberSavingsRowsResult,
      ] = await Promise.allSettled([
        fetchGroupSavingsByGroupID(activeGroupID),
        fetchBeneficiariesByGroupCode(activeGroupID),
        fetchSavingsTypes(),
        apiGet<{ DistrictID?: string; districtID?: string }>(
          `/groups/${encodeURIComponent(activeGroupID)}`,
        ),
        apiGet<MemberSaving[]>("/member-savings"),
      ]);

      const sRows = sRowsResult.status === "fulfilled" ? sRowsResult.value : [];
      const mRows = mRowsResult.status === "fulfilled" ? mRowsResult.value : [];
      const tRows = tRowsResult.status === "fulfilled" ? tRowsResult.value : [];
      const group =
        groupRowResult.status === "fulfilled" && groupRowResult.value
          ? groupRowResult.value
          : {};
      const memberSavingsRows =
        memberSavingsRowsResult.status === "fulfilled"
          ? memberSavingsRowsResult.value
          : [];

      setSelectedGroupDistrictID(
        String(group?.DistrictID || group?.districtID || ""),
      );

      setGroupSavings(Array.isArray(sRows) ? sRows : []);
      setMembers(Array.isArray(mRows) ? mRows : []);
      const memberSavingsFiltered = (Array.isArray(memberSavingsRows) ? memberSavingsRows : []).filter(
        (row) => String(row.groupCode || "") === String(activeGroupID),
      );
      setMemberSavings(memberSavingsFiltered);

      setSavingsTypes(
        Array.isArray(tRows) && tRows.length
          ? tRows
          : getDefaultGroupSavingsTypes(),
      );

      const failures = [
        sRowsResult,
        mRowsResult,
        tRowsResult,
        groupRowResult,
        memberSavingsRowsResult,
      ].filter((result) => result.status === "rejected");

      if (failures.length > 0) {
        console.error("Savings partial load failure:", failures);
      }
    } catch (error) {
      console.error("Failed to load savings:", error);
      setGroupSavings([]);
      setMembers([]);
      setMemberSavings([]);
      setSavingsTypes(getDefaultGroupSavingsTypes());
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

  /* ---------------- TOTALS ---------------- */

  const totalGroupSavings = useMemo(
    () =>
      (groupSavings || []).reduce(
        (sum, row) => sum + Number(row?.Amount || 0),
        0,
      ),
    [groupSavings],
  );

  const savingsTypeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of savingsTypes) {
      map[String(t.TypeID)] = t.savings_name || String(t.TypeID);
    }
    return map;
  }, [savingsTypes]);

  const memberSavingsTotalsByCode = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const row of memberSavings) {
      const code = String(row.sppCode || "");
      if (!code) continue;
      totals[code] = (totals[code] || 0) + Number(row.amount || 0);
    }
    return totals;
  }, [memberSavings]);

  const membersWithSavings = useMemo(() => {
    const codesWithSavings = new Set(
      memberSavings.map((row) => String(row.sppCode || "")).filter(Boolean),
    );
    return members.filter((m) => codesWithSavings.has(String(m.sppCode || "")));
  }, [memberSavings, members]);

  const filteredMembersWithSavings = useMemo(() => {
    const query = memberSearchText.trim().toLowerCase();
    if (!query) return membersWithSavings;

    return membersWithSavings.filter((member) => {
      const memberCode = String(member.sppCode || "").toLowerCase();
      const memberName = String(member.hh_head_name || "").toLowerCase();
      const mlCode = String(member.hh_code || "").toLowerCase();
      return (
        memberCode.includes(query) ||
        memberName.includes(query) ||
        mlCode.includes(query)
      );
    });
  }, [memberSearchText, membersWithSavings]);

  const sortedGroupSavings = useMemo(() => {
    const toSortableDate = (row: GroupSaving) =>
      `${String(row?.Yr || "").padStart(4, "0")}-${String(row?.Month || "").padStart(2, "0")}`;

    return [...(groupSavings || [])].sort((a, b) =>
      toSortableDate(b).localeCompare(toSortableDate(a)),
    );
  }, [groupSavings]);

  const totalByType = useMemo(() => {
    const totals: Record<string, number> = {};

    (groupSavings || []).forEach((row) => {
      const key = String(row?.sType || "");
      totals[key] = (totals[key] || 0) + Number(row?.Amount || 0);
    });

    return totals;
  }, [groupSavings]);

  /* ---------------- FORM ---------------- */

  const resetForm = () => {
    setAmount("");
    setEditingRecID(null);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setActiveType(null);
    resetForm();
  };

  const openAddModalForType = (type: SavingsType) => {
    resetForm();
    setActiveType(type);
    setShowAddModal(true);
  };

  const openEditModalForSaving = (row: GroupSaving) => {
    const matchingType =
      savingsTypes.find((t) => String(t.TypeID) === String(row.sType)) ||
      ({ TypeID: String(row.sType || "02"), savings_name: "Group Savings" } as SavingsType);

    setEditingRecID(Number(row.RecID || 0) || null);
    setActiveType(matchingType);
    setAmount(formatAmountInput(row.Amount || 0));
    setMonth(String(row.Month || "").padStart(2, "0"));
    setYear(String(row.Yr || ""));
    setShowAddModal(true);
  };

  const formatMonthYearLabel = (row: Pick<GroupSaving, "Month" | "Yr">) => {
    const monthValue = String(row.Month || "").padStart(2, "0");
    const monthName = monthOptions.find((m) => m.value === monthValue)?.label || monthValue;
    return `${monthName} ${row.Yr || ""}`.trim();
  };

  const handleDeleteSaving = async (recID?: number) => {
    if (!recID) return;
    try {
      setSaving(true);
      await deleteGroupSaving(recID);
      await load();
    } catch (error) {
      console.error("Failed to delete saving record:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGroupSaving = async () => {
    if (!selectedGroupID || !activeType) return;

    const numericAmount = Number(parseAmount(amount));

    if (numericAmount <= 0) {
      alert("Enter valid amount");
      return;
    }

    try {
      setSaving(true);

      if (editingRecID) {
        await updateGroupSaving(editingRecID, {
          GroupID: selectedGroupID,
          DistrictID: selectedGroupDistrictID,
          Yr: year,
          Month: month,
          Amount: numericAmount,
          sType: activeType.TypeID,
        });
      } else {
        await createGroupSaving({
          GroupID: selectedGroupID,
          DistrictID: selectedGroupDistrictID,
          Yr: year,
          Month: month,
          Amount: numericAmount,
          sType: activeType.TypeID,
        });
      }

      closeAddModal();
      await load();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonButtons slot="start">
            <IonButton onClick={() => goBackFromGroupChild(history)} color="light">
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Group Savings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard className="savings-hero-card">
          <IonCardContent className="savings-hero-card__content">
            <div className="savings-hero-card__meta">
              <div className="savings-hero-card__text">
                <h2>
                  {selectedGroupName ||
                    localStorage.getItem("selectedGroupName") ||
                    "No group selected"}
                </h2>
                <p>{selectedGroupID || localStorage.getItem("selectedGroupID") || "-"}</p>
              </div>
              <IonBadge color="light" className="savings-hero-card__badge">
                {membersWithSavings.length} members
              </IonBadge>
            </div>
          </IonCardContent>
        </IonCard>

        <div className="savings-overview-grid">
          <IonCard className="savings-stat-card">
            <IonCardContent>
              <div className="savings-stat-card__row">
                <span className="savings-stat-card__label">Total Savings</span>
                <IonBadge color="success" className="savings-stat-card__badge">
                  {formatAmountDisplay(totalGroupSavings)}
                </IonBadge>
              </div>
            </IonCardContent>
          </IonCard>

          <IonCard className="savings-stat-card">
            <IonCardContent>
              <div className="savings-stat-card__row">
                <span className="savings-stat-card__label">Savings Records</span>
                <IonBadge color="success" className="savings-stat-card__badge">
                  {sortedGroupSavings.length.toLocaleString()}
                </IonBadge>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <IonCard className="savings-section-card">
          <IonCardHeader>
            <IonCardTitle>Savings Accounts</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {loading ? (
              <IonSpinner name="crescent" />
            ) : (
              <IonList className="group-savings-types-list">
                {savingsTypes.map((type) => (
                  <IonCard
                    key={type.TypeID}
                    className="group-savings-type-card"
                    onClick={() => openAddModalForType(type)}
                  >
                    <IonCardContent
                      className="group-savings-type-card__content"
                    >
                      <div className="group-savings-type-card__copy">
                        <IonLabel>
                          <h3>{type.savings_name}</h3>
                          <p>Add or update savings for this account</p>
                        </IonLabel>
                      </div>
                      <div className="group-savings-type-card__actions">
                        <IonBadge color="success" className="group-savings-type-card__badge">
                          {formatAmountDisplay(totalByType[type.TypeID] || 0)}
                        </IonBadge>
                        <IonButton
                          fill="clear"
                          className="group-savings-type-card__button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openAddModalForType(type);
                          }}
                        >
                          <IonIcon icon={addCircleOutline} />
                        </IonButton>
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        <IonModal
          isOpen={showAddModal}
          onDidDismiss={closeAddModal}
          keepContentsMounted={false}
        >
          <IonHeader>
            <IonToolbar color="success">
              <IonTitle>{editingRecID ? "Edit Saving" : "Add Saving"}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={closeAddModal}>
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding app-record-modal-content">
            <div className="app-record-modal-stack">
              <IonCard className="app-record-modal-hero">
                <IonCardContent>
                  <IonLabel>
                    <h2>{activeType?.savings_name || "Group Saving"}</h2>
                    <p>{selectedGroupName || selectedGroupID || "-"}</p>
                  </IonLabel>
                </IonCardContent>
              </IonCard>

              <IonItem className="app-record-modal-item">
                <IonLabel position="stacked">Amount</IonLabel>
                <IonInput
                  value={amount}
                  inputMode="numeric"
                  placeholder="Enter amount"
                  onIonInput={(e) =>
                    setAmount(formatAmountInput(String(e.detail?.value ?? "")))
                  }
                />
              </IonItem>

              <IonItem className="app-record-modal-item">
                <IonLabel position="stacked">Month</IonLabel>
                <IonSelect
                  value={month}
                  placeholder="Select month"
                  onIonChange={(e) => setMonth(String(e.detail?.value ?? ""))}
                >
                  {monthOptions.map((m) => (
                    <IonSelectOption key={m.value} value={m.value}>
                      {m.label}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem className="app-record-modal-item">
                <IonLabel position="stacked">Year</IonLabel>
                <IonSelect
                  value={year}
                  placeholder="Select year"
                  onIonChange={(e) => setYear(String(e.detail?.value ?? ""))}
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
                disabled={saving}
                className="app-record-modal-save"
              >
                {saving ? <IonSpinner name="crescent" /> : "Save"}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        <IonCard className="savings-section-card">
          <IonCardHeader>
            <IonCardTitle>Group Savings History</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {sortedGroupSavings.length === 0 ? (
              <IonLabel color="medium">No group savings recorded yet.</IonLabel>
            ) : (
              <IonList className="savings-history-list">
                {sortedGroupSavings.map((row) => (
                  <IonCard
                    key={row.RecID || `${row.GroupID}-${row.Month}-${row.Yr}-${row.sType}`}
                    className="savings-history-card"
                  >
                    <IonCardContent className="savings-history-card__content">
                      <div className="savings-history-card__copy">
                        <h3>{savingsTypeNameById[String(row.sType || "")] || "Group Saving"}</h3>
                        <p>{formatMonthYearLabel(row)}</p>
                        <strong>{formatAmountDisplay(row.Amount)}</strong>
                      </div>
                      <IonButton
                        fill="clear"
                        className="savings-history-card__menu"
                        title="More actions"
                        onClick={() => setHistoryActionRow(row)}
                      >
                        <IonIcon icon={ellipsisHorizontal} />
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        <IonModal isOpen={!!viewRow} onDidDismiss={() => setViewRow(null)}>
          <IonHeader>
            <IonToolbar color="success">
              <IonTitle>Group Saving Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setViewRow(null)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding app-record-modal-content">
            <div className="app-record-modal-stack">
              <IonCard className="app-record-modal-hero">
                <IonCardContent>
                  <IonLabel>
                    <h2>
                      {savingsTypeNameById[String(viewRow?.sType || "")] ||
                        viewRow?.sType ||
                        "Group Saving"}
                    </h2>
                    <p>{selectedGroupName || selectedGroupID || "-"}</p>
                  </IonLabel>
                </IonCardContent>
              </IonCard>
              <IonItem lines="none" className="app-record-modal-item">
                <IonLabel>
                  <h3>Group</h3>
                  <p>{selectedGroupName || selectedGroupID || "-"}</p>
                </IonLabel>
              </IonItem>
              <IonItem lines="none" className="app-record-modal-item">
                <IonLabel>
                  <h3>Saving Type</h3>
                  <p>
                    {savingsTypeNameById[String(viewRow?.sType || "")] ||
                      viewRow?.sType ||
                      "-"}
                  </p>
                </IonLabel>
              </IonItem>
              <IonItem lines="none" className="app-record-modal-item">
                <IonLabel>
                  <h3>Month & Year</h3>
                  <p>{viewRow ? formatMonthYearLabel(viewRow) : "-"}</p>
                </IonLabel>
              </IonItem>
              <IonItem lines="none" className="app-record-modal-item">
                <IonLabel>
                  <h3>Amount</h3>
                  <p>{formatAmountDisplay(viewRow?.Amount)}</p>
                </IonLabel>
              </IonItem>
            </div>
          </IonContent>
        </IonModal>

        <IonActionSheet
          isOpen={!!historyActionRow}
          header={
            historyActionRow
              ? savingsTypeNameById[String(historyActionRow.sType || "")] || "Group Saving"
              : "Group Saving"
          }
          subHeader={historyActionRow ? formatMonthYearLabel(historyActionRow) : undefined}
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
                if (historyActionRow) openEditModalForSaving(historyActionRow);
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
          header="Delete Group Saving?"
          message={
            deleteTarget
              ? [
                  `Saving Type: ${
                    savingsTypeNameById[String(deleteTarget.sType || "")] ||
                    "Group Saving"
                  }`,
                  `Period: ${formatMonthYearLabel(deleteTarget)}`,
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
                  void handleDeleteSaving(deleteTarget.RecID);
                  setDeleteTarget(null);
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
