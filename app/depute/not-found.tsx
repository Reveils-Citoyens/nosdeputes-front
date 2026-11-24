import PageIntrouvable from "@/components/erreurs/PageIntrouvable";

/** Fiche d'un député inconnu (adresse erronée, ancien lien). */
export default function DeputeIntrouvable() {
  return (
    <PageIntrouvable
      titre="Ce député est introuvable"
      texte="Aucun député ne correspond à cette adresse. Elle est peut-être mal saisie, ou le lien est ancien."
      liens={[
        { libelle: "Tous les députés", href: "/deputes" },
        { libelle: "Rechercher", href: "/recherche" },
      ]}
    />
  );
}
