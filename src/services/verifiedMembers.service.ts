// src/services/verifiedMembers.service.ts

import { apiGet } from "./api";

/* ===============================
   TYPES
================================ */

export type VerifiedMember = {
  sppCode: string;
  hh_head_name: string;
  hh_code: string;
  groupname?: string | null;
};

/* ===============================
   SERVICE
================================ */

/**
 * Get verified members by villageClusterID (ALL devices)
 */
export const getVerifiedMembers = async (
  villageClusterID: string | number,
): Promise<VerifiedMember[]> => {
  if (!villageClusterID) return [];

  const rows = await apiGet<any[]>(
    `/beneficiaries/verified?villageClusterID=${encodeURIComponent(
      String(villageClusterID),
    )}`,
  );

  return Array.isArray(rows) ? (rows as VerifiedMember[]) : [];
};
