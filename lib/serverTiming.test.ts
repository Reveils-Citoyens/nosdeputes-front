import { afterEach, describe, expect, it, vi } from "vitest";
import { startServerTiming } from "./serverTiming";
describe("instrumentation sans données personnelles", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
  it("expose uniquement une durée et reste silencieuse par défaut", () => {
    vi.stubEnv("PERF_DIAGNOSTICS", "0");
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    expect(startServerTiming("mongo-amendements")()).toMatch(/^mongo-amendements;dur=\d+\.\d$/);
    expect(log).not.toHaveBeenCalled();
  });
  it("permet des journaux de diagnostic explicites", () => {
    vi.stubEnv("PERF_DIAGNOSTICS", "1");
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    startServerTiming("debats-metadata")();
    expect(log.mock.calls[0][0]).toMatch(/^\[performance\] debats-metadata \d+\.\dms$/);
  });
});
