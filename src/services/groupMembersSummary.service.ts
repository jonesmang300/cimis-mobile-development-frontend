import { apiGet } from "./api";

/* ===============================
   TYPES
================================ */
export type GroupSummaryRow = {
  groupname: string;
  males: number;
  females: number;
  total: number;
};

export type VerifiedTotals = {
  M: number;
  F: number;
  Total: number;
};

/* ===============================
   API CALL: GROUP SUMMARY
   =============================== */
export async function getGroupMembersSummary(
  villageClusterID: string,
): Promise<GroupSummaryRow[]> {
  if (!villageClusterID) return [];

  const rows = await apiGet(
    `/beneficiaries/summary/group?villageClusterID=${encodeURIComponent(
      villageClusterID,
    )}`,
  );

  return Array.isArray(rows)
    ? rows.map((r) => ({
        groupname: String(r.groupname || "No Group"),
        males: Number(r.males || 0),
        females: Number(r.females || 0),
        total: Number(r.total || 0),
      }))
    : [];
}

/* ===============================
   API CALL: VERIFIED TOTALS
   =============================== */
export async function getVerifiedTotals(
  villageClusterID: string,
): Promise<VerifiedTotals> {
  if (!villageClusterID) return { M: 0, F: 0, Total: 0 };

  const row = await apiGet(
    `/beneficiaries/summary/verified/totals?villageClusterID=${encodeURIComponent(
      villageClusterID,
    )}`,
  );

  return {
    M: Number(row?.M || 0),
    F: Number(row?.F || 0),
    Total: Number(row?.Total || 0),
  };
}
