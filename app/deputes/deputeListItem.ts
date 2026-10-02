import type { ActeurDepute } from "@/data/getDeputes";

export type DeputeListItem = Pick<ActeurDepute,
  "uid" | "nom" | "prenom" | "slug" | "urlImage" | "groupeParlementaireUid" | "auGouvernement"
> & {
  mandatPrincipal?: Pick<ActeurDepute["mandatPrincipal"],
    "numCirco" | "departement" | "numDepartement" | "dateFin"
  >;
};

export function toDeputeListItem(acteur: ActeurDepute): DeputeListItem {
  const mandat = acteur.mandatPrincipal;
  return {
    uid: acteur.uid, nom: acteur.nom, prenom: acteur.prenom,
    slug: acteur.slug, urlImage: acteur.urlImage,
    groupeParlementaireUid: acteur.groupeParlementaireUid,
    auGouvernement: acteur.auGouvernement,
    mandatPrincipal: mandat ? {
      numCirco: mandat.numCirco, departement: mandat.departement,
      numDepartement: mandat.numDepartement, dateFin: mandat.dateFin,
    } : undefined,
  };
}
