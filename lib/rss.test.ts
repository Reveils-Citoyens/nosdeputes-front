import { describe, expect, it } from "vitest";
import { dateDuJour, echapperXml, formatJour, preparerElements, rendreRss, MAX_ELEMENTS, type ElementFlux } from "./rss";

const element = (guid: string, jour: string, extra: Partial<ElementFlux> = {}): ElementFlux => ({
  guid,
  titre: guid,
  lien: "/x",
  date: dateDuJour(jour)!,
  ...extra,
});

describe("echapperXml", () => {
  it("échappe les caractères réservés et retire les contrôles interdits", () => {
    expect(echapperXml(`Loi « A & B » <i>"x"</i> l'État\u0001\u000B`)).toBe(
      "Loi « A &amp; B » &lt;i&gt;&quot;x&quot;&lt;/i&gt; l&apos;État",
    );
  });
});

describe("dates", () => {
  it("place un jour à 10 h UTC, qu'il arrive en chaîne ou à minuit UTC", () => {
    expect(dateDuJour("2026-07-21")?.toISOString()).toBe("2026-07-21T10:00:00.000Z");
    expect(dateDuJour("2026-07-21T00:00:00.000Z")?.toISOString()).toBe("2026-07-21T10:00:00.000Z");
    expect(dateDuJour(new Date("2026-07-21T00:00:00Z"))?.toISOString()).toBe("2026-07-21T10:00:00.000Z");
    expect(dateDuJour(null)).toBeNull();
    expect(dateDuJour("pas une date")).toBeNull();
  });
  it("écrit « 1er » pour le premier du mois", () => {
    expect(formatJour(dateDuJour("2026-10-01")!)).toBe("1er octobre 2026");
    expect(formatJour(dateDuJour("2026-10-11")!)).toBe("11 octobre 2026");
  });
});

describe("preparerElements", () => {
  it("trie du plus récent au plus ancien, dédoublonne les guid et limite", () => {
    const tries = preparerElements([element("a", "2026-01-01"), element("b", "2026-03-01"), element("a", "2026-02-01")]);
    expect(tries.map((e) => e.guid)).toEqual(["b", "a"]);
    const beaucoup = Array.from({ length: MAX_ELEMENTS + 10 }, (_, i) => element(`e${i}`, "2026-01-01"));
    expect(preparerElements(beaucoup)).toHaveLength(MAX_ELEMENTS);
  });
});

describe("rendreRss", () => {
  it("produit un RSS 2.0 avec liens absolus, guid non permaliens et self", () => {
    const xml = rendreRss({
      titre: "Dossier & co",
      lien: "/17/dossier/D1",
      chemin: "/17/dossier/D1/rss.xml",
      description: "Description",
      elements: [element("acte-1", "2026-07-21", { titre: "Adoptée", description: "378 pour" })],
    });
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<rss version="2.0"/);
    expect(xml).toContain("<title>Dossier &amp; co</title>");
    expect(xml).toMatch(/<link>https?:\/\/[^<]+\/17\/dossier\/D1<\/link>/);
    expect(xml).toMatch(/<atom:link href="https?:\/\/[^"]+\/17\/dossier\/D1\/rss.xml" rel="self"/);
    expect(xml).toContain('<guid isPermaLink="false">acte-1</guid>');
    expect(xml).toContain("<pubDate>Tue, 21 Jul 2026 10:00:00 GMT</pubDate>");
    expect(xml).toContain("<lastBuildDate>Tue, 21 Jul 2026 10:00:00 GMT</lastBuildDate>");
    expect(xml.match(/<item>/g)).toHaveLength(1);
  });
  it("reste valide sans élément", () => {
    const xml = rendreRss({ titre: "T", lien: "/", chemin: "/rss.xml", description: "D", elements: [] });
    expect(xml).not.toContain("<item>");
    expect(xml).not.toContain("lastBuildDate");
    expect(xml).toContain("</channel>\n</rss>");
  });
});
