// src/services/dashboard.service.ts

import { apiGet } from "./api";
import { getStableDeviceId } from "../utils/device";

/* ===============================
   TYPES
================================ */
export type DashboardCounts = {
  totalVerified: number;
  myVerified: number;
};

/* ===============================
   SERVICE
================================ */

/**
 * Get total verified members (all devices)
 */
export const getTotalVerifiedCount = async (): Promise<number> => {
  const res = await apiGet<{ total: number | string }>(
    "/beneficiaries/count/selected",
  );

  return Number(res?.total) || 0;
};

/**
 * Get verified members count for this device only
 */
export const getMyVerifiedCount = async (): Promise<number> => {
  const deviceId = await getStableDeviceId();

  const res = await apiGet<{ total: number | string }>(
    `/beneficiaries/count/selected/device/${encodeURIComponent(deviceId)}`,
  );

  return Number(res?.total) || 0;
};

/**
 * Get both dashboard counts at once
 */
export const getDashboardCounts = async (): Promise<DashboardCounts> => {
  const [totalVerified, myVerified] = await Promise.all([
    getTotalVerifiedCount(),
    getMyVerifiedCount(),
  ]);

  return {
    totalVerified,
    myVerified,
  };
};
