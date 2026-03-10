import { apiGet, apiPost, apiPatch } from "./api";

/* ===============================
   TYPES
================================ */
export type Beneficiary = {
  sppCode: string;

  hh_head_name?: string;
  hh_code?: string;

  sex?: string | null;
  dob?: string | null;

  nat_id?: string | null;
  hh_size?: number | null;

  groupname?: string;
  groupCode?: string;
  selected?: number | string | null;

  // optional fields from backend
  villageClusterID?: string;
  regionID?: string;
  districtID?: string;
  taID?: string;
};

export type BulkSyncPayload = {
  sppCode: string;
  nat_id: string | null;
  hh_size: number | null;
  sex: string | null;
  dob: string | null;
  groupname: string;
  groupCode: string;
  selected: 1;
  deviceId: string;
};

/* ===============================
   HELPERS
================================ */
const toDateOnly = (date: string | null | undefined) => {
  if (!date) return null;
  return date.includes("T") ? date.split("T")[0] : date;
};

/* ===============================
   FETCH BENEFICIARIES BY VC (API ONLY)
================================ */
export const fetchBeneficiariesByVC = async (
  vc: string,
): Promise<Beneficiary[]> => {
  if (!vc) return [];

  const rows = await apiGet<Beneficiary[]>(
    `/beneficiaries/filter?villageClusterID=${encodeURIComponent(vc)}`,
  );

  return Array.isArray(rows) ? rows : [];
};

export const fetchBeneficiariesByGroupCode = async (
  groupCode: string,
): Promise<Beneficiary[]> => {
  if (!groupCode) return [];

  const rows = await apiGet<Beneficiary[]>(
    `/beneficiaries/group/${encodeURIComponent(groupCode)}`,
  );

  return Array.isArray(rows) ? rows : [];
};

/* ===============================
   UPDATE BENEFICIARY (API ONLY)
================================ */
export const updateBeneficiary = async (beneficiary: Beneficiary) => {
  if (!beneficiary?.sppCode) throw new Error("Missing sppCode");

  // clean nat_id
  const nat = String(beneficiary.nat_id ?? "").trim();
  const nat_id = nat === "" ? null : nat;

  // clean hh_size
  const sizeStr = String(beneficiary.hh_size ?? "").trim();
  const hh_size =
    sizeStr === ""
      ? null
      : Number.isNaN(Number(sizeStr))
        ? null
        : Number(sizeStr);

  return apiPatch(`/beneficiaries/${encodeURIComponent(beneficiary.sppCode)}`, {
    sex: beneficiary.sex || null,
    dob: toDateOnly(beneficiary.dob),
    nat_id,
    hh_size,
  });
};

/* ===============================
   BULK SYNC GROUP (API ONLY)
================================ */
export const bulkSyncGroup = async (
  selectedMembers: Beneficiary[],
  groupName: string,
  groupCode: string,
  deviceId: string,
) => {
  const g = (groupName || "").trim();
  if (!g) throw new Error("Group name is required");
  if (!groupCode?.trim()) throw new Error("Group code is required");
  if (!deviceId?.trim()) throw new Error("DeviceId is required");

  const payload: BulkSyncPayload[] = selectedMembers.map((m) => {
    // nat_id: allow null, but never send ""
    const nat = String(m.nat_id ?? "").trim();
    const nat_id = nat === "" ? null : nat;

    // hh_size: allow null, but never send "" and never send NaN
    const sizeStr = String(m.hh_size ?? "").trim();
    const hh_size =
      sizeStr === ""
        ? null
        : Number.isNaN(Number(sizeStr))
          ? null
          : Number(sizeStr);

    return {
      sppCode: m.sppCode,
      nat_id,
      hh_size,
      sex: m.sex ?? null,
      dob: toDateOnly(m.dob),
      groupname: g,
      groupCode: groupCode.trim(),
      selected: 1,
      deviceId, // ✅ IMPORTANT
    };
  });

  return apiPost("/beneficiaries/bulk-sync", payload);
};

export type CreateGroupPayload = {
  groupname: string;
  DateEstablished: string;
  regionID: string;
  DistrictID: string;
  TAID: string;
  villageClusterID: string;
  cohort?: string;
  projectID?: string;
  programID?: string;
  userID?: string | null;
  slgApproved?: string;
};

export type CreateGroupResponse = {
  id: string;
  groupID: string;
  message?: string;
};

export const createGroup = async (
  payload: CreateGroupPayload,
): Promise<CreateGroupResponse> => {
  return apiPost<CreateGroupResponse>("/groups", payload);
};
