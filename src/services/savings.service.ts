import { apiGet, apiPatch, apiPost, updateCachedCollection } from "./api";
import { toLocalDateOnly } from "../utils/date";

export type GroupSaving = {
  RecID?: number;
  GroupID?: string;
  DistrictID?: string;
  Yr?: string;
  Month?: string;
  Amount?: number;
  sType?: string;
};

export type MemberSaving = {
  recID?: number;
  sppCode?: string;
  groupCode?: string;
  amount?: number;
  date?: string;
  sType?: string;
};

export type SavingsType = {
  TypeID: string;
  savings_name?: string;
  description?: string;
};

const DEFAULT_GROUP_SAVINGS_TYPE: SavingsType = {
  TypeID: "02",
  savings_name: "Group Savings",
};

const mergeUniqueSavingsTypes = (types: SavingsType[]) => {
  const seen = new Set<string>();
  const merged: SavingsType[] = [];

  for (const type of types) {
    const key = String(type?.TypeID || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push({
      TypeID: key,
      savings_name: String(type?.savings_name || key),
      description: type?.description,
    });
  }

  return merged;
};

export const getDefaultGroupSavingsTypes = (): SavingsType[] => [
  DEFAULT_GROUP_SAVINGS_TYPE,
];

export const getDefaultMemberSavingsTypes = (): SavingsType[] => [];

const prependCachedItem = <T>(items: T[], item: T) => [item, ...items];

const updateCachedItem = <T extends Record<string, any>>(
  items: T[],
  idField: keyof T,
  idValue: string | number,
  patch: Partial<T>,
) =>
  items.map((item) =>
    String(item[idField] ?? "") === String(idValue)
      ? { ...item, ...patch }
      : item,
  );

const removeCachedItem = <T extends Record<string, any>>(
  items: T[],
  idField: keyof T,
  idValue: string | number,
) => items.filter((item) => String(item[idField] ?? "") !== String(idValue));

/* ---------------- GROUP SAVINGS ---------------- */

export const fetchGroupSavingsByGroupID = async (
  groupID: string,
): Promise<GroupSaving[]> => {
  try {
    if (!groupID) return [];

    const rows = await apiGet<GroupSaving[]>("/group-savings");

    const safeRows = Array.isArray(rows) ? rows : [];

    return safeRows.filter((r) => String(r.GroupID || "") === String(groupID));
  } catch (error) {
    console.error("fetchGroupSavingsByGroupID error:", error);
    return [];
  }
};

export const createGroupSaving = async (payload: {
  GroupID: string;
  DistrictID?: string;
  Yr: string;
  Month: string;
  Amount: number;
  sType: string;
}) => {
  try {
    const created = await apiPost<GroupSaving & { id?: number }>("/group-savings", payload);
    await updateCachedCollection<GroupSaving>("/group-savings", (items) =>
      prependCachedItem(items, {
        ...payload,
        RecID: created?.RecID ?? created?.id ?? undefined,
      }),
    );
    return created;
  } catch (error) {
    console.error("createGroupSaving error:", error);
    throw error;
  }
};

export const updateGroupSaving = async (
  recID: number,
  payload: Partial<{
    GroupID: string;
    DistrictID: string;
    Yr: string;
    Month: string;
    Amount: number;
    sType: string;
  }>,
) => {
  try {
    const result = await apiPatch(
      `/group-savings/${encodeURIComponent(String(recID))}`,
      payload,
    );
    await updateCachedCollection<GroupSaving>("/group-savings", (items) =>
      updateCachedItem(items, "RecID", recID, payload),
    );
    return result;
  } catch (error) {
    console.error("updateGroupSaving error:", error);
    throw error;
  }
};

export const deleteGroupSaving = async (recID: number) => {
  try {
    const result = await apiPatch(
      `/group-savings/${encodeURIComponent(String(recID))}/delete`,
      {},
    );
    await updateCachedCollection<GroupSaving>("/group-savings", (items) =>
      removeCachedItem(items, "RecID", recID),
    );
    return result;
  } catch (error) {
    console.error("deleteGroupSaving error:", error);
    throw error;
  }
};

/* ---------------- SAVINGS TYPES ---------------- */

export const fetchSavingsTypes = async (): Promise<SavingsType[]> => {
  try {
    const rows = await apiGet<SavingsType[]>("/savings-types");
    const safeRows = Array.isArray(rows) ? rows : [];
    return mergeUniqueSavingsTypes([
      ...safeRows,
      DEFAULT_GROUP_SAVINGS_TYPE,
    ]);
  } catch (error) {
    console.error("fetchSavingsTypes error:", error);
    return mergeUniqueSavingsTypes([
      DEFAULT_GROUP_SAVINGS_TYPE,
    ]);
  }
};

/* ---------------- MEMBER SAVINGS ---------------- */

export const fetchMemberSavings = async (
  groupCode: string,
  sppCode: string,
): Promise<MemberSaving[]> => {
  try {
    if (!groupCode || !sppCode) return [];

    const rows = await apiGet<MemberSaving[]>("/member-savings");

    const safeRows = Array.isArray(rows) ? rows : [];

    return safeRows
      .filter(
        (r) =>
          String(r.groupCode || "") === String(groupCode) &&
          String(r.sppCode || "") === String(sppCode),
      )
      .map((row) => ({
        ...row,
        date: toLocalDateOnly(row.date),
      }));
  } catch (error) {
    console.error("fetchMemberSavings error:", error);
    return [];
  }
};

export const createMemberSaving = async (payload: {
  sppCode: string;
  groupCode: string;
  amount: number;
  date: string;
  sType: string;
}) => {
  try {
    const created = await apiPost<MemberSaving & { id?: number }>("/member-savings", payload);
    await updateCachedCollection<MemberSaving>("/member-savings", (items) =>
      prependCachedItem(items, {
        ...payload,
        recID: created?.recID ?? created?.id ?? undefined,
      }),
    );
    return created;
  } catch (error) {
    console.error("createMemberSaving error:", error);
    throw error;
  }
};

export const updateMemberSaving = async (
  recID: number,
  payload: Partial<{
    sppCode: string;
    groupCode: string;
    amount: number;
    date: string;
    sType: string;
  }>,
) => {
  try {
    const result = await apiPatch(
      `/member-savings/${encodeURIComponent(String(recID))}`,
      payload,
    );
    await updateCachedCollection<MemberSaving>("/member-savings", (items) =>
      updateCachedItem(items, "recID", recID, payload),
    );
    return result;
  } catch (error) {
    console.error("updateMemberSaving error:", error);
    throw error;
  }
};

export const deleteMemberSaving = async (recID: number) => {
  try {
    const result = await apiPatch(
      `/member-savings/${encodeURIComponent(String(recID))}/delete`,
      {},
    );
    await updateCachedCollection<MemberSaving>("/member-savings", (items) =>
      removeCachedItem(items, "recID", recID),
    );
    return result;
  } catch (error) {
    console.error("deleteMemberSaving error:", error);
    throw error;
  }
};
