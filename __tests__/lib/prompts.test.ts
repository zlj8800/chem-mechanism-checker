import { SYSTEM_PROMPT } from "@/lib/prompts";

describe("SYSTEM_PROMPT", () => {
  it("is a non-empty string", () => {
    expect(typeof SYSTEM_PROMPT).toBe("string");
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(100);
  });

  it("mentions key reaction types", () => {
    expect(SYSTEM_PROMPT).toContain("SN1");
    expect(SYSTEM_PROMPT).toContain("SN2");
    expect(SYSTEM_PROMPT).toContain("E1");
    expect(SYSTEM_PROMPT).toContain("E2");
  });

  it("instructs identification of mechanism type", () => {
    expect(SYSTEM_PROMPT).toContain("Identify the Reaction Type");
  });

  it("instructs verification of correctness", () => {
    expect(SYSTEM_PROMPT).toContain("Verify Correctness");
  });

  it("instructs error pinpointing", () => {
    expect(SYSTEM_PROMPT).toContain("Pinpoint Errors");
  });

  it("instructs teaching", () => {
    expect(SYSTEM_PROMPT).toContain("Teach");
  });

  it("instructs providing the correct mechanism", () => {
    expect(SYSTEM_PROMPT).toContain("Provide the Correct Mechanism");
  });

  it("covers electron-pushing diagrams", () => {
    expect(SYSTEM_PROMPT).toContain("electron-pushing diagrams");
    expect(SYSTEM_PROMPT).toContain("curved arrows");
  });

  it("covers structure determination", () => {
    expect(SYSTEM_PROMPT).toContain("structure determination");
  });

  it("specifies response format sections", () => {
    expect(SYSTEM_PROMPT).toContain("Mechanism Type");
    expect(SYSTEM_PROMPT).toContain("Verdict");
    expect(SYSTEM_PROMPT).toContain("Errors Found");
    expect(SYSTEM_PROMPT).toContain("Correct Mechanism");
    expect(SYSTEM_PROMPT).toContain("Key Concepts");
    expect(SYSTEM_PROMPT).toContain("Study Tips");
  });
});
