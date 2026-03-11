import { apiGet } from "./api";
import { getStableDeviceId } from "../utils/device";
import { GroupTraining, Meeting, GroupIGA, MemberIGA } from "./groupOperations.service";
import { GroupSaving, MemberSaving } from "./savings.service";

type DashboardGroup = {
  groupID?: string;
  groupname?: string;
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

export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  const deviceId = await getStableDeviceId();

  const [
    verifiedTotalRes,
    verifiedByDeviceRes,
    groups,
    trainings,
    meetings,
    groupSavings,
    memberSavings,
    groupIGAs,
    memberIGAs,
  ] = await Promise.all([
    apiGet<{ total: number | string }>("/beneficiaries/count/selected"),
    apiGet<{ total: number | string }>(
      `/beneficiaries/count/selected/device/${encodeURIComponent(deviceId)}`,
    ),
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
    totalVerified: toNumber(verifiedTotalRes?.total),
    myVerified: toNumber(verifiedByDeviceRes?.total),
    groupsFormed: visibleGroups.length,
    trainings: filteredTrainings.length,
    meetings: filteredMeetings.length,
    aggregatedSavings,
    groupIGAs: filteredGroupIGAs.length,
    memberIGAs: filteredMemberIGAs.length,
  };
};
