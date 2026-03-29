import { apiGet, apiPatch, apiPost, updateCachedCollection } from "./api";

export type GroupTraining = {
  TrainingID?: string | number;
  regionID?: string;
  districtID?: string;
  groupID?: string;
  TrainingTypeID?: string;
  StartDate?: string;
  FinishDate?: string;
  trainedBy?: string;
  Males?: number | string;
  Females?: number | string;
  _queued?: boolean;
};

export type Meeting = {
  meetID?: string | number;
  purpose?: string;
  meetingdate?: string;
  minutes?: string;
  groupCode?: string;
  _queued?: boolean;
};

export type MeetingAttendance = {
  id?: string | number;
  meetID?: string | number;
  groupCode?: string;
  sppCode?: string;
};

export type MemberTraining = {
  RecordID?: number;
  groupID?: string;
  sppCode?: string;
  TrainingID?: string | number;
  attendance?: string;
  deleted?: string;
};

export type GroupIGA = {
  recID?: number;
  groupID?: string;
  districtID?: string;
  bus_category?: string;
  type?: string;
  no_male?: number | string;
  no_female?: number | string;
  amount_invested?: number | string;
  imonth?: string;
  iyear?: string;
};

export type MemberIGA = {
  recID?: number;
  groupID?: string;
  districtID?: string;
  sppCode?: string;
  bus_category?: string;
  type?: string;
  amount_invested?: number | string;
  imonth?: string;
  iyear?: string;
};

const prependCachedItem = <T>(items: T[], item: T) => [item, ...items];

const makeOfflineTempId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const updateCachedItem = <T extends Record<string, any>>(
  items: T[],
  idField: keyof T,
  idValue: string | number,
  patch: Partial<T>,
) =>
  items.map((item) =>
    String(item[idField] ?? "") === String(idValue)
      ? { ...item, ...patch }
      : item,
  );

const removeCachedItem = <T extends Record<string, any>>(
  items: T[],
  idField: keyof T,
  idValue: string | number,
) => items.filter((item) => String(item[idField] ?? "") !== String(idValue));

export const fetchGroupTrainingsByGroupID = async (
  groupID: string,
): Promise<GroupTraining[]> => {
  if (!groupID) return [];
  const rows = await apiGet<GroupTraining[]>("/group-trainings");
  return (Array.isArray(rows) ? rows : []).filter(
    (row) => String(row.groupID || "") === String(groupID),
  );
};

export const createGroupTraining = async (
  payload: Required<
    Pick<
      GroupTraining,
      | "regionID"
      | "districtID"
      | "groupID"
      | "TrainingTypeID"
      | "StartDate"
      | "FinishDate"
      | "trainedBy"
      | "Males"
      | "Females"
    >
  >,
) => {
  const offlineTrainingId = makeOfflineTempId("training");
  const created = await apiPost<GroupTraining & { id?: number; _queued?: boolean }>(
    "/group-trainings",
    {
      ...payload,
      TrainingID: offlineTrainingId,
    },
  );
  const nextTrainingId =
    created?._queued
      ? offlineTrainingId
      : created?.TrainingID ?? created?.id ?? undefined;
  await updateCachedCollection<GroupTraining>("/group-trainings", (items) =>
    prependCachedItem(items, {
      ...payload,
      TrainingID: nextTrainingId,
      _queued: Boolean(created?._queued),
    }),
  );
  return {
    ...created,
    TrainingID: nextTrainingId,
  };
};

export const updateGroupTraining = async (
  trainingID: string | number,
  payload: Partial<GroupTraining>,
) =>
  apiPatch(
    `/group-trainings/${encodeURIComponent(String(trainingID))}`,
    payload,
  ).then(async (result) => {
    await updateCachedCollection<GroupTraining>("/group-trainings", (items) =>
      updateCachedItem(items, "TrainingID", trainingID, payload),
    );
    return result;
  });

export const deleteGroupTraining = async (trainingID: string | number) =>
  apiPatch(
    `/group-trainings/${encodeURIComponent(String(trainingID))}/delete`,
    {},
  ).then(async (result) => {
    await updateCachedCollection<GroupTraining>("/group-trainings", (items) =>
      removeCachedItem(items, "TrainingID", trainingID),
    );
    return result;
  });

