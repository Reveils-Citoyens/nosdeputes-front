import { afterEach, describe, expect, it, vi } from "vitest";

const collections: Record<string, unknown[]> = {
  acteurs: [],
  dossiers: [
    { uid: "DLR5L17N54776", legislature: "17", procedureParlementaire: { code: "1" }, titreDossier: { titre: "Violences sexuelles" } },
    { uid: "DLR5L17N1", legislature: "17", procedureParlementaire: { code: "10" }, titreDossier: { titre: "Mission sur l'eau" } },
    { uid: "DLR5L17N2", legislature: "17", procedureParlementaire: { code: "1" }, titres: { titrePrincipal: "Logement" } },
  ],
  reunions: [
    { uid: "RU1", organeReuniRef: "PO1" },
    // Commission : un seul texte à l'ordre du jour.
    { uid: "RUANR5L17S2026IDC1", organeReuniRef: "PO2", ODJ: { pointsODJ: { pointODJ: { uid: "PT1", dossiersLegislatifsRefs: { dossierRef: "DLR5L17N54776" } } } } },
    // Séance : plusieurs textes.
    {
      uid: "RUANR5L17S2026IDS2",
      organeReuniRef: "PO838901",
      ODJ: { pointsODJ: { pointODJ: [
        { uid: "PT-A", dossiersLegislatifsRefs: { dossierRef: "DLR5L17N54776" } },
        { uid: "PT-B", dossiersLegislatifsRefs: { dossierRef: "DLR5L17N2" } },
      ] } },
    },
  ],
  organes: [{ uid: "PO1", libelle: "Mission sur l'eau" }],
};
vi.mock("@/lib/mongodb", () => ({
  getParlementDb: async () => ({
    collection: (nom: string) => ({
      find: (filtre: Record<string, any>) => ({
        toArray: async () =>
          (collections[nom] ?? []).filter((doc: any) => {
            if (filtre.uid?.$in) return filtre.uid.$in.includes(doc.uid);
            if (filtre["titreDossier.titre"]?.$in) return filtre["titreDossier.titre"].$in.includes(doc.titreDossier?.titre);
            return true;
          }),
      }),
    }),
  }),
}));

function api(data: unknown[]) {
  const fetchMock = vi.fn(async (_input: string, _init?: RequestInit) =>
    new Response(JSON.stringify({ data }), { headers: { total: "42" } })
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function charger() {
  vi.stubEnv("NEXT_PUBLIC_TRICOTEUSES_API_URL", "https://api.test");
  vi.resetModules();
  return import("./searchInterventions");
}

describe("searchInterventions", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("ne demande que les champs utiles et ne transmet qu'un extrait", async () => {
    const fetchMock = api([{ uid: "I1", texte: `<p>${"mot ".repeat(5000)}</p>`, debatRefUid: "CRSANR5L17S2026O1N1" }]);
    const { searchInterventions } = await charger();

    const r = await searchInterventions("logement", { page: 2, perPage: 5 });

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get("select")?.split(",")).toEqual(
      expect.arrayContaining(["uid", "texte", "orateur", "dossierRefUid", "reunionRefUid", "debatRefUid"])
    );
    expect(url.searchParams.get("page")).toBe("2");
    expect(r.total).toBe(42);
    expect(r.items[0].texte.length).toBeLessThanOrEqual(401);
    expect(r.items[0].texte.endsWith("…")).toBe(true);
  });

  it("fournit le titre et la page du dossier, en plus du compte rendu", async () => {
    api([
      { uid: "I1", texte: "Intervention en séance", debatRefUid: "CRSANR5L17S2026O1N1", dossierRefUid: "DLR5L17N54776" },
      { uid: "I2", texte: "Audition de la mission", debatRefUid: "CRCANR5L17S2026PO1N1", reunionRefUid: "RU1" },
      { uid: "I3", texte: "Sans dossier", debatRefUid: "CRSANR5L17S2026O1N2" },
    ]);
    const { searchInterventions } = await charger();

    const [seance, mission, orphelin] = (await searchInterventions("logement")).items;

    expect(seance).toMatchObject({
      dossierTitre: "Violences sexuelles",
      dossierHref: "/17/dossier/DLR5L17N54776",
      href: "/17/dossier/DLR5L17N54776/debat/CRSANR5L17S2026O1N1",
    });
    expect(mission).toMatchObject({
      dossierTitre: "Mission sur l'eau",
      dossierHref: "/17/dossier/DLR5L17N1",
      href: "/17/dossier/DLR5L17N1/comptes-rendus/CRCANR5L17S2026PO1N1",
    });
    expect(orphelin).toMatchObject({ dossierTitre: null, dossierHref: null, href: null });
  });

  it("rattache les transcriptions par l'ordre du jour de leur réunion, sans deviner", async () => {
    api([
      { uid: "T1", texte: "Transcription de commission", debatRefUid: "TR-ANR5L17S2026IDC1", reunionRefUid: "RUANR5L17S2026IDC1" },
      { uid: "T2", texte: "Transcription de séance, point B", debatRefUid: "TR-ANR5L17S2026IDS2", reunionRefUid: "RUANR5L17S2026IDS2", pointOdjRefUid: "PT-B" },
      { uid: "T3", texte: "Transcription de séance, point inconnu", debatRefUid: "TR-ANR5L17S2026IDS2", reunionRefUid: "RUANR5L17S2026IDS2" },
    ]);
    const { searchInterventions } = await charger();

    const [commission, seance, ambigu] = (await searchInterventions("logement")).items;

    expect(commission).toMatchObject({
      type: "commission",
      dossierHref: "/17/dossier/DLR5L17N54776",
      href: "/17/dossier/DLR5L17N54776/commission/TR-ANR5L17S2026IDC1",
    });
    expect(seance).toMatchObject({
      type: "seance",
      dossierTitre: "Logement",
      href: "/17/dossier/DLR5L17N2/debat/TR-ANR5L17S2026IDS2",
    });
    expect(ambigu).toMatchObject({ type: "seance", dossierHref: null, href: null });
  });
});
