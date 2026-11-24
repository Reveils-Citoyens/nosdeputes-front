import PageIntrouvable from "@/components/erreurs/PageIntrouvable";

/** Dossier législatif inconnu (identifiant erroné, ancien lien). */
export default function DossierIntrouvable() {
  return (
    <PageIntrouvable
      titre="Ce dossier législatif est introuvable"
      texte="Aucun dossier ne correspond à cette adresse. L’identifiant est peut-être mal saisi, ou le dossier n’est pas encore publié par l’Assemblée nationale."
      liens={[
        { libelle: "Tous les dossiers", href: "/dossiers" },
        { libelle: "Les thèmes", href: "/themes" },
        { libelle: "Rechercher", href: "/recherche" },
      ]}
    />
  );
}
