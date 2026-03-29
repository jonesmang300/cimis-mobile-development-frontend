// src/services/viewVerifiedMember.service.ts

import { apiGet } from "./api";

/* ===============================
   TYPES
================================ */

export type VerifiedMemberDetails = {
  sppCode: string;

  hh_head_name?: string;
  hh_code?: string;
  sex?: string;
  dob?: string;
  nat_id?: string;
  hh_size?: number;

  groupname?: string;

  regionID?: string;
  districtID?: string;
  taID?: string;
  villageClusterID?: string;
};

export type LocationNames = {
  regionName: string;
  districtName: string;
  taName: string;
  vcName: string;
};

/* ===============================
   API CALLS
================================ */

export const getVerifiedMemberBySppCode = async (
  sppCode: string,
): Promise<VerifiedMemberDetails | null> => {
  if (!sppCode) return null;

  const data = await apiGet<VerifiedMemberDetails>(
    `/beneficiaries?sppCode=${encodeURIComponent(sppCode)}`,
  );

  return data || null;
};

export const getLocationNamesForMember = async (
  member: VerifiedMemberDetails,
): Promise<LocationNames> => {
  try {
    const regionID = member.regionID || "";
    const districtID = member.districtID || "";
    const taID = member.taID || "";
    const villageClusterID = member.villageClusterID || "";

    // defaults
    const names: LocationNames = {
      regionName: "N/A",
      districtName: "N/A",
      taName: "N/A",
      vcName: "N/A",
    };

    // REGION
    if (regionID) {
      const regions = await apiGet<any[]>(`/regions`);
      const r = regions.find((x) => x.regionID === regionID);
      names.regionName = r?.name || regionID;
    }

    // DISTRICT
    if (regionID && districtID) {
      const districts = await apiGet<any[]>(
        `/districts?regionID=${encodeURIComponent(regionID)}`,
      );
      const d = districts.find((x) => x.DistrictID === districtID);
      names.districtName = d?.DistrictName || districtID;
    }

    // TA
    if (districtID && taID) {
      const tas = await apiGet<any[]>(
        `/tas?districtID=${encodeURIComponent(districtID)}`,
      );
      const t = tas.find((x) => x.TAID === taID);
      names.taName = t?.TAName || taID;
    }

    // VC
    if (taID && villageClusterID) {
      const vcs = await apiGet<any[]>(
        `/village-clusters?taID=${encodeURIComponent(taID)}`,
      );
      const v = vcs.find((x) => x.villageClusterID === villageClusterID);
      names.vcName = v?.villageClusterName || villageClusterID;
    }

    return names;
  } catch (err) {
    console.error("Failed loading location names:", err);

    return {
      regionName: "N/A",
      districtName: "N/A",
      taName: "N/A",
      vcName: "N/A",
    };
  }
};
