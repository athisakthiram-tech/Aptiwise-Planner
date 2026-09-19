import { describe, it, expect, afterEach, vi } from "vitest";
import { shareViaWebShare } from "@/lib/customerPlan/export/webShareAdapter";

const originalNavigator = globalThis.navigator;

afterEach(() => {
  Object.defineProperty(globalThis, "navigator", { value: originalNavigator, configurable: true });
  vi.restoreAllMocks();
});

function setNavigator(nav: Partial<Navigator> | undefined) {
  Object.defineProperty(globalThis, "navigator", { value: nav, configurable: true });
}

describe("shareViaWebShare — progressive Web Share adapter", () => {
  it("reports 'unsupported' when navigator.share does not exist", async () => {
    setNavigator({} as Partial<Navigator>);
    const outcome = await shareViaWebShare({ title: "t", text: "x" });
    expect(outcome.status).toBe("unsupported");
  });

  it("reports 'unsupported' when navigator itself is unavailable", async () => {
    setNavigator(undefined);
    const outcome = await shareViaWebShare({ title: "t", text: "x" });
    expect(outcome.status).toBe("unsupported");
  });

  it("shares text-only successfully when supported and no files are requested", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator({ share } as unknown as Partial<Navigator>);
    const outcome = await shareViaWebShare({ title: "Aptiwise", text: "hello" });
    expect(outcome).toEqual({ status: "shared", usedFiles: false });
    expect(share).toHaveBeenCalledWith({ title: "Aptiwise", text: "hello" });
  });

  it("falls back to text-only when file sharing is requested but canShare rejects files", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(false);
    setNavigator({ share, canShare } as unknown as Partial<Navigator>);
    const fakeFile = { name: "proposal.pdf" } as unknown as File;
    const outcome = await shareViaWebShare({ title: "t", text: "x", files: [fakeFile] });
    expect(outcome).toEqual({ status: "shared", usedFiles: false });
    expect(share).toHaveBeenCalledWith({ title: "t", text: "x" });
  });

  it("shares files when canShare confirms file support", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    setNavigator({ share, canShare } as unknown as Partial<Navigator>);
    const fakeFile = { name: "proposal.pdf" } as unknown as File;
    const outcome = await shareViaWebShare({ title: "t", text: "x", files: [fakeFile] });
    expect(outcome).toEqual({ status: "shared", usedFiles: true });
    expect(share).toHaveBeenCalledWith({ title: "t", text: "x", files: [fakeFile] });
  });

  it("reports 'cancelled' (not 'failed') when the user dismisses the native share sheet", async () => {
    const abortError = new DOMException("The user aborted a request.", "AbortError");
    const share = vi.fn().mockRejectedValue(abortError);
    setNavigator({ share } as unknown as Partial<Navigator>);
    const outcome = await shareViaWebShare({ title: "t", text: "x" });
    expect(outcome.status).toBe("cancelled");
  });

  it("reports a genuine 'failed' outcome for any other error", async () => {
    const share = vi.fn().mockRejectedValue(new Error("Something went wrong"));
    setNavigator({ share } as unknown as Partial<Navigator>);
    const outcome = await shareViaWebShare({ title: "t", text: "x" });
    expect(outcome).toEqual({ status: "failed", message: "Something went wrong" });
  });

  it("never crashes on a non-Error rejection value", async () => {
    const share = vi.fn().mockRejectedValue("plain string rejection");
    setNavigator({ share } as unknown as Partial<Navigator>);
    const outcome = await shareViaWebShare({ title: "t", text: "x" });
    expect(outcome.status).toBe("failed");
  });
});
