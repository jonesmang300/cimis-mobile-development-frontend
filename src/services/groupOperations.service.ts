import { apiGet, apiPatch, apiPost } from "./api";

export type GroupTraining = {
  TrainingID?: number;
  regionID?: string;
  districtID?: string;
  groupID?: string;
  TrainingTypeID?: string;
  StartDate?: string;
  FinishDate?: string;
  trainedBy?: string;
  Males?: number | string;
  Females?: number | string;
};

export type Meeting = {
  meetID?: number;
  purpose?: string;
  meetingdate?: string;
  minutes?: string;
  groupCode?: string;
};

export type MeetingAttendance = {
  id?: number;
  meetID?: number;
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
) => apiPost("/group-trainings", payload);

export const updateGroupTraining = async (
  trainingID: number,
  payload: Partial<GroupTraining>,
) =>
  apiPatch(
    `/group-trainings/${encodeURIComponent(String(trainingID))}`,
    payload,
  );

export const deleteGroupTraining = async (trainingID: number) =>
  apiPatch(
    `/group-trainings/${encodeURIComponent(String(trainingID))}/delete`,
    {},
  );

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
) => apiPost("/meetings", payload);

export const updateMeeting = async (
  meetingID: number,
  payload: Partial<Meeting>,
) => apiPatch(`/meetings/${encodeURIComponent(String(meetingID))}`, payload);

export const deleteMeeting = async (meetingID: number) =>
  apiPatch(`/meetings/${encodeURIComponent(String(meetingID))}/delete`, {});

export const fetchMeetingAttendance = async (): Promise<MeetingAttendance[]> => {
  const rows = await apiGet<MeetingAttendance[]>("/meeting-attendance");
  return Array.isArray(rows) ? rows : [];
};

export const createMeetingAttendance = async (
  payload: Required<Pick<MeetingAttendance, "meetID" | "groupCode" | "sppCode">>,
) => apiPost("/meeting-attendance", payload);

export const deleteMeetingAttendance = async (attendanceID: number) =>
  apiPatch(
    `/meeting-attendance/${encodeURIComponent(String(attendanceID))}/delete`,
    {},
  );

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
    Pick<
      MemberTraining,
      | "groupID"
      | "sppCode"
      | "TrainingID"
      | "attendance"
    >
  >,
) => apiPost("/member-trainings", payload);

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
) => apiPost("/group-igas", payload);

export const updateGroupIGA = async (
  recID: number,
  payload: Partial<GroupIGA>,
) => apiPatch(`/group-igas/${encodeURIComponent(String(recID))}`, payload);

export const deleteGroupIGA = async (recID: number) =>
  apiPatch(`/group-igas/${encodeURIComponent(String(recID))}/delete`, {});

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
) => apiPost("/member-igas", payload);

export const updateMemberIGA = async (
  recID: number,
  payload: Partial<MemberIGA>,
) => apiPatch(`/member-igas/${encodeURIComponent(String(recID))}`, payload);

export const deleteMemberIGA = async (recID: number) =>
  apiPatch(`/member-igas/${encodeURIComponent(String(recID))}/delete`, {});
