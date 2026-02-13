// src/services/verifiedMembersByDevice.service.ts

import { apiGet } from "./api";
import { getStableDeviceId } from "../utils/device";

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
 * Get verified members by VC + current deviceId
 */
export const getVerifiedMembersByDevice = async (
  villageClusterID: string | number,
): Promise<VerifiedMember[]> => {
  if (!villageClusterID) return [];

  const deviceId = await getStableDeviceId();

  if (!deviceId) {
    console.error("No deviceId found");
    return [];
  }

  const rows = await apiGet<any[]>(
    `/beneficiaries/verified/deviceId?villageClusterID=${encodeURIComponent(
      String(villageClusterID),
    )}&deviceId=${encodeURIComponent(deviceId)}`,
  );

  return Array.isArray(rows) ? (rows as VerifiedMember[]) : [];
};
