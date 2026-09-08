// La config vitest ne fixe pas le runtime JSX automatique : import explicite.
import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Verbatim from "@/components/Verbatim";

const rendu = (texte: string) => renderToStaticMarkup(<Verbatim texte={texte} />);

describe("Verbatim", () => {
  it("convertit les quatre balises de l'Assemblée", () => {
    expect(rendu("a<br>b")).toBe("a<br/>b");
    expect(rendu("a<br/>b")).toBe("a<br/>b");
    expect(rendu("<italique>mot</italique>")).toBe("<em>mot</em>");
    expect(rendu("m<exposant>2</exposant>")).toBe("m<sup>2</sup>");
    expect(rendu("CO<indice>2</indice>")).toBe("CO<sub>2</sub>");
  });

  it("décode les entités", () => {
    expect(rendu("Pierre &amp; Paul")).toBe("Pierre &amp; Paul");
    expect(rendu("l&#x2019;Assemblée")).toContain("l’Assemblée");
  });

  it("n'injecte pas de balise inconnue", () => {
    // Une balise non prévue reste du texte échappé, jamais du HTML.
    expect(rendu("<script>alert(1)</script>")).not.toContain("<script>");
    expect(rendu("<b>gras</b>")).not.toContain("<b>gras</b>");
  });

  it("gère l'imbrication et les balises non refermées", () => {
    expect(rendu("<italique>a<exposant>1</exposant></italique>")).toBe(
      "<em>a<sup>1</sup></em>"
    );
    expect(rendu("<italique>jamais fermé")).toContain("jamais fermé");
  });
});