export const fetchMeetingsByGroupCode = async (
  groupCode: string,
): Promise<Meeting[]> => {
  if (!groupCode) return [];
  const rows = await apiGet<Meeting[]>("/meetings");
  return (Array.isArray(rows) ? rows : []).filter(
    (row) => String(row.groupCode || "") === String(groupCode),
  );
};

export const createMeeting = async (
  payload: Required<Pick<Meeting, "purpose" | "meetingdate" | "minutes" | "groupCode">>,
) => {
  const offlineMeetingId = makeOfflineTempId("meeting");
  const created = await apiPost<Meeting & { id?: number; _queued?: boolean }>(
    "/meetings",
    {
      ...payload,
      meetID: offlineMeetingId,
    },
  );
  const nextMeetingId =
    created?._queued
      ? offlineMeetingId
      : created?.meetID ?? created?.id ?? undefined;
  await updateCachedCollection<Meeting>("/meetings", (items) =>
    prependCachedItem(items, {
      ...payload,
      meetID: nextMeetingId,
      _queued: Boolean(created?._queued),
    }),
  );
  return {
    ...created,
    meetID: nextMeetingId,
  };
};

export const updateMeeting = async (
  meetingID: string | number,
  payload: Partial<Meeting>,
) =>
  apiPatch(`/meetings/${encodeURIComponent(String(meetingID))}`, payload).then(
    async (result) => {
      await updateCachedCollection<Meeting>("/meetings", (items) =>
        updateCachedItem(items, "meetID", meetingID, payload),
      );
      return result;
    },
  );

export const deleteMeeting = async (meetingID: string | number) =>
  apiPatch(`/meetings/${encodeURIComponent(String(meetingID))}/delete`, {}).then(
    async (result) => {
      await updateCachedCollection<Meeting>("/meetings", (items) =>
        removeCachedItem(items, "meetID", meetingID),
      );
      return result;
    },
  );

export const fetchMeetingAttendance = async (): Promise<MeetingAttendance[]> => {
  const rows = await apiGet<MeetingAttendance[]>("/meeting-attendance");
  return Array.isArray(rows) ? rows : [];
};

export const createMeetingAttendance = async (
  payload: Required<Pick<MeetingAttendance, "meetID" | "groupCode" | "sppCode">>,
) => {
  const created = await apiPost<MeetingAttendance & { id?: number }>(
    "/meeting-attendance",
    payload,
  );
  await updateCachedCollection<MeetingAttendance>("/meeting-attendance", (items) =>
    prependCachedItem(items, {
      ...payload,
      id: created?.id ?? undefined,
    }),
  );
  return created;
};

export const deleteMeetingAttendance = async (attendanceID: string | number) =>
  apiPatch(
    `/meeting-attendance/${encodeURIComponent(String(attendanceID))}/delete`,
    {},
  ).then(async (result) => {
    await updateCachedCollection<MeetingAttendance>("/meeting-attendance", (items) =>
      removeCachedItem(items, "id", attendanceID),
    );
    return result;
  });

export const fetchMemberTrainings = async (params?: {
  trainingID?: string | number;
  groupID?: string;
  sppCode?: string;
}): Promise<MemberTraining[]> => {
  const search = new URLSearchParams();
  if (params?.trainingID !== undefined) {
    search.set("trainingID", String(params.trainingID));
  }
  if (params?.groupID) {
    search.set("groupID", params.groupID);
  }
  if (params?.sppCode) {
    search.set("sppCode", params.sppCode);
  }

  const endpoint = search.toString()
    ? `/member-trainings?${search.toString()}`
    : "/member-trainings";

  const rows = await apiGet<MemberTraining[]>(endpoint);
  return Array.isArray(rows) ? rows : [];
};

