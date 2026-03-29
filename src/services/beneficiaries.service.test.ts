import { beforeEach, describe, expect, it, vi } from "vitest";

const apiPatch = vi.fn();
const updateCachedCollection = vi.fn();

vi.mock("./api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch,
  updateCachedCollection,
}));

vi.mock("../plugins/network", () => ({
  isOnline: vi.fn(),
}));

vi.mock("../utils/device", () => ({
  getStableDeviceId: vi.fn(),
}));

vi.mock("../data/db", () => ({
  saveOfflineGroup: vi.fn(),
  saveOfflineGroupMembers: vi.fn(),
  listOfflineMembersByGroupId: vi.fn(),
  listOfflineAssignments: vi.fn().mockResolvedValue([]),
}));

describe("updateBeneficiary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiPatch.mockResolvedValue(undefined);
    updateCachedCollection.mockResolvedValue(undefined);
  });

  it("sends the expected patch payload for the web edit flow", async () => {
    const { updateBeneficiary } = await import("./beneficiaries.service");

    await updateBeneficiary({
      sppCode: "SPP001",
      sex: "02",
      dob: "1990-04-20",
      nat_id: "AB123456",
      hh_size: 6,
      hh_code: "HH-001",
      groupname: "Alpha Group",
      groupCode: "GRP-1",
      villageClusterID: "VC-10",
      selected: 1,
    });

    expect(apiPatch).toHaveBeenCalledWith("/beneficiaries/SPP001", {
      sex: "02",
      dob: "1990-04-20",
      nat_id: "AB123456",
      hh_size: 6,
      hh_code: "HH-001",
      groupname: "Alpha Group",
      groupCode: "GRP-1",
      selected: "1",
    });

    expect(updateCachedCollection).toHaveBeenCalledTimes(2);
    expect(updateCachedCollection).toHaveBeenNthCalledWith(
      1,
      "/beneficiaries/filter?villageClusterID=VC-10",
      expect.any(Function),
    );
    expect(updateCachedCollection).toHaveBeenNthCalledWith(
      2,
      "/beneficiaries/group?groupCode=GRP-1",
      expect.any(Function),
    );
  });

  it("normalizes blank optional fields to null before patching", async () => {
    const { updateBeneficiary } = await import("./beneficiaries.service");

    await updateBeneficiary({
      sppCode: "SPP002",
      sex: null,
      dob: "",
      nat_id: "   ",
      hh_size: null,
      hh_code: " ",
      groupname: "",
      groupID: "GRP-2",
      selected: null,
    });

    expect(apiPatch).toHaveBeenCalledWith("/beneficiaries/SPP002", {
      sex: null,
      dob: null,
      nat_id: null,
      hh_size: null,
      hh_code: null,
      groupname: null,
      groupCode: "GRP-2",
      selected: null,
    });
  });
});
