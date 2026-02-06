import { Capacitor } from "@capacitor/core";
import { apiGet, apiPost, apiPatch } from "./api";

import { getBeneficiaries, preloadBeneficiaries } from "../db/sqlite";

/* ===============================
   PLATFORM
================================ */
const isNative = Capacitor.getPlatform() !== "web";

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
  selected?: number | string | null; // ✅ add this
};

export type BulkSyncPayload = {
  sppCode: string;
  nat_id: string | null;
  hh_size: number | null;
  sex: string | null;
  dob: string | null;
  groupname: string;
  selected: 1;
};

/* ===============================
   HELPERS
================================ */
const toDateOnly = (date: string | null | undefined) => {
  if (!date) return null;
  return date.includes("T") ? date.split("T")[0] : date;
};

/* ===============================
   FETCH BENEFICIARIES BY VC
================================ */
export const fetchBeneficiariesByVC = async (
  vc: string,
): Promise<Beneficiary[]> => {
  if (!vc) return [];

  // Native: sync API -> SQLite -> read from SQLite
  if (isNative) {
    await preloadBeneficiaries(vc);
    const res = await getBeneficiaries(vc);
    return res.values || [];
  }

  // Web: API only
  const rows = await apiGet<Beneficiary[]>(
    `/beneficiaries/filter?villageClusterID=${vc}`,
  );

  return Array.isArray(rows) ? rows : [];
};

/* ===============================
   UPDATE BENEFICIARY
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
   BULK SYNC GROUP
================================ */
export const bulkSyncGroup = async (
  selectedMembers: Beneficiary[],
  groupName: string,
) => {
  const g = (groupName || "").trim();
  if (!g) throw new Error("Group name is required");

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
      selected: 1,
    };
  });

  // ✅ IMPORTANT: this is what was missing
  // Change endpoint to your real backend endpoint if different
  return apiPost("/beneficiaries/bulk-sync", payload);
};
