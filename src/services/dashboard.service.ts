import { apiGet } from "./api";
import { getStableDeviceId } from "../utils/device";
import { GroupTraining, Meeting, GroupIGA, MemberIGA } from "./groupOperations.service";
import { GroupSaving, MemberSaving } from "./savings.service";

type DashboardGroup = {
  groupID?: string;
  groupname?: string;
  villageClusterID?: string;
};

export type DashboardOverview = {
  totalVerified: number;
  myVerified: number;
  groupsFormed: number;
  trainings: number;
  meetings: number;
  aggregatedSavings: number;
  groupIGAs: number;
  memberIGAs: number;
};

const toNumber = (value: string | number | null | undefined) =>
  Number(value || 0) || 0;

export const getDashboardOverview = async (
  roleId?: number,
): Promise<DashboardOverview> => {
  const deviceId = await getStableDeviceId();

  const [groups, trainings, meetings, groupSavings, memberSavings, groupIGAs, memberIGAs] =
    await Promise.all([
    apiGet<DashboardGroup[]>("/groups"),
    apiGet<GroupTraining[]>("/group-trainings"),
    apiGet<Meeting[]>("/meetings"),
    apiGet<GroupSaving[]>("/group-savings"),
    apiGet<MemberSaving[]>("/member-savings"),
    apiGet<GroupIGA[]>("/group-igas"),
    apiGet<MemberIGA[]>("/member-igas"),
    ]);

  const visibleGroups = Array.isArray(groups) ? groups : [];
  const visibleGroupIds = new Set(
    visibleGroups.map((row) => String(row.groupID || "")).filter(Boolean),
  );
  const visibleVillageClusters = Array.from(
    new Set(
      visibleGroups
        .map((row) => String(row.villageClusterID || "").trim())
        .filter(Boolean),
    ),
  );

  let totalVerified = 0;
  let myVerified = 0;

  if (roleId === 2) {
    const verifiedRows = await Promise.all(
      visibleVillageClusters.map(async (villageClusterID) => {
        const [totalRes, deviceRes] = await Promise.all([
          apiGet<any[]>(
            `/beneficiaries/verified?villageClusterID=${encodeURIComponent(
              villageClusterID,
            )}`,
          ),
          apiGet<any[]>(
            `/beneficiaries/verified/deviceId?villageClusterID=${encodeURIComponent(
              villageClusterID,
            )}&deviceId=${encodeURIComponent(deviceId)}`,
          ),
        ]);

        return {
          total: Array.isArray(totalRes) ? totalRes.length : 0,
          mine: Array.isArray(deviceRes) ? deviceRes.length : 0,
        };
      }),
    );

    totalVerified = verifiedRows.reduce((sum, row) => sum + row.total, 0);
    myVerified = verifiedRows.reduce((sum, row) => sum + row.mine, 0);
  } else {
    const [verifiedTotalRes, verifiedByDeviceRes] = await Promise.all([
      apiGet<{ total: number | string }>("/beneficiaries/count/selected"),
      apiGet<{ total: number | string }>(
        `/beneficiaries/count/selected/device/${encodeURIComponent(deviceId)}`,
      ),
    ]);

    totalVerified = toNumber(verifiedTotalRes?.total);
    myVerified = toNumber(verifiedByDeviceRes?.total);
  }

  const filteredTrainings = (Array.isArray(trainings) ? trainings : []).filter((row) =>
    visibleGroupIds.has(String(row.groupID || "")),
  );

  const filteredMeetings = (Array.isArray(meetings) ? meetings : []).filter((row) =>
    visibleGroupIds.has(String(row.groupCode || "")),
  );

  const filteredGroupSavings = (Array.isArray(groupSavings) ? groupSavings : []).filter(
    (row) => visibleGroupIds.has(String(row.GroupID || "")),
  );

  const filteredMemberSavings = (Array.isArray(memberSavings) ? memberSavings : []).filter(
    (row) => visibleGroupIds.has(String(row.groupCode || "")),
  );

  const filteredGroupIGAs = (Array.isArray(groupIGAs) ? groupIGAs : []).filter((row) =>
    visibleGroupIds.has(String(row.groupID || "")),
  );

  const filteredMemberIGAs = (Array.isArray(memberIGAs) ? memberIGAs : []).filter((row) =>
    visibleGroupIds.has(String(row.groupID || "")),
  );

  const aggregatedSavings =
    filteredGroupSavings.reduce((sum, row) => sum + toNumber(row.Amount), 0) +
    filteredMemberSavings.reduce((sum, row) => sum + toNumber(row.amount), 0);

  return {
    totalVerified,
    myVerified,
    groupsFormed: visibleGroups.length,
    trainings: filteredTrainings.length,
    meetings: filteredMeetings.length,
    aggregatedSavings,
    groupIGAs: filteredGroupIGAs.length,
    memberIGAs: filteredMemberIGAs.length,
  };
};