export const createMemberTraining = async (
  payload: Required<
    Pick<MemberTraining, "groupID" | "sppCode" | "TrainingID" | "attendance">
  >,
) => {
  const created = await apiPost<MemberTraining & { id?: number }>("/member-trainings", payload);
  const cachedItem = {
    ...payload,
    RecordID: created?.RecordID ?? created?.id ?? undefined,
  };
  const endpoints = [
    `/member-trainings?groupID=${encodeURIComponent(String(payload.groupID || ""))}`,
    `/member-trainings?trainingID=${encodeURIComponent(
      String(payload.TrainingID || ""),
    )}&groupID=${encodeURIComponent(String(payload.groupID || ""))}`,
  ];

  await Promise.all(
    endpoints.map((endpoint) =>
      updateCachedCollection<MemberTraining>(endpoint, (items) =>
        prependCachedItem(items, cachedItem),
      ),
    ),
  );
  return created;
};

export const fetchGroupIGAsByGroupID = async (
  groupID: string,
): Promise<GroupIGA[]> => {
  if (!groupID) return [];
  const rows = await apiGet<GroupIGA[]>("/group-igas");
  return (Array.isArray(rows) ? rows : []).filter(
    (row) => String(row.groupID || "") === String(groupID),
  );
};

export const createGroupIGA = async (
  payload: Required<
    Pick<
      GroupIGA,
      | "groupID"
      | "districtID"
      | "bus_category"
      | "type"
      | "no_male"
      | "no_female"
      | "amount_invested"
      | "imonth"
      | "iyear"
    >
  >,
) => {
  const created = await apiPost<GroupIGA & { id?: number }>("/group-igas", payload);
  await updateCachedCollection<GroupIGA>("/group-igas", (items) =>
    prependCachedItem(items, {
      ...payload,
      recID: created?.recID ?? created?.id ?? undefined,
    }),
  );
  return created;
};

export const updateGroupIGA = async (
  recID: number,
  payload: Partial<GroupIGA>,
) =>
  apiPatch(`/group-igas/${encodeURIComponent(String(recID))}`, payload).then(
    async (result) => {
      await updateCachedCollection<GroupIGA>("/group-igas", (items) =>
        updateCachedItem(items, "recID", recID, payload),
      );
      return result;
    },
  );

export const deleteGroupIGA = async (recID: number) =>
  apiPatch(`/group-igas/${encodeURIComponent(String(recID))}/delete`, {}).then(
    async (result) => {
      await updateCachedCollection<GroupIGA>("/group-igas", (items) =>
        removeCachedItem(items, "recID", recID),
      );
      return result;
    },
  );

export const fetchMemberIGAs = async (): Promise<MemberIGA[]> => {
  const rows = await apiGet<MemberIGA[]>("/member-igas");
  return Array.isArray(rows) ? rows : [];
};

export const fetchMemberIGAsByMember = async (
  groupID: string,
  sppCode: string,
): Promise<MemberIGA[]> => {
  if (!groupID || !sppCode) return [];
  const rows = await fetchMemberIGAs();
  return rows.filter(
    (row) =>
      String(row.groupID || "") === String(groupID) &&
      String(row.sppCode || "") === String(sppCode),
  );
};

export const createMemberIGA = async (
  payload: Required<
    Pick<
      MemberIGA,
      | "groupID"
      | "districtID"
      | "sppCode"
      | "bus_category"
      | "type"
      | "amount_invested"
      | "imonth"
      | "iyear"
    >
  >,
) => {
  const created = await apiPost<MemberIGA & { id?: number }>("/member-igas", payload);
  await updateCachedCollection<MemberIGA>("/member-igas", (items) =>
    prependCachedItem(items, {
      ...payload,
      recID: created?.recID ?? created?.id ?? undefined,
    }),
  );
  return created;
};

export const updateMemberIGA = async (
  recID: number,
  payload: Partial<MemberIGA>,
) =>
  apiPatch(`/member-igas/${encodeURIComponent(String(recID))}`, payload).then(
    async (result) => {
      await updateCachedCollection<MemberIGA>("/member-igas", (items) =>
        updateCachedItem(items, "recID", recID, payload),
      );
      return result;
    },
  );

export const deleteMemberIGA = async (recID: number) =>
  apiPatch(`/member-igas/${encodeURIComponent(String(recID))}/delete`, {}).then(
    async (result) => {
      await updateCachedCollection<MemberIGA>("/member-igas", (items) =>
        removeCachedItem(items, "recID", recID),
      );
      return result;
    },
  );
