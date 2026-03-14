import { apiGet, apiPatch, apiPost } from "./api";

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
    return await apiPost("/group-savings", payload);
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
    return await apiPatch(
      `/group-savings/${encodeURIComponent(String(recID))}`,
      payload,
    );
  } catch (error) {
    console.error("updateGroupSaving error:", error);
    throw error;
  }
};

export const deleteGroupSaving = async (recID: number) => {
  try {
    return await apiPatch(
      `/group-savings/${encodeURIComponent(String(recID))}/delete`,
      {},
    );
  } catch (error) {
    console.error("deleteGroupSaving error:", error);
    throw error;
  }
};

/* ---------------- SAVINGS TYPES ---------------- */

export const fetchSavingsTypes = async (): Promise<SavingsType[]> => {
  try {
    const rows = await apiGet<SavingsType[]>("/savings-types");
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.error("fetchSavingsTypes error:", error);
    return [];
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

    return safeRows.filter(
      (r) =>
        String(r.groupCode || "") === String(groupCode) &&
        String(r.sppCode || "") === String(sppCode),
    );
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
    return await apiPost("/member-savings", payload);
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
    return await apiPatch(
      `/member-savings/${encodeURIComponent(String(recID))}`,
      payload,
    );
  } catch (error) {
    console.error("updateMemberSaving error:", error);
    throw error;
  }
};

export const deleteMemberSaving = async (recID: number) => {
  try {
    return await apiPatch(
      `/member-savings/${encodeURIComponent(String(recID))}/delete`,
      {},
    );
  } catch (error) {
    console.error("deleteMemberSaving error:", error);
    throw error;
  }
};
