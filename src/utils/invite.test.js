import { describe, it, expect } from "vitest";
import { generateInviteCode, normalizeInviteCode, isWellFormedInviteCode } from "./invite.js";

describe("generateInviteCode", () => {
  it("produces an 8 character code", () => {
    expect(generateInviteCode()).toHaveLength(8);
  });

  it("never uses characters that are easy to misread aloud", () => {
    const codes = Array.from({ length: 200 }, () => generateInviteCode()).join("");
    expect(codes).not.toMatch(/[OIL01]/);
  });

  it("does not repeat itself in practice", () => {
    const codes = new Set(Array.from({ length: 500 }, () => generateInviteCode()));
    expect(codes.size).toBeGreaterThan(495);
  });
});

describe("normalizeInviteCode", () => {
  it("accepts what people actually type", () => {
    expect(normalizeInviteCode(" k7rm-29pq ")).toBe("K7RM29PQ");
  });

  it("handles empty input without throwing", () => {
    expect(normalizeInviteCode(undefined)).toBe("");
  });
});

describe("isWellFormedInviteCode", () => {
  it("passes a generated code", () => {
    expect(isWellFormedInviteCode(generateInviteCode())).toBe(true);
  });

  it("rejects wrong lengths and ambiguous characters", () => {
    expect(isWellFormedInviteCode("K7RM29P")).toBe(false);
    expect(isWellFormedInviteCode("K7RM29PO")).toBe(false);
  });
});
