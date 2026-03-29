import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.fn();

vi.mock("./api", () => ({
  apiGet,
}));

describe("getVerifiedMemberBySppCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the query-string beneficiary route and encodes sppCode safely", async () => {
    apiGet.mockResolvedValue({
      sppCode: "080801004/0019",
      hh_head_name: "Jane Doe",
    });

    const { getVerifiedMemberBySppCode } = await import("./viewVerifiedMember.service");

    const result = await getVerifiedMemberBySppCode("080801004/0019");

    expect(apiGet).toHaveBeenCalledWith(
      "/beneficiaries?sppCode=080801004%2F0019",
    );
    expect(result).toEqual({
      sppCode: "080801004/0019",
      hh_head_name: "Jane Doe",
    });
  });
});
