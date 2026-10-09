import { describe, expect, it } from "vitest";
import { openGraphPage } from "./metadata";

describe("openGraphPage", () => {
  it("réinjecte les champs communs et l'image par défaut", () => {
    const og = openGraphPage({ title: "Tous les députés" }) as Record<string, unknown>;
    expect(og).toMatchObject({
      type: "website",
      siteName: "NosDéputés.fr",
      locale: "fr_FR",
      title: "Tous les députés",
      images: { url: "/opengraph-image", width: 1200, height: 630 },
    });
  });
  it("ne déclare pas d'image quand la route a son opengraph-image", () => {
    // Déclarer `images` masquerait l'image générée pour ce segment.
    const og = openGraphPage({ type: "profile", title: "X" }, { imageDediee: true });
    expect(og).not.toHaveProperty("images");
    expect(og).toMatchObject({ type: "profile" });
  });
});
