import { describe, expect, it } from "vitest";
import { groupesCites } from "./ParoleItem";

describe("groupesCites", () => {
  it("lit les groupes d'une interruption collective", () => {
    expect(groupesCites("Un député du groupe LFI-NFP")).toEqual(["LFI-NFP"]);
    expect(groupesCites("Plusieurs députés des groupes LFI-NFP et SOC")).toEqual(["LFI-NFP", "SOC"]);
    expect(groupesCites("Plusieurs députés des groupes RN, UDR et DR.")).toEqual(["RN", "UDR", "DR"]);
  });

  it("ignore un orateur nommé", () => {
    expect(groupesCites("M. Thibault Bazin")).toEqual([]);
    expect(groupesCites(null)).toEqual([]);
  });
});
