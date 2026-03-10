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

export const fetchGroupSavingsByGroupID = async (
  groupID: string,
): Promise<GroupSaving[]> => {
  if (!groupID) return [];
  const rows = await apiGet<GroupSaving[]>("/group-savings");
  return (Array.isArray(rows) ? rows : []).filter(
    (r) => String(r.GroupID || "") === String(groupID),
  );
};

export const createGroupSaving = async (payload: {
  GroupID: string;
  DistrictID?: string;
  Yr: string;
  Month: string;
  Amount: number;
  sType: string;
}) => {
  return apiPost("/group-savings", payload);
};

export const fetchSavingsTypes = async (): Promise<SavingsType[]> => {
  const rows = await apiGet<SavingsType[]>("/savings-types");
  return Array.isArray(rows) ? rows : [];
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
  return apiPatch(`/group-savings/${encodeURIComponent(String(recID))}`, payload);
};

export const deleteGroupSaving = async (recID: number) => {
  return apiPatch(`/group-savings/${encodeURIComponent(String(recID))}/delete`, {});
};

export const fetchMemberSavings = async (
  groupCode: string,
  sppCode: string,
): Promise<MemberSaving[]> => {
  if (!groupCode || !sppCode) return [];
  const rows = await apiGet<MemberSaving[]>("/member-savings");
  return (Array.isArray(rows) ? rows : []).filter(
    (r) =>
      String(r.groupCode || "") === String(groupCode) &&
      String(r.sppCode || "") === String(sppCode),
  );
};

export const createMemberSaving = async (payload: {
  sppCode: string;
  groupCode: string;
  amount: number;
  date: string;
  sType: string;
}) => {
  return apiPost("/member-savings", payload);
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
  return apiPatch(`/member-savings/${encodeURIComponent(String(recID))}`, payload);
};

export const deleteMemberSaving = async (recID: number) => {
  return apiPatch(
    `/member-savings/${encodeURIComponent(String(recID))}/delete`,
    {},
  );
};
