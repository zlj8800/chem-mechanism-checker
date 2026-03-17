describe("getGeminiModel", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("throws when GEMINI_API_KEY is not set", async () => {
    delete process.env.GEMINI_API_KEY;
    const { getGeminiModel } = await import("@/lib/gemini");
    expect(() => getGeminiModel()).toThrow(
      "GEMINI_API_KEY environment variable is not set"
    );
  });

  it("returns a model when API key is set", async () => {
    process.env.GEMINI_API_KEY = "test-key-12345";
    const { getGeminiModel } = await import("@/lib/gemini");
    const model = getGeminiModel();
    expect(model).toBeDefined();
    expect(typeof model.startChat).toBe("function");
    expect(typeof model.generateContent).toBe("function");
  });
});
