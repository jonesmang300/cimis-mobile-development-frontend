import { apiGet } from "./api";
import { getStableDeviceId } from "../utils/device";
import { GroupTraining, Meeting, GroupIGA, MemberIGA } from "./groupOperations.service";
import { GroupSaving, MemberSaving } from "./savings.service";

type DashboardGroup = {
  groupID?: string;
  groupname?: string;
  regionID?: string;
  DistrictID?: string;
  districtID?: string;
  TAID?: string;
  taID?: string;
  villageClusterID?: string;
};

export type DashboardOverview = {
  totalVerified: number;
  myVerified: number;
  groupsFormed: number;
  trainings: number;
  meetings: number;
  aggregatedGroupSavings: number;
  aggregatedMemberSavings: number;
  aggregatedSavings: number;
  groupIGAs: number;
  memberIGAs: number;
};

export type SummaryMetricKey =
  | "verified"
  | "groups"
  | "trainings"
  | "meetings"
  | "savingsGroup"
  | "savingsMember"
  | "groupIGAs"
  | "memberIGAs"
  | "myVerified";

export type SummaryDetailItem = {
  id: string;
  title: string;
  subtitle: string;
  details: string[];
  badge?: string;
  searchText: string;
  members?: string[];
  section?: string;
  amountValue?: number;
};

type VerifiedBeneficiary = {
  sppCode?: string;
  groupname?: string;
  hh_head_name?: string;
  hh_code?: string;
  villageClusterID?: string;
  groupCode?: string;
  groupID?: string;
  districtID?: string;
  taID?: string;
  selected?: number | string;
};

type BeneficiaryLookupRow = {
  sppCode?: string;
  hh_head_name?: string;
  groupCode?: string;
  groupID?: string;
};

type TrainingTypeRow = {
  trainingTypeID?: string;
  training_name?: string;
};

type FacilitatorRow = {
  facilitatorID?: string;
  title?: string;
};

type SavingsTypeRow = {
  TypeID?: string;
  savings_name?: string;
};

type BusinessCategoryRow = {
  categoryID?: string;
  catname?: string;
};

type IGATypeRow = {
  ID?: string;
  categoryID?: string;
  name?: string;
};

const toNumber = (value: string | number | null | undefined) =>
  Number(value || 0) || 0;

const formatMoney = (value: string | number | null | undefined) =>
  `K ${toNumber(value).toLocaleString("en-US")}`;

