import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDebatsUnCached } from "./getDebats";

function response(data: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => ({ data }),
  } as Response;
}

describe("getDebatsUnCached", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL = "https://tricoteuses.test";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("démarre les actes sans attendre les points ODJ et borne la fraîcheur du cache", async () => {
    let release!: (value: Response) => void;
    const points = new Promise<Response>((resolve) => { release = resolve; });
    const mock = vi.fn((input: string | URL | Request, _options?: RequestInit) => String(input).includes("/points_odj/")
      ? points : Promise.resolve(response({ actesLegislatifs: [] })));
    vi.stubGlobal("fetch", mock);
    const pending = getDebatsUnCached("DOSSIER");
    expect(mock).toHaveBeenCalledTimes(2);
    release(response([]));
    expect(await pending).toEqual([]);
    expect(mock.mock.calls[0][1]).toEqual({ next: { revalidate: 60 } });
  });

  it("conserve une transcription en commission et en séance quand le CR est absent", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/points_odj/")) return response([
        { agendaRef: { xsiType: "seance_type", transcriptionRefUid: "TR-SEANCE", compteRenduRef: [{ uid: "TR-SEANCE", chambre: "AN" }] } },
        { agendaRef: { xsiType: "reunionCommission_type", transcriptionRefUid: "TR-COMMISSION", compteRenduRef: [{ uid: "TR-COMMISSION", chambre: "AN" }] } },
      ]);
      if (url.includes("/dossiers/")) return response({ actesLegislatifs: [] });
      return response({ uid: url.includes("TR-SEANCE") ? "TR-SEANCE" : "TR-COMMISSION", _count: { paragraphes: 1 } });
    }));
    expect((await getDebatsUnCached("DOSSIER"))?.map((d) => [d.uid, d.debateType])).toEqual([
      ["TR-SEANCE", "seance"], ["TR-COMMISSION", "commission"],
    ]);
  });

  it("une panne des actes ou d'un CR ne masque pas le CR encore disponible", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/points_odj/")) return response([
        { agendaRef: { xsiType: "seance_type", compteRenduRef: [{ uid: "CR-OK", chambre: "AN" }] } },
        { agendaRef: { xsiType: "seance_type", compteRenduRef: [{ uid: "CR-FAIL", chambre: "AN" }] } },
      ]);
      if (url.includes("/dossiers/")) throw new Error("Network");
      if (url.includes("CR-FAIL")) return response(null, false);
      return response({ uid: "CR-OK", dateSeance: "2026-07-15", _count: { paragraphes: 1 } });
    }));
    const result = await getDebatsUnCached("DOSSIER");
    expect(result?.map((d) => d.uid)).toEqual(["CR-OK"]);
    expect(result?.[0].dateSeance).toBeInstanceOf(Date);
  });

  it("retrouve les CR d'une commission spéciale même sans points ODJ", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);

      if (url.includes("/points_odj/")) {
        return response([
          {
            agendaRef: {
              uid: "REUNION-SEANCE",
              xsiType: "seance_type",
              timestampDebut: "2026-07-15T13:00:00.000Z",
              compteRenduRefUid: "CRS-SEANCE",
              transcriptionRefUid: "TR-SEANCE",
              compteRenduRef: [
                { uid: "TR-SEANCE", chambre: "AN" },
                { uid: "CRS-SEANCE", chambre: "AN" },
              ],
            },
          },
        ]);
      }
      if (url.includes("/dossiers/")) {
        return response({
          actesLegislatifs: [
            {
              chambre: "AN",
              codeActe: "AN1-COM-FOND",
              dateActe: "2026-05-27T00:00:00.000Z",
              organeRefUid: "PO-SPECIALE",
              reunionRefUid: null,
              organeRef: {
                uid: "PO-SPECIALE",
                codeType: "CNPS",
                libelle: "Commission spéciale du dossier",
              },
            },
            {
              chambre: "AN",
              codeActe: "AN1-DEBATS-SEANCE",
              dateActe: "2026-07-15T00:00:00.000Z",
              reunionRefUid: "REUNION-SEANCE",
            },
            {
              chambre: "AN",
              codeActe: "AN2-COM-FOND",
              dateActe: "2026-09-01T00:00:00.000Z",
              organeRefUid: "PO-SPECIALE",
              reunionRefUid: null,
              organeRef: {
                uid: "PO-SPECIALE",
                codeType: "CNPS",
                libelle: "Commission spéciale du dossier",
              },
            },
          ],
        });
      }
      if (url.includes("/reunions/?")) {
        return response([
          {
            uid: "REUNION-COMMISSION",
            xsiType: "reunionCommission_type",
            etat: "Terminé",
            timestampDebut: "2026-07-01T07:40:00.000Z",
            compteRenduRefUid: "CRC-COMMISSION",
            transcriptionRefUid: "TR-COMMISSION",
            compteRenduRef: [
              { uid: "TR-COMMISSION", chambre: "AN" },
              { uid: "CRC-COMMISSION", chambre: "AN" },
            ],
          },
          {
            uid: "REUNION-COMMISSION-2",
            xsiType: "reunionCommission_type",
            etat: "Terminé",
            timestampDebut: "2026-09-02T13:00:00.000Z",
            compteRenduRefUid: "CRC-COMMISSION-2",
            compteRenduRef: [
              { uid: "CRC-COMMISSION-2", chambre: "AN" },
            ],
          },
        ]);
      }
      if (url.includes("/debats/CRS-SEANCE")) {
        return response({
          uid: "CRS-SEANCE",
          chambre: "AN",
          dateSeance: "2026-07-15T00:00:00.000Z",
          _count: { paragraphes: 2 },
        });
      }
      if (url.includes("/debats/CRC-COMMISSION-2")) {
        return response({
          uid: "CRC-COMMISSION-2",
          chambre: "AN",
          dateSeance: "2026-09-02T00:00:00.000Z",
          _count: { paragraphes: 4 },
        });
      }
      if (url.includes("/debats/CRC-COMMISSION?")) {
        return response({
          uid: "CRC-COMMISSION",
          chambre: "AN",
          dateSeance: "2026-07-01T00:00:00.000Z",
          _count: { paragraphes: 3 },
        });
      }

      throw new Error(`URL inattendue : ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getDebatsUnCached("DOSSIER");

    expect(result?.map(
      ({ uid, debateType, organeLibelle, reunionDate, lectureLabel }) => ({
        uid,
        debateType,
        organeLibelle,
        reunionDate,
        lectureLabel,
      })
    )).toEqual([
      {
        uid: "CRC-COMMISSION",
        debateType: "commission",
        organeLibelle: "Commission spéciale du dossier",
        reunionDate: "2026-07-01T07:40:00.000Z",
        lectureLabel: "1re lecture",
      },
      {
        uid: "CRS-SEANCE",
        debateType: "seance",
        organeLibelle: null,
        reunionDate: "2026-07-15T13:00:00.000Z",
        lectureLabel: "1re lecture",
      },
      {
        uid: "CRC-COMMISSION-2",
        debateType: "commission",
        organeLibelle: "Commission spéciale du dossier",
        reunionDate: "2026-09-02T13:00:00.000Z",
        lectureLabel: "2e lecture",
      },
    ]);
  });

  it("ne rattache pas toutes les réunions d'une commission permanente", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/points_odj/")) return response([]);
      if (url.includes("/dossiers/")) {
        return response({
          actesLegislatifs: [
            {
              chambre: "AN",
              codeActe: "AN1-COM-FOND",
              organeRefUid: "PO-PERMANENTE",
              reunionRefUid: null,
              organeRef: {
                uid: "PO-PERMANENTE",
                codeType: "COMPER",
                libelle: "Commission permanente",
              },
            },
          ],
        });
      }
      throw new Error(`URL inattendue : ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getDebatsUnCached("DOSSIER")).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("suit une réunion de commission permanente explicitement référencée", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/points_odj/")) return response([]);
      if (url.includes("/dossiers/")) {
        return response({
          actesLegislatifs: [
            {
              chambre: "AN",
              codeActe: "AN1-COM-FOND-REUNION",
              organeRefUid: "PO-PERMANENTE",
              reunionRefUid: "REUNION-EXPLICITE",
              organeRef: {
                uid: "PO-PERMANENTE",
                codeType: "COMPER",
                libelle: "Commission permanente",
              },
            },
          ],
        });
      }
      if (url.includes("/reunions/REUNION-EXPLICITE")) {
        return response({
          uid: "REUNION-EXPLICITE",
          xsiType: "reunionCommission_type",
          compteRenduRef: [{ uid: "CRC-EXPLICITE", chambre: "AN" }],
        });
      }
      if (url.includes("/debats/CRC-EXPLICITE")) {
        return response({
          uid: "CRC-EXPLICITE",
          chambre: "AN",
          _count: { paragraphes: 1 },
        });
      }
      throw new Error(`URL inattendue : ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getDebatsUnCached("DOSSIER");

    expect(result).toHaveLength(1);
    expect(result?.[0]).toMatchObject({
      uid: "CRC-EXPLICITE",
      debateType: "commission",
    });
  });
});
