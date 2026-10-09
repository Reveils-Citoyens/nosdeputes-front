import * as React from "react";
import { getActeurBySlug } from "@/data/getActeurBySlug";
import { formatCirco } from "@/utils/formatCirco";
import { chargerPhoto, couleursOg, imageDePartage, Pastille, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import ImageParDefaut from "@/app/opengraph-image";

export const alt = "Fiche du député sur NosDéputés.fr";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Volontairement sans statistiques d'activité : sorties de leur contexte
// (présidence de séance, attribution des mesures, période), elles
// induiraient en erreur sur une image partagée.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const depute = await getActeurBySlug(slug);
  if (depute === null) return ImageParDefaut();

  const photo = await chargerPhoto(depute.urlImage);
  const groupe = depute.groupeParlementaire;
  const couleurGroupe = groupe?.couleurAssociee || "#9CA3AF";
  const circo = depute.mandatPrincipal
    ? formatCirco(
        depute.mandatPrincipal.numCirco,
        depute.mandatPrincipal.departement,
        depute.mandatPrincipal.numDepartement,
      )
    : "";
  const nomComplet = `${depute.prenom} ${depute.nom}`;
  const mandatAcheve = depute.chambre === "AN" && depute.actif === false;
  const qualite = depute.chambre === "AN" ? (depute.civ === "Mme" ? "Députée" : "Député") : "Parlementaire";

  return imageDePartage({
    rubrique: qualite,
    lisere: couleurGroupe,
    children: (
      <div style={{ display: "flex", alignItems: "center", gap: 56, width: "100%" }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            width={250}
            height={320}
            alt=""
            style={{ objectFit: "cover", borderRadius: 24, border: `1px solid ${couleursOg.bordure}` }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 250,
              height: 320,
              borderRadius: 24,
              backgroundColor: couleursOg.fondDoux,
              fontSize: 96,
              fontWeight: 700,
              color: couleursOg.secondaire,
            }}
          >
            {`${depute.prenom[0] ?? ""}${depute.nom[0] ?? ""}`}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 22, flex: 1 }}>
          <div style={{ fontSize: nomComplet.length > 24 ? 64 : 76, fontWeight: 700, lineHeight: 1.05 }}>
            {nomComplet}
          </div>
          {circo && (
            <div style={{ fontSize: 34, fontWeight: 500, color: couleursOg.secondaire }}>
              {`${qualite} de la ${circo}`}
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 8 }}>
            {groupe && <Pastille point={couleurGroupe}>{groupe.libelleAbrev || groupe.libelle}</Pastille>}
            {depute.auGouvernement && (
              <Pastille couleur="#1E40AF" fond="#DBEAFE">Membre du Gouvernement</Pastille>
            )}
            {mandatAcheve && <Pastille>Mandat achevé</Pastille>}
          </div>
          {groupe && groupe.libelleAbrev && groupe.libelle !== groupe.libelleAbrev && (
            <div style={{ fontSize: 26, color: couleursOg.secondaire }}>{groupe.libelle}</div>
          )}
        </div>
      </div>
    ),
  });
}