const formatDate = (value: string | null | undefined) => {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  const dateOnly = raw.includes("T") ? raw.split("T")[0] : raw;
  const date = new Date(dateOnly);
  if (Number.isNaN(date.getTime())) return dateOnly;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const monthName = (value: string | number | null | undefined) => {
  const normalized = String(value || "").padStart(2, "0");
  const months: Record<string, string> = {
    "01": "Jan",
    "02": "Feb",
    "03": "Mar",
    "04": "Apr",
    "05": "May",
    "06": "Jun",
    "07": "Jul",
    "08": "Aug",
    "09": "Sep",
    "10": "Oct",
    "11": "Nov",
    "12": "Dec",
  };
  return months[normalized] || normalized || "-";
};

const makeSearchText = (parts: Array<string | number | null | undefined>) =>
  parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const dedupeById = <T extends { id: string }>(items: T[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const getVisibleScope = async () => {
  const groups = await apiGet<DashboardGroup[]>("/groups");
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

  return {
    visibleGroups,
    visibleGroupIds,
    visibleVillageClusters,
  };
};

const buildLocationMaps = async (groups: DashboardGroup[]) => {
  const regionIds = Array.from(
    new Set(groups.map((row) => String(row.regionID || "").trim()).filter(Boolean)),
  );
  const districtPairs = Array.from(
    new Set(
      groups
        .map((row) => {
          const regionID = String(row.regionID || "").trim();
          const districtID = String(row.DistrictID || row.districtID || "").trim();
          return regionID && districtID ? `${regionID}::${districtID}` : "";
        })
        .filter(Boolean),
    ),
  );
  const taPairs = Array.from(
    new Set(
      groups
        .map((row) => {
          const districtID = String(row.DistrictID || row.districtID || "").trim();
          const taID = String(row.TAID || row.taID || "").trim();
          return districtID && taID ? `${districtID}::${taID}` : "";
        })
        .filter(Boolean),
    ),
  );
  const vcPairs = Array.from(
    new Set(
      groups
        .map((row) => {
          const taID = String(row.TAID || row.taID || "").trim();
          const villageClusterID = String(row.villageClusterID || "").trim();
          return taID && villageClusterID ? `${taID}::${villageClusterID}` : "";
        })
        .filter(Boolean),
    ),
  );

  const districtMap: Record<string, string> = {};
  const taMap: Record<string, string> = {};
  const vcMap: Record<string, string> = {};

  await Promise.all(
    regionIds.map(async (regionID) => {
      const districts = await apiGet<Array<{ DistrictID?: string; DistrictName?: string }>>(
        `/districts?regionID=${encodeURIComponent(regionID)}`,
      );
      (Array.isArray(districts) ? districts : []).forEach((row) => {
        const districtID = String(row.DistrictID || "").trim();
        if (districtID) {
          districtMap[districtID] = row.DistrictName || districtID;
        }
      });
    }),
  );

  await Promise.all(
    Array.from(new Set(taPairs.map((pair) => pair.split("::")[0]))).map(
      async (districtID) => {
        const tas = await apiGet<Array<{ TAID?: string; TAName?: string }>>(
          `/tas?districtID=${encodeURIComponent(districtID)}`,
        );
        (Array.isArray(tas) ? tas : []).forEach((row) => {
          const taID = String(row.TAID || "").trim();
          if (taID) {
            taMap[taID] = row.TAName || taID;
          }
        });
      },
    ),
  );

  await Promise.all(
    Array.from(new Set(vcPairs.map((pair) => pair.split("::")[0]))).map(
      async (taID) => {
        const vcs = await apiGet<
          Array<{ villageClusterID?: string; villageClusterName?: string }>
        >(`/village-clusters?taID=${encodeURIComponent(taID)}`);
        (Array.isArray(vcs) ? vcs : []).forEach((row) => {
          const villageClusterID = String(row.villageClusterID || "").trim();
          if (villageClusterID) {
            vcMap[villageClusterID] = row.villageClusterName || villageClusterID;
          }
        });
      },
    ),
  );

  return {
    districtMap,
    taMap,
    vcMap,
  };
};

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
  const aggregatedGroupSavings = filteredGroupSavings.reduce(
    (sum, row) => sum + toNumber(row.Amount),
    0,
  );
  const aggregatedMemberSavings = filteredMemberSavings.reduce(
    (sum, row) => sum + toNumber(row.amount),
    0,
  );

  return {
    totalVerified,
    myVerified,
    groupsFormed: visibleGroups.length,
    trainings: filteredTrainings.length,
    meetings: filteredMeetings.length,
    aggregatedGroupSavings,
    aggregatedMemberSavings,
    aggregatedSavings,
    groupIGAs: filteredGroupIGAs.length,
    memberIGAs: filteredMemberIGAs.length,
  };
};

export const getDashboardMetricItems = async (
  metric: SummaryMetricKey,
  roleId?: number,
): Promise<SummaryDetailItem[]> => {
  void roleId;
  const { visibleGroups, visibleGroupIds, visibleVillageClusters } =
    await getVisibleScope();

  if (metric === "groups") {
    const { districtMap, taMap, vcMap } = await buildLocationMaps(visibleGroups);

    return visibleGroups.map((group) => ({
      id: String(group.groupID || ""),
      title: String(group.groupname || group.groupID || "Group"),
      subtitle: String(group.groupID || "-"),
      details: [
        `District: ${
          districtMap[String(group.DistrictID || group.districtID || "").trim()] ||
          String(group.DistrictID || group.districtID || "-")
        }`,
        `TA: ${
          taMap[String(group.TAID || group.taID || "").trim()] ||
          String(group.TAID || group.taID || "-")
        }`,
        `Village Cluster: ${
          vcMap[String(group.villageClusterID || "").trim()] ||
          String(group.villageClusterID || "-")
        }`,
      ],
      badge: "Group",
      searchText: makeSearchText([
        group.groupname,
        group.groupID,
        districtMap[String(group.DistrictID || group.districtID || "").trim()] ||
          group.DistrictID ||
          group.districtID,
        taMap[String(group.TAID || group.taID || "").trim()] ||
          group.TAID ||
          group.taID,
        vcMap[String(group.villageClusterID || "").trim()] ||
          group.villageClusterID,
        group.villageClusterID,
      ]),
    }));
  }

  if (metric === "verified" || metric === "myVerified") {
    const deviceId = await getStableDeviceId();
    const [rows, { districtMap, taMap, vcMap }] = await Promise.all([
      Promise.all(
        visibleVillageClusters.map((villageClusterID) =>
          metric === "myVerified"
            ? apiGet<VerifiedBeneficiary[]>(
                `/beneficiaries/verified/deviceId?villageClusterID=${encodeURIComponent(
                  villageClusterID,
                )}&deviceId=${encodeURIComponent(deviceId)}`,
              )
            : apiGet<VerifiedBeneficiary[]>(
                `/beneficiaries/filter?villageClusterID=${encodeURIComponent(
                  villageClusterID,
                )}`,
              ),
        ),
      ),
      buildLocationMaps(visibleGroups),
    ]);

    const groupMetaMap = new Map(
      visibleGroups.map((group) => [
        String(group.groupID || "").trim(),
        group,
      ]),
    );

    const verifiedRows = rows
      .flatMap((groupRows) => (Array.isArray(groupRows) ? groupRows : []))
      .filter((row) =>
        metric === "myVerified"
          ? Boolean(String(row.sppCode || "").trim())
          : String(row.selected || "") === "1",
      );

    const grouped = new Map<
      string,
      {
        title: string;
        subtitle: string;
        districtName: string;
        taName: string;
        vcName: string;
        members: string[];
      }
    >();

    verifiedRows.forEach((row) => {
      const resolvedGroupId = String(
        row.groupCode || row.groupID || "",
      ).trim();
      const meta = groupMetaMap.get(resolvedGroupId);
      const districtID = String(
        row.districtID || meta?.DistrictID || meta?.districtID || "",
      ).trim();
      const taID = String(row.taID || meta?.TAID || meta?.taID || "").trim();
      const villageClusterID = String(
        row.villageClusterID || meta?.villageClusterID || "",
      ).trim();
      const groupKey =
        resolvedGroupId || `${row.groupname || "ungrouped"}::${villageClusterID}`;

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          title: String(row.groupname || meta?.groupname || "Verified Group"),
          subtitle: resolvedGroupId || "No group code",
          districtName: districtMap[districtID] || districtID || "-",
          taName: taMap[taID] || taID || "-",
          vcName: vcMap[villageClusterID] || villageClusterID || "-",
          members: [],
        });
      }

      const memberLabel = String(row.hh_head_name || "").trim();
      if (memberLabel) {
        grouped.get(groupKey)?.members.push(memberLabel);
      }
    });

    return Array.from(grouped.entries())
      .map(([groupKey, group]) => {
        const sortedMembers = Array.from(new Set(group.members)).sort((a, b) =>
          a.localeCompare(b),
        );

        return {
          id: groupKey,
          title: group.title,
          subtitle: group.subtitle,
          details: [
            `District: ${group.districtName}`,
            `TA: ${group.taName}`,
            `Village Cluster: ${group.vcName}`,
          ],
          badge: `${sortedMembers.length} verified`,
          members: sortedMembers,
          searchText: makeSearchText([
            group.title,
            group.subtitle,
            group.districtName,
            group.taName,
            group.vcName,
            ...sortedMembers,
          ]),
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  if (metric === "trainings") {
    const { districtMap, taMap, vcMap } = await buildLocationMaps(visibleGroups);
    const groupMetaMap = new Map(
      visibleGroups.map((group) => [String(group.groupID || "").trim(), group]),
    );
    const [trainings, trainingTypes, facilitators] = await Promise.all([
      apiGet<GroupTraining[]>("/group-trainings"),
      apiGet<TrainingTypeRow[]>("/training-types"),
      apiGet<FacilitatorRow[]>("/training-facilitators"),
    ]);

    const typeMap = Object.fromEntries(
      (Array.isArray(trainingTypes) ? trainingTypes : []).map((row) => [
        String(row.trainingTypeID || ""),
        row.training_name || String(row.trainingTypeID || ""),
      ]),
    );
    const facilitatorMap = Object.fromEntries(
      (Array.isArray(facilitators) ? facilitators : []).map((row) => [
        String(row.facilitatorID || ""),
        row.title || String(row.facilitatorID || ""),
      ]),
    );

    return (Array.isArray(trainings) ? trainings : [])
      .filter((row) => visibleGroupIds.has(String(row.groupID || "")))
      .map((row) => {
        const group = groupMetaMap.get(String(row.groupID || "").trim());
        const districtName =
          districtMap[String(group?.DistrictID || group?.districtID || "").trim()] ||
          String(group?.DistrictID || group?.districtID || "-");
        const taName =
          taMap[String(group?.TAID || group?.taID || "").trim()] ||
          String(group?.TAID || group?.taID || "-");
        const villageClusterName =
          vcMap[String(group?.villageClusterID || "").trim()] ||
          String(group?.villageClusterID || "-");

        return {
          id: String(row.TrainingID || `${row.groupID}-${row.StartDate}`),
          title:
            typeMap[String(row.TrainingTypeID || "")] ||
            String(row.TrainingTypeID || "Training"),
          subtitle: String(group?.groupname || row.groupID || "-"),
          details: [
            `District: ${districtName}`,
            `TA: ${taName}`,
            `Village Cluster: ${villageClusterName}`,
            `Start: ${formatDate(row.StartDate)}`,
            `Finish: ${formatDate(row.FinishDate)}`,
            `Facilitator: ${
              facilitatorMap[String(row.trainedBy || "")] ||
              String(row.trainedBy || "-")
            }`,
          ],
          badge: `${toNumber(row.Males) + toNumber(row.Females)} people`,
          searchText: makeSearchText([
            row.groupID,
            group?.groupname,
            districtName,
            taName,
            villageClusterName,
            row.TrainingTypeID,
            typeMap[String(row.TrainingTypeID || "")],
            row.trainedBy,
            facilitatorMap[String(row.trainedBy || "")],
            row.StartDate,
            row.FinishDate,
          ]),
        };
      });
  }

  if (metric === "meetings") {
    const { districtMap, taMap, vcMap } = await buildLocationMaps(visibleGroups);
    const groupMetaMap = new Map(
      visibleGroups.map((group) => [String(group.groupID || "").trim(), group]),
    );
    const meetings = await apiGet<Meeting[]>("/meetings");
    return (Array.isArray(meetings) ? meetings : [])
      .filter((row) => visibleGroupIds.has(String(row.groupCode || "")))
      .map((row) => {
        const group = groupMetaMap.get(String(row.groupCode || "").trim());
        const districtName =
          districtMap[String(group?.DistrictID || group?.districtID || "").trim()] ||
          String(group?.DistrictID || group?.districtID || "-");
        const taName =
          taMap[String(group?.TAID || group?.taID || "").trim()] ||
          String(group?.TAID || group?.taID || "-");
        const villageClusterName =
          vcMap[String(group?.villageClusterID || "").trim()] ||
          String(group?.villageClusterID || "-");

        return {
          id: String(row.meetID || `${row.groupCode}-${row.meetingdate}`),
          title: String(row.purpose || "Meeting"),
          subtitle: String(group?.groupname || row.groupCode || "-"),
          details: [
            `District: ${districtName}`,
            `TA: ${taName}`,
            `Village Cluster: ${villageClusterName}`,
            `Date: ${formatDate(row.meetingdate)}`,
            `Minutes: ${String(row.minutes || "-")}`,
          ],
          badge: "Meeting",
          searchText: makeSearchText([
            row.purpose,
            row.groupCode,
            group?.groupname,
            districtName,
            taName,
            villageClusterName,
            row.meetingdate,
            row.minutes,
          ]),
        };
      });
  }

  if (metric === "savingsGroup" || metric === "savingsMember") {
    const { districtMap, taMap, vcMap } = await buildLocationMaps(visibleGroups);
    const groupMetaMap = new Map(
      visibleGroups.map((group) => [String(group.groupID || "").trim(), group]),
    );
    const [groupSavings, memberSavings, savingsTypes, beneficiariesByGroup] = await Promise.all([
      apiGet<GroupSaving[]>("/group-savings"),
      apiGet<MemberSaving[]>("/member-savings"),
      apiGet<SavingsTypeRow[]>("/savings-types"),
      Promise.all(
        visibleVillageClusters.map((villageClusterID) =>
          apiGet<BeneficiaryLookupRow[]>(
            `/beneficiaries/filter?villageClusterID=${encodeURIComponent(
              villageClusterID,
            )}`,
          ),
        ),
      ),
    ]);

    const typeMap = Object.fromEntries(
      (Array.isArray(savingsTypes) ? savingsTypes : []).map((row) => [
        String(row.TypeID || ""),
        row.savings_name || String(row.TypeID || ""),
      ]),
    );
    const memberNameMap = new Map<string, string>();
    beneficiariesByGroup
      .flatMap((rows) => (Array.isArray(rows) ? rows : []))
      .forEach((row) => {
        const sppCode = String(row.sppCode || "").trim();
        if (!sppCode) return;
        memberNameMap.set(
          sppCode,
          String(row.hh_head_name || "").trim() || sppCode,
        );
      });

    const groupItems = (Array.isArray(groupSavings) ? groupSavings : [])
      .filter((row) => visibleGroupIds.has(String(row.GroupID || "")))
      .map((row) => {
        const group = groupMetaMap.get(String(row.GroupID || "").trim());
        const districtName =
          districtMap[String(group?.DistrictID || group?.districtID || "").trim()] ||
          String(group?.DistrictID || group?.districtID || "-");
        const taName =
          taMap[String(group?.TAID || group?.taID || "").trim()] ||
          String(group?.TAID || group?.taID || "-");
        const villageClusterName =
          vcMap[String(group?.villageClusterID || "").trim()] ||
          String(group?.villageClusterID || "-");

        return {
          id: `group-saving:${String(
            row.RecID || [row.GroupID, row.Yr, row.Month].filter(Boolean).join("-"),
          )}`,
          section: "Group Savings",
          title: String(group?.groupname || row.GroupID || "Group Savings"),
          subtitle: typeMap[String(row.sType || "")] || "Group Savings",
          details: [
            `District: ${districtName}`,
            `TA: ${taName}`,
            `Village Cluster: ${villageClusterName}`,
            `Period: ${monthName(row.Month)} ${String(row.Yr || "-")}`,
          ],
          badge: formatMoney(row.Amount),
          amountValue: toNumber(row.Amount),
          searchText: makeSearchText([
            row.GroupID,
            group?.groupname,
            districtName,
            taName,
            villageClusterName,
            row.Yr,
            row.Month,
            row.sType,
            typeMap[String(row.sType || "")],
            row.Amount,
          ]),
        };
      });

    const memberItems = (Array.isArray(memberSavings) ? memberSavings : [])
      .filter((row) => visibleGroupIds.has(String(row.groupCode || "")))
      .map((row) => {
        const group = groupMetaMap.get(String(row.groupCode || "").trim());
        const districtName =
          districtMap[String(group?.DistrictID || group?.districtID || "").trim()] ||
          String(group?.DistrictID || group?.districtID || "-");
        const taName =
          taMap[String(group?.TAID || group?.taID || "").trim()] ||
          String(group?.TAID || group?.taID || "-");
        const villageClusterName =
          vcMap[String(group?.villageClusterID || "").trim()] ||
          String(group?.villageClusterID || "-");

        return {
          id: `member-saving:${String(
            row.recID || [row.sppCode, row.date].filter(Boolean).join("-"),
          )}`,
          section: "Member Savings",
          title:
            memberNameMap.get(String(row.sppCode || "").trim()) ||
            `Member ${String(row.sppCode || "-")}`,
          subtitle: String(group?.groupname || row.groupCode || "-"),
          details: [
            `District: ${districtName}`,
            `TA: ${taName}`,
            `Village Cluster: ${villageClusterName}`,
            `Date: ${formatDate(row.date)}`,
          ],
          badge: formatMoney(row.amount),
          amountValue: toNumber(row.amount),
          searchText: makeSearchText([
            row.sppCode,
            row.groupCode,
            group?.groupname,
            districtName,
            taName,
            villageClusterName,
            row.date,
            row.sType,
            typeMap[String(row.sType || "")],
            row.amount,
          ]),
        };
      });

    return metric === "savingsGroup" ? groupItems : memberItems;
  }

  if (metric === "groupIGAs" || metric === "memberIGAs") {
    const { districtMap, taMap, vcMap } = await buildLocationMaps(visibleGroups);
    const groupMetaMap = new Map(
      visibleGroups.map((group) => [String(group.groupID || "").trim(), group]),
    );
    const [groupIGAs, memberIGAs, categories, igaTypes, beneficiariesByGroup] = await Promise.all([
      apiGet<GroupIGA[]>("/group-igas"),
      apiGet<MemberIGA[]>("/member-igas"),
      apiGet<BusinessCategoryRow[]>("/business-categories"),
      apiGet<IGATypeRow[]>("/iga-types"),
      Promise.all(
        visibleVillageClusters.map((villageClusterID) =>
          apiGet<BeneficiaryLookupRow[]>(
            `/beneficiaries/filter?villageClusterID=${encodeURIComponent(
              villageClusterID,
            )}`,
          ),
        ),
      ),
    ]);

    const categoryMap = Object.fromEntries(
      (Array.isArray(categories) ? categories : []).map((row) => [
        String(row.categoryID || ""),
        row.catname || String(row.categoryID || ""),
      ]),
    );
    const typeMap = Object.fromEntries(
      (Array.isArray(igaTypes) ? igaTypes : []).map((row) => [
        String(row.ID || ""),
        row.name || String(row.ID || ""),
      ]),
    );
    const memberNameMap = new Map<string, string>();
    beneficiariesByGroup
      .flatMap((rows) => (Array.isArray(rows) ? rows : []))
      .forEach((row) => {
        const sppCode = String(row.sppCode || "").trim();
        if (!sppCode) return;
        memberNameMap.set(
          sppCode,
          String(row.hh_head_name || "").trim() || sppCode,
        );
      });

    const rows =
      metric === "groupIGAs"
        ? (Array.isArray(groupIGAs) ? groupIGAs : []).filter((row) =>
            visibleGroupIds.has(String(row.groupID || "")),
          )
        : (Array.isArray(memberIGAs) ? memberIGAs : []).filter((row) =>
            visibleGroupIds.has(String(row.groupID || "")),
          );

    return rows.map((row) => {
      const group = groupMetaMap.get(String(row.groupID || "").trim());
      const districtName =
        districtMap[String(group?.DistrictID || group?.districtID || "").trim()] ||
        String(group?.DistrictID || group?.districtID || "-");
      const taName =
        taMap[String(group?.TAID || group?.taID || "").trim()] ||
        String(group?.TAID || group?.taID || "-");
      const villageClusterName =
        vcMap[String(group?.villageClusterID || "").trim()] ||
        String(group?.villageClusterID || "-");

        return {
          id: `${metric}:${String(
            row.recID ||
              [row.groupID, row.type, row.imonth, row.iyear].filter(Boolean).join("-"),
          )}`,
        title:
          typeMap[String(row.type || "")] ||
          categoryMap[String(row.bus_category || "")] ||
          "IGA Record",
        subtitle:
          metric === "groupIGAs"
            ? String(group?.groupname || row.groupID || "-")
            : memberNameMap.get(String((row as MemberIGA).sppCode || "").trim()) ||
              `Member ${String((row as MemberIGA).sppCode || "-")}`,
        details: [
          `Group: ${String(group?.groupname || row.groupID || "-")}`,
          `District: ${districtName}`,
          `TA: ${taName}`,
          `Village Cluster: ${villageClusterName}`,
          `Category: ${
            categoryMap[String(row.bus_category || "")] ||
            String(row.bus_category || "-")
          }`,
          `Period: ${monthName(row.imonth)} ${String(row.iyear || "-")}`,
          ...(metric === "groupIGAs"
            ? [
                `Males: ${toNumber((row as GroupIGA).no_male)}`,
                `Females: ${toNumber((row as GroupIGA).no_female)}`,
              ]
            : []),
        ],
        badge: formatMoney(row.amount_invested),
        searchText: makeSearchText([
          row.groupID,
          group?.groupname,
          (row as MemberIGA).sppCode,
          districtName,
          taName,
          villageClusterName,
          row.bus_category,
          categoryMap[String(row.bus_category || "")],
          row.type,
          typeMap[String(row.type || "")],
          row.imonth,
          row.iyear,
          row.amount_invested,
        ]),
      };
    });
  }

  return [];
};
