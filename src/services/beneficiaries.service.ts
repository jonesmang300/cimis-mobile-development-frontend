import { apiGet, apiPost, apiPatch, updateCachedCollection } from "./api";
import { isOnline } from "../plugins/network";
import { getStableDeviceId } from "../utils/device";
import {
  saveOfflineGroup,
  saveOfflineGroupMembers,
  listOfflineMembersByGroupId,
  listOfflineAssignments,
} from "../data/db";

/* ===============================
   CREATE GROUP
================================ */

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

export type CreateGroupResult = CreateGroupResponse & {
  offlineClientId?: string;
  offline?: boolean;
};

const projectMap: Record<string, string> = {
  "01": "SLG",
  "02": "csG",
  "03": "CCI",
  "04": "LRP",
  "05": "nuG",
  "06": "RSG",
};

const makeClientId = () =>
  `grp_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;

const generateTempGroupId = (projectId: string | undefined, deviceId: string) => {
  const projectCode = projectMap[projectId || ""] || "UNK";
  const year = new Date().getFullYear();
  const deviceSuffix = deviceId.slice(-6);
  const counter = Date.now().toString(36).toUpperCase();
  return `TMP/${year}/${projectCode}/${deviceSuffix}/${counter}`;
};

const createGroupOffline = async (
  payload: CreateGroupPayload,
): Promise<CreateGroupResult> => {
  const deviceId = await getStableDeviceId();
  const clientId = makeClientId();
  const tempGroupId = generateTempGroupId(payload.projectID, deviceId);

  await saveOfflineGroup(clientId, tempGroupId, { ...payload, deviceId }, "pending");

  return {
    id: tempGroupId,
    groupID: tempGroupId,
    message: "Queued for sync",
    offlineClientId: clientId,
    offline: true,
  };
};

export const createGroup = async (
  payload: CreateGroupPayload,
): Promise<CreateGroupResult> => {
  const online = await isOnline().catch(() => false);

  if (!online) {
    return createGroupOffline(payload);
  }

  const created = await apiPost<CreateGroupResponse>("/groups", payload);
  const groupID = String(created?.groupID || created?.id || "").trim();

  if (groupID) {
    await updateCachedCollection<any>("/groups", (items) =>
      upsertByKey(
        items,
        {
          ...payload,
          groupID,
        },
        "groupID",
      ),
    );
  }

  return created;
};

/* ===============================
   TYPES
================================ */

export type Beneficiary = {
  sppCode: string;

  hh_head_name?: string;
  hh_code?: string | null;

  sex?: string | null;
  dob?: string | null;

  nat_id?: string | null;
  hh_size?: number | null;

  groupname?: string | null;
  groupCode?: string | null;
  groupID?: string | null;
  selected?: number | string | null;

  villageClusterID?: string;
  regionID?: string;
  districtID?: string;
  taID?: string;
  deviceId?: string;
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

export type BulkSyncGroupResult = {
  _queued?: boolean;
  message?: string;
  count?: number;
};

const upsertByKey = <T extends Record<string, any>>(
  items: T[],
  nextItem: T,
  key: keyof T,
) => {
  const nextKey = String(nextItem[key] ?? "").trim();
  if (!nextKey) return items;

  const filtered = items.filter(
    (item) => String(item[key] ?? "").trim() !== nextKey,
  );

  return [nextItem, ...filtered];
};

/* ===============================
   HELPERS
================================ */

const toDateOnly = (date?: string | null) => {
  if (!date) return null;

  try {
    return new Date(date).toISOString().slice(0, 10);
  } catch {
    return null;
  }
};

/* ===============================
   MERGE OFFLINE ASSIGNMENTS
================================ */

async function applyOfflineAssignments(
  rows: Beneficiary[],
): Promise<Beneficiary[]> {
  const offline = await listOfflineAssignments();

  if (!Array.isArray(offline) || offline.length === 0) {
    return rows;
  }

  const bySpp = new Map<string, Beneficiary>();

  offline.forEach((b: any) => {
    if (b && typeof b.sppCode === "string") {
      bySpp.set(b.sppCode, b);
    }
  });

  return rows.map((row) => {
    const override = bySpp.get(row.sppCode);
    return override ? { ...row, ...override } : row;
  });
}

/* ===============================
   FETCH BY VC
================================ */

export const fetchBeneficiariesByVC = async (
  vc: string,
): Promise<Beneficiary[]> => {
  if (!vc) return [];

  const rows = await apiGet<Beneficiary[]>(
    `/beneficiaries/filter?villageClusterID=${encodeURIComponent(vc)}`,
  );

  const safe = Array.isArray(rows) ? rows : [];

  return applyOfflineAssignments(safe);
};

/* ===============================
   FETCH BY GROUP
================================ */

export const fetchBeneficiariesByGroupCode = async (
  groupCode: string,
): Promise<Beneficiary[]> => {
  if (!groupCode) return [];

  try {
    const rows = await apiGet<Beneficiary[]>(
      `/beneficiaries/group?groupCode=${encodeURIComponent(groupCode)}`,
    );

    const safe = Array.isArray(rows) ? rows : [];

    const merged = await applyOfflineAssignments(safe);

    if (merged.length > 0) return merged;
  } catch (error) {
    console.warn("API failed, using offline data", error);
  }

  const offlineRows = await listOfflineMembersByGroupId(groupCode);

  // Ensure groupCode/groupID set from offline payload for UI consistency
  const withIds = (offlineRows as Beneficiary[]).map((b) => {
    const finalId = b.groupCode || b.groupID || groupCode;
    return {
      ...b,
      groupCode: finalId,
      groupID: finalId,
      selected: b.selected ?? 1,
    };
  });

  return withIds;
};

/* ===============================
   UPDATE BENEFICIARY
================================ */

export const updateBeneficiary = async (beneficiary: Beneficiary) => {
  if (!beneficiary?.sppCode) {
    throw new Error("Missing sppCode");
  }

  const nat = String(beneficiary.nat_id ?? "").trim();
  const nat_id = nat === "" ? null : nat;

  const sizeStr = String(beneficiary.hh_size ?? "").trim();

  const hh_size =
    sizeStr === ""
      ? null
      : Number.isNaN(Number(sizeStr))
        ? null
        : Number(sizeStr);

  const hh_code = String(beneficiary.hh_code ?? "").trim() || null;
  const groupname = String(beneficiary.groupname ?? "").trim() || null;
  const groupValue =
    String(beneficiary.groupCode ?? beneficiary.groupID ?? "").trim() || null;
  const selected =
    beneficiary.selected === null || beneficiary.selected === undefined
      ? null
      : String(beneficiary.selected);

  const patchPayload = {
    sex: beneficiary.sex || null,
    dob: toDateOnly(beneficiary.dob),
    nat_id,
    hh_size,
    hh_code,
    groupname,
    groupCode: groupValue,
    selected,
  };

  const result = await apiPatch(
    `/beneficiaries?sppCode=${encodeURIComponent(beneficiary.sppCode)}`,
    patchPayload,
  );

  const mutateItems = (items: Beneficiary[]) =>
    items.map((item) =>
      String(item.sppCode || "").trim() === String(beneficiary.sppCode || "").trim()
        ? {
            ...item,
            ...patchPayload,
          }
        : item,
    );

  const vc = String(beneficiary.villageClusterID || "").trim();
  if (vc) {
    await updateCachedCollection<Beneficiary>(
      `/beneficiaries/filter?villageClusterID=${encodeURIComponent(vc)}`,
      mutateItems,
    );
  }

  const groupCode = String(beneficiary.groupCode || beneficiary.groupID || "").trim();
  if (groupCode) {
    await updateCachedCollection<Beneficiary>(
      `/beneficiaries/group?groupCode=${encodeURIComponent(groupCode)}`,
      mutateItems,
    );
  }

  return result;
};

/* ===============================
   BULK SYNC GROUP
================================ */

export const bulkSyncGroup = async (
  selectedMembers: Beneficiary[],
  groupName: string,
  groupCode: string,
  deviceId: string,
): Promise<BulkSyncGroupResult> => {
  const g = (groupName || "").trim();

  if (!g) throw new Error("Group name is required");
  if (!groupCode?.trim()) throw new Error("Group code is required");
  if (!deviceId?.trim()) throw new Error("DeviceId is required");

  const payload: BulkSyncPayload[] = selectedMembers.map((m) => {
    const nat = String(m.nat_id ?? "").trim();
    const nat_id = nat === "" ? null : nat;

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
      deviceId,
    };
  });

  const online = await isOnline().catch(() => false);

  if (!online) {
    return {
      _queued: true,
      message: "Queued for sync",
      count: payload.length,
    };
  }

  const result = await apiPost<BulkSyncGroupResult>("/beneficiaries/bulk-sync", payload);

  await updateCachedCollection<Beneficiary>(
    `/beneficiaries/group?groupCode=${encodeURIComponent(groupCode.trim())}`,
    (items) =>
      payload.map((member) => ({
        ...items.find(
          (item) => String(item.sppCode || "").trim() === String(member.sppCode || "").trim(),
        ),
        ...member,
        groupID: member.groupCode,
      })),
  );

  return result;
};

export const saveQueuedServerGroupAssignments = async (
  groupId: string,
  groupPayload: CreateGroupPayload,
  members: Beneficiary[],
  deviceId: string,
) => {
  const clientId = makeClientId();
  await saveOfflineGroup(
    clientId,
    groupId,
    { ...groupPayload, deviceId },
    "pending",
    groupId,
  );

  await saveOfflineGroupMembers(
    clientId,
    members.map((member) => ({
      ...member,
      groupCode: groupId,
      groupID: groupId,
      selected: member.selected ?? 1,
      deviceId: member.deviceId || deviceId,
    })),
    groupId,
  );
};

/* ===============================
   SAVE OFFLINE ASSIGNMENTS
================================ */

export const saveOfflineGroupAssignments = async (
  clientId: string,
  members: Beneficiary[],
) =>
  saveOfflineGroupMembers(
    clientId,
    members.map((m) => ({
      ...m,
      groupCode: m.groupCode || m.groupID || clientId,
      groupID: m.groupID || m.groupCode || clientId,
      selected: m.selected ?? 1,
    })),
    clientId,
  );
